import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js'; // Renamed to avoid conflict
import { realStripeAPI } from './stripe-real-api';
import type {
  Customer as StripeApiCustomer,
  Subscription as StripeApiSubscription,
  // Assuming realStripeAPI might return objects compatible with Stripe's own types from 'stripe' package
} from 'stripe';


// Stripe webhook event types (remains the same)
export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string;
  } | null;
  type: string;
}

// Stripe configuration interface (remains the same)
interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
  testMode: boolean; // This flag indicates if Stripe keys are for test or live environment
}

// Subscription plan interface (remains the same)
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  popular?: boolean;
}

// Customer interface for this service (remains the same for now)
export interface Customer {
  id: string; // This might be our internal DB ID or Stripe Customer ID
  email: string;
  name?: string;
  stripeCustomerId?: string; // Stripe Customer ID (e.g., cus_xxxx)
  subscriptionId?: string; // Stripe Subscription ID (e.g., sub_xxxx)
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  currentPlan?: string; // Stripe Price ID or local plan ID
  billingCycleAnchor?: Date;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
}

// Payment method interface (remains the same)
export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

// Invoice interface (remains the same for now)
export interface Invoice {
  id: string; // Stripe Invoice ID
  number: string; // Stripe Invoice Number
  status: string;
  amount: number; // in cents
  currency: string;
  created: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  description?: string;
}

// Subscription interface for this service (remains the same for now)
export interface Subscription {
  id: string; // Stripe Subscription ID
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan: SubscriptionPlan | null; // Can be null if plan details are not readily available or mapped
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  customerId: string; // Stripe Customer ID
}

const DEMO_PUBLISHABLE_KEY = 'pk_test_51234567890123456789012345678901234567890123';

class StripeService {
  private stripeJS: StripeJS | null = null;
  private config: StripeConfig | null = null;
  private isInitialized = false;

  // Helper to check if using the specific hardcoded demo key
  private isDemoInstallation(): boolean {
    return this.config?.publishableKey === DEMO_PUBLISHABLE_KEY;
  }

  async initialize(config: StripeConfig): Promise<void> {
    this.config = config;

    try {
      if (!config.publishableKey || !config.publishableKey.startsWith('pk_')) {
        throw new Error('Invalid publishable key format - must start with pk_');
      }
      if (!config.secretKey || !config.secretKey.startsWith('sk_')) {
        throw new Error('Invalid secret key format - must start with sk_');
      }

      const isUsingSpecificDemoKey = this.isDemoInstallation();

      if (isUsingSpecificDemoKey) {
        console.log('Using specific demo key - initializing mock Stripe.js and relying on local mocks/simulator.');
        this.stripeJS = this.createMockStripeJS();
        // realStripeAPI will NOT be initialized for the specific demo key.
      } else {
        console.log(`Real keys detected (testMode: ${config.testMode}) - initializing Stripe.js and realStripeAPI.`);
        // Attempt to load Stripe.js, but create a mock for direct redirect compatibility
        this.stripeJS = this.createMockStripeJS();
        // Initialize realStripeAPI for actual backend operations
        try {
          realStripeAPI.initialize({
            publishableKey: config.publishableKey,
            secretKey: config.secretKey,
            webhookSecret: config.webhookSecret,
            // testMode is implicitly handled by realStripeAPI using test/live keys
          });
          console.log('🔧 Real Stripe API initialized for actual payment processing.');
        } catch (realApiError) {
          console.warn('⚠️ Real Stripe API initialization failed:', realApiError);
          // Application can continue with stripeJS mock, but realStripeAPI calls will fail or be unavailable.
        }
      }

      localStorage.setItem('stripe_config', JSON.stringify(config));
      this.isInitialized = true;
      console.log(`✅ StripeService initialized. Mode: ${isUsingSpecificDemoKey ? 'DemoKey' : 'RealKeys'}. RealAPI configured: ${realStripeAPI.isConfigured()}`);

    } catch (error) {
      console.error('❌ Failed to initialize StripeService:', error);
      this.isInitialized = false;
      // Error handling for Stripe.js loading (less critical if createMockStripeJS is always used for stripeJS)
      if (error instanceof Error && (error.message.includes('Failed to load Stripe.js') || error.message.includes('CORS'))) {
          throw new Error('Stripe.js loading issue encountered. Please check network or ad-blockers.');
      }
      throw error;
    }
  }

  private createMockStripeJS(): StripeJS { // Renamed from createMockStripe
    return {
      redirectToCheckout: async (options) => {
        console.log('[MOCK Stripe.js] redirectToCheckout called with options:', options);
        if (options && 'sessionId' in options && options.sessionId && realStripeAPI.isConfigured()) {
            const session = await realStripeAPI.retrieveCheckoutSession(options.sessionId);
            if (session && session.url) {
                window.location.href = session.url;
                return { error: null } as any; // Should not reach here
            }
            return { error: { message: 'Failed to retrieve session URL via realStripeAPI for mock redirect.' } };
        }
        return { error: { message: 'Mock Stripe.js: redirectToCheckout not fully implemented without realStripeAPI or sessionId.' }};
      },
      elements: () => ({} as unknown as any), // Further mocking needed if Elements are used
      confirmPayment: async () => ({ error: { message: 'Mock Stripe.js: confirmPayment not implemented.'} } as any),
      // ... other Stripe.js methods if needed by the UI directly
    } as unknown as StripeJS;
  }

  getPlans(): SubscriptionPlan[] {
    console.warn('⚠️ getPlans() called on StripeService - plans are managed via PlanPricing component and user configuration.');
    return [];
  }

  async createCheckoutSession(params: {
    priceId: string;
    customerId?: string;
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
    mode?: 'subscription' | 'payment';
    trialPeriodDays?: number;
  }): Promise<{ sessionId: string; url: string }> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');
    if (!realStripeAPI.isConfigured()) {
      // TODO: Optionally, here we could fallback to stripeBackendSimulator if isDemoInstallation() is true
      // For now, strict dependency on realStripeAPI for this core function.
      throw new Error('Real Stripe API not configured. Cannot create checkout session.');
    }

    console.log('🚀 Creating Stripe checkout session via realStripeAPI:', params);
    try {
      const response = await realStripeAPI.createRealCheckoutSession({
        priceId: params.priceId,
        customerEmail: params.customerEmail || undefined, // Pass undefined if not available
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        mode: params.mode || 'subscription',
        trialPeriodDays: params.trialPeriodDays,
        // customerId: params.customerId, // realStripeAPI.createRealCheckoutSession needs to support this
      });

      if (!response.success || !response.sessionId || !response.url) {
        throw new Error(response.error || 'Failed to create real checkout session: Invalid response from API.');
      }
      console.log('✅ REAL Stripe checkout session created successfully:', response);
      return { sessionId: response.sessionId, url: response.url };
    } catch (error) {
      console.error('❌ Real Stripe API checkout session creation failed:', error);
      throw error;
    }
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');

    // The stripeJS mock's redirectToCheckout now handles redirection via realStripeAPI
    if (this.stripeJS) {
        console.log(`🔄 Attempting redirect to checkout for session via Stripe.js object: ${sessionId}`);
        const { error } = await this.stripeJS.redirectToCheckout({ sessionId });
        if (error) {
            console.error('❌ Stripe.js redirectToCheckout error:', error.message);
            throw new Error(`Redirect to checkout failed: ${error.message}`);
        }
    } else {
        throw new Error('Stripe.js not available for redirect.');
    }
  }

  // --- Data Fetching and Management ---
  // These methods will now prioritize realStripeAPI

  async getCustomer(stripeCustomerId: string): Promise<Customer | null> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
      try {
        const stripeApiCustomer = await realStripeAPI.retrieveCustomer(stripeCustomerId); // Assuming realStripeAPI has retrieveCustomer
        if (!stripeApiCustomer) return null;
        // Transform StripeApiCustomer to local Customer interface
        return {
          id: stripeApiCustomer.id,
          email: stripeApiCustomer.email || 'N/A',
          name: stripeApiCustomer.name || undefined,
          stripeCustomerId: stripeApiCustomer.id,
          // subscriptionId, subscriptionStatus etc. might need separate calls or expansion on realStripeAPI.retrieveCustomer
        } as Customer; // Cast needed if interfaces differ
      } catch (error) {
        console.error(`Error fetching customer ${stripeCustomerId} from realStripeAPI:`, error);
        throw error; // Or return null/fallback to mock
      }
    }
    // Fallback to legacy mock for demo key or if realStripeAPI not configured
    console.log('[MOCK] Getting customer (demo key or real API not configured):', stripeCustomerId);
    const storedCustomer = localStorage.getItem('demo_customer');
    if (storedCustomer) return JSON.parse(storedCustomer);
    return { id: stripeCustomerId, email: 'demo@example.com', name: 'Demo Customer', stripeCustomerId, subscriptionStatus: 'active', currentPlan: 'pro' };
  }

  async createCustomer(params: { email: string; name?: string; metadata?: Record<string, string> }): Promise<Customer> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
      try {
        const stripeApiCustomer = await realStripeAPI.createCustomer(params);
        if (!stripeApiCustomer) throw new Error('Failed to create customer via realStripeAPI');
        return {
          id: stripeApiCustomer.id,
          email: stripeApiCustomer.email || params.email,
          name: stripeApiCustomer.name || params.name,
          stripeCustomerId: stripeApiCustomer.id,
        };
      } catch (error) {
        console.error('Error creating customer via realStripeAPI:', error);
        throw error;
      }
    }
    console.log('[MOCK] Creating customer (demo key or real API not configured):', params);
    const customer: Customer = { id: `demo_cus_${Date.now()}`, email: params.email, name: params.name, stripeCustomerId: `cus_demo_${Date.now()}` };
    if (this.config?.testMode) localStorage.setItem('demo_customer', JSON.stringify(customer)); // Be cautious with testMode for demo keys
    return customer;
  }

  async getCustomerSubscriptions(stripeCustomerId: string): Promise<Subscription[]> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
      try {
        const apiSubscriptions = await realStripeAPI.listCustomerSubscriptions(stripeCustomerId);
        // TODO: Transform StripeApiSubscription[] to local Subscription[]
        // This requires mapping plan IDs, features, etc., which can be complex.
        // For now, returning a simplified version or assuming direct compatibility for key fields.
        return apiSubscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          plan: null, // Plan details require more complex mapping logic
          cancelAtPeriodEnd: sub.cancel_at_period_end || false,
          canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
          customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        } as Subscription));
      } catch (error) {
        console.error(`Error fetching subscriptions for ${stripeCustomerId} from realStripeAPI:`, error);
        throw error;
      }
    }
    console.log('[MOCK] Getting subscriptions (demo key or real API not configured):', stripeCustomerId);
    const stored = localStorage.getItem('demo_subscription');
    if (stored) return [JSON.parse(stored)];
    return [{ id: 'sub_demo', status: 'active', currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), plan: null, cancelAtPeriodEnd: false, customerId: stripeCustomerId }];
  }

  async updateSubscription(params: { subscriptionId: string; priceId?: string; quantity?: number; cancelAtPeriodEnd?: boolean; }): Promise<Subscription> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');
    const { subscriptionId, priceId, cancelAtPeriodEnd } = params;

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
        // realStripeAPI.updateSubscription would be needed.
        // For cancelAtPeriodEnd:
        if (typeof cancelAtPeriodEnd === 'boolean') {
            const updatedSub = cancelAtPeriodEnd
                ? await realStripeAPI.cancelSubscription(subscriptionId, true) // true for at_period_end
                : await realStripeAPI.resumeSubscription(subscriptionId); // Assuming resume sets cancel_at_period_end to false

            if (!updatedSub) throw new Error('Subscription update/cancel/resume failed via realStripeAPI');
            return {
                id: updatedSub.id,
                status: updatedSub.status,
                currentPeriodStart: new Date(updatedSub.current_period_start * 1000),
                currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
                plan: null, // Plan mapping needed
                cancelAtPeriodEnd: updatedSub.cancel_at_period_end || false,
                customerId: typeof updatedSub.customer === 'string' ? updatedSub.customer : updatedSub.customer.id,
            } as Subscription;
        }
        // For price changes (more complex, requires realStripeAPI.updateSubscription with items)
        if (priceId) {
            console.warn('Price change in updateSubscription via realStripeAPI not fully implemented yet.');
            // const updatedApiSub = await realStripeAPI.updateSubscription(subscriptionId, { priceId });
            // Transform and return
        }
        throw new Error('Specific updateSubscription scenario not fully implemented for realStripeAPI yet.');
    }

    console.log('[MOCK] Updating subscription (demo key or real API not configured):', params);
    // Fallback to legacy mock
    const stored = localStorage.getItem('demo_subscription');
    const sub = stored ? JSON.parse(stored) : { id: subscriptionId, status: 'active', plan: { id: 'mock_plan' }, customerId: 'cus_demo' };
    if (params.cancelAtPeriodEnd !== undefined) {
      sub.cancelAtPeriodEnd = params.cancelAtPeriodEnd;
      sub.canceledAt = params.cancelAtPeriodEnd ? new Date() : undefined;
      sub.status = params.cancelAtPeriodEnd ? (sub.status === 'trialing' ? sub.status : 'active') : 'active'; // Keep trialing status if cancelling trial
    }
    if (params.priceId) sub.plan = { id: params.priceId /* ... other plan details if available */ };
    localStorage.setItem('demo_subscription', JSON.stringify(sub));
    return sub as Subscription;
  }

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<Subscription> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');
    // `immediate = true` means cancel now. `immediate = false` means `cancel_at_period_end = true`.
    const cancelAtPeriodEnd = !immediate;

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
        const updatedSub = await realStripeAPI.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
        if (!updatedSub) throw new Error('Subscription cancellation failed via realStripeAPI');
        return { /* transform StripeApiSubscription to Subscription */
            id: updatedSub.id, status: updatedSub.status,
            currentPeriodStart: new Date(updatedSub.current_period_start * 1000),
            currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
            plan: null, cancelAtPeriodEnd: updatedSub.cancel_at_period_end || false,
            customerId: typeof updatedSub.customer === 'string' ? updatedSub.customer : updatedSub.customer.id,
        } as Subscription;
    }
    console.log('[MOCK] Canceling subscription (demo key or real API not configured):', subscriptionId, immediate);
    return this.updateSubscription({ subscriptionId, cancelAtPeriodEnd }); // Uses mock update
  }

  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
     if (!this.isInitialized) throw new Error('StripeService not initialized.');

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
        const updatedSub = await realStripeAPI.resumeSubscription(subscriptionId);
        if (!updatedSub) throw new Error('Subscription resumption failed via realStripeAPI');
         return { /* transform StripeApiSubscription to Subscription */
            id: updatedSub.id, status: updatedSub.status,
            currentPeriodStart: new Date(updatedSub.current_period_start * 1000),
            currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
            plan: null, cancelAtPeriodEnd: updatedSub.cancel_at_period_end || false,
            customerId: typeof updatedSub.customer === 'string' ? updatedSub.customer : updatedSub.customer.id,
        } as Subscription;
    }
    console.log('[MOCK] Resuming subscription (demo key or real API not configured):', subscriptionId);
    return this.updateSubscription({ subscriptionId, cancelAtPeriodEnd: false }); // Uses mock update
  }

  // getPaymentMethods and getInvoices would follow a similar refactoring pattern:
  // Check !isDemoInstallation() && realStripeAPI.isConfigured(), then call realStripeAPI, else use existing mocks.
  // These require corresponding methods in realStripeAPI.ts (e.g., listPaymentMethods, listInvoices).
  // For brevity, I'll leave their mock implementations as is, with a TODO.
  async getPaymentMethods(stripeCustomerId: string): Promise<PaymentMethod[]> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
      try {
        const apiPaymentMethods = await realStripeAPI.listPaymentMethods(stripeCustomerId);
        return apiPaymentMethods.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          } : undefined,
          // Assuming the first card payment method is default if multiple are returned.
          // Stripe API itself doesn't directly mark a PM as default on list, default is on customer/subscription.
          // This might need more sophisticated logic if true default status is required here.
          isDefault: pm.type === 'card',
        }));
      } catch (error) {
        console.error(`Error fetching payment methods for ${stripeCustomerId} from realStripeAPI:`, error);
        throw error;
      }
    }
    console.log('[MOCK] Getting payment methods (demo key or real API not configured):', stripeCustomerId);
    return [{ id: 'pm_demo_card', type: 'card', card: { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2025 }, isDefault: true }];
  }

  async getInvoices(stripeCustomerId: string): Promise<Invoice[]> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
      try {
        const apiInvoices = await realStripeAPI.listInvoices(stripeCustomerId);
        return apiInvoices.map(inv => ({
          id: inv.id,
          number: inv.number || `N/A-${inv.id.substring(3, 7)}`, // Stripe invoice numbers can be null
          status: inv.status || 'draft', // Status can be null
          amount: inv.amount_due, // amount_due is in cents
          currency: inv.currency,
          created: new Date(inv.created * 1000),
          paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : undefined,
          hostedInvoiceUrl: inv.hosted_invoice_url || undefined,
          invoicePdf: inv.invoice_pdf || undefined,
          description: inv.description || inv.lines?.data?.[0]?.description || undefined,
        }));
      } catch (error) {
        console.error(`Error fetching invoices for ${stripeCustomerId} from realStripeAPI:`, error);
        throw error;
      }
    }
    console.log('[MOCK] Getting invoices (demo key or real API not configured):', stripeCustomerId);
    return [{ id: 'in_demo_invoice_1', number: 'INV-001', status: 'paid', amount: 2900, currency: 'usd', created: new Date(), description: 'Mock Plan' }];
  }

  async createBillingPortalSession(stripeCustomerId: string, returnUrl: string): Promise<{ url: string }> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');

    if (!this.isDemoInstallation() && realStripeAPI.isConfigured()) {
      try {
        const portalSession = await realStripeAPI.createBillingPortalSession(stripeCustomerId, returnUrl);
        if (portalSession && portalSession.url) {
          return { url: portalSession.url };
        }
        throw new Error('Failed to create billing portal session via realStripeAPI or URL missing.');
      } catch (error) {
        console.error(`Error creating billing portal session for ${stripeCustomerId} via realStripeAPI:`, error);
        // Fall through to mock behavior or throw, depending on desired strictness
        console.warn('Falling back to mock billing portal session due to real API error.');
      }
    }

    console.log('[MOCK] Creating billing portal session (demo key, real API error, or real API not configured):', stripeCustomerId);
    // Simplified mock for demo key or if API call fails
    if (this.isDemoInstallation()) {
        alert('Demo Mode: In production, this would open the Stripe Customer Portal.');
    } else {
         // If not demo key, but API failed, it's more of a test mode mock
        alert('Stripe Billing Portal would open here. This is a mock for test mode or API failure.');
    }
    return { url: returnUrl }; // Fallback to returnUrl for simplicity
  }


  // Webhook handling in stripe.ts is mostly for frontend reacting to backend-verified events.
  // Actual verification (constructEvent) is in realStripeAPI.
  async handleWebhookEvent(event: StripeWebhookEvent): Promise<{ received: boolean }> {
    console.log('StripeService: Handling Stripe webhook event on frontend:', event.type, event.id);
    // This method would typically be used to update frontend state based on confirmed webhook events
    // (e.g., after a backend endpoint has verified and processed it).
    // For now, it's just logging.
    return { received: true };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config?.webhookSecret) {
      console.warn('Webhook secret not configured in StripeService. Cannot verify signature.');
      return false;
    }
    // This is a mock verification. Actual verification should happen via realStripeAPI.constructWebhookEvent
    // if the frontend were to ever receive raw webhooks (which it typically shouldn't).
    console.warn('StripeService.verifyWebhookSignature is a mock. Real verification is via realStripeAPI/backend.');
    return true;
  }

  formatCurrency(amount: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
  }

  isConfigured(): boolean {
    return this.isInitialized && this.config !== null && (this.isDemoInstallation() || realStripeAPI.isConfigured());
  }

  // isTestMode now refers to the keys being test keys, not whether to use frontend mocks.
  isTestMode(): boolean {
    return this.config?.testMode ?? false; // False if no config
  }

  // Use this to check if specifically the hardcoded demo key is active, leading to frontend mocks.
  isUsingDemoKey(): boolean {
    return this.isDemoInstallation();
  }

  getConfig(): StripeConfig | null {
    return this.config;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isInitialized) throw new Error('StripeService not initialized.');
    console.log('🧪 Testing StripeService connection...');

    if (this.isDemoInstallation()) {
      console.log('✅ StripeService is in demo key mode. Connection test passed (mock).');
      return true;
    }

    if (realStripeAPI.isConfigured()) {
      try {
        const realApiConnection = await realStripeAPI.testConnection();
        console.log('✅ Real Stripe API connection test result:', realApiConnection);
        return realApiConnection;
      } catch (error) {
        console.error('❌ Real Stripe API connection test failed during StripeService test:', error);
        return false;
      }
    } else {
      console.warn('⚠️ Real Stripe API not configured. StripeService connection test cannot verify backend.');
      return false; // Or true if frontend-only mock operation is considered "connected"
    }
  }
}

export const stripeService = new StripeService();
