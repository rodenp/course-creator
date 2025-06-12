import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
    stripeService,
    type SubscriptionPlan,
    type Customer,
    type PaymentMethod,
    type Invoice,
    type Subscription // Imported Subscription type from stripeService
} from '@/services/stripe';

interface ActiveSubscriptionDetails {
  id: string;
  planId: string; // This would be the app's plan ID (e.g., 'pro', 'free')
  stripePriceId?: string; // The actual Stripe Price ID
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
}

interface StripeContextType {
  // Configuration
  isConfigured: boolean;
  isTestMode: boolean;
  isUsingDemoKey: boolean; // Added to know if using pk_test_... demo key
  configureStripe: (config: {
    publishableKey: string;
    secretKey: string;
    webhookSecret?: string;
    testMode: boolean;
  }) => Promise<void>;

  // Plans
  plans: SubscriptionPlan[]; // Application-defined plans

  // Customer & Subscription
  customer: Customer | null;
  activeSubscription: ActiveSubscriptionDetails | null; // Derived from customer's subscriptions
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  loadCustomerData: (appCustomerId: string) => Promise<void>; // appCustomerId might differ from stripeCustomerId

  // Actions
  initiateUpgrade: (planId: string, currentStripeCustomerId?: string, customerEmail?: string) => Promise<void>; // New method
  createCheckoutSession: (planId: string) => Promise<void>; // Kept for specific direct calls if needed
  cancelSubscription: (subscriptionId: string, immediate?: boolean) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  openBillingPortal: () => Promise<void>;

  // State
  loading: boolean;
  error: string | null;

  // Utility
  formatCurrency: (amount: number, currency?: string) => string;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: ReactNode;
  // customerId here could be an application-specific ID, not necessarily Stripe's customer ID.
  // Stripe Customer ID will be part of the `Customer` object.
  appCustomerId?: string;
}

export function StripeProvider({ children, appCustomerId }: StripeProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
  const [isUsingDemoKey, setIsUsingDemoKey] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscriptionDetails | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserPlans = () => {
      try {
        const savedPlans = localStorage.getItem('subscriptionPlans');
        if (savedPlans) {
          const parsedPlans: SubscriptionPlan[] = JSON.parse(savedPlans).map((plan: any) => ({
            ...plan,
            // Ensure price is a number, not string, from localStorage
            price: parseFloat(plan.price || 0),
            createdAt: plan.createdAt ? new Date(plan.createdAt): new Date(),
            updatedAt: plan.updatedAt ? new Date(plan.updatedAt) : new Date()
          }));
          console.log('💼 StripeContext: Loaded user-configured plans:', parsedPlans);
          setPlans(parsedPlans);
        } else {
          console.log('💼 StripeContext: No user plans found, using empty array');
          setPlans([]); // Or set some default plans
        }
      } catch (e) {
        console.error('Failed to load user plans in StripeContext:', e);
        setPlans([]);
      }
    };

    loadUserPlans();
    setIsConfigured(stripeService.isConfigured());
    setIsTestMode(stripeService.isTestMode());
    setIsUsingDemoKey(stripeService.isUsingDemoKey());

    try {
      const savedConfig = localStorage.getItem('stripe_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        stripeService.initialize(config).then(() => {
          setIsConfigured(stripeService.isConfigured());
          setIsTestMode(stripeService.isTestMode());
          setIsUsingDemoKey(stripeService.isUsingDemoKey());
        }).catch(() => localStorage.removeItem('stripe_config'));
      }
    } catch (e) {
      localStorage.removeItem('stripe_config');
    }
  }, []);

  useEffect(() => {
    // appCustomerId is the internal ID. We need stripeService's customer ID for its calls.
    // Assuming `customer.id` or `customer.stripeCustomerId` from stripeService is the Stripe ID.
    if (appCustomerId && isConfigured && customer?.stripeCustomerId) {
      loadCustomerData(customer.stripeCustomerId);
    } else if (appCustomerId && isConfigured && !customer) {
        // If we have an appCustomerId but no Stripe customer object yet,
        // we might need a way to map appCustomerId to a Stripe Customer ID,
        // or load customer based on appCustomerId if stripeService.getCustomer supported it.
        // For now, assuming loadCustomerData is called with a Stripe Customer ID.
        // If appCustomerId is the Stripe Customer ID, then this is fine.
        // This logic might need adjustment based on how appCustomerId relates to stripeCustomerId.
        console.warn("StripeContext: appCustomerId is present, but no Stripe customer object or ID. loadCustomerData might need a Stripe Customer ID.");
        // Attempting to load if appCustomerId is potentially the stripeId
        loadCustomerData(appCustomerId);
    }
  }, [appCustomerId, isConfigured, customer?.stripeCustomerId]);


  const deriveActiveSubscription = (stripeCustomer: Customer | null, stripeSubscriptions: Subscription[]): ActiveSubscriptionDetails | null => {
    if (!stripeCustomer || !stripeSubscriptions || stripeSubscriptions.length === 0) {
      return null;
    }
    // Find the most relevant subscription (e.g., active or trialing)
    let subToUse = stripeSubscriptions.find(s => s.status === 'active' || s.status === 'trialing');
    if (!subToUse && stripeSubscriptions.length > 0) {
        subToUse = stripeSubscriptions[0]; // fallback to first one if no active/trialing
    }

    if (!subToUse) return null;

    const appPlan = plans.find(p => p.stripePriceId === subToUse!.plan?.stripePriceId || p.id === subToUse!.plan?.id);

    return {
      id: subToUse.id,
      planId: appPlan?.id || subToUse.plan?.id || 'unknown',
      stripePriceId: subToUse.plan?.stripePriceId,
      status: subToUse.status,
      currentPeriodStart: subToUse.currentPeriodStart ? new Date(subToUse.currentPeriodStart) : undefined,
      currentPeriodEnd: subToUse.currentPeriodEnd ? new Date(subToUse.currentPeriodEnd) : undefined,
      cancelAtPeriodEnd: subToUse.cancelAtPeriodEnd,
      trialEnd: subToUse.trialEnd ? new Date(subToUse.trialEnd) : undefined,
    };
  };

  const loadCustomerData = async (stripeCustomerId: string) => {
    if (!stripeService.isConfigured() && !stripeService.isUsingDemoKey()) {
        setError("Stripe is not configured. Cannot load customer data.");
        return;
    }
    try {
      setLoading(true);
      setError(null);

      const customerData = await stripeService.getCustomer(stripeCustomerId);
      let subscriptionsData: Subscription[] = [];
      if (customerData?.stripeCustomerId) { // Ensure we have a stripe ID to fetch related data
          subscriptionsData = await stripeService.getCustomerSubscriptions(customerData.stripeCustomerId);
      }

      const paymentMethodsData = customerData?.stripeCustomerId ? await stripeService.getPaymentMethods(customerData.stripeCustomerId) : [];
      const invoicesData = customerData?.stripeCustomerId ? await stripeService.getInvoices(customerData.stripeCustomerId) : [];

      setCustomer(customerData);
      setActiveSubscription(deriveActiveSubscription(customerData, subscriptionsData));
      setPaymentMethods(paymentMethodsData);
      setInvoices(invoicesData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer data');
      setCustomer(null); // Clear customer on error
      setActiveSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const configureStripe = async (config: { publishableKey: string; secretKey: string; webhookSecret?: string; testMode: boolean; }) => {
    try {
      setLoading(true);
      setError(null);
      await stripeService.initialize(config);
      setIsConfigured(stripeService.isConfigured());
      setIsTestMode(stripeService.isTestMode());
      setIsUsingDemoKey(stripeService.isUsingDemoKey());
      // Reload plans and potentially customer data if a customerId was already set
      const savedPlans = localStorage.getItem('subscriptionPlans');
      if (savedPlans) setPlans(JSON.parse(savedPlans).map((p:any) => ({...p, price: parseFloat(p.price||0)})));
      if (appCustomerId && stripeService.isConfigured()) { // If appCustomerId was passed, try to load data
          // This relies on appCustomerId being usable as stripeCustomerId or having a mapping.
          await loadCustomerData(appCustomerId);
      }
      console.log('✅ Stripe configuration successful');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to configure Stripe';
      setError(errorMessage);
      setIsConfigured(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initiateUpgrade = async (planId: string, currentStripeCustomerId?: string, customerEmail?: string) => {
    setLoading(true);
    setError(null);
    try {
      const targetPlan = plans.find(p => p.id === planId);
      if (!targetPlan) throw new Error(`Plan with ID ${planId} not found.`);

      const effectiveStripeCustomerId = currentStripeCustomerId || customer?.stripeCustomerId;
      const effectiveEmail = customerEmail || customer?.email || 'user@example.com'; // Fallback email

      if (targetPlan.price > 0) { // Paid plan
        if (!targetPlan.stripePriceId) {
          throw new Error(`Plan "${targetPlan.name}" is a paid plan but has no Stripe Price ID configured.`);
        }
        if (!stripeService.isConfigured() && !stripeService.isUsingDemoKey()) {
            throw new Error("Stripe is not configured for paid plan upgrade.");
        }

        console.log(`🚀 Initiating upgrade to paid plan: ${targetPlan.name} (${targetPlan.stripePriceId})`);
        const session = await stripeService.createCheckoutSession({
          priceId: targetPlan.stripePriceId,
          customerId: effectiveStripeCustomerId,
          customerEmail: effectiveEmail,
          successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
          cancelUrl: `${window.location.origin}/billing/cancel`,
          mode: 'subscription',
          trialPeriodDays: targetPlan.trialPeriodDays // Pass trial days from plan definition
        });

        if (session.url) {
          window.location.href = session.url;
        } else {
          throw new Error('No checkout URL received from Stripe.');
        }
      } else { // Free plan
        console.log(`🔄 Initiating change to FREE plan: ${targetPlan.name}`);
        if (effectiveStripeCustomerId && (!stripeService.isUsingDemoKey() && stripeService.isConfigured())) {
            // If there's an existing Stripe customer and a subscription, it should be cancelled first.
            // This logic can be complex (e.g. prorations, etc.).
            // For simplicity here, if they have an active paid sub, we might prevent direct switch to free,
            // or require them to cancel first.
            // For now, we'll assume if they are moving to free, any existing paid sub needs separate cancellation.
            console.warn("User has Stripe Customer ID. Switching to free plan locally. Ensure any active paid Stripe subscription is handled (e.g. canceled).");
        }

        // Simulate local update for free plan or if Stripe isn't fully set up for this customer
        const newSubscriptionDetails: ActiveSubscriptionDetails = {
            id: `free_sub_${Date.now()}`,
            planId: targetPlan.id,
            stripePriceId: targetPlan.stripePriceId, // usually undefined/null for free
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Arbitrary long period for free
            cancelAtPeriodEnd: false,
        };
        setActiveSubscription(newSubscriptionDetails);

        // Update customer object minimally
        if (customer) {
            const updatedCustomer = {
                ...customer,
                subscriptionId: newSubscriptionDetails.id,
                subscriptionStatus: newSubscriptionDetails.status,
                currentPlan: newSubscriptionDetails.planId,
                cancelAtPeriodEnd: false,
            };
            setCustomer(updatedCustomer);
            // Persist this mock change if in demo key mode or if no real stripe customer
             if (stripeService.isUsingDemoKey() || !effectiveStripeCustomerId) {
                localStorage.setItem('demo_customer', JSON.stringify(updatedCustomer));
             }
        } else {
            // Create a new demo customer for the free plan
            const newDemoCustomer: Customer = {
                id: `demo_cus_${Date.now()}`,
                email: effectiveEmail,
                stripeCustomerId: `cus_demo_${Date.now()}`,
                subscriptionId: newSubscriptionDetails.id,
                subscriptionStatus: newSubscriptionDetails.status,
                currentPlan: newSubscriptionDetails.planId,
            };
            setCustomer(newDemoCustomer);
            if (stripeService.isUsingDemoKey()) {
                localStorage.setItem('demo_customer', JSON.stringify(newDemoCustomer));
            }
        }
        console.log('✅ Successfully switched to FREE plan locally:', targetPlan.name);
        // Optionally, redirect to a success page for free plans too
        // window.location.href = `${window.location.origin}/billing/success?plan_id=${planId}&free=true`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate plan upgrade.');
      throw err; // Re-throw for the calling component to handle
    } finally {
      setLoading(false);
    }
  };

  // This is the old method, now initiateUpgrade is preferred for clarity.
  // Kept for compatibility if any component calls it directly, but should be deprecated.
  const createCheckoutSession = async (planId: string): Promise<void> => {
    console.warn("createCheckoutSession is deprecated in StripeContext, use initiateUpgrade instead.");
    // Finding the plan to ensure stripePriceId is available for the session.
    const plan = plans.find(p => p.id === planId);
    if (!plan) {
        setError(`Plan ${planId} not found for checkout.`);
        setLoading(false);
        throw new Error(`Plan ${planId} not found for checkout.`);
    }
    if (plan.price > 0 && !plan.stripePriceId) {
        setError(`Plan ${plan.name} requires a Stripe Price ID.`);
        setLoading(false);
        throw new Error(`Plan ${plan.name} requires a Stripe Price ID.`);
    }
    // If it's a free plan, initiateUpgrade handles it without Stripe checkout.
    // This path should ideally only be for paid plans.
    return initiateUpgrade(planId, customer?.stripeCustomerId, customer?.email);
  };

  const cancelSubscription = async (subscriptionId: string, immediate = false) => {
    setLoading(true);
    setError(null);
    try {
      await stripeService.cancelSubscription(subscriptionId, !immediate); // !immediate means cancel_at_period_end = true
      if (customer?.stripeCustomerId) { // Reload data to reflect cancellation
        await loadCustomerData(customer.stripeCustomerId);
      } else if (customer) { // If local mock customer, update locally
        const updatedCustomer = {...customer, subscriptionStatus: 'canceled', cancelAtPeriodEnd: true};
        setCustomer(updatedCustomer);
        setActiveSubscription(deriveActiveSubscription(updatedCustomer, [])); // Pass empty array if sub is gone
        if(stripeService.isUsingDemoKey()) localStorage.setItem('demo_customer', JSON.stringify(updatedCustomer));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    setLoading(true);
    setError(null);
    try {
      await stripeService.resumeSubscription(subscriptionId);
      if (customer?.stripeCustomerId) { // Reload data
        await loadCustomerData(customer.stripeCustomerId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!customer?.stripeCustomerId) throw new Error('No Stripe Customer ID found to open billing portal.');
      const session = await stripeService.createBillingPortalSession(customer.stripeCustomerId, window.location.href);
      window.open(session.url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'usd') => {
    return stripeService.formatCurrency(amount, currency);
  };

  const value: StripeContextType = {
    isConfigured,
    isTestMode,
    isUsingDemoKey,
    configureStripe,
    plans,
    customer,
    activeSubscription,
    paymentMethods,
    invoices,
    loadCustomerData,
    initiateUpgrade, // Export new method
    createCheckoutSession, // Keep for now, mark as deprecated or refactor usages
    cancelSubscription,
    resumeSubscription,
    openBillingPortal,
    loading,
    error,
    formatCurrency
  };

  return <StripeContext.Provider value={value}>{children}</StripeContext.Provider>;
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}
