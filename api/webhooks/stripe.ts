import { createSecureWebhookHandler } from '@/services/stripe-server-webhook-handler';

// This is a Vercel/Netlify serverless function.
// It's configured to disable bodyParser to receive the raw request body,
// which is necessary for Stripe webhook signature verification.

// Helper function to read raw body from the request
async function getRawBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', (err: Error) => {
      reject(err);
    });
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  try {
    const rawBody = await getRawBody(req);

    // IMPORTANT: Replace these with actual environment variables in your deployment
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_YOUR_STRIPE_SECRET_KEY"; // Fallback for local dev if not set
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_YOUR_STRIPE_WEBHOOK_SECRET"; // Fallback for local dev

    if (stripeSecretKey === "sk_test_YOUR_STRIPE_SECRET_KEY" || webhookSecret === "whsec_YOUR_STRIPE_WEBHOOK_SECRET") {
        console.warn("Using placeholder Stripe secrets for webhook handler. Ensure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set in production.");
    }

    const webhookHandler = createSecureWebhookHandler(stripeSecretKey, webhookSecret);
    const { success, error: handlerError } = await webhookHandler.handleWebhook(rawBody, signature);

    if (success) {
      return res.status(200).json({ received: true });
    } else {
      console.error('❌ Webhook handler failed:', handlerError);
      return res.status(400).json({ error: 'Webhook handler failed', message: handlerError });
    }

  } catch (error) {
    console.error('❌ Webhook endpoint error:', error);
    // Check if the error is due to raw body parsing or something else
    if (error instanceof Error && error.message.includes("Invalid JSON")) {
        return res.status(400).json({ error: "Invalid JSON payload" });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Configure Vercel to disable body parsing for this route
// This is crucial for Stripe's signature verification, which needs the raw body.
export const config = {
  api: {
    bodyParser: false,
  },
};
