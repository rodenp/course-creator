// Backend API Simulator for Real Stripe Integration Testing
// This simulates the server-side Stripe API calls that would normally happen on your backend

interface BackendStripeConfig {
  secretKey: string; // Only secret key is needed for backend operations
  publishableKey?: string; // Optional: for any simulation logic that might need it
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

// Interface for simulated customer data stored in localStorage
interface SimulatedCustomer {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  currentPlan?: string;
  billingCycleAnchor?: Date;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
}

// Interface for simulated subscription data stored in localStorage
interface SimulatedSubscription {
  id: string;
  object: 'subscription';
  status: string;
  current_period_start: number; // Stripe uses Unix timestamps
  current_period_end: number;   // Stripe uses Unix timestamps
  customer: string; // Stripe Customer ID
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount?: number;
        currency?: string;
        product?: string;
        type?: string;
        recurring?: {
            interval: string;
            interval_count: number;
        }
      };
      quantity?: number;
    }>;
  };
  metadata?: Record<string, any>;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
  canceled_at?: number | null;
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
      throw new Error('Backend Stripe simulator not configured');
    }

    console.log('🏗️ [BACKEND SIMULATION] Creating Stripe checkout session with params:', {
      priceId: params.priceId,
      customerEmail: params.customerEmail,
      mode: params.mode || 'subscription',
      trialPeriodDays: params.trialPeriodDays
    });

    try {
      const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

      // Store session data for later retrieval - enhanced from stripe-real-backend.ts
      const sessionData = {
        id: sessionId,
        object: 'checkout.session',
        created: Math.floor(Date.now() / 1000),
        mode: params.mode || 'subscription',
        status: 'open', // Initial status
        url: checkoutUrl,
        customer_email: params.customerEmail,
        customer: params.customerId, // Store customerId if provided
        line_items: {
          data: [{
            price: { // More detailed price from stripe-real-backend.ts
              id: params.priceId,
              object: 'price',
              active: true,
              currency: 'usd', // Assuming USD for simulation
              product: `prod_simulated_${params.priceId}`, // Simulated product ID
              type: 'recurring', // Assuming recurring for subscription mode
              recurring: { // Assuming monthly for simulation
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
        } : undefined,
        metadata: { // Added from stripe-real-backend.ts
          source: 'course-builder-simulator',
          customer_email: params.customerEmail,
        },
        // Fields to be filled on completion
        payment_status: 'unpaid',
        completed_at: null,
        subscription: null, // Will be filled with subscription ID on completion
      };

      localStorage.setItem(`stripe_session_${sessionId}`, JSON.stringify(sessionData));

      console.log('✅ [BACKEND SIMULATION] Checkout session created successfully:', { sessionId, url: checkoutUrl });
      console.log('🔗 In a real scenario, user would be redirected to this URL to complete payment.');

      return {
        sessionId,
        url: checkoutUrl,
        success: true
      };

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
    console.error(`❌ [BACKEND SIMULATION] Session not found for ID: ${sessionId}`);
    throw new Error('Session not found in simulator');
  }

  // Simulate creating a customer
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<SimulatedCustomer> {
    console.log('👤 [BACKEND SIMULATION] Creating customer:', params);

    const customerId = `cus_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const customer: SimulatedCustomer = {
      id: customerId,
      email: params.email,
      name: params.name,
      stripeCustomerId: customerId, // In simulation, our ID is the Stripe ID
      metadata: {
        source: 'course-builder-simulator',
        ...params.metadata
      }
    };
    localStorage.setItem(`stripe_customer_${customerId}`, JSON.stringify(customer));
    console.log('✅ [BACKEND SIMULATION] Customer created:', customer);
    return customer;
  }

  // Simulate retrieving a customer
  async retrieveCustomer(customerId: string): Promise<SimulatedCustomer | null> {
    console.log('🔍 [BACKEND SIMULATION] Retrieving customer:', customerId);
    const customerData = localStorage.getItem(`stripe_customer_${customerId}`);
    return customerData ? JSON.parse(customerData) : null;
  }


  // Simulate retrieving a subscription
  async retrieveSubscription(subscriptionId: string): Promise<SimulatedSubscription | null> {
    console.log('📋 [BACKEND SIMULATION] Retrieving subscription:', subscriptionId);
    const subData = localStorage.getItem(`stripe_subscription_${subscriptionId}`);
    if (subData) {
      return JSON.parse(subData) as SimulatedSubscription;
    }
    console.warn(`[BACKEND SIMULATION] Subscription ${subscriptionId} not found.`);
    return null;
  }

  // Merged and enhanced from stripe-real-backend.ts's processSuccessfulPayment
  private async _processSuccessfulPayment(sessionData: any): Promise<{ customer: SimulatedCustomer, subscription: SimulatedSubscription} | null > {
    console.log('🎉 [BACKEND SIMULATION] Processing successful payment for session:', sessionData.id);

    let customerId = sessionData.customer;
    let customer: SimulatedCustomer | null = null;

    if (customerId) {
        customer = await this.retrieveCustomer(customerId);
    }

    if (!customer && sessionData.customer_email) {
        const existingCustomers = Object.keys(localStorage)
            .filter(k => k.startsWith('stripe_customer_'))
            .map(k => JSON.parse(localStorage.getItem(k)!) as SimulatedCustomer)
            .filter(c => c.email === sessionData.customer_email);
        if(existingCustomers.length > 0) {
            customer = existingCustomers[0];
            customerId = customer.id;
        }
    }

    if (!customer) {
      const name = sessionData.customer_details?.name || sessionData.shipping_details?.name || 'Simulated Customer';
      customer = await this.createCustomer({ email: sessionData.customer_email, name });
      customerId = customer.id;
    } else {
       // Update customer with new session details if needed
       localStorage.setItem(`stripe_customer_${customerId}`, JSON.stringify(customer));
    }

    const lineItem = sessionData.line_items?.data?.[0];
    const priceInfo = lineItem?.price;

    const subscriptionId = `sub_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const periodEnd = sessionData.subscription_data?.trial_period_days
      ? nowTimestamp + sessionData.subscription_data.trial_period_days * 24 * 60 * 60
      : nowTimestamp + 30 * 24 * 60 * 60; // Default 30 days

    const subscription: SimulatedSubscription = {
      id: subscriptionId,
      object: 'subscription',
      status: sessionData.subscription_data?.trial_period_days ? 'trialing' : 'active',
      current_period_start: nowTimestamp,
      current_period_end: periodEnd,
      trial_end: sessionData.subscription_data?.trial_period_days ? periodEnd : null,
      customer: customerId,
      items: {
        data: [{
          price: {
            id: priceInfo?.id || 'price_sim_default',
            unit_amount: priceInfo?.unit_amount || 2900,
            currency: priceInfo?.currency || 'usd',
            product: priceInfo?.product || 'prod_sim_default',
            type: priceInfo?.type || 'recurring',
            recurring: priceInfo?.recurring || { interval: 'month', interval_count: 1}
          },
          quantity: lineItem?.quantity || 1
        }]
      },
      metadata: {
        source: 'course-builder-simulator',
        session_id: sessionData.id
      },
      cancel_at_period_end: false,
      canceled_at: null,
    };

    localStorage.setItem(`stripe_subscription_${subscriptionId}`, JSON.stringify(subscription));

    // Update customer with subscription info
    customer.subscriptionId = subscriptionId;
    customer.subscriptionStatus = subscription.status as SimulatedCustomer['subscriptionStatus'];
    customer.currentPlan = subscription.items.data[0].price.id;
    customer.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    customer.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    customer.trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined;
    localStorage.setItem(`stripe_customer_${customerId}`, JSON.stringify(customer));

    console.log('✅ [BACKEND SIMULATION] Payment processed, customer and subscription updated:', { customer, subscription });
    return { customer, subscription };
  }

  // Simulate webhook event handling
  async handleWebhookEvent(event: { type: string; data: { object: any } }): Promise<{ received: boolean; processed?: boolean; error?: string }> {
    console.log('🪝 [BACKEND SIMULATION] Processing webhook event:', event.type, event.data.object.id);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('✅ [SIM] Checkout session completed:', event.data.object.id);
          // Update the stored session to mark it as complete
          const session = await this.retrieveCheckoutSession(event.data.object.id);
          if (session) {
            session.status = 'complete';
            session.payment_status = 'paid';
            session.completed_at = Math.floor(Date.now() / 1000);

            const paymentResult = await this._processSuccessfulPayment(session);
            if (paymentResult) {
                session.customer = paymentResult.customer.id;
                session.subscription = paymentResult.subscription.id;
            }
            localStorage.setItem(`stripe_session_${event.data.object.id}`, JSON.stringify(session));
          }
          // In real app: provision service, send confirmation email, etc.
          break;

        case 'customer.subscription.created':
          console.log('📋 [SIM] Subscription created:', event.data.object.id);
          // Usually handled by checkout.session.completed in this simulator's flow
          // but can be called independently if needed.
          // Ensure subscription is stored if not already.
          const subData = event.data.object as SimulatedSubscription;
          localStorage.setItem(`stripe_subscription_${subData.id}`, JSON.stringify(subData));
          break;

        case 'customer.subscription.updated':
          console.log('📋 [SIM] Subscription updated:', event.data.object.id);
          const updatedSub = event.data.object as SimulatedSubscription;
          localStorage.setItem(`stripe_subscription_${updatedSub.id}`, JSON.stringify(updatedSub));
          // Potentially update associated customer too
          const customer = await this.retrieveCustomer(updatedSub.customer);
          if (customer) {
            customer.subscriptionStatus = updatedSub.status as SimulatedCustomer['subscriptionStatus'];
            customer.cancelAtPeriodEnd = updatedSub.cancel_at_period_end;
            // ... other relevant fields
            localStorage.setItem(`stripe_customer_${customer.id}`, JSON.stringify(customer));
          }
          break;

        case 'customer.subscription.deleted':
          console.log('🗑️ [SIM] Subscription deleted (canceled):', event.data.object.id);
          const deletedSub = event.data.object as SimulatedSubscription; // Stripe sends the sub object
          const existingSub = await this.retrieveSubscription(deletedSub.id);
          if (existingSub) {
            existingSub.status = 'canceled';
            existingSub.canceled_at = deletedSub.canceled_at || Math.floor(Date.now() / 1000);
            localStorage.setItem(`stripe_subscription_${existingSub.id}`, JSON.stringify(existingSub));

            const subCustomer = await this.retrieveCustomer(existingSub.customer);
            if (subCustomer) {
              subCustomer.subscriptionStatus = 'canceled';
              subCustomer.currentPlan = undefined;
              // ... other relevant fields
              localStorage.setItem(`stripe_customer_${subCustomer.id}`, JSON.stringify(subCustomer));
            }
          }
          break;

        case 'invoice.payment_succeeded':
          console.log('💰 [SIM] Payment succeeded for invoice:', event.data.object.id);
          // In real app: confirm payment, extend subscription period, unlock features.
          // This simulator might extend subscription period if it's not the first payment.
          const invoice = event.data.object;
          if (invoice.subscription) {
            const subscription = await this.retrieveSubscription(invoice.subscription);
            if (subscription && subscription.status === 'active') { // Don't reactivate a cancelled sub this way
              const currentPeriodEnd = subscription.current_period_end;
              // Assuming monthly, add 30 days. More complex logic for other intervals.
              subscription.current_period_start = currentPeriodEnd;
              subscription.current_period_end = currentPeriodEnd + (30 * 24 * 60 * 60);
              localStorage.setItem(`stripe_subscription_${subscription.id}`, JSON.stringify(subscription));
              console.log(`📋 [SIM] Subscription ${subscription.id} extended to ${new Date(subscription.current_period_end * 1000)}`);
            }
          }
          break;

        case 'invoice.payment_failed':
          console.log('❌ [SIM] Payment failed for invoice:', event.data.object.id);
          // In real app: handle failed payment, notify user, set subscription to past_due.
          const failedInvoice = event.data.object;
           if (failedInvoice.subscription) {
            const subscription = await this.retrieveSubscription(failedInvoice.subscription);
            if (subscription) {
              subscription.status = 'past_due'; // Or 'unpaid' depending on Stripe flow
              localStorage.setItem(`stripe_subscription_${subscription.id}`, JSON.stringify(subscription));
               const subCustomer = await this.retrieveCustomer(subscription.customer);
                if (subCustomer) {
                    subCustomer.subscriptionStatus = 'past_due';
                    localStorage.setItem(`stripe_customer_${subCustomer.id}`, JSON.stringify(subCustomer));
                }
              console.log(`🔔 [SIM] Subscription ${subscription.id} marked as ${subscription.status}.`);
            }
          }
          break;

        default:
          console.log('ℹ️ [SIM] Unhandled webhook event:', event.type);
      }
      return { received: true, processed: true };
    } catch (error) {
      console.error(`❌ [SIM] Error processing webhook ${event.type}:`, error);
      return { received: true, processed: false, error: (error as Error).message };
    }
  }

  // Simulate completing a checkout session (what happens after payment)
  async simulateCheckoutCompletion(sessionId: string): Promise<any> {
    console.log('🎉 [BACKEND SIMULATION] Simulating checkout completion for session:', sessionId);

    const sessionData = await this.retrieveCheckoutSession(sessionId);
    if (!sessionData) {
      throw new Error(`[BACKEND SIMULATION] Session ${sessionId} not found for completion simulation.`);
    }
    if (sessionData.status === 'complete') {
        console.warn(`[BACKEND SIMULATION] Session ${sessionId} already marked as complete.`);
        return { session: sessionData, subscription: await this.retrieveSubscription(sessionData.subscription) };
    }

    // Mark session as completed (this will be done inside webhook too, but good to set here)
    sessionData.status = 'complete';
    sessionData.payment_status = 'paid';
    sessionData.completed_at = Math.floor(Date.now() / 1000);

    // The actual creation of subscription and customer happens via webhook processing
    // Trigger the webhook event that would normally come from Stripe
    await this.handleWebhookEvent({
      type: 'checkout.session.completed',
      data: { object: sessionData }
    });

    // Retrieve potentially updated session (with sub ID)
    const updatedSession = await this.retrieveCheckoutSession(sessionId);
    const subscription = updatedSession.subscription ? await this.retrieveSubscription(updatedSession.subscription) : null;

    console.log('✅ [BACKEND SIMULATION] Checkout completion simulated successfully.');
    return { session: updatedSession, subscription };
  }

  // Added from stripe-real-backend.ts
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.warn('⚠️ [BACKEND SIMULATION] Simulator not configured. Cannot test connection.');
      return false;
    }
    try {
      console.log('🧪 [BACKEND SIMULATION] Testing Stripe Backend Simulator connection...');
      // For a simulator, "connection" means it's initialized with a config.
      // We can validate the secret key format if it's supposed to be a Stripe-like key.
      const isValidKey = this.config.secretKey && (this.config.secretKey.startsWith('sk_test_') || this.config.secretKey.startsWith('sk_live_') || this.config.secretKey.startsWith('sk_sim_')); // Allow sk_sim_ for simulator
      if (isValidKey) {
        console.log('✅ [BACKEND SIMULATION] Simulator connection test passed (config loaded and key format looks okay).');
        return true;
      } else if (this.config.secretKey) {
        console.warn(`⚠️ [BACKEND SIMULATION] Simulator secret key format might be incorrect, but proceeding as it's a simulation: ${this.config.secretKey.substring(0,10)}...`);
        return true; // For simulator, allow any key if set
      }
      else {
        console.error('❌ [BACKEND SIMULATION] Simulator secret key not set.');
        return false;
      }
    } catch (error) {
      console.error('❌ [BACKEND SIMULATION] Simulator connection test failed:', error);
      return false;
    }
  }

  isBackendConfigured(): boolean {
    return this.isConfigured;
  }

  getConfig(): BackendStripeConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const stripeBackendSimulator = new StripeBackendSimulator();
