import { stripeService, type StripeWebhookEvent } from './stripe';

export interface WebhookHandler {
  handleEvent: (event: StripeWebhookEvent) => Promise<void>;
}

class StripeWebhookService implements WebhookHandler {
  private isServer = typeof window === 'undefined';

  async handleEvent(event: StripeWebhookEvent): Promise<void> {
    console.log('🎣 Webhook received:', event.type, event.id);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event);
          break;

        case 'invoice.created':
          await this.handleInvoiceCreated(event);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event);
          break;

        default:
          console.log('ℹ️ Unhandled webhook event type:', event.type);
      }
    } catch (error) {
      console.error('❌ Error handling webhook event:', error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(event: StripeWebhookEvent): Promise<void> {
    console.log('✅ Subscription created:', event.data.object);

    const subscription = event.data.object as any;

    // Update local subscription data
    const subscriptionData = {
      id: subscription.id,
      userId: 'user_001', // In real app, map from customer ID
      planId: this.mapStripePriceToPlanId(subscription.items.data[0].price.id),
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer
    };

    // Store subscription (only in browser)
    if (!this.isServer) {
      localStorage.setItem('user-subscription', JSON.stringify(subscriptionData));

      // Trigger UI update
      window.dispatchEvent(new CustomEvent('subscription-updated', {
        detail: subscriptionData
      }));
    }

    console.log('💾 Subscription data:', subscriptionData);
  }

  private async handleSubscriptionUpdated(event: StripeWebhookEvent): Promise<void> {
    console.log('🔄 Subscription updated:', event.data.object);

    const subscription = event.data.object as any;
    const previousAttributes = event.data.previous_attributes as any;

    if (!this.isServer) {
      // Get existing subscription
      const existingSubscription = localStorage.getItem('user-subscription');
      if (!existingSubscription) {
        console.warn('No existing subscription found to update');
        return;
      }

      const subscriptionData = JSON.parse(existingSubscription);

      // Update subscription data
      const updatedSubscription = {
        ...subscriptionData,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        planId: this.mapStripePriceToPlanId(subscription.items.data[0].price.id)
      };

      localStorage.setItem('user-subscription', JSON.stringify(updatedSubscription));

      // Trigger UI update
      window.dispatchEvent(new CustomEvent('subscription-updated', {
        detail: updatedSubscription
      }));

      // Log important changes
      if (previousAttributes?.status) {
        console.log(`📊 Subscription status changed: ${previousAttributes.status} → ${subscription.status}`);
      }

      console.log('💾 Subscription updated:', updatedSubscription);
    } else {
      console.log('💾 Server: Subscription update processed');
    }
  }

  private async handleSubscriptionDeleted(event: StripeWebhookEvent): Promise<void> {
    console.log('❌ Subscription deleted/canceled:', event.data.object);

    const subscription = event.data.object as any;

    if (!this.isServer) {
      // Update subscription status to canceled
      const existingSubscription = localStorage.getItem('user-subscription');
      if (existingSubscription) {
        const subscriptionData = JSON.parse(existingSubscription);
        const updatedSubscription = {
          ...subscriptionData,
          status: 'canceled',
          canceledAt: new Date()
        };

        localStorage.setItem('user-subscription', JSON.stringify(updatedSubscription));

        // Trigger UI update
        window.dispatchEvent(new CustomEvent('subscription-updated', {
          detail: updatedSubscription
        }));

        console.log('💾 Subscription marked as canceled');
      }
    }
  }

  private async handlePaymentSucceeded(event: StripeWebhookEvent): Promise<void> {
    console.log('💰 Payment succeeded:', event.data.object);

    const invoice = event.data.object as any;

    // Store invoice data
    const invoiceData = {
      id: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      date: new Date(invoice.created * 1000),
      description: invoice.lines.data[0]?.description || 'Subscription payment',
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf
    };

    if (!this.isServer) {
      // Get existing invoices and add new one
      const existingInvoices = JSON.parse(localStorage.getItem('user-invoices') || '[]');
      const updatedInvoices = [invoiceData, ...existingInvoices];
      localStorage.setItem('user-invoices', JSON.stringify(updatedInvoices));

      // Trigger UI update
      window.dispatchEvent(new CustomEvent('invoice-updated', {
        detail: invoiceData
      }));
    }

    console.log('💾 Invoice stored:', invoiceData);
  }

  private async handlePaymentFailed(event: StripeWebhookEvent): Promise<void> {
    console.log('❌ Payment failed:', event.data.object);

    const invoice = event.data.object as any;

    if (!this.isServer) {
      // Update subscription status if needed
      const existingSubscription = localStorage.getItem('user-subscription');
      if (existingSubscription) {
        const subscriptionData = JSON.parse(existingSubscription);
        if (subscriptionData.stripeSubscriptionId === invoice.subscription) {
          const updatedSubscription = {
            ...subscriptionData,
            status: 'past_due'
          };

          localStorage.setItem('user-subscription', JSON.stringify(updatedSubscription));

          // Trigger UI update
          window.dispatchEvent(new CustomEvent('subscription-updated', {
            detail: updatedSubscription
          }));

          console.log('💾 Subscription marked as past due');
        }
      }

      // Store failed invoice
      const invoiceData = {
        id: invoice.id,
        subscriptionId: invoice.subscription,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        date: new Date(invoice.created * 1000),
        description: invoice.lines.data[0]?.description || 'Subscription payment',
        hostedInvoiceUrl: invoice.hosted_invoice_url
      };

      const existingInvoices = JSON.parse(localStorage.getItem('user-invoices') || '[]');
      const updatedInvoices = [invoiceData, ...existingInvoices];
      localStorage.setItem('user-invoices', JSON.stringify(updatedInvoices));

      // Trigger UI update
      window.dispatchEvent(new CustomEvent('invoice-updated', {
        detail: invoiceData
      }));
    }
  }

  private async handleTrialWillEnd(event: StripeWebhookEvent): Promise<void> {
    console.log('⏰ Trial will end soon:', event.data.object);

    const subscription = event.data.object as any;
    const trialEnd = new Date(subscription.trial_end * 1000);

    if (!this.isServer) {
      // Show notification to user
      const notification = {
        id: `trial-end-${subscription.id}`,
        type: 'warning',
        title: 'Trial Ending Soon',
        message: `Your trial will end on ${trialEnd.toLocaleDateString()}. Update your payment method to continue your subscription.`,
        date: new Date()
      };

      // Store notification
      const existingNotifications = JSON.parse(localStorage.getItem('user-notifications') || '[]');
      const updatedNotifications = [notification, ...existingNotifications];
      localStorage.setItem('user-notifications', JSON.stringify(updatedNotifications));

      // Trigger UI update
      window.dispatchEvent(new CustomEvent('notification-created', {
        detail: notification
      }));
    }

    console.log('🔔 Trial end notification created');
  }

  private async handleCheckoutCompleted(event: StripeWebhookEvent): Promise<void> {
    console.log('🛒 Checkout session completed:', event.data.object);

    const session = event.data.object as any;

    // If this was a subscription checkout, the subscription.created webhook will handle the main logic
    // For one-time payments (courses), handle here
    if (session.mode === 'payment') {
      const paymentData = {
        id: session.payment_intent,
        sessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
        status: 'paid',
        date: new Date(),
        customerEmail: session.customer_email,
        metadata: session.metadata
      };

      if (!this.isServer) {
        // Store payment
        const existingPayments = JSON.parse(localStorage.getItem('course-payments') || '[]');
        const updatedPayments = [paymentData, ...existingPayments];
        localStorage.setItem('course-payments', JSON.stringify(updatedPayments));

        // Trigger UI update
        window.dispatchEvent(new CustomEvent('payment-completed', {
          detail: paymentData
        }));
      }

      console.log('💾 Course payment stored:', paymentData);
    }
  }

  private async handleInvoiceCreated(event: StripeWebhookEvent): Promise<void> {
    console.log('📄 Invoice created:', event.data.object);

    const invoice = event.data.object as any;

    // Store invoice as pending
    const invoiceData = {
      id: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'pending',
      date: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      description: invoice.lines.data[0]?.description || 'Subscription payment',
      hostedInvoiceUrl: invoice.hosted_invoice_url
    };

    if (!this.isServer) {
      const existingInvoices = JSON.parse(localStorage.getItem('user-invoices') || '[]');
      const updatedInvoices = [invoiceData, ...existingInvoices];
      localStorage.setItem('user-invoices', JSON.stringify(updatedInvoices));

      // Trigger UI update
      window.dispatchEvent(new CustomEvent('invoice-updated', {
        detail: invoiceData
      }));
    }

    console.log('💾 Pending invoice stored:', invoiceData);
  }

  private async handlePaymentIntentSucceeded(event: StripeWebhookEvent): Promise<void> {
    console.log('💳 Payment intent succeeded:', event.data.object);

    const paymentIntent = event.data.object as any;

    // This handles course payments or other one-time payments
    if (paymentIntent.metadata?.course_id) {
      const coursePayment = {
        id: paymentIntent.id,
        courseId: paymentIntent.metadata.course_id,
        courseName: paymentIntent.metadata.course_name || 'Unknown Course',
        studentEmail: paymentIntent.receipt_email || 'unknown@example.com',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'paid',
        date: new Date(paymentIntent.created * 1000),
        paymentMethod: 'Card',
        stripePaymentId: paymentIntent.id
      };

      if (!this.isServer) {
        // Store course payment
        const existingPayments = JSON.parse(localStorage.getItem('course-payments') || '[]');
        const updatedPayments = [coursePayment, ...existingPayments];
        localStorage.setItem('course-payments', JSON.stringify(updatedPayments));

        // Trigger UI update
        window.dispatchEvent(new CustomEvent('course-payment-completed', {
          detail: coursePayment
        }));
      }

      console.log('💾 Course payment stored:', coursePayment);
    }
  }

  private mapStripePriceToPlanId(stripePriceId: string): string {
    // Get user-configured plans and find matching plan (only in browser)
    if (!this.isServer) {
      const savedPlans = localStorage.getItem('subscriptionPlans');
      if (savedPlans) {
        try {
          const plans = JSON.parse(savedPlans);
          const matchingPlan = plans.find((plan: any) => plan.stripePriceId === stripePriceId);
          if (matchingPlan) {
            return matchingPlan.id;
          }
        } catch (error) {
          console.error('Error mapping Stripe price to plan ID:', error);
        }
      }
    }

    // Fallback mapping
    const priceToIdMap: { [key: string]: string } = {
      'price_pro_monthly': 'pro',
      'price_enterprise_monthly': 'enterprise',
      'price_basic_monthly': 'basic'
    };

    return priceToIdMap[stripePriceId] || 'basic';
  }
}

// Export singleton instance
export const stripeWebhookService = new StripeWebhookService();

// Test webhook simulation for development
export const simulateWebhook = (eventType: string, data: any) => {
  const event: StripeWebhookEvent = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: `idem_${Date.now()}`
    },
    type: eventType
  };

  console.log('🧪 Simulating webhook:', event);
  return stripeWebhookService.handleEvent(event);
};
