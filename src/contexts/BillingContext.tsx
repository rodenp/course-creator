import type React from 'react';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useStripe } from './StripeContext'; // Import useStripe
import type {
  PlanType,
  // Subscription, // Will use ActiveSubscriptionDetails from StripeContext or derive
  // Invoice, // Will use Invoice from StripeContext
  // PaymentMethod, // Will use PaymentMethod from StripeContext
  BillingDetails, // This seems specific to BillingContext's mock, might be removed or re-evaluated
  FeatureKey,
  Plan as AppPlan // Renaming to avoid conflict with Stripe's Plan
} from '@/types/billing'; // Assuming Plan here is the app-specific definition

// Import the actual config for features
import { FEATURE_CONFIG } from '@/types/billing'; // PLANS import will be removed

// Define a simpler Subscription type for BillingContext, derived from StripeContext's data
interface BillingSubscriptionState {
  id: string | null; // Stripe Subscription ID
  planId: PlanType | null; // App's plan ID (e.g., 'free', 'pro')
  status: string | null; // e.g., 'active', 'canceled', 'trialing'
  cancelAtPeriodEnd: boolean | null;
}

interface BillingContextType {
  // Current subscription derived from StripeContext
  subscription: BillingSubscriptionState | null;
  currentPlan: AppPlan | null; // App-specific plan details

  // Feature checking
  hasFeature: (feature: FeatureKey) => boolean;
  canCreateCourse: () => boolean;
  getCourseLimit: () => number;

  // Billing data (delegated to StripeContext, or removed if purely mock)
  // invoices: Invoice[];
  // paymentMethods: PaymentMethod[];
  billingDetails: BillingDetails | null; // Keep if it has specific UI role beyond Stripe data

  // Actions
  upgradePlan: (planId: PlanType) => Promise<void>;
  cancelCurrentSubscription: () => Promise<void>; // Renamed for clarity
  // updatePaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>; // To be handled by StripeContext/Billing Portal
  // downloadInvoice: (invoiceId: string) => Promise<void>; // To be handled by StripeContext/Billing Portal

  // Loading states
  loadingBillingAction: boolean; // More specific loading state
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

interface BillingProviderProps {
  children: ReactNode;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ children }) => {
  const stripeContext = useStripe(); // Use StripeContext

  const [subscription, setSubscription] = useState<BillingSubscriptionState | null>(null);
  const [currentPlan, setCurrentPlan] = useState<AppPlan | null>(null);
  // Mock billingDetails might remain if it serves a UI purpose not covered by Stripe's Customer
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>({
      name: stripeContext.customer?.name || 'User',
      email: stripeContext.customer?.email || 'user@example.com',
      // Address should come from Stripe Customer object if needed
  });
  const [loadingBillingAction, setLoadingBillingAction] = useState(false);

  // Derive BillingContext's subscription and currentPlan from StripeContext
  useEffect(() => {
    if (stripeContext.customer && stripeContext.activeSubscription) {
      const activeSub = stripeContext.activeSubscription;
      const appPlans = stripeContext.plans; // Use plans from StripeContext

      const derivedSubscription: BillingSubscriptionState = {
        id: activeSub.id,
        planId: activeSub.planId as PlanType, // Assuming planId from StripeContext matches PlanType
        status: activeSub.status,
        cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd || false,
      };
      setSubscription(derivedSubscription);

      const foundPlan = appPlans.find(p => p.id === activeSub.planId || p.stripePriceId === activeSub.stripePriceId) as AppPlan | undefined;
      // Map SubscriptionPlan (from stripeService) to AppPlan (from @/types/billing)
      if (foundPlan) {
          const appSpecificPlan: AppPlan = {
              id: foundPlan.id as PlanType,
              name: foundPlan.name,
              price: foundPlan.price, // Already a number in StripeContext's plan
              billing: foundPlan.interval === 'year' ? 'annually' : 'monthly', // Map interval
              stripePriceId: foundPlan.stripePriceId,
              features: foundPlan.features,
              limits: { // Assuming default limits or that StripeContext.plans includes these
                  maxCourses: (foundPlan as any).maxCourses || (FEATURE_CONFIG.MAX_COURSES.defaultValue?.pro || 10), // Example access
                  maxStudents: 1000, // Placeholder
                  storageGB: 5, // Placeholder
                  apiCalls: 10000, // Placeholder
              },
              trialPeriodDays: (foundPlan as any).trialPeriodDays
          };
          setCurrentPlan(appSpecificPlan);
      } else {
          setCurrentPlan(null); // Or a default plan
      }

    } else if (stripeContext.customer && !stripeContext.activeSubscription) {
      // Customer exists but no active Stripe subscription - could be on a "default free" tier
      setSubscription({ id: null, planId: 'free', status: 'active', cancelAtPeriodEnd: false }); // Example default
      const freePlan = stripeContext.plans.find(p => p.id === 'free' || p.price === 0) as AppPlan | undefined;
      if (freePlan) setCurrentPlan(freePlan); else setCurrentPlan(null);
    } else {
      setSubscription(null);
      setCurrentPlan(null);
    }
  }, [stripeContext.customer, stripeContext.activeSubscription, stripeContext.plans]);

  // Update billingDetails when customer info changes in StripeContext
  useEffect(() => {
    if (stripeContext.customer) {
        setBillingDetails(prev => ({
            ...prev,
            name: stripeContext.customer?.name || prev?.name || 'User',
            email: stripeContext.customer?.email || prev?.email || 'user@example.com',
            // address: stripeContext.customer?.address // If StripeCustomer had address
        }));
    }
  }, [stripeContext.customer]);


  // Removed: useEffect for initializing with mock data (invoices, paymentMethods)
  // Removed: useEffect for loading userPlans (now from StripeContext)
  // Removed: useEffect for handling 'upgrade_success' URL params (StripeContext.initiateUpgrade success/cancel URLs should handle this, then reload data)

  // Feature checking (uses currentPlan which is now derived from StripeContext)
  const hasFeature = (feature: FeatureKey): boolean => {
    if (!subscription || !currentPlan) return false;
    // Ensure currentPlan.id is of type PlanType for FEATURE_CONFIG
    const planIdForFeatureCheck = currentPlan.id as PlanType;
    return FEATURE_CONFIG[feature]?.plans.includes(planIdForFeatureCheck) || false;
  };

  const canCreateCourse = (): boolean => {
    if (!subscription || !currentPlan) return false;
    if (currentPlan.limits.maxCourses === -1) return true; // Unlimited
    // In a real app, currentCourseCount should come from a reliable source (e.g., app backend or context)
    // For now, keeping localStorage example but acknowledging its limitations.
    const currentCourseCount = JSON.parse(localStorage.getItem('courses') || '[]').length;
    return currentCourseCount < currentPlan.limits.maxCourses;
  };

  const getCourseLimit = (): number => {
    return currentPlan?.limits.maxCourses ?? 0;
  };

  // Actions
  const upgradePlan = async (planId: PlanType): Promise<void> => {
    console.log('BillingContext: Delegating upgradePlan to StripeContext for planId:', planId);
    setLoadingBillingAction(true);
    try {
      // Pass stripeCustomerId and email from StripeContext's customer object
      await stripeContext.initiateUpgrade(
        planId,
        stripeContext.customer?.stripeCustomerId,
        stripeContext.customer?.email
      );
      // StripeContext.initiateUpgrade will handle redirection or local state update for free plans.
      // After redirection and success, StripeContext.loadCustomerData should be triggered
      // by the success page or upon app reload, which will then update BillingContext's subscription.
    } catch (error) {
      console.error('❌ BillingContext: Plan upgrade failed via StripeContext:', error);
      // Error should be handled by StripeContext and potentially displayed by UI components
      throw error; // Re-throw for the calling component to handle if needed
    } finally {
      setLoadingBillingAction(false);
    }
  };

  const cancelCurrentSubscription = async (): Promise<void> => {
    if (!stripeContext.activeSubscription?.id) {
      console.warn("BillingContext: No active Stripe subscription to cancel.");
      // Or, if there's a local "free" subscription, handle that:
      if (subscription?.planId === 'free' && subscription.id?.startsWith('free_sub_')) {
          setSubscription(null);
          setCurrentPlan(null);
          // Optionally clear demo_customer if it was only for the free plan.
          // localStorage.removeItem('demo_customer');
          console.log("BillingContext: Cleared local free subscription.");
          return;
      }
      throw new Error("No active Stripe subscription ID found to cancel.");
    }

    console.log('BillingContext: Delegating cancelSubscription to StripeContext for subId:', stripeContext.activeSubscription.id);
    setLoadingBillingAction(true);
    try {
      await stripeContext.cancelSubscription(stripeContext.activeSubscription.id, false); // false for cancel_at_period_end
      // StripeContext.cancelSubscription will call loadCustomerData, which updates
      // stripeContext.activeSubscription, and thus BillingContext's subscription state.
    } catch (error) {
      console.error('❌ BillingContext: Subscription cancellation failed via StripeContext:', error);
      throw error;
    } finally {
      setLoadingBillingAction(false);
    }
  };

  // Removed: updatePaymentMethod (should be via Stripe Billing Portal, accessed through StripeContext)
  // Removed: downloadInvoice (should be via Stripe Billing Portal or StripeContext providing invoice URLs)

  return (
    <BillingContext.Provider value={{
      subscription,
      currentPlan,
      hasFeature,
      canCreateCourse,
      getCourseLimit,
      // invoices: stripeContext.invoices, // Provide directly from StripeContext if needed by consumers of BillingContext
      // paymentMethods: stripeContext.paymentMethods, // Same as above
      billingDetails, // Kept if it serves a distinct UI purpose
      upgradePlan,
      cancelCurrentSubscription,
      loadingBillingAction,
    }}>
      {children}
    </BillingContext.Provider>
  );
};

// Feature gate hook (remains the same)
export const useFeatureGate = (feature: FeatureKey) => {
  const { hasFeature } = useBilling();
  return {
    hasFeature: hasFeature(feature),
    feature,
  };
};
