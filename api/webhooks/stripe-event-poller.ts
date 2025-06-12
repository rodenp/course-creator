// IMPORTANT: THIS FILE IS FOR DEVELOPMENT/TESTING POLLING PURPOSES ONLY.
// IT LACKS STRIPE SIGNATURE VERIFICATION AND IS NOT SUITABLE FOR PRODUCTION WEBHOOK PROCESSING.
// THE PRIMARY, SECURE WEBHOOK ENDPOINT IS 'api/webhooks/stripe.ts'.

// Global storage for webhook events (in production, use Redis or database)
let recentWebhookEvents: any[] = [];

// Simple webhook handler that stores real Stripe events for frontend polling
export default async function handler(req: any, res: any) {
  // IMPORTANT: This handler is for development/testing (event polling) and does NOT verify
  // Stripe webhook signatures. It should NOT be used as a production webhook endpoint.
  // Use 'api/webhooks/stripe.ts' for secure production webhook handling.

  const { method, url } = req;

  // Handle GET requests for polling recent events
  if (method === 'GET') {
    console.log('📡 Frontend polling for webhook events (stripe-event-poller)');

    // Return recent events and clear them
    const events = [...recentWebhookEvents];
    recentWebhookEvents = []; // Clear after sending

    return res.status(200).json({
      success: true,
      events,
      count: events.length
    });
  }

  // Handle POST requests (actual webhooks from Stripe)
  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎣 Webhook received by stripe-event-poller.ts (for polling, NOT SECURE PROCESSING)');

    // Get the webhook event from request body
    const webhookEvent = req.body;

    // Validate that we have a proper Stripe event
    if (!webhookEvent || !webhookEvent.type || !webhookEvent.data) {
      console.error('❌ Invalid webhook event structure (stripe-event-poller)');
      return res.status(400).json({ error: 'Invalid webhook event' });
    }

    console.log('📄 Storing webhook event for polling:', webhookEvent.type, webhookEvent.id, '(stripe-event-poller)');

    // Store the event for frontend polling
    recentWebhookEvents.push({
      ...webhookEvent,
      receivedAt: new Date().toISOString()
    });

    // Keep only the last 10 events to prevent memory issues
    if (recentWebhookEvents.length > 10) {
      recentWebhookEvents = recentWebhookEvents.slice(-10);
    }

    console.log('✅ Webhook stored for frontend polling (stripe-event-poller)');

    return res.status(200).json({
      received_by_poller: true, // Indicate it was received by this specific poller
      eventType: webhookEvent.type,
      eventId: webhookEvent.id,
      stored_for_polling: true
    });

  } catch (error) {
    console.error('❌ Webhook processing failed in stripe-event-poller:', error);
    return res.status(500).json({
      error: 'Webhook polling storage failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Configure to accept raw body for Stripe signature verification
// Although this poller doesn't verify, the config is often copied.
// For this endpoint, bodyParser: true (default) is fine as it just logs/stores JSON.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
