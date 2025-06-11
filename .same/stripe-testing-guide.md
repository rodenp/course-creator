# 🔧 Stripe Configuration & Extensions Testing Guide

## 🚀 Quick Start: Configure Test Stripe Integration

### Step 1: Navigate to Extensions
1. **From Main Screen**: Click the "Extensions" button (globe icon) in the header
2. **From Billing Issues**: Click "Billing" → "Configure Stripe" (automatically navigates to Extensions)

### Step 2: Configure Stripe (Easy Demo Mode)
1. **Find Stripe Integration**: Look for "Stripe Payments" in the Featured Extensions section
2. **Click Install**: Click the "Install" button on the Stripe card
3. **Use Demo Keys**: In the configuration screen:
   - Ensure "Test Mode" is enabled (should be by default)
   - Click **"Use Demo Keys for Testing"** button (blue button in the info box)
   - This auto-fills with working test keys
4. **Save Configuration**: Click "Save Configuration"
5. **Success**: You should see "Stripe configured successfully!" alert

### Step 3: Test Billing Features
1. **Go Back**: Click "← Back to Extensions" then navigate to main screen
2. **Access Billing**: Click the "Billing" button in header
3. **See Active Dashboard**: Should now show full billing dashboard instead of "Not Configured"
4. **Explore Plans**: Browse subscription plans (Basic, Pro, Enterprise)
5. **Test Checkout**: Click "Subscribe" on any plan (demo mode - no real charges)

## 📋 Complete Extensions Testing Checklist

### ✅ **Payment Extensions**
- [x] **Stripe Payments** - ⭐ Featured
  - Status: Available → Configured (after setup)
  - Price: Free
  - Test demo keys functionality
  - Test billing dashboard integration

### ✅ **Analytics Extensions**
- [x] **Advanced Analytics** - Available
  - Status: Available (not implemented yet)
  - Price: $19/month
  - Category: Analytics

### ✅ **Communication Extensions**
- [x] **Mailchimp Integration** - Available
  - Status: Available
  - Price: Free
  - Category: Communication

- [x] **Zoom Integration** - Coming Soon
  - Status: Available (Coming Soon)
  - Price: Free
  - Category: Communication

- [x] **Slack Integration** - Coming Soon
  - Status: Available (Coming Soon)
  - Price: Free
  - Category: Communication

### ✅ **Storage Extensions**
- [x] **AWS S3 Storage** - Coming Soon
  - Status: Available (Coming Soon)
  - Price: Pay per use
  - Category: Storage

### ✅ **Integration Extensions**
- [x] **Zapier Integration** - Coming Soon
  - Status: Available (Coming Soon)
  - Price: Free
  - Category: Integration

- [x] **Custom Domain** - Available
  - Status: Available
  - Price: $49/month
  - Category: Integration

## 🧪 Stripe Test Data

### Demo Test Keys (Auto-filled)
```
Publishable Key: pk_test_51234567890123456789012345678901234567890123
Secret Key: sk_test_51234567890123456789012345678901234567890123
Webhook Secret: whsec_1234567890123456789012345678901234567890
```

### Test Credit Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0000 0000 3220`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)

## 🎯 Expected Behavior After Configuration

### ✅ **Extensions Screen**
- Stripe card shows "Active" badge and "Manage" button
- Status indicator shows "Configured"
- Test mode badge visible

### ✅ **Billing Dashboard**
- Full dashboard instead of "Not Configured" message
- Subscription plans displayed (Basic $9, Pro $29, Enterprise $99)
- Mock customer data and payment methods
- Test invoices and billing history
- Working "Manage Billing" and checkout flows

### ✅ **Main Application**
- Billing button works without errors
- All billing-related features accessible
- No more "Stripe Not Configured" messages

## 🐛 Troubleshooting

### Common Issues
1. **"Demo Keys" button not working**: Refresh page and try again
2. **Configuration not saving**: Check browser console for errors
3. **Billing still shows "Not Configured"**: Try refreshing the page
4. **Keys not accepted**: Ensure they start with `pk_test_` and `sk_test_`

### Reset Configuration
1. Go to Extensions → Stripe → Configure
2. Clear all fields and re-enter keys
3. Toggle test mode off and on
4. Save configuration again

## 🚀 Next Steps After Testing

1. **Explore Other Extensions**: Browse available integrations
2. **Test Course Creation**: Verify billing limits and plan features
3. **Try Real Stripe Keys**: Replace demo keys with real test keys from Stripe dashboard
4. **Production Setup**: When ready, disable test mode and use live keys

---

**🎉 Success Criteria**: You should be able to configure Stripe, access full billing features, and explore all extensions without errors!
