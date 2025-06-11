import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { stripeService, type SubscriptionPlan, type Customer, type PaymentMethod, type Invoice } from '@/services/stripe';

interface StripeContextType {
  // Configuration
  isConfigured: boolean;
  isTestMode: boolean;
  configureStripe: (config: {
    publishableKey: string;
    secretKey: string;
    webhookSecret?: string;
    testMode: boolean;
  }) => Promise<void>;

  // Plans
  plans: SubscriptionPlan[];

  // Customer
  customer: Customer | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  loadCustomerData: (customerId: string) => Promise<void>;

  // Subscriptions
  createCheckoutSession: (planId: string) => Promise<void>;
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
  customerId?: string;
}

export function StripeProvider({ children, customerId }: StripeProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize plans and load saved configuration
  useEffect(() => {
    // Load user-configured plans from PlanPricing
    const loadUserPlans = () => {
      try {
        const savedPlans = localStorage.getItem('subscriptionPlans');
        if (savedPlans) {
          const parsedPlans = JSON.parse(savedPlans).map((plan: any) => ({
            ...plan,
            createdAt: new Date(plan.createdAt),
            updatedAt: new Date(plan.updatedAt)
          }));
          console.log('💼 StripeContext: Loaded user-configured plans:', parsedPlans);
          setPlans(parsedPlans);
        } else {
          console.log('💼 StripeContext: No user plans found, using empty array');
          setPlans([]);
        }
      } catch (error) {
        console.error('Failed to load user plans in StripeContext:', error);
        setPlans([]);
      }
    };

    loadUserPlans();
    setIsConfigured(stripeService.isConfigured());
    setIsTestMode(stripeService.isTestMode());

    // Try to load saved configuration from localStorage
    try {
      const savedConfig = localStorage.getItem('stripe_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        // Silently restore the configuration
        stripeService.initialize(config).then(() => {
          setIsConfigured(true);
          setIsTestMode(config.testMode);
        }).catch(() => {
          // Clear invalid config
          localStorage.removeItem('stripe_config');
        });
      }
    } catch (error) {
      // Clear invalid config
      localStorage.removeItem('stripe_config');
    }
  }, []);

  // Load customer data when customerId changes
  useEffect(() => {
    if (customerId && isConfigured) {
      loadCustomerData(customerId);
    }
  }, [customerId, isConfigured]);

  const configureStripe = async (config: {
    publishableKey: string;
    secretKey: string;
    webhookSecret?: string;
    testMode: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Configuring Stripe with:', {
        publishableKey: `${config.publishableKey.substring(0, 20)}...`,
        testMode: config.testMode
      });

      await stripeService.initialize(config);

      setIsConfigured(true);
      setIsTestMode(config.testMode);

      // Reload user-configured plans
      try {
        const savedPlans = localStorage.getItem('subscriptionPlans');
        if (savedPlans) {
          const parsedPlans = JSON.parse(savedPlans).map((plan: any) => ({
            ...plan,
            createdAt: new Date(plan.createdAt),
            updatedAt: new Date(plan.updatedAt)
          }));
          setPlans(parsedPlans);
        }
      } catch (error) {
        console.error('Failed to reload plans after Stripe configuration:', error);
      }

      console.log('✅ Stripe configuration successful');

    } catch (err) {
      console.error('❌ Stripe configuration failed:', err);
      console.error('❌ StripeContext error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to configure Stripe';
      setError(errorMessage);
      throw err;
    } finally {
      console.log('🔧 StripeContext: Setting loading to false');
      setLoading(false);
    }
  };

  const loadCustomerData = async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [customerData, paymentMethodsData, invoicesData] = await Promise.all([
        stripeService.getCustomer(customerId),
        stripeService.getPaymentMethods(customerId),
        stripeService.getInvoices(customerId)
      ]);

      setCustomer(customerData);
      setPaymentMethods(paymentMethodsData);
      setInvoices(invoicesData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (planId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const plan = plans.find(p => p.id === planId);
      console.log('🔍 StripeContext: All available plans:', plans);
      console.log('🔍 StripeContext: Looking for planId:', planId);
      console.log('🔍 StripeContext: Found plan:', plan);

      if (!plan) {
        throw new Error('Plan not found');
      }

      console.log('💰 StripeContext: Plan price:', plan.price, 'stripePriceId:', plan.stripePriceId);

      // Validate that paid plans have Stripe price IDs
      if (plan.price > 0 && !plan.stripePriceId) {
        throw new Error(`Plan "${plan.name}" requires a Stripe Price ID. Please configure it in Plan Pricing.`);
      }

      console.log('🚀 StripeContext: Creating checkout session and redirecting directly...');

      const session = await stripeService.createCheckoutSession({
        priceId: plan.stripePriceId,
        customerId: customer?.stripeCustomerId,
        customerEmail: customer?.email || 'user@example.com',
        successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
        mode: 'subscription',
        trialPeriodDays: plan.trialPeriodDays && plan.trialPeriodDays > 0 ? plan.trialPeriodDays : undefined
      });

      console.log('✅ StripeContext: Checkout session created:', session);
      console.log('🚀 StripeContext: Redirecting to checkout URL:', session.url);

      // Direct redirect to the checkout URL - no need for separate redirectToCheckout call
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received from Stripe');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string, immediate = false) => {
    try {
      setLoading(true);
      setError(null);

      await stripeService.cancelSubscription(subscriptionId, !immediate);

      // Reload customer data to reflect changes
      if (customer) {
        await loadCustomerData(customer.id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      setError(null);

      await stripeService.resumeSubscription(subscriptionId);

      // Reload customer data to reflect changes
      if (customer) {
        await loadCustomerData(customer.id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!customer?.stripeCustomerId) {
        throw new Error('No customer found');
      }

      const session = await stripeService.createBillingPortalSession(
        customer.stripeCustomerId,
        window.location.href
      );

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
    configureStripe,
    plans,
    customer,
    paymentMethods,
    invoices,
    loadCustomerData,
    createCheckoutSession,
    cancelSubscription,
    resumeSubscription,
    openBillingPortal,
    loading,
    error,
    formatCurrency
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
