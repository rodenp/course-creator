import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Stripe webhook event types (can remain, useful for frontend if webhooks push to client)
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

// Frontend-specific Stripe configuration
interface FrontendStripeConfig {
  publishableKey: string;
  testMode?: boolean;
}

// Subscription plan interface
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // Assuming this is in major units (e.g., dollars, euros)
  currency: string;
  interval: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  popular?: boolean;
  trialPeriodDays?: number;
}

// Customer interface
export interface Customer {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  currentPlan?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
}

// Payment method interface
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

// Invoice interface
export interface Invoice {
  id: string;
  number?: string; // Number might not always be present for all invoice states
  status: string;
  amount: number; // Typically in cents for Stripe, but service methods should clarify
  currency: string;
  created: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  description?: string;
}

// Subscription interface
export interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan?: SubscriptionPlan;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  customerId: string;
}


class StripeService {
  private stripe: Stripe | null = null;
  private config: FrontendStripeConfig | null = null;
  private isInitialized = false;
  private apiUrlBase = '/api/stripe'; // Base path for consumer app's Stripe API routes

  async initialize(config: FrontendStripeConfig): Promise<void> {
    if (!config.publishableKey || !config.publishableKey.startsWith('pk_')) {
      this.isInitialized = false;
      throw new Error('Invalid publishable key format - must start with pk_');
    }

    this.config = {
        ...config,
        testMode: config.testMode ?? !config.publishableKey.startsWith('pk_live_')
    };

    try {
      const isSpecificDemoKey = this.config.publishableKey === 'pk_test_51234567890123456789012345678901234567890123';

      if (isSpecificDemoKey || this.config.testMode) {
        console.log('StripeService: Using demo/test keys - initializing mock Stripe.js.');
        this.stripe = this.createMockStripe();
      } else {
        this.stripe = await this.loadStripeWithTimeout(this.config.publishableKey, 5000);
      }

      this.isInitialized = true;
      console.log(`✅ Stripe.js initialized for publishableKey: ${this.config.publishableKey.substring(0,20)}... TestMode: ${this.config.testMode}`);

    } catch (error) {
      console.error('❌ Failed to initialize Stripe.js:', error);
      this.isInitialized = false;
      if (error instanceof Error) {
        if (error.message.includes('Failed to load Stripe.js') || error.message.includes('timeout') || error.message.includes('CORS') || error.message.includes('NS_ERROR_DOM_CORP_FAILED')) {
          throw new Error('Failed to load Stripe.js. This could be due to network issues, ad blockers, or an invalid publishable key. Please check your connection and key, then try again.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while initializing Stripe.js');
    }
  }

  private async loadStripeWithTimeout(publishableKey: string, timeout: number): Promise<Stripe | null> {
    return Promise.race([
      loadStripe(publishableKey),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Stripe.js loading timeout - please check your connection')), timeout)
      )
    ]);
  }

  private createMockStripe(): Stripe {
    const mockRedirectToCheckout = async (options?: any) => {
      console.log("MockStripe: redirectToCheckout called with options:", options);
      if (options && options.sessionId && options.sessionId.startsWith("cs_test_")) {
        return { error: null };
      }
      return { error: { message: "Mock redirect failed: Invalid session ID." } };
    };
    return { redirectToCheckout: mockRedirectToCheckout, elements: () => ({} as any) } as Stripe;
  }

  getPlans(): SubscriptionPlan[] {
    console.warn('StripeService.getPlans: Deprecated. Plans are managed by BillingProvider, sourced from props or localStorage.');
    return [];
  }

  async createCheckoutSession(params: {
    priceId?: string;
    planId?: string;
    customerId?: string;
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
    mode?: 'subscription' | 'payment';
    trialPeriodDays?: number;
  }): Promise<{ sessionId: string; url: string }> {
    if (!this.isInitialized) throw new Error('Stripe (frontend) not initialized');

    console.log('StripeService.createCheckoutSession: Calling backend API with params:', params);

    const response = await fetch(`${this.apiUrlBase}/checkout-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' /* TODO: Add Auth header */ },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed with status: ' + response.status }));
      throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }
    const sessionData = await response.json();
    return { sessionId: sessionData.sessionId, url: sessionData.url };
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    if (!this.stripe) throw new Error('Stripe.js not loaded');
    const { error } = await this.stripe.redirectToCheckout({ sessionId });
    if (error) {
      console.error('Stripe redirectToCheckout error:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, immediate = false): Promise<Subscription> {
    if (!this.isInitialized) throw new Error('Stripe (frontend) not initialized');
    const response = await fetch(`${this.apiUrlBase}/subscriptions/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', /* TODO: Auth header */ },
      body: JSON.stringify({ subscriptionId, immediate }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Cancel subscription request failed: ' + response.status }));
      throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    if (!this.isInitialized) throw new Error('Stripe (frontend) not initialized');
    const response = await fetch(`${this.apiUrlBase}/subscriptions/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', /* TODO: Auth header */ },
      body: JSON.stringify({ subscriptionId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Resume subscription request failed: ' + response.status }));
      throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    if (!this.isInitialized) throw new Error('Stripe (frontend) not initialized');
    const response = await fetch(`${this.apiUrlBase}/billing-portal-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', /* TODO: Auth header */ },
      body: JSON.stringify({ customerId, returnUrl }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Create billing portal session request failed: ' + response.status }));
      throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    console.warn("StripeService.getCustomer: Using mock. Needs backend API call to " + `${this.apiUrlBase}/customers/${customerId}`);
    return { id: customerId, email: 'demo@example.com', name: 'Demo Customer (Mock)', stripeCustomerId: `cus_mock_${customerId}` };
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    console.warn("StripeService.getPaymentMethods: Using mock. Needs backend API call to " + `${this.apiUrlBase}/payment-methods?customerId=${customerId}`);
    return [];
  }

  async getInvoices(customerId: string): Promise<Invoice[]> {
     console.warn("StripeService.getInvoices: Using mock. Needs backend API call to " + `${this.apiUrlBase}/invoices?customerId=${customerId}`);
    return [];
  }

  formatCurrency(amount: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100); // Assuming amount is in cents
  }

  isConfigured(): boolean {
    return this.isInitialized && !!this.config?.publishableKey;
  }

  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }

  getConfig(): FrontendStripeConfig | null {
    return this.config;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn("StripeService.testConnection: Stripe not initialized.");
      return false;
    }
    console.log("StripeService.testConnection: Frontend Stripe.js appears loaded.");
    return true;
  }
}

export const stripeService = new StripeService();
