import type React from 'react';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type {
  PlanType,
  Subscription,
  Invoice,
  PaymentMethod,
  BillingDetails,
  FeatureKey,
  Plan // Assuming Plan is the correct, possibly more detailed type from types/billing
} from '@/types/billing';
import { FEATURE_CONFIG, PLANS as DEFAULT_PLANS } from '@/types/billing'; // Renamed to avoid conflict
import { useStripe } from './StripeContext'; // To access the refactored stripeService

// Define UserInfoType if not already globally available or imported from a shared types location
// This should match the one used in CoursePlugin.tsx
interface UserInfoType {
  id: string;
  email?: string;
  name?: string;
  planId?: PlanType; // Use PlanType for consistency
  planStatus?: Subscription['status']; // Use Subscription status type
}

interface BillingContextType {
  subscription: Subscription | null;
  currentPlan: Plan | null;
  hasFeature: (feature: FeatureKey) => boolean;
  canCreateCourse: () => boolean;
  getCourseLimit: () => number;
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  billingDetails: BillingDetails | null;
  upgradePlan: (planId: PlanType) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  updatePaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>;
  downloadInvoice: (invoiceId: string) => Promise<void>;
  loading: boolean;
  upgrading: boolean;
  userPlans: Plan[]; // Expose the plans being used
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

const generateMockInvoices = (): Invoice[] => { /* ... (implementation unchanged) ... */
  return [
    { id: 'inv_001', subscriptionId: 'sub_001', amount: 19.00, currency: 'USD', status: 'paid', date: new Date('2024-01-01'), description: 'Pro Plan - January 2024', downloadUrl: '#', items: [{id: 'item_001', description: 'Pro Plan Monthly', amount: 19.00, quantity: 1, period: { start: new Date('2024-01-01'), end: new Date('2024-02-01')}}]},
    { id: 'inv_002', subscriptionId: 'sub_001', amount: 19.00, currency: 'USD', status: 'paid', date: new Date('2024-02-01'), description: 'Pro Plan - February 2024', downloadUrl: '#', items: [{id: 'item_002', description: 'Pro Plan Monthly', amount: 19.00, quantity: 1, period: { start: new Date('2024-02-01'), end: new Date('2024-03-01')}}]},
  ];
};
const generateMockPaymentMethods = (): PaymentMethod[] => { /* ... (implementation unchanged) ... */
  return [{ id: 'pm_001', type: 'card', last4: '4242', brand: 'visa', expiryMonth: 12, expiryYear: 2027, isDefault: true }];
};

interface BillingProviderProps {
  children: ReactNode;
  userInfo?: UserInfoType;
  userPlans?: Plan[];
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ children, userInfo, userPlans: propUserPlans }) => {
  const { createCheckoutSession: stripeCreateCheckoutSession } = useStripe(); // Get stripeService's method

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [userPlans, setUserPlans] = useState<Plan[]>(DEFAULT_PLANS); // Initialize with default

  useEffect(() => {
    if (propUserPlans) {
      setUserPlans(propUserPlans);
      console.log('BillingContext: Using plans from props.');
    } else {
      const savedPlans = localStorage.getItem('subscriptionPlans');
      if (savedPlans) {
        try {
          const parsedPlans = JSON.parse(savedPlans).map((plan: any) => ({
            ...plan,
            createdAt: new Date(plan.createdAt),
            updatedAt: new Date(plan.updatedAt),
            billing: plan.interval === 'year' ? 'yearly' : 'monthly',
            limits: plan.limits || { maxCourses: plan.maxCourses || 0 }
          }));
          setUserPlans(parsedPlans);
          console.log('BillingContext: Loaded plans from localStorage.');
        } catch (error) {
          console.error('BillingContext: Failed to load plans from localStorage, using defaults.', error);
          setUserPlans(DEFAULT_PLANS);
        }
      } else {
        console.log('BillingContext: No propUserPlans or saved plans, using default plans.');
        setUserPlans(DEFAULT_PLANS);
      }
    }
  }, [propUserPlans]);

  useEffect(() => {
    const initializeBilling = async () => {
      setLoading(true);
      try {
        if (userInfo?.id && userInfo.planId && userInfo.planStatus) {
          const sub: Subscription = {
            id: `sub_${userInfo.planId}_${userInfo.id}`, // More unique mock ID
            userId: userInfo.id,
            planId: userInfo.planId,
            status: userInfo.planStatus,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          };
          setSubscription(sub);
          console.log('BillingContext: Initialized subscription from userInfo prop.');
          // localStorage.setItem('user-subscription', JSON.stringify(sub)); // Optionally persist
        } else {
          const savedSubscription = localStorage.getItem('user-subscription');
          if (savedSubscription) {
            const sub = JSON.parse(savedSubscription);
            setSubscription({
              ...sub,
              currentPeriodStart: new Date(sub.currentPeriodStart),
              currentPeriodEnd: new Date(sub.currentPeriodEnd),
              canceledAt: sub.canceledAt ? new Date(sub.canceledAt) : undefined,
            });
            console.log('BillingContext: Initialized subscription from localStorage.');
          } else {
             // Default to a "free" basic plan if no info
            const defaultPlan = userPlans.find(p => p.id === 'basic') || userPlans[0];
            if (defaultPlan && userInfo?.id) {
                 const defaultSub: Subscription = {
                    id: `sub_${defaultPlan.id}_${userInfo.id}`, userId: userInfo.id, planId: defaultPlan.id, status: 'active',
                    currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Long period for free/basic
                 };
                 setSubscription(defaultSub);
                 console.log('BillingContext: Initialized with default basic/free subscription.');
            } else {
                 setSubscription(null); // No active subscription
                 console.log('BillingContext: No user info or default plan, no active subscription.');
            }
          }
        }
        setInvoices(generateMockInvoices());
        setPaymentMethods(generateMockPaymentMethods());
        setBillingDetails({ name: userInfo?.name || 'Guest User', email: userInfo?.email || 'guest@example.com', address: { line1: '', city: '', postalCode: '', country: '' } });
      } catch (error) { console.error('Failed to initialize billing:', error);
      } finally { setLoading(false); }
    };
    initializeBilling();
  }, [userInfo, userPlans]); // Rerun if userInfo or available plans change

  const currentPlan = useMemo(() => {
    return subscription && userPlans
      ? userPlans.find(plan => plan.id === subscription.planId) || null
      : null;
  }, [subscription, userPlans]);

  const hasFeature = useCallback((feature: FeatureKey): boolean => {
    if (!subscription || !currentPlan) return false; // No subscription or plan means no features
    // Check if the feature is included in the current plan's allowed features
    const featureConf = FEATURE_CONFIG[feature];
    if (!featureConf) return false; // Feature not configured
    return featureConf.plans.includes(currentPlan.id);
  }, [subscription, currentPlan]);

  const canCreateCourse = useCallback((): boolean => {
    if (!subscription || !currentPlan) return false;
    if (currentPlan.limits.maxCourses === -1) return true; // Unlimited
    // This is a placeholder for actual course count check, which should be done via StorageService or backend
    const currentCourseCount = JSON.parse(localStorage.getItem('courses') || '[]').length;
    return currentCourseCount < currentPlan.limits.maxCourses;
  }, [subscription, currentPlan]);

  const getCourseLimit = useCallback((): number => {
    return currentPlan?.limits.maxCourses ?? 0;
  }, [currentPlan]);

  const upgradePlan = async (planId: PlanType): Promise<void> => {
    setUpgrading(true);
    try {
      const targetPlan = userPlans.find(plan => plan.id === planId);
      if (!targetPlan) throw new Error(`Plan ${planId} not found`);
      if (targetPlan.price > 0 && !targetPlan.stripePriceId) {
        throw new Error(`Plan "${targetPlan.name}" requires a Stripe Price ID.`);
      }

      if (targetPlan.price === 0) {
        const newSubscription: Subscription = {
          id: `sub_${planId}_${userInfo?.id || 'guest'}`,
          userId: userInfo?.id || 'guest-user-id', // Use actual user ID
          planId, status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
        setSubscription(newSubscription);
        localStorage.setItem('user-subscription', JSON.stringify(newSubscription)); // Persist for mock
        console.log('BillingContext: Upgraded to free plan directly.');
        return;
      }

      // For paid plans, use stripeService from StripeContext
      await stripeCreateCheckoutSession({
        priceId: targetPlan.stripePriceId!,
        customerEmail: userInfo?.email || 'user@example.com', // Use email from userInfo
        successUrl: `${window.location.origin}?upgrade_success=true&plan=${planId}`,
        cancelUrl: `${window.location.origin}?upgrade_cancelled=true`,
        mode: 'subscription',
        trialPeriodDays: targetPlan.trialPeriodDays
      });
      // Note: stripeCreateCheckoutSession will redirect. If it throws, error will be caught below.
    } catch (error) {
      console.error('❌ Plan upgrade failed in BillingContext:', error);
      throw error;
    } finally {
      setUpgrading(false);
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    if (!subscription) return;
    // Mock cancellation for now, real implementation would call backend then Stripe
    const canceledSub = { ...subscription, status: 'canceled' as const, canceledAt: new Date() };
    setSubscription(canceledSub);
    localStorage.setItem('user-subscription', JSON.stringify(canceledSub)); // Persist for mock
    console.log('BillingContext: Subscription cancelled (mock).');
  };

  // Other actions like updatePaymentMethod, downloadInvoice remain mock for now
  const updatePaymentMethod = async (pm: PaymentMethod) => { console.warn("Mock: updatePaymentMethod", pm); };
  const downloadInvoice = async (id: string) => { console.warn("Mock: downloadInvoice", id); };

  return (
    <BillingContext.Provider value={{
      subscription, currentPlan, hasFeature, canCreateCourse, getCourseLimit,
      invoices, paymentMethods, billingDetails, upgradePlan, cancelSubscription,
      updatePaymentMethod, downloadInvoice, loading, upgrading, userPlans
    }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useFeatureGate = (feature: FeatureKey) => {
  const { hasFeature } = useBilling();
  return { hasFeature: hasFeature(feature), feature };
};
