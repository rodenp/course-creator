# 🚀 Real Stripe Payment Flow Setup Guide

## 🎯 Overview
This guide will help you set up **real Stripe payment processing** with actual charges, webhooks, and full checkout functionality.

## 📋 Prerequisites

### 1. Stripe Account Setup
1. **Create Stripe Account**: [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. **Verify Business Details**: Complete account verification
3. **Enable Test Mode**: Use test mode for development

### 2. Get Real Stripe Keys
1. **Go to Stripe Dashboard**: [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. **Switch to Test Mode**: Toggle in top-left corner
3. **Copy Keys**:
   - **Publishable Key**: `pk_test_...` (safe for frontend)
   - **Secret Key**: `sk_test_...` (backend only - we'll simulate)

### 3. Create Real Products & Prices
1. **Go to Products**: [https://dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)
2. **Create Products**:
   - **Basic Plan**: $9/month
   - **Pro Plan**: $29/month
   - **Enterprise Plan**: $99/month
3. **Copy Price IDs**: Each will have format `price_1ABC123...`

## 🔧 Configuration Steps

### Step 1: Update Price IDs in Code
Replace demo price IDs with your real ones:

```typescript
// In src/services/stripe.ts - update subscriptionPlans array
private readonly subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    stripePriceId: 'price_YOUR_BASIC_PRICE_ID', // Replace this
    // ... rest of config
  },
  {
    id: 'pro',
    name: 'Pro',
    stripePriceId: 'price_YOUR_PRO_PRICE_ID', // Replace this
    // ... rest of config
  },
  // ... etc
];
```

### Step 2: Configure Real Keys in App
1. **Navigate**: Extensions → Stripe Payments → Install
2. **Enter Real Keys**:
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`
3. **Enable Test Mode**: Keep test mode ON for development
4. **Save Configuration**

### Step 3: Set Up Server-Side Endpoint (Required for Real Payments)

Real Stripe requires server-side API calls. Create this endpoint:

```typescript
// Example backend endpoint (Node.js/Express)
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_YOUR_SECRET_KEY');

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, customerId, customerEmail } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      customer: customerId,
      customer_email: customerEmail,
      success_url: `${req.headers.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/billing/cancel`,
      subscription_data: {
        trial_period_days: 7, // Optional trial
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔄 Updated Service Implementation

Let me update the Stripe service to support real API calls:

### Real Checkout Session Creation
```typescript
// Update createCheckoutSession method
async createCheckoutSession(params: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'subscription' | 'payment';
  trialPeriodDays?: number;
}): Promise<{ sessionId: string; url: string }> {

  // For real implementation, call your backend
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const { sessionId } = await response.json();
  return { sessionId, url: `https://checkout.stripe.com/c/pay/${sessionId}` };
}
```

## 📡 Webhook Setup (Essential for Real Payments)

### 1. Create Webhook Endpoint
```typescript
// Webhook handler for subscription updates
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // Update user subscription in your database
      break;
    case 'invoice.payment_succeeded':
      // Handle successful payment
      break;
    case 'invoice.payment_failed':
      // Handle failed payment
      break;
  }

  res.json({received: true});
});
```

### 2. Configure Webhook in Stripe
1. **Go to Webhooks**: [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. **Add Endpoint**: `https://yourdomain.com/webhook`
3. **Select Events**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🧪 Testing Real Payments

### Test Credit Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0000 0000 3220`
- **Insufficient Funds**: `4000 0000 0000 9995`

### Testing Flow
1. **Configure Real Keys**: Use your actual test keys
2. **Create Subscription**: Choose a plan and subscribe
3. **Complete Checkout**: Use test card on Stripe Checkout
4. **Verify in Stripe**: Check Dashboard for payment
5. **Check Webhooks**: Verify events are received
6. **Update UI**: Subscription should show as active

## 📊 Expected Results

### In Stripe Dashboard
- ✅ Customer created
- ✅ Subscription active
- ✅ Payment succeeded
- ✅ Invoice generated
- ✅ Webhook events fired

### In Course Builder
- ✅ User subscription updated
- ✅ Billing dashboard shows active plan
- ✅ Access to premium features
- ✅ Billing history populated

## 🚀 Go Live Checklist

### Before Production
- [ ] Switch to live Stripe keys
- [ ] Set up production webhook endpoint
- [ ] Configure real domain URLs
- [ ] Test with small amounts
- [ ] Set up proper error monitoring
- [ ] Configure customer support processes

**🎯 Ready for real Stripe payment processing!**
