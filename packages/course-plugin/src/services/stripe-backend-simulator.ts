// Backend API Simulator for Real Stripe Integration Testing
// This simulates the server-side Stripe API calls that would normally happen on your backend

interface BackendStripeConfig {
  secretKey: string;
  webhookSecret?: string;
}

interface CreateCheckoutSessionRequest {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'subscription' | 'payment';
  trialPeriodDays?: number;
}

interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
  success: boolean;
  error?: string;
}

class StripeBackendSimulator {
  private config: BackendStripeConfig | null = null;
  private isConfigured = false;

  // Initialize with secret key
  initialize(config: BackendStripeConfig): void {
    this.config = config;
    this.isConfigured = true;
    console.log('🔧 Backend Stripe simulator initialized with secret key:', config.secretKey.substring(0, 20) + '...');
  }

  // Simulate creating a real Stripe checkout session
  async createCheckoutSession(params: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    if (!this.isConfigured || !this.config) {
      throw new Error('Backend Stripe not configured');
    }

    console.log('🏗️ [BACKEND SIMULATION] Creating real Stripe checkout session with params:', {
      priceId: params.priceId,
      customerEmail: params.customerEmail,
      mode: params.mode || 'subscription',
      trialPeriodDays: params.trialPeriodDays
    });

    try {
      // Simulate the real Stripe Checkout Session creation
      // In real implementation, this would be:
      // const session = await stripe.checkout.sessions.create({...});

      const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Simulate real Stripe response
      const response: CreateCheckoutSessionResponse = {
        sessionId,
        url: `https://checkout.stripe.com/c/pay/${sessionId}`,
        success: true
      };

      // Store session data for later retrieval
      const sessionData = {
        id: sessionId,
        object: 'checkout.session',
        created: Math.floor(Date.now() / 1000),
        mode: params.mode || 'subscription',
        status: 'open',
        url: response.url,
        customer_email: params.customerEmail,
        line_items: {
          data: [{
            price: {
              id: params.priceId,
              object: 'price',
              active: true,
              currency: 'usd',
              product: 'prod_simulated',
              type: 'recurring',
              recurring: {
                interval: 'month',
                interval_count: 1
              }
            },
            quantity: 1
          }]
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: params.trialPeriodDays ? {
          trial_period_days: params.trialPeriodDays
        } : undefined
      };

      // Store in localStorage for demo purposes (in real app, this would be in database)
      localStorage.setItem(`stripe_session_${sessionId}`, JSON.stringify(sessionData));

      console.log('✅ [BACKEND SIMULATION] Checkout session created successfully:', response);
      return response;

    } catch (error) {
      console.error('❌ [BACKEND SIMULATION] Failed to create checkout session:', error);
      return {
        sessionId: '',
        url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Simulate retrieving a checkout session
  async retrieveCheckoutSession(sessionId: string): Promise<any> {
    console.log('🔍 [BACKEND SIMULATION] Retrieving checkout session:', sessionId);

    const sessionData = localStorage.getItem(`stripe_session_${sessionId}`);
    if (sessionData) {
      return JSON.parse(sessionData);
    }

    throw new Error('Session not found');
  }

  // Simulate creating a customer
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<any> {
    console.log('👤 [BACKEND SIMULATION] Creating customer:', params);

    const customer = {
      id: `cus_${Date.now()}`,
      object: 'customer',
      created: Math.floor(Date.now() / 1000),
      email: params.email,
      name: params.name,
      metadata: params.metadata || {}
    };

    return customer;
  }

  // Simulate retrieving a subscription
  async retrieveSubscription(subscriptionId: string): Promise<any> {
    console.log('📋 [BACKEND SIMULATION] Retrieving subscription:', subscriptionId);

    // Return simulated subscription data
    return {
      id: subscriptionId,
      object: 'subscription',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      customer: 'cus_simulated',
      items: {
        data: [{
          id: 'si_simulated',
          price: {
            id: 'price_simulated',
            unit_amount: 2900, // $29.00
            currency: 'usd'
          }
        }]
      }
    };
  }

  // Simulate webhook event handling
  async handleWebhookEvent(event: any): Promise<{ success: boolean }> {
    console.log('🪝 [BACKEND SIMULATION] Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('✅ Checkout session completed:', event.data.object.id);
        // In real app: create/update subscription in database
        break;

      case 'customer.subscription.created':
        console.log('📋 Subscription created:', event.data.object.id);
        // In real app: activate user's subscription
        break;

      case 'customer.subscription.updated':
        console.log('📋 Subscription updated:', event.data.object.id);
        // In real app: update subscription status
        break;

      case 'invoice.payment_succeeded':
        console.log('💰 Payment succeeded:', event.data.object.id);
        // In real app: confirm payment, extend subscription
        break;

      case 'invoice.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        // In real app: handle failed payment, notify user
        break;

      default:
        console.log('ℹ️ Unhandled webhook event:', event.type);
    }

    return { success: true };
  }

  // Simulate completing a checkout session (what happens after payment)
  async simulateCheckoutCompletion(sessionId: string): Promise<any> {
    console.log('🎉 [BACKEND SIMULATION] Simulating checkout completion for session:', sessionId);

    const sessionData = localStorage.getItem(`stripe_session_${sessionId}`);
    if (!sessionData) {
      throw new Error('Session not found');
    }

    const session = JSON.parse(sessionData);

    // Simulate successful payment completion
    const completedSession = {
      ...session,
      status: 'complete',
      payment_status: 'paid'
    };

    // Create simulated subscription
    const subscription = {
      id: `sub_${Date.now()}`,
      object: 'subscription',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      customer: session.customer || `cus_${Date.now()}`,
      items: {
        data: [{
          price: session.line_items.data[0].price
        }]
      }
    };

    // Store completed data
    localStorage.setItem(`stripe_session_${sessionId}`, JSON.stringify(completedSession));
    localStorage.setItem(`stripe_subscription_${subscription.id}`, JSON.stringify(subscription));

    // Trigger webhook events
    await this.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: { object: completedSession }
    });

    await this.handleWebhookEvent({
      type: 'customer.subscription.created',
      data: { object: subscription }
    });

    console.log('✅ [BACKEND SIMULATION] Checkout completion simulated successfully');
    return { session: completedSession, subscription };
  }

  // Check if backend is configured
  isBackendConfigured(): boolean {
    return this.isConfigured;
  }

  // Get configuration
  getConfig(): BackendStripeConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const stripeBackendSimulator = new StripeBackendSimulator();
