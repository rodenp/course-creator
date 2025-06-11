# 🔗 Stripe Price ID Connection Guide

## 🎯 **The Missing Link: Price IDs**

The Course Builder plans are currently using **placeholder Price IDs** that don't exist in your Stripe account. Here's how to fix this:

## 📝 **Step 1: Create Real Products in Stripe**

### **Go to Your Stripe Dashboard**
1. **Login**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Switch to Test Mode**: Toggle in top-left corner
3. **Go to Products**: [https://dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)

### **Create Exact Products**
Create these products **exactly** as shown:

**Product 1: Basic Plan**
- **Product Name**: `Course Builder - Basic Plan`
- **Description**: `Perfect for individuals - Up to 3 courses, Basic analytics`
- **Pricing Model**: `Recurring`
- **Price**: `$9.00`
- **Currency**: `USD`
- **Billing Period**: `Monthly`
- **Copy the Price ID**: Will look like `price_1ABC123DEF456GHI789`

**Product 2: Pro Plan**
- **Product Name**: `Course Builder - Pro Plan`
- **Description**: `Best for growing businesses - Unlimited courses, Advanced analytics`
- **Pricing Model**: `Recurring`
- **Price**: `$29.00`
- **Currency**: `USD`
- **Billing Period**: `Monthly`
- **Copy the Price ID**: Will look like `price_2DEF456GHI789ABC123`

**Product 3: Enterprise Plan**
- **Product Name**: `Course Builder - Enterprise Plan`
- **Description**: `For large organizations - Everything in Pro plus SSO, Custom integrations`
- **Pricing Model**: `Recurring`
- **Price**: `$99.00`
- **Currency**: `USD`
- **Billing Period**: `Monthly`
- **Copy the Price ID**: Will look like `price_3GHI789ABC123DEF456`

## 🔧 **Step 2: Update Course Builder Code**

### **Replace Placeholder Price IDs**
1. **Open**: `course-builder/src/services/stripe.ts`
2. **Find line 115** (around the subscriptionPlans array)
3. **Replace the placeholder IDs**:

```typescript
private readonly subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for individuals',
    price: 9,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_YOUR_BASIC_PRICE_ID_HERE', // ← Replace this
    features: [
      'Up to 3 courses',
      'Basic analytics',
      'Email support',
      'Standard templates'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for growing businesses',
    price: 29,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_YOUR_PRO_PRICE_ID_HERE', // ← Replace this
    features: [
      'Unlimited courses',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Integrations',
      'Advanced reporting'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 99,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_YOUR_ENTERPRISE_PRICE_ID_HERE', // ← Replace this
    features: [
      'Everything in Pro',
      'SSO integration',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Advanced security'
    ]
  }
];
```

### **Example with Real Price IDs**
```typescript
// Example with real Stripe Price IDs (yours will be different)
stripePriceId: 'price_1OQ2J3K4M5N6O7P8Q9R0S1T2', // Basic Plan
stripePriceId: 'price_2PQ3J4K5M6N7O8P9Q0R1S2T3', // Pro Plan
stripePriceId: 'price_3QR4J5K6M7N8O9P0Q1R2S3T4', // Enterprise Plan
```

## 🧪 **Step 3: Test the Connection**

### **Configure Real Stripe Keys**
1. **Get API Keys**: Stripe Dashboard → Developers → API Keys
2. **Copy Keys**:
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`
3. **Configure in App**: Extensions → Stripe → Install → Enter real keys → Save

### **Test Real Payment Flow**
1. **Go to Billing**: Click "Billing" in Course Builder
2. **Choose Plan**: Select "Pro Plan ($29)"
3. **Subscribe**: Click "Subscribe"
4. **Real Checkout**: Confirm real Stripe checkout
5. **Enter Test Card**: `4242 4242 4242 4242`
6. **Complete Payment**: Pay $29.00

### **Verify in Stripe Dashboard**
1. **Check Payments**: [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
2. **Should See**:
   - ✅ **Payment**: $29.00 charge for "Course Builder - Pro Plan"
   - ✅ **Customer**: Email and details from checkout
   - ✅ **Subscription**: Active subscription to Pro Plan
   - ✅ **Invoice**: Generated for $29.00

### **Verify in Course Builder**
- ✅ **Active Subscription**: Shows "Pro" plan
- ✅ **Billing Period**: Current period dates
- ✅ **Features**: Pro plan features unlocked
- ✅ **Payment Method**: Test card ending in 4242

## 🔍 **How to Verify the Connection**

### **Console Testing**
Open browser console (F12) and run:

```javascript
// Check if real price IDs are configured
console.log('Plans with Price IDs:', window.stripeService.getPlans());

// Test creating checkout with real price ID
window.realStripeAPI.createRealCheckoutSession({
  priceId: 'price_YOUR_REAL_PRICE_ID', // Use your actual price ID
  customerEmail: 'test@example.com',
  successUrl: window.location.origin + '/success',
  cancelUrl: window.location.origin + '/cancel',
  mode: 'subscription'
}).then(result => {
  console.log('✅ Real checkout session created:', result);
  console.log('🔗 This will charge for your actual Stripe product!');
});
```

### **Tracing the Connection**
1. **Course Builder Plan** → `stripePriceId: 'price_ABC123'`
2. **Stripe API Call** → `stripe.checkout.sessions.create({ line_items: [{ price: 'price_ABC123' }] })`
3. **Stripe Checkout** → Shows your actual product name and price
4. **Payment Success** → Creates subscription to your actual Stripe product
5. **Stripe Dashboard** → Shows payment for your specific product

## 🎯 **What You'll See When It's Working**

### **In Stripe Checkout Page**
- Product name: "Course Builder - Pro Plan"
- Price: "$29.00 / month"
- Description: "Best for growing businesses..."

### **In Stripe Dashboard**
- **Product**: Course Builder - Pro Plan
- **Customer**: test@example.com
- **Amount**: $29.00
- **Status**: Paid
- **Subscription**: Active

### **In Course Builder**
- **Current Plan**: Pro
- **Status**: Active
- **Next Billing**: [Date]
- **Features**: All Pro features unlocked

## 🚨 **Common Issues**

### **"Invalid Price ID" Error**
- **Cause**: Using placeholder IDs or wrong price ID
- **Fix**: Copy exact price ID from Stripe Dashboard

### **"Product Not Found" Error**
- **Cause**: Price ID from wrong Stripe account or mode
- **Fix**: Ensure you're in test mode and using test price IDs

### **Payment Shows Wrong Product**
- **Cause**: Wrong price ID mapping
- **Fix**: Verify price ID matches the correct product in Stripe

## 🎉 **Success Criteria**

When everything is connected correctly:
1. **Choose plan in Course Builder** → See exact product name in Stripe checkout
2. **Complete payment** → Payment appears in Stripe Dashboard with correct product
3. **Subscription active** → Both Course Builder and Stripe show same subscription
4. **Product revenue** → Stripe Dashboard shows revenue for your specific products

**🎯 This creates a direct link between your Course Builder plans and your Stripe products, with real billing and revenue tracking!**
