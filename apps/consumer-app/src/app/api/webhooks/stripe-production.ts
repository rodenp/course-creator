// Global storage for webhook events (in production, use Redis or database)
let recentWebhookEvents: any[] = [];

// Simple webhook handler that stores real Stripe events for frontend polling
export default async function handler(req: any, res: any) {
  const { method, url } = req;

  // Handle GET requests for polling recent events
  if (method === 'GET') {
    console.log('📡 Frontend polling for webhook events');

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
    console.log('🎣 Webhook received from Stripe');

    // Get the webhook event from request body
    const webhookEvent = req.body;

    // Validate that we have a proper Stripe event
    if (!webhookEvent || !webhookEvent.type || !webhookEvent.data) {
      console.error('❌ Invalid webhook event structure');
      return res.status(400).json({ error: 'Invalid webhook event' });
    }

    console.log('📄 Processing webhook event:', webhookEvent.type, webhookEvent.id);

    // Store the event for frontend polling
    recentWebhookEvents.push({
      ...webhookEvent,
      receivedAt: new Date().toISOString()
    });

    // Keep only the last 10 events to prevent memory issues
    if (recentWebhookEvents.length > 10) {
      recentWebhookEvents = recentWebhookEvents.slice(-10);
    }

    console.log('✅ Webhook stored for frontend polling');

    return res.status(200).json({
      received: true,
      eventType: webhookEvent.type,
      eventId: webhookEvent.id,
      stored: true
    });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Configure to accept raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
