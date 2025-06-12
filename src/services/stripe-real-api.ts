// Real Stripe API Service - Makes actual API calls to Stripe for real checkout sessions
import Stripe from 'stripe';

interface RealStripeAPIConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
}

interface CreateRealCheckoutParams {
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'subscription' | 'payment';
  trialPeriodDays?: number;
}

class RealStripeAPI {
  private stripe: Stripe | null = null;
  private config: RealStripeAPIConfig | null = null;
  private _isConfigured = false;

  // Initialize with real Stripe configuration
  initialize(config: RealStripeAPIConfig): void {
    try {
      // Create real Stripe instance with secret key
      this.stripe = new Stripe(config.secretKey, {
        apiVersion: '2024-11-20.acacia', // Use latest API version
        typescript: true,
      });

      this.config = config;
      this._isConfigured = true;

      console.log('🚀 REAL Stripe API initialized:', {
        publishableKey: config.publishableKey.substring(0, 20) + '...',
        secretKey: config.secretKey.substring(0, 20) + '...',
        testMode: config.secretKey.includes('test'),
        apiVersion: '2024-11-20.acacia'
      });

    } catch (error) {
      console.error('❌ Failed to initialize real Stripe API:', error);
      throw error;
    }
  }

  // Create a REAL Stripe checkout session
  async createRealCheckoutSession(params: CreateRealCheckoutParams): Promise<{
    sessionId: string;
    url: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }

    console.log('🚀 Creating REAL Stripe checkout session:', {
      priceId: params.priceId,
      customerEmail: params.customerEmail,
      mode: params.mode || 'subscription'
    });

    try {
      // Create actual Stripe checkout session
      const session = await this.stripe.checkout.sessions.create({
        mode: params.mode || 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        customer_email: params.customerEmail,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        ...(params.trialPeriodDays && {
          subscription_data: {
            trial_period_days: params.trialPeriodDays,
          },
        }),
        metadata: {
          source: 'course-builder',
          customer_email: params.customerEmail,
        },
        // Allow promotion codes
        allow_promotion_codes: true,
        // Billing address collection
        billing_address_collection: 'auto',
        // Invoice creation only for one-time payments (payment mode)
        // For subscription mode, Stripe automatically creates invoices
        invoice_creation: params.mode === 'payment' ? {
          enabled: true,
          invoice_data: {
            description: 'Course Builder Payment',
            metadata: {
              source: 'course-builder'
            }
          }
        } : undefined,
      });

      console.log('✅ REAL Stripe checkout session created successfully:', {
        sessionId: session.id,
        url: session.url,
        mode: session.mode,
        status: session.status
      });

      // Store session information locally for testing
      const sessionInfo = {
        id: session.id,
        object: session.object,
        created: session.created,
        mode: session.mode,
        status: session.status,
        url: session.url,
        customer_email: session.customer_email,
        success_url: session.success_url,
        cancel_url: session.cancel_url,
        metadata: session.metadata,
        line_items: session.line_items,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency
      };

      localStorage.setItem(`real_session_${session.id}`, JSON.stringify(sessionInfo));

      return {
        sessionId: session.id,
        url: session.url || '',
        success: true
      };

    } catch (error) {
      console.error('❌ Failed to create real Stripe checkout session:', error);

      const errorMessage = error instanceof Stripe.errors.StripeError
        ? `Stripe Error: ${error.message}`
        : error instanceof Error
        ? error.message
        : 'Unknown error';

      return {
        sessionId: '',
        url: '',
        success: false,
        error: errorMessage
      };
    }
  }

  // Retrieve a real checkout session
  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }

    try {
      console.log('🔍 Retrieving REAL checkout session:', sessionId);

      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      console.log('📋 Retrieved real session:', {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer: session.customer,
        subscription: session.subscription
      });

      return session;

    } catch (error) {
      console.error('❌ Failed to retrieve checkout session:', error);
      return null;
    }
  }

  // Create a real customer
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer | null> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }

    try {
      console.log('👤 Creating REAL Stripe customer:', params.email);

      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          source: 'course-builder',
          ...params.metadata
        }
      });

      console.log('✅ Real customer created:', {
        id: customer.id,
        email: customer.email,
        name: customer.name
      });

      return customer;

    } catch (error) {
      console.error('❌ Failed to create customer:', error);
      return null;
    }
  }

  // Retrieve a real subscription
  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!this.stripe || !this.isConfigured()) {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }

    try {
      console.log('📋 Retrieving REAL subscription:', subscriptionId);

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      console.log('✅ Real subscription retrieved:', {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end
      });

      return subscription;

    } catch (error) {
      console.error('❌ Failed to retrieve subscription:', error);
      return null;
    }
  }

  // List customer subscriptions
  async listCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }

    try {
      console.log('📋 Listing REAL customer subscriptions:', customerId);

      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10
      });

      console.log('✅ Customer subscriptions retrieved:', subscriptions.data.length);

      return subscriptions.data;

    } catch (error) {
      console.error('❌ Failed to list customer subscriptions:', error);
      return [];
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId: string, atPeriodEnd = true): Promise<Stripe.Subscription | null> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }

    try {
      console.log('❌ Canceling REAL subscription:', subscriptionId, 'at period end:', atPeriodEnd);

      const subscription = atPeriodEnd
        ? await this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
            metadata: {
              cancelled_by: 'customer',
              cancelled_at: new Date().toISOString()
            }
          })
        : await this.stripe.subscriptions.cancel(subscriptionId);

      console.log('✅ Subscription cancellation processed:', {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
      });

      return subscription;

    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      return null;
    }
  }

  // Resume a subscription
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }

    try {
      console.log('🔄 Resuming REAL subscription:', subscriptionId);

      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
        metadata: {
          resumed_by: 'customer',
          resumed_at: new Date().toISOString()
        }
      });

      console.log('✅ Subscription resumed:', {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end
      });

      return subscription;

    } catch (error) {
      console.error('❌ Failed to resume subscription:', error);
      return null;
    }
  }

  // Test the connection to Stripe
  async testConnection(): Promise<boolean> {
    if (!this.stripe || !this.isConfigured()) {
      return false;
    }

    try {
      console.log('🧪 Testing REAL Stripe API connection...');

      // Test by retrieving account information
      const account = await this.stripe.accounts.retrieve();

      console.log('✅ Real Stripe API connection successful:', {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      });

      return true;

    } catch (error) {
      console.error('❌ Real Stripe API connection failed:', error);
      return false;
    }
  }

  // Construct webhook event
  constructWebhookEvent(payload: string, signature: string): Stripe.Event | null {
    if (!this.config?.webhookSecret) {
      console.warn('⚠️ Webhook secret not configured');
      return null;
    }

    try {
      const event = this.stripe?.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      );

      console.log('✅ Webhook event constructed:', event?.type);
      return event || null;

    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return null;
    }
  }

  // Check if configured
  isConfigured(): boolean {
    return this._isConfigured && this.stripe !== null;
  }

  // Get configuration
  getConfig(): RealStripeAPIConfig | null {
    return this.config;
  }

  // Get Stripe instance (for advanced usage)
  getStripeInstance(): Stripe | null {
    return this.stripe;
  }

  // List payment methods for a customer
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }
    try {
      console.log('💳 Listing payment methods for customer:', customerId);
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card', // Assuming we only care about card payment methods for now
      });
      console.log('✅ Payment methods retrieved:', paymentMethods.data.length);
      return paymentMethods.data;
    } catch (error) {
      console.error('❌ Failed to list payment methods:', error);
      return [];
    }
  }

  // List invoices for a customer
  async listInvoices(customerId: string, params?: Stripe.InvoiceListParams): Promise<Stripe.Invoice[]> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }
    try {
      console.log('🧾 Listing invoices for customer:', customerId);
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: params?.limit || 20, // Default limit
        ...params,
      });
      console.log('✅ Invoices retrieved:', invoices.data.length);
      return invoices.data;
    } catch (error) {
      console.error('❌ Failed to list invoices:', error);
      return [];
    }
  }

  // Create a billing portal session
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session | null> {
    if (!this.stripe || !this.isConfigured()) {
      throw new Error('Real Stripe API not configured');
    }
    try {
      console.log('🚪 Creating billing portal session for customer:', customerId);
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      console.log('✅ Billing portal session created:', session.url);
      return session;
    } catch (error) {
      console.error('❌ Failed to create billing portal session:', error);
      return null;
    }
  }
}

// Export singleton instance
export const realStripeAPI = new RealStripeAPI();
