import type React from 'react';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type {
  PlanType,
  Subscription,
  Invoice,
  PaymentMethod,
  BillingDetails,
  FeatureKey,
  Plan
} from '@/types/billing';

// Import the actual config and plans
import { FEATURE_CONFIG, PLANS } from '@/types/billing';

interface BillingContextType {
  // Current subscription
  subscription: Subscription | null;
  currentPlan: Plan | null;

  // Feature checking
  hasFeature: (feature: FeatureKey) => boolean;
  canCreateCourse: () => boolean;
  getCourseLimit: () => number;

  // Billing data
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  billingDetails: BillingDetails | null;

  // Actions
  upgradePlan: (planId: PlanType) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  updatePaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>;
  downloadInvoice: (invoiceId: string) => Promise<void>;

  // Loading states
  loading: boolean;
  upgrading: boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

// Mock data for development
const generateMockInvoices = (): Invoice[] => {
  return [
    {
      id: 'inv_001',
      subscriptionId: 'sub_001',
      amount: 19.00,
      currency: 'USD',
      status: 'paid',
      date: new Date('2024-01-01'),
      description: 'Pro Plan - January 2024',
      downloadUrl: '#',
      items: [
        {
          id: 'item_001',
          description: 'Pro Plan Monthly',
          amount: 19.00,
          quantity: 1,
          period: {
            start: new Date('2024-01-01'),
            end: new Date('2024-02-01'),
          },
        },
      ],
    },
    {
      id: 'inv_002',
      subscriptionId: 'sub_001',
      amount: 19.00,
      currency: 'USD',
      status: 'paid',
      date: new Date('2024-02-01'),
      description: 'Pro Plan - February 2024',
      downloadUrl: '#',
      items: [
        {
          id: 'item_002',
          description: 'Pro Plan Monthly',
          amount: 19.00,
          quantity: 1,
          period: {
            start: new Date('2024-02-01'),
            end: new Date('2024-03-01'),
          },
        },
      ],
    },
    {
      id: 'inv_003',
      subscriptionId: 'sub_001',
      amount: 19.00,
      currency: 'USD',
      status: 'pending',
      date: new Date('2024-03-01'),
      dueDate: new Date('2024-03-15'),
      description: 'Pro Plan - March 2024',
      items: [
        {
          id: 'item_003',
          description: 'Pro Plan Monthly',
          amount: 19.00,
          quantity: 1,
          period: {
            start: new Date('2024-03-01'),
            end: new Date('2024-04-01'),
          },
        },
      ],
    },
  ];
};

const generateMockPaymentMethods = (): PaymentMethod[] => {
  return [
    {
      id: 'pm_001',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2027,
      isDefault: true,
    },
  ];
};

interface BillingProviderProps {
  children: ReactNode;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [userPlans, setUserPlans] = useState<Plan[]>(PLANS);

  // Load user-configured plans from PlanPricing
  useEffect(() => {
    const savedPlans = localStorage.getItem('subscriptionPlans');
    if (savedPlans) {
      try {
        const parsedPlans = JSON.parse(savedPlans).map((plan: any) => ({
          ...plan,
          createdAt: new Date(plan.createdAt),
          updatedAt: new Date(plan.updatedAt),
          billing: 'monthly' as const,
          limits: {
            maxCourses: plan.maxCourses || 10,
            maxStudents: plan.maxStudents || 100,
            storageGB: plan.storageGB || 5,
            apiCalls: plan.apiCalls || 1000,
          }
        }));
        console.log('💼 Loaded user-configured plans:', parsedPlans);
        setUserPlans(parsedPlans);
      } catch (error) {
        console.error('Failed to load user plans:', error);
        setUserPlans(PLANS); // Fallback to default
      }
    }
  }, []);

  // Get current plan based on subscription - use user-configured plans
  const currentPlan = subscription
    ? userPlans.find(plan => plan.id === subscription.planId) || userPlans[0]
    : userPlans[0]; // Default to basic plan

  // Initialize with mock data
  useEffect(() => {
    const initializeBilling = async () => {
      try {
        // In a real app, this would fetch from your backend
        const savedSubscription = localStorage.getItem('user-subscription');

        if (savedSubscription) {
          const sub = JSON.parse(savedSubscription);
          setSubscription({
            ...sub,
            currentPeriodStart: new Date(sub.currentPeriodStart),
            currentPeriodEnd: new Date(sub.currentPeriodEnd),
            canceledAt: sub.canceledAt ? new Date(sub.canceledAt) : undefined,
          });
        } else {
          // Default to pro plan
          const defaultSubscription: Subscription = {
            id: 'sub_pro',
            userId: 'user_001',
            planId: 'pro',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          };
          setSubscription(defaultSubscription);
          localStorage.setItem('user-subscription', JSON.stringify(defaultSubscription));
        }

        setInvoices(generateMockInvoices());
        setPaymentMethods(generateMockPaymentMethods());
        setBillingDetails({
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        });
      } catch (error) {
        console.error('Failed to initialize billing:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeBilling();
  }, []);

  // Handle successful payment upgrades from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const upgradeSuccess = urlParams.get('upgrade_success');
    const planId = urlParams.get('plan');

    if (upgradeSuccess === 'true' && planId) {
      console.log('🎉 Payment successful! Upgrading to plan:', planId);

      // Find the target plan
      const targetPlan = userPlans.find(plan => plan.id === planId);
      if (targetPlan) {
        // Update subscription immediately
        const newSubscription: Subscription = {
          id: `sub_${planId}`,
          userId: 'user_001',
          planId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };

        setSubscription(newSubscription);
        localStorage.setItem('user-subscription', JSON.stringify(newSubscription));

        // Clean up URL parameters
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        console.log('✅ Subscription updated to:', targetPlan.name);
      }
    }
  }, [userPlans]);

  // Feature checking
  const hasFeature = (feature: FeatureKey): boolean => {
    if (!subscription || !currentPlan) return false;
    return FEATURE_CONFIG[feature]?.plans.includes(subscription.planId) || false;
  };

  const canCreateCourse = (): boolean => {
    if (!subscription || !currentPlan) return false;

    // Check if user has unlimited courses
    if (currentPlan.limits.maxCourses === -1) return true;

    // In a real app, you'd check the actual course count
    const currentCourseCount = JSON.parse(localStorage.getItem('courses') || '[]').length;
    return currentCourseCount < currentPlan.limits.maxCourses;
  };

  const getCourseLimit = (): number => {
    return currentPlan?.limits.maxCourses || 0;
  };

  // Actions
  const upgradePlan = async (planId: PlanType): Promise<void> => {
    console.log('🔥🔥🔥 BILLING CONTEXT upgradePlan called with planId:', planId);
    setUpgrading(true);
    try {
      // Find the plan to upgrade to
      const targetPlan = userPlans.find(plan => plan.id === planId);
      if (!targetPlan) {
        throw new Error(`Plan ${planId} not found`);
      }

      console.log('💳 BillingContext: Upgrading to plan:', targetPlan);

      // Validate that paid plans have Stripe price IDs
      if (targetPlan.price > 0 && !targetPlan.stripePriceId) {
        throw new Error(`Plan "${targetPlan.name}" requires a Stripe Price ID. Please configure it in Plan Pricing.`);
      }

      // For free plans, just update subscription immediately
      if (targetPlan.price === 0) {
        console.log('🆓 Free plan upgrade - updating subscription directly');
        const newSubscription: Subscription = {
          id: `sub_${planId}`,
          userId: 'user_001',
          planId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };

        setSubscription(newSubscription);
        localStorage.setItem('user-subscription', JSON.stringify(newSubscription));
        return;
      }

      // For paid plans, use Stripe checkout
      console.log('💰 Paid plan upgrade - redirecting to Stripe checkout');
      console.log('🔑 Using Stripe Price ID:', targetPlan.stripePriceId);

      // Get Stripe service from window
      const stripeService = (window as any).stripeService;
      if (!stripeService) {
        throw new Error('Stripe service not available. Please configure Stripe in Extensions first.');
      }

      // Create checkout session with the user-configured price ID
      const checkoutResult = await stripeService.createCheckoutSession({
        priceId: targetPlan.stripePriceId,
        successUrl: `${window.location.origin}?upgrade_success=true&plan=${planId}`,
        cancelUrl: `${window.location.origin}?upgrade_cancelled=true`,
        customerEmail: 'demo@example.com', // In real app, get from user context
        mode: 'subscription',
        trialPeriodDays: targetPlan.trialPeriodDays && targetPlan.trialPeriodDays > 0 ? targetPlan.trialPeriodDays : undefined
      });

      if (checkoutResult.error) {
        throw new Error(`Stripe checkout failed: ${checkoutResult.error}`);
      }

      console.log('✅ Checkout session created, redirecting to:', checkoutResult.url);

      // Always redirect - no more demo mode detection



      // Always redirect to the checkout URL
      if (checkoutResult.url) {
        console.log('🚀 Redirecting to Stripe checkout:', checkoutResult.url);
        console.log('🔍 URL type:', checkoutResult.url.includes('checkout.stripe.com') ? 'Real Stripe' : 'Other');

        // Force redirect to Stripe checkout
        window.location.href = checkoutResult.url;
      } else {
        throw new Error('No checkout URL received from Stripe');
      }

    } catch (error) {
      console.error('❌ Plan upgrade failed:', error);
      throw error;
    } finally {
      setUpgrading(false);
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    if (!subscription) return;

    try {
      // In a real app, this would call your backend/Stripe
      const canceledSubscription = {
        ...subscription,
        status: 'canceled' as const,
        canceledAt: new Date(),
      };

      setSubscription(canceledSubscription);
      localStorage.setItem('user-subscription', JSON.stringify(canceledSubscription));
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  };

  const updatePaymentMethod = async (paymentMethod: PaymentMethod): Promise<void> => {
    try {
      // In a real app, this would update via Stripe
      setPaymentMethods(prev => [
        paymentMethod,
        ...prev.map(pm => ({ ...pm, isDefault: false }))
      ]);
    } catch (error) {
      console.error('Failed to update payment method:', error);
      throw error;
    }
  };

  const downloadInvoice = async (invoiceId: string): Promise<void> => {
    try {
      // In a real app, this would download from Stripe
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Create a mock PDF download
      const pdfContent = `Invoice ${invoice.id}\nAmount: $${invoice.amount}\nDate: ${invoice.date.toDateString()}\nStatus: ${invoice.status}`;
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      throw error;
    }
  };

  return (
    <BillingContext.Provider value={{
      subscription,
      currentPlan,
      hasFeature,
      canCreateCourse,
      getCourseLimit,
      invoices,
      paymentMethods,
      billingDetails,
      upgradePlan,
      cancelSubscription,
      updatePaymentMethod,
      downloadInvoice,
      loading,
      upgrading,
    }}>
      {children}
    </BillingContext.Provider>
  );
};

// Feature gate hook
export const useFeatureGate = (feature: FeatureKey) => {
  const { hasFeature } = useBilling();
  return {
    hasFeature: hasFeature(feature),
    feature,
  };
};
