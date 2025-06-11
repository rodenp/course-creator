# Stripe Webhook Implementation Guide

## 🔍 Current Implementation Status

### ✅ What We Have (Complete)

#### **1. Frontend Webhook Simulation**
- **File**: `src/services/stripe-webhooks.ts`
- **Purpose**: Handles webhook events in the browser for testing
- **Features**:
  - Complete event handlers for all Stripe webhook types
  - LocalStorage updates for subscription/invoice data
  - Real-time UI updates via custom events
  - Testing interface with simulation buttons

#### **2. Production Webhook Handler**
- **File**: `src/services/stripe-webhook-production.ts`
- **Purpose**: Production-ready webhook processing with signature verification
- **Features**:
  - Proper Stripe signature verification using `stripe.webhooks.constructEvent()`
  - Complete event processing for all webhook types
  - Database integration placeholders (ready for your database)
  - Error handling and logging

#### **3. Webhook Endpoints**
- **Files**:
  - `api/webhooks/stripe.ts` (basic endpoint)
  - `api/webhooks/stripe-production.ts` (production endpoint)
- **Purpose**: Backend endpoints to receive webhooks from Stripe
- **Features**:
  - Serverless function compatible (Vercel/Netlify)
  - Signature verification
  - Environment variable configuration

#### **4. Webhook URL Generation**
- **File**: `src/services/stripe-webhook-endpoint.ts`
- **Purpose**: Generate webhook URLs for different deployment scenarios
- **Features**:
  - Dynamic URL generation based on deployment
  - Setup instructions and event list
  - Copy-to-clipboard functionality in UI

### ❌ What's Missing (For Production)

#### **1. Backend Deployment**
- **Issue**: Webhook endpoints exist but need to be deployed
- **Solution**: Deploy to Vercel, Netlify, or your preferred platform
- **Files to deploy**: `api/webhooks/stripe-production.ts`

#### **2. Database Integration**
- **Issue**: Webhook handlers log to console but don't save to database
- **Solution**: Replace TODO comments with actual database calls
- **Examples**:
  ```typescript
  // Replace this:
  // await this.updateUserSubscription(subscription.customer, subscriptionData);

  // With this:
  await database.users.update({
    where: { stripeCustomerId: subscription.customer },
    data: { subscription: subscriptionData }
  });
  ```

#### **3. Environment Variables**
- **Issue**: Need to configure Stripe keys in production
- **Required Variables**:
  ```env
  STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

#### **4. Real-time Frontend Updates**
- **Issue**: Production handler logs events but doesn't notify frontend
- **Solutions**:
  - WebSocket connection
  - Server-Sent Events (SSE)
  - Database polling
  - Push notifications

## 🚀 Production Setup Steps

### Step 1: Deploy Webhook Endpoint

#### **Option A: Vercel**
1. Deploy your app to Vercel
2. The webhook endpoint will be: `https://your-app.vercel.app/api/webhooks/stripe-production`
3. Add environment variables in Vercel dashboard

#### **Option B: Netlify**
1. Deploy your app to Netlify
2. Create `netlify/functions/stripe-webhook.js`:
```javascript
const { handleStripeWebhook } = require('../../src/services/stripe-webhook-production');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const result = await handleStripeWebhook(
    event.body,
    event.headers['stripe-signature'],
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  return {
    statusCode: result.success ? 200 : 400,
    body: JSON.stringify(result)
  };
};
```

#### **Option C: Custom Server**
```javascript
// Express.js example
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const result = await handleStripeWebhook(
    req.body,
    req.headers['stripe-signature'],
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  res.status(result.success ? 200 : 400).json(result);
});
```

### Step 2: Configure Environment Variables

```env
# Production
STRIPE_SECRET_KEY=sk_live_51ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
STRIPE_WEBHOOK_SECRET=whsec_1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk

# Test
STRIPE_SECRET_KEY=sk_test_51ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk
```

### Step 3: Add Webhook in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
   - `checkout.session.completed`
   - `invoice.created`
   - `payment_intent.succeeded`
5. Copy the webhook secret

### Step 4: Add Database Integration

Replace the TODO comments in `stripe-webhook-production.ts` with your database calls:

```typescript
// Example with Prisma
private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    planId: this.mapStripePriceToPlanId(subscription.items.data[0].price.id),
  };

  // Find user by Stripe customer ID and update subscription
  await prisma.user.update({
    where: { stripeCustomerId: subscription.customer },
    data: { subscription: subscriptionData }
  });

  // Send welcome email
  await sendWelcomeEmail(subscription.customer);
}
```

### Step 5: Add Real-time Updates (Optional)

#### **Option A: WebSocket with Socket.io**
```typescript
// In webhook handler
private async notifyFrontend(eventType: string, data: any): Promise<void> {
  io.emit(eventType, data);
}

// In frontend
socket.on('subscription-updated', (data) => {
  updateBillingDashboard(data);
});
```

#### **Option B: Server-Sent Events**
```typescript
// In webhook handler
private async notifyFrontend(eventType: string, data: any): Promise<void> {
  // Send to SSE endpoint
  await fetch('/api/sse/notify', {
    method: 'POST',
    body: JSON.stringify({ eventType, data })
  });
}
```

#### **Option C: Database Polling**
```typescript
// In frontend - poll for updates every 30 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch('/api/subscription/status');
    const data = await response.json();
    updateSubscriptionState(data);
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

## 🧪 Testing Your Webhook Implementation

### 1. Use Stripe CLI for Local Testing
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe-production

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### 2. Use the Built-in Testing Interface
- Go to Billing Dashboard
- Use the "Webhook Testing" buttons (visible in test mode)
- Check console logs to see event processing

### 3. Monitor Webhook Logs
- Check your server logs for webhook processing
- Use Stripe Dashboard > Webhooks > [your endpoint] > Attempts
- Look for successful (200) vs failed (4xx/5xx) responses

## 📊 What Happens When Webhooks Work

### Subscription Created
1. User completes Stripe checkout
2. Stripe sends `customer.subscription.created` webhook
3. Your endpoint receives and verifies the webhook
4. Database is updated with new subscription
5. User is granted access to premium features
6. Welcome email is sent
7. Frontend updates to show active subscription

### Payment Succeeded
1. Stripe processes recurring payment
2. Stripe sends `invoice.payment_succeeded` webhook
3. Invoice is saved to database
4. Subscription status is updated to 'active'
5. Receipt email is sent
6. Frontend billing dashboard updates

### Payment Failed
1. Payment attempt fails (expired card, insufficient funds, etc.)
2. Stripe sends `invoice.payment_failed` webhook
3. Subscription status is updated to 'past_due'
4. Retry attempts are logged
5. User is notified of payment failure
6. Frontend shows payment issue warning

## 🔒 Security Considerations

### 1. Signature Verification
- **Critical**: Always verify webhook signatures
- **Why**: Prevents malicious requests pretending to be from Stripe
- **How**: Use `stripe.webhooks.constructEvent()`

### 2. Idempotency
- **Issue**: Stripe may send the same webhook multiple times
- **Solution**: Check event ID before processing
```typescript
// Check if event already processed
const existingEvent = await database.webhookEvents.findUnique({
  where: { stripeEventId: event.id }
});

if (existingEvent) {
  console.log('Event already processed:', event.id);
  return;
}

// Process event and save
await database.webhookEvents.create({
  data: { stripeEventId: event.id, processed: true }
});
```

### 3. Environment Variables
- Never commit Stripe secrets to code
- Use environment variables in production
- Rotate webhook secrets periodically

## 🎯 Summary

### **Current State**:
- ✅ Complete webhook logic (frontend simulation)
- ✅ Production-ready webhook handler with signature verification
- ✅ Webhook endpoint scaffolding
- ✅ UI integration and testing interface

### **To Make It Work in Production**:
1. **Deploy webhook endpoint** to your server/platform
2. **Add environment variables** (Stripe keys)
3. **Configure webhook in Stripe Dashboard** with your URL
4. **Replace database TODOs** with actual database calls
5. **Test with Stripe CLI** or real transactions

### **The Result**:
When properly deployed, your webhook system will automatically:
- Update user subscriptions when payments succeed/fail
- Handle trial endings and send notifications
- Process course purchases and grant access
- Keep billing dashboard in sync with Stripe
- Provide enterprise-grade payment automation

The webhook infrastructure is **production-ready** - it just needs deployment and database integration!
