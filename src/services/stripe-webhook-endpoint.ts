import { stripeWebhookService, type StripeWebhookEvent } from './stripe-webhooks';

// Webhook endpoint configuration
export interface WebhookEndpointConfig {
  url: string;
  secret: string;
  events: string[];
  description: string;
}

// Generate webhook endpoint URL for different deployment scenarios
export const generateWebhookURL = (baseUrl?: string): WebhookEndpointConfig => {
  // Get the current domain or use provided base URL
  const domain = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com');

  // Webhook endpoint path
  const webhookPath = '/api/webhooks/stripe';
  const fullUrl = `${domain}${webhookPath}`;

  return {
    url: fullUrl,
    secret: 'whsec_your_webhook_secret_from_stripe', // This will be provided by Stripe
    events: [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.trial_will_end',
      'checkout.session.completed',
      'invoice.created',
      'payment_intent.succeeded',
      'payment_method.attached',
      'customer.created',
      'customer.updated'
    ],
    description: 'Course Builder Stripe Integration'
  };
};

// Different deployment scenarios and their webhook URLs
export const getWebhookURLs = () => {
  const scenarios = {
    // Local development (if using ngrok or similar)
    local: {
      name: 'Local Development',
      url: 'https://your-ngrok-url.ngrok.io/api/webhooks/stripe',
      note: 'Use ngrok or similar tool to expose localhost. Run: ngrok http 3000'
    },

    // Netlify deployment
    netlify: {
      name: 'Netlify Deployment',
      url: 'https://your-site-name.netlify.app/api/webhooks/stripe',
      note: 'Replace "your-site-name" with your actual Netlify site name'
    },

    // Vercel deployment
    vercel: {
      name: 'Vercel Deployment',
      url: 'https://your-project.vercel.app/api/webhooks/stripe',
      note: 'Replace "your-project" with your actual Vercel project name'
    },

    // Custom domain
    custom: {
      name: 'Custom Domain',
      url: 'https://your-domain.com/api/webhooks/stripe',
      note: 'Replace "your-domain.com" with your actual domain'
    },

    // Same platform (current)
    same: {
      name: 'Same Platform',
      url: 'https://same.new/api/webhooks/stripe',
      note: 'For testing on Same platform - may need backend setup'
    }
  };

  return scenarios;
};

// Display webhook setup instructions
export const displayWebhookInstructions = () => {
  const webhookUrls = getWebhookURLs();
  const config = generateWebhookURL();

  console.log('\n🎣 STRIPE WEBHOOK SETUP INSTRUCTIONS\n');
  console.log('1. Go to your Stripe Dashboard: https://dashboard.stripe.com/webhooks');
  console.log('2. Click "Add endpoint"');
  console.log('3. Choose the appropriate URL based on your deployment:\n');

  Object.entries(webhookUrls).forEach(([key, scenario]) => {
    console.log(`   ${scenario.name}:`);
    console.log(`   URL: ${scenario.url}`);
    console.log(`   Note: ${scenario.note}\n`);
  });

  console.log('4. Select these events to listen for:');
  config.events.forEach(event => {
    console.log(`   ✓ ${event}`);
  });

  console.log('\n5. After creating the endpoint, copy the webhook secret (starts with "whsec_")');
  console.log('6. Add the secret to your environment variables or Stripe configuration\n');

  console.log('🔧 Backend Implementation Required:');
  console.log('- Create /api/webhooks/stripe endpoint in your backend');
  console.log('- Verify webhook signatures using Stripe SDK');
  console.log('- Call the webhook handler from this service\n');

  return {
    urls: webhookUrls,
    config,
    instructions: 'See console for detailed setup instructions'
  };
};

// For current Same platform, show the webhook URL
export const getCurrentWebhookURL = (): string => {
  if (typeof window !== 'undefined') {
    const currentUrl = `${window.location.origin}/api/webhooks/stripe`;
    console.log('\n🎣 YOUR STRIPE WEBHOOK URL:');
    console.log(`${currentUrl}\n`);
    console.log('⚠️ Note: This requires backend implementation to handle webhook requests');
    return currentUrl;
  }
  return 'https://your-domain.com/api/webhooks/stripe';
};

// Export the main function to get webhook URL
export const getStripeWebhookURL = (): string => {
  return getCurrentWebhookURL();
};
