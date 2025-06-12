import { stripeService, type StripeWebhookEvent } from './stripe';

export interface WebhookHandler {
  handleEvent: (event: StripeWebhookEvent) => Promise<void>;
}

class StripeWebhookService implements WebhookHandler {
  private isServer = typeof window === 'undefined';

  async handleEvent(event: StripeWebhookEvent): Promise<void> {
    // This service is now primarily for frontend simulation via `simulateWebhook`.
    // Direct event processing logic has been moved to SecureStripeWebhookHandler for backend processing.
    console.log(
      `🎣 StripeWebhookService.handleEvent called for event: ${event.type} (${event.id}). ` +
      `This is likely from a simulation. Actual backend processing should occur in SecureStripeWebhookHandler.`
    );

    // If running on the client-side (likely a simulation), dispatch an event
    // that some UI components might be listening to for demo/testing purposes.
    if (!this.isServer) {
        window.dispatchEvent(new CustomEvent('stripe-webhook-event-simulated', {
            detail: event
        }));
        console.log('🚀 Dispatched simulated event to window for UI testing:', event.type);

        // Minimal local storage update for simulated events if needed for some tests.
        // This is NOT a replacement for backend state management.
        // Example: if a 'payment_succeeded' is simulated, a test might expect some local flag.
        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as any;
            const existingInvoices = JSON.parse(localStorage.getItem('simulated-user-invoices') || '[]');
            const updatedInvoices = [{id: invoice.id, status: 'paid', amount: invoice.amount_paid }, ...existingInvoices];
            localStorage.setItem('simulated-user-invoices', JSON.stringify(updatedInvoices.slice(0,5))); // Keep it small
        }
    }
    // No further processing here.
  }

  // mapStripePriceToPlanId is removed as it was part of the detailed event handling.
  // If needed for simulation setup, it could be a static utility or part of simulation data.
}

// Export singleton instance
// The instance is kept if `simulateWebhook` relies on instance properties,
// or if some parts of the UI might still try to call `handleEvent` on the instance for simulation.
// Otherwise, `simulateWebhook` could be made a static/standalone function if it doesn't need `this`.
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
