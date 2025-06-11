import Stripe from 'stripe';

// Production webhook handler with proper signature verification
export class ProductionStripeWebhookHandler {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret;
  }

  async handleWebhook(rawBody: string, signature: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      console.log('🎣 Verified webhook event:', event.type, event.id);

      // Process the event
      await this.processEvent(event);

      return { success: true };

    } catch (error) {
      console.error('❌ Webhook verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.created':
        await this.handleInvoiceCreated(event.data.object as Stripe.Invoice);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log('ℹ️ Unhandled webhook event type:', event.type);
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log('✅ Subscription created:', subscription.id);

    // In production, you would:
    // 1. Get customer from database using subscription.customer
    // 2. Update user's subscription status in database
    // 3. Send welcome email
    // 4. Grant access to premium features
    // 5. Update billing dashboard data

    const subscriptionData = {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      planId: this.mapStripePriceToPlanId(subscription.items.data[0].price.id),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date()
    };

    // TODO: Replace with actual database call
    // await this.updateUserSubscription(subscription.customer, subscriptionData);

    console.log('💾 Would save subscription to database:', subscriptionData);

    // Send real-time update to frontend (via WebSocket or Server-Sent Events)
    await this.notifyFrontend('subscription-updated', subscriptionData);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('🔄 Subscription updated:', subscription.id);

    const subscriptionData = {
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      planId: this.mapStripePriceToPlanId(subscription.items.data[0].price.id),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      updatedAt: new Date()
    };

    // TODO: Replace with actual database call
    // await this.updateUserSubscription(subscription.customer, subscriptionData);

    console.log('💾 Would update subscription in database:', subscriptionData);
    await this.notifyFrontend('subscription-updated', subscriptionData);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('❌ Subscription deleted:', subscription.id);

    // TODO: Replace with actual database call
    // await this.updateUserSubscription(subscription.customer, {
    //   status: 'canceled',
    //   canceledAt: new Date()
    // });

    await this.notifyFrontend('subscription-deleted', {
      stripeSubscriptionId: subscription.id,
      status: 'canceled'
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('💰 Payment succeeded:', invoice.id);

    const invoiceData = {
      stripeInvoiceId: invoice.id,
      subscriptionId: invoice.subscription as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      invoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      description: invoice.lines.data[0]?.description || 'Subscription payment',
      updatedAt: new Date()
    };

    // TODO: Replace with actual database call
    // await this.saveInvoice(invoiceData);
    // await this.updateUserSubscriptionStatus(invoice.subscription, 'active');

    console.log('💾 Would save invoice to database:', invoiceData);
    await this.notifyFrontend('payment-succeeded', invoiceData);

    // Send receipt email
    // await this.sendReceiptEmail(invoice);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('❌ Payment failed:', invoice.id);

    const invoiceData = {
      stripeInvoiceId: invoice.id,
      subscriptionId: invoice.subscription as string,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      attemptedAt: new Date(),
      description: invoice.lines.data[0]?.description || 'Subscription payment',
      updatedAt: new Date()
    };

    // TODO: Replace with actual database calls
    // await this.saveInvoice(invoiceData);
    // await this.updateUserSubscriptionStatus(invoice.subscription, 'past_due');

    console.log('💾 Would save failed invoice to database:', invoiceData);
    await this.notifyFrontend('payment-failed', invoiceData);

    // Send payment failure email
    // await this.sendPaymentFailureEmail(invoice);
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    console.log('⏰ Trial will end soon:', subscription.id);

    const trialEndData = {
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      trialEnd: new Date(subscription.trial_end! * 1000),
      daysRemaining: Math.ceil((subscription.trial_end! * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
    };

    // TODO: Replace with actual implementation
    // await this.createNotification(subscription.customer, {
    //   type: 'trial_ending',
    //   title: 'Trial Ending Soon',
    //   message: `Your trial ends in ${trialEndData.daysRemaining} days`,
    //   data: trialEndData
    // });

    console.log('🔔 Would create trial ending notification:', trialEndData);
    await this.notifyFrontend('trial-will-end', trialEndData);

    // Send trial ending email
    // await this.sendTrialEndingEmail(subscription);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('🛒 Checkout completed:', session.id);

    if (session.mode === 'subscription') {
      // Subscription checkout - will be handled by subscription.created webhook
      console.log('📝 Subscription checkout completed, waiting for subscription.created webhook');
    } else if (session.mode === 'payment') {
      // One-time payment (course purchase)
      const paymentData = {
        sessionId: session.id,
        paymentIntentId: session.payment_intent as string,
        amount: session.amount_total!,
        currency: session.currency!,
        customerEmail: session.customer_email!,
        status: 'completed',
        metadata: session.metadata,
        createdAt: new Date()
      };

      // TODO: Replace with actual database call
      // await this.saveCoursePayment(paymentData);

      console.log('💾 Would save course payment to database:', paymentData);
      await this.notifyFrontend('course-payment-completed', paymentData);

      // Grant course access
      // await this.grantCourseAccess(session.customer_email, session.metadata?.course_id);
    }
  }

  private async handleInvoiceCreated(invoice: Stripe.Invoice): Promise<void> {
    console.log('📄 Invoice created:', invoice.id);

    const invoiceData = {
      stripeInvoiceId: invoice.id,
      subscriptionId: invoice.subscription as string,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'pending',
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      description: invoice.lines.data[0]?.description || 'Subscription payment',
      createdAt: new Date()
    };

    // TODO: Replace with actual database call
    // await this.saveInvoice(invoiceData);

    console.log('💾 Would save pending invoice to database:', invoiceData);
    await this.notifyFrontend('invoice-created', invoiceData);
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log('💳 Payment intent succeeded:', paymentIntent.id);

    // Handle course payments
    if (paymentIntent.metadata?.course_id) {
      const coursePayment = {
        paymentIntentId: paymentIntent.id,
        courseId: paymentIntent.metadata.course_id,
        courseName: paymentIntent.metadata.course_name || 'Unknown Course',
        studentEmail: paymentIntent.receipt_email || 'unknown@example.com',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        createdAt: new Date(paymentIntent.created * 1000)
      };

      // TODO: Replace with actual database calls
      // await this.saveCoursePayment(coursePayment);
      // await this.grantCourseAccess(coursePayment.studentEmail, coursePayment.courseId);

      console.log('💾 Would save course payment to database:', coursePayment);
      await this.notifyFrontend('course-payment-succeeded', coursePayment);

      // Send course access email
      // await this.sendCourseAccessEmail(coursePayment);
    }
  }

  private mapStripePriceToPlanId(stripePriceId: string): string {
    // TODO: Replace with database lookup
    const priceToIdMap: { [key: string]: string } = {
      'price_1234567890': 'basic',
      'price_pro_monthly': 'pro',
      'price_enterprise_monthly': 'enterprise'
    };

    return priceToIdMap[stripePriceId] || 'basic';
  }

  private async notifyFrontend(eventType: string, data: any): Promise<void> {
    // TODO: Implement real-time frontend notification
    // Options:
    // 1. WebSocket connection
    // 2. Server-Sent Events (SSE)
    // 3. Push notifications
    // 4. Database polling from frontend

    console.log(`🔔 Would notify frontend: ${eventType}`, data);

    // For now, just log the event
    // In production, you might use:
    // - Socket.io
    // - WebSocket
    // - Server-Sent Events
    // - Push to message queue (Redis/RabbitMQ)
  }
}

// Factory function to create webhook handler
export const createProductionWebhookHandler = (secretKey: string, webhookSecret: string) => {
  return new ProductionStripeWebhookHandler(secretKey, webhookSecret);
};

// Example usage in serverless function
export const handleStripeWebhook = async (
  rawBody: string,
  signature: string,
  secretKey: string,
  webhookSecret: string
): Promise<{ success: boolean; error?: string }> => {
  const handler = createProductionWebhookHandler(secretKey, webhookSecret);
  return handler.handleWebhook(rawBody, signature);
};
