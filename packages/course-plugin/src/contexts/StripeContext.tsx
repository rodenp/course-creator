import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { stripeService, type SubscriptionPlan, type Customer, type PaymentMethod, type Invoice } from '@/services/stripe';
import type { Plan } from '@/types/billing'; // Assuming Plan is defined here or in @/types

interface StripeContextType {
  isConfigured: boolean;
  isTestMode: boolean;
  configureStripe: (config: {
    publishableKey: string;
    secretKey: string; // This is problematic for frontend, see notes
    webhookSecret?: string;
    testMode: boolean;
  }) => Promise<void>;
  plans: Plan[]; // Use the more generic Plan type
  customer: Customer | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  loadCustomerData: (customerId: string) => Promise<void>;
  createCheckoutSession: (planId: string) => Promise<void>;
  cancelSubscription: (subscriptionId: string, immediate?: boolean) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  openBillingPortal: () => Promise<void>;
  loading: boolean;
  error: string | null;
  formatCurrency: (amount: number, currency?: string) => string;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: ReactNode;
  customerId?: string;
  publishableKey?: string; // New prop
  userPlans?: Plan[];      // New prop
}

export function StripeProvider({ children, customerId, publishableKey, userPlans }: StripeProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]); // Use Plan type
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false); // Changed default to false, useEffect handles initial loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        let initializedByKey = false;
        if (publishableKey) {
          try {
            // This is a placeholder for the secretKey.
            // stripeService.initialize needs refactoring to not strictly require secretKey for frontend-only operations.
            // A frontend Stripe service should ideally only be initialized with a publishableKey.
            // The backend (realStripeAPI) handles operations requiring the secretKey.
            await stripeService.initialize({
              publishableKey: publishableKey,
              secretKey: 'DUMMY_SK_FRONTEND_SHOULD_NOT_NEED_THIS_OR_BE_CONFIGURED_ELSEWHERE',
              testMode: !publishableKey.startsWith('pk_live_')
            });
            setIsConfigured(true);
            setIsTestMode(stripeService.isTestMode());
            // Persist minimal config if provided by prop, so other parts of app can know PK/TestMode
            // if they were relying on localStorage. Ideally, they'd use this context.
            localStorage.setItem('stripe_config', JSON.stringify({
              publishableKey,
              testMode: stripeService.isTestMode()
            }));
            initializedByKey = true;
            console.log('StripeContext: Initialized with publishableKey from props.');
          } catch (err) {
            console.error("Error initializing stripeService in StripeProvider with publishableKey:", err);
            setError(err instanceof Error ? err.message : 'Stripe initialization failed with provided key.');
            // Do not set isConfigured to false here, let fallback try
          }
        }

        if (!initializedByKey) {
          const savedConfig = localStorage.getItem('stripe_config');
          if (savedConfig) {
            try {
              const config = JSON.parse(savedConfig);
              // Ensure the saved config has the necessary fields for the internal stripeService
              await stripeService.initialize({
                publishableKey: config.publishableKey,
                secretKey: config.secretKey || 'DUMMY_SK_FALLBACK', // Still problematic
                testMode: config.testMode,
                webhookSecret: config.webhookSecret
              });
              setIsConfigured(true);
              setIsTestMode(config.testMode);
              console.log('StripeContext: Initialized with saved config from localStorage.');
            } catch (err) {
              localStorage.removeItem('stripe_config');
              console.warn('StripeContext: Failed to initialize with saved config, falling back to service defaults.', err);
              setIsConfigured(stripeService.isConfigured());
              setIsTestMode(stripeService.isTestMode());
            }
          } else {
             // If no key and no saved config, rely on stripeService's internal default (likely demo/mock)
             setIsConfigured(stripeService.isConfigured());
             setIsTestMode(stripeService.isTestMode());
             console.log('StripeContext: No publishableKey or saved config, using stripeService defaults.');
          }
        }

        // Load plans
        if (userPlans) {
          console.log('💼 StripeContext: Using userPlans from props:', userPlans);
          setPlans(userPlans);
        } else {
          try {
            const savedPlans = localStorage.getItem('subscriptionPlans');
            if (savedPlans) {
              const parsedPlans = JSON.parse(savedPlans).map((plan: any) => ({
                ...plan,
                createdAt: new Date(plan.createdAt),
                updatedAt: new Date(plan.updatedAt),
                // Ensure Plan type structure is matched
                billing: plan.interval === 'year' ? 'yearly' : 'monthly',
                limits: plan.limits || { maxCourses: plan.maxCourses || 0 }
              }));
              console.log('💼 StripeContext: Loaded user-configured plans from localStorage:', parsedPlans);
              setPlans(parsedPlans);
            } else {
              setPlans([]);
            }
          } catch (planError) {
            console.error('Failed to load user plans from localStorage in StripeContext:', planError);
            setPlans([]);
          }
        }
      } catch (e) {
         // Catch any unexpected error from overall init
         console.error("StripeContext: Unexpected error during initial config load", e);
         setError(e instanceof Error ? e.message : 'Unexpected error during Stripe setup.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialConfig();
  }, [publishableKey, userPlans]);

  useEffect(() => {
    if (customerId && isConfigured) {
      loadCustomerData(customerId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, isConfigured]); // loadCustomerData is a dependency, but it's stable

  const configureStripe = async (config: {
    publishableKey: string;
    secretKey: string; // Problematic
    webhookSecret?: string;
    testMode: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      console.log('StripeContext: configureStripe called with:', {
        publishableKey: `${config.publishableKey.substring(0, 20)}...`,
        testMode: config.testMode
      });
      await stripeService.initialize(config);
      setIsConfigured(true);
      setIsTestMode(config.testMode);
      localStorage.setItem('stripe_config', JSON.stringify(config)); // Persist for fallback if needed

      // Reload plans after re-configuration
      if (userPlans) {
        setPlans(userPlans);
        console.log('StripeContext: Reloaded plans from props after re-config.');
      } else {
        try {
          const savedPlans = localStorage.getItem('subscriptionPlans');
          if (savedPlans) {
            const parsedPlans = JSON.parse(savedPlans).map((plan: any) => ({
              ...plan,
              createdAt: new Date(plan.createdAt),
              updatedAt: new Date(plan.updatedAt),
              billing: plan.interval === 'year' ? 'yearly' : 'monthly',
              limits: plan.limits || { maxCourses: plan.maxCourses || 0 }
            }));
            setPlans(parsedPlans);
            console.log('StripeContext: Reloaded plans from localStorage after re-config.');
          } else { setPlans([]); }
        } catch (error) { console.error('Failed to reload plans after Stripe re-configuration:', error); setPlans([]); }
      }
      console.log('✅ Stripe re-configuration successful');
    } catch (err) {
      console.error('❌ Stripe re-configuration failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to re-configure Stripe';
      setError(errorMessage);
      setIsConfigured(false); // Reflect that config failed
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async (id: string) => {
    // Implementation remains the same, uses internal stripeService
    try {
      setLoading(true); setError(null);
      const [customerData, paymentMethodsData, invoicesData] = await Promise.all([
        stripeService.getCustomer(id),
        stripeService.getPaymentMethods(id),
        stripeService.getInvoices(id)
      ]);
      setCustomer(customerData);
      setPaymentMethods(paymentMethodsData);
      setInvoices(invoicesData);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load customer data');
    } finally { setLoading(false); }
  };

  const createCheckoutSession = async (planId: string): Promise<void> => {
    // Implementation remains the same, uses internal stripeService
    // Ensure 'plans' state is used here
    try {
      setLoading(true); setError(null);
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error(`Plan with ID ${planId} not found in StripeContext plans.`);
      if (plan.price > 0 && !plan.stripePriceId) {
        throw new Error(`Plan "${plan.name}" requires a Stripe Price ID. Configure it in Plan Pricing.`);
      }
      const session = await stripeService.createCheckoutSession({
        priceId: plan.stripePriceId!, // Asserting because we checked above
        customerId: customer?.stripeCustomerId,
        customerEmail: customer?.email || 'user@example.com',
        successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
        mode: plan.billing === 'monthly' || plan.billing === 'yearly' ? 'subscription' : 'payment', // Assuming Plan.billing implies mode
        trialPeriodDays: plan.trialPeriodDays
      });
      if (session.url) { window.location.href = session.url; }
      else { throw new Error('No checkout URL received'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create checkout session'); throw err;
    } finally { setLoading(false); }
  };

  // cancelSubscription, resumeSubscription, openBillingPortal, formatCurrency remain the same
  const cancelSubscription = async (subscriptionId: string, immediate = false) => {
    try { setLoading(true); setError(null);
      await stripeService.cancelSubscription(subscriptionId, !immediate);
      if (customer) await loadCustomerData(customer.id);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to cancel subscription'); throw err;
    } finally { setLoading(false); }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    try { setLoading(true); setError(null);
      await stripeService.resumeSubscription(subscriptionId);
      if (customer) await loadCustomerData(customer.id);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to resume subscription'); throw err;
    } finally { setLoading(false); }
  };

  const openBillingPortal = async () => {
    try { setLoading(true); setError(null);
      if (!customer?.stripeCustomerId) throw new Error('No Stripe customer ID found');
      const session = await stripeService.createBillingPortalSession(customer.stripeCustomerId, window.location.href);
      window.open(session.url, '_blank');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to open billing portal'); throw err;
    } finally { setLoading(false); }
  };

  const formatCurrency = (amount: number, currency = 'usd') => {
    return stripeService.formatCurrency(amount, currency); // Assuming price is in cents if using this directly
  };


  const value: StripeContextType = {
    isConfigured, isTestMode, configureStripe, plans, customer, paymentMethods, invoices,
    loadCustomerData, createCheckoutSession, cancelSubscription, resumeSubscription, openBillingPortal,
    loading, error, formatCurrency
  };

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}
