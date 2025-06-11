# 🧪 Course-Specific Billing Testing Guide

## 🎯 **Overview**
This guide will help you test all the new course-specific Stripe billing features that have been implemented in the course builder.

## 📸 **Live Preview Available**
The application is currently running at: http://localhost:3000/
A screenshot is available showing the enhanced course cards with pricing information.

## 🔧 **Features to Test**

### **1. Enhanced Course Cards (Immediate Testing)**

**What to Look For:**
- **Pricing Badges**: Look for pricing information in the top-right corner of course cards
- **Access Level Badges**: "Paid" or "Free" indicators in the top-left corner
- **Purchase Buttons**: "Purchase Course" buttons on paid courses vs "View Course" on free courses
- **Stripe Status**: Configuration status indicators for paid courses

**Expected Results:**
- "Complete React Developer Course" should show pricing badges and "Purchase Course" button
- "TypeScript Fundamentals" should show subscription pricing
- "Modern CSS & Tailwind" should show "Free" badge and "View Course" button

### **2. Course Settings → Stripe Configuration**

**Testing Steps:**
1. **Navigate**: Click any course → Settings gear icon
2. **Access & Pricing Section**: Look for the new "Access & Pricing" card
3. **Enable Paid Course**: Toggle the "Paid Course" switch
4. **Configure Stripe**: Click "Configure Stripe" button

**Expected Results:**
- Toggle should enable/disable paid access
- "Configure Stripe" button should open course-specific Stripe settings
- Status indicators should update based on configuration

### **3. Course-Specific Stripe Settings**

**Testing Steps:**
1. **From Course Settings**: Click "Configure Stripe"
2. **Basic Configuration**:
   - Enable Stripe Payments toggle
   - Test Mode toggle
   - Enter API keys (use demo keys button for testing)
3. **Create Pricing Plans**:
   - Click "Add Plan" button
   - Test different intervals: monthly, yearly, one-time
   - Add features for each plan
   - Mark popular plans

**Test Plan Examples:**
```
Basic Plan:
- Name: "Basic Access"
- Price: $49
- Interval: One-time
- Features: ["Lifetime access", "Certificate", "Community"]

Pro Plan:
- Name: "Pro Access"
- Price: $99
- Interval: One-time
- Features: ["Everything in Basic", "Source code", "Priority support"]
- Mark as Popular: ✓

Monthly Plan:
- Name: "Monthly Subscription"
- Price: $19
- Interval: Monthly
- Trial Days: 14
- Features: ["Monthly access", "Cancel anytime"]
```

### **4. Plan Editor Modal Testing**

**Testing Steps:**
1. **Create New Plan**: Click "Add Plan" in Stripe settings
2. **Edit Existing Plan**: Click edit icon on any plan
3. **Test Form Fields**:
   - Plan name and description
   - Price and currency selection
   - Billing interval dropdown
   - Trial days (optional)
   - Features list (add/remove)
   - Popular and Enabled toggles

**Validation Testing:**
- Try submitting without required fields
- Test feature addition/removal
- Test different billing intervals
- Verify preview updates correctly

### **5. Purchase Flow Testing**

**Testing Steps:**
1. **Initiate Purchase**: Click "Purchase Course" on a paid course card
2. **Plan Selection**: Review course-specific pricing display
3. **Plan Selection**: Choose a plan and click purchase button
4. **Confirmation Dialog**: Review purchase details
5. **Stripe Integration**: Test "Proceed to Payment" button

**Expected Flow:**
```
Course Card → Purchase Course → Plan Selection →
Confirmation → Stripe Checkout (demo mode)
```

**Important Notes:**
- This uses the existing Stripe demo/test infrastructure
- Course-specific settings override global Stripe settings
- Demo mode shows simulation dialogs

### **6. Course Access Level Display**

**Testing What Changes:**
1. **Free Course**: Shows green "Free" badge
2. **Paid Course (Unconfigured)**: Shows "Paid" badge but "Stripe not configured" warning
3. **Paid Course (Configured)**: Shows "Paid" badge with "Stripe configured (X plans)" status

### **7. Sample Data Verification**

**Pre-configured Examples:**
- **Course 1 (React)**: Paid course with 3 plans (Basic $49, Pro $99, Monthly $19)
- **Course 2 (TypeScript)**: Paid course with monthly subscription only
- **Course 3 (CSS)**: Free course
- **Template Course**: Free course (templates are free by default)

## 🎨 **UI/UX Testing Points**

### **Visual Elements to Verify:**
- [ ] Pricing badges are clearly visible and well-positioned
- [ ] Access level badges use appropriate colors (blue for paid, green for free)
- [ ] Purchase buttons are prominent and action-oriented
- [ ] Course cards maintain good visual hierarchy
- [ ] Stripe configuration UI is professional and intuitive
- [ ] Plan editor modal is user-friendly

### **Responsive Testing:**
- [ ] Course cards display properly on different screen sizes
- [ ] Pricing information remains readable on mobile
- [ ] Purchase dialog is properly sized on all devices
- [ ] Plan editor modal works on mobile/tablet

## 🔍 **Technical Testing**

### **Console Testing Commands:**
```javascript
// Check global Stripe service
console.log('Stripe service:', window.stripeService.isConfigured());

// Check course data
const courses = JSON.parse(localStorage.getItem('courses') || '[]');
console.log('Courses with Stripe settings:',
  courses.filter(c => c.stripeSettings?.enabled)
);

// Test course-specific checkout
window.stripeService.createCheckoutSession({
  priceId: 'price_demo_premium_course',
  customerEmail: 'test@example.com',
  successUrl: window.location.origin + '/success',
  cancelUrl: window.location.origin + '/cancel',
  mode: 'payment'
}).then(console.log);
```

### **Data Persistence Testing:**
- [ ] Course Stripe settings save correctly
- [ ] Pricing plans persist after page refresh
- [ ] Access level changes are maintained
- [ ] Configuration status updates properly

## 📊 **Business Logic Testing**

### **Plan Management:**
- [ ] Can create plans with different intervals
- [ ] Popular plan highlighting works
- [ ] Plan enable/disable functionality
- [ ] Plan ordering (order field)
- [ ] Feature list management

### **Pricing Display Logic:**
- [ ] Single plan shows exact price
- [ ] Multiple plans show "From $X" format
- [ ] Free courses show "Free"
- [ ] Unconfigured paid courses show appropriate messaging

### **Purchase Flow Logic:**
- [ ] Only enabled plans appear in purchase flow
- [ ] Course-specific Stripe keys are used when configured
- [ ] Fallback to global Stripe settings when course keys not set
- [ ] Proper error handling for missing configuration

## 🚨 **Error Scenarios to Test**

### **Configuration Errors:**
- [ ] No Stripe keys configured (global or course-specific)
- [ ] Invalid price IDs in plans
- [ ] Missing required plan fields
- [ ] Stripe service initialization failures

### **Purchase Flow Errors:**
- [ ] Selecting disabled plans
- [ ] Plans without price IDs
- [ ] Network failures during checkout
- [ ] Stripe service unavailable

## ✅ **Success Criteria**

### **✅ Course Management:**
- Course settings properly show access level controls
- Stripe configuration opens and functions correctly
- Plan management works intuitively

### **✅ User Experience:**
- Course cards clearly show pricing and access level
- Purchase flow is smooth and professional
- Confirmation dialogs provide clear information

### **✅ Technical Integration:**
- Course-specific Stripe settings integrate with global service
- Checkout sessions use correct course configuration
- Data persistence works reliably

### **✅ Visual Design:**
- Professional appearance matches existing design
- Pricing information is prominent but not overwhelming
- All UI elements are properly styled and responsive

## 🎉 **Testing Summary**

**Quick Test Sequence:**
1. **View Enhanced Course Cards** → Verify pricing badges and access indicators
2. **Configure Course Billing** → Course Settings → Configure Stripe → Add Plans
3. **Test Purchase Flow** → Click Purchase → Select Plan → Confirm
4. **Verify Data Persistence** → Refresh page and check settings maintained

**Expected Total Test Time:** 15-20 minutes for comprehensive testing

**🎯 Success Indicator:** You should be able to create a paid course with multiple pricing plans and initiate a purchase flow that uses course-specific Stripe settings!

---

## 📝 **Implementation Notes**

**What's New in Version 71:**
- Course-specific Stripe settings and pricing plans
- Enhanced course cards with pricing displays
- Integrated purchase flow with existing Stripe service
- Professional plan management interface
- Course access level controls

**Architecture:**
- Extends existing Course interface with billing properties
- Integrates with existing Stripe service infrastructure
- Uses course-specific settings when available, falls back to global
- Maintains data in localStorage for demo purposes

**🚀 Ready for comprehensive testing of the new course billing features!**
