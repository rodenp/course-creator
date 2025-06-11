import { createWebhookHandler } from '@/services/stripe-webhook-endpoint';

// This is a Vercel/Netlify serverless function
// For other platforms, adapt as needed (Express.js, etc.)

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a Request object from the incoming request
    const request = new Request(`${req.url}`, {
      method: req.method,
      headers: {
        'stripe-signature': req.headers['stripe-signature'] || '',
        'content-type': req.headers['content-type'] || '',
      },
      body: JSON.stringify(req.body)
    });

    // Use our webhook handler
    const webhookHandler = createWebhookHandler();
    const response = await webhookHandler(request);

    // Convert Response to Express/Vercel response
    const responseData = await response.json();
    return res.status(response.status).json(responseData);

  } catch (error) {
    console.error('❌ Webhook endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
