import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CheckCircle,
  Star,
  Clock,
  CreditCard,
  Calendar,
  Gift,
  Lock,
  X,
  ArrowRight,
  Shield
} from 'lucide-react';
import { CoursePricing } from './CoursePricing';
import { useStripe } from '@/contexts/StripeContext';
import { stripeService as globalStripeServiceInstance } from '@/services/stripe'; // Import directly
import type { Course, CoursePricingPlan } from '@/types';

interface CoursePurchaseProps {
  course: Course;
  onClose: () => void;
  onPurchaseComplete?: (planId: string) => void;
}

export function CoursePurchase({ course, onClose, onPurchaseComplete }: CoursePurchaseProps) {
  // useStripe can be used for global state like isConfigured, or potentially customer email for prefill
  const stripeContext = useStripe();
  const [selectedPlan, setSelectedPlan] = useState<CoursePricingPlan | null>(null);
  const [loading, setLoading] = useState(false); // This can be stripeContext.loading if global loading is appropriate
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!course.stripeSettings?.enabled || !course.isPaid) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Course Not Available for Purchase</DialogTitle>
            <DialogDescription>
              This course is not configured for payments or is currently free.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const handlePlanSelect = (planId: string) => {
    const plan = course.stripeSettings!.plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setShowConfirmation(true);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !course.stripeSettings) {
      return;
    }

    try {
      setLoading(true);

      // Initialize/Reconfigure global Stripe service with course-specific settings if different
      await initializeCourseStripe(course.stripeSettings);

      // Create checkout session using the reconfigured global Stripe service
      const sessionDetails = await createCourseCheckoutSessionDirect(course, selectedPlan);

      // Use the global Stripe service instance to redirect to checkout
      if (sessionDetails.sessionId) {
        await globalStripeServiceInstance.redirectToCheckout(sessionDetails.sessionId);
      } else {
        throw new Error('Checkout session ID not found.');
      }

      // If successful, notify parent component
      onPurchaseComplete?.(selectedPlan.id);

    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeCourseStripe = async (stripeSettings: NonNullable<typeof course.stripeSettings>) => {
    // Reconfigure the global stripe instance if course-specific keys are provided and different.
    // This uses the configureStripe method from StripeContext which updates the global stripeService instance.
    const currentGlobalConfig = globalStripeServiceInstance.getConfig(); // Use imported service

    if (stripeSettings.publishableKey && stripeSettings.secretKey &&
        (!currentGlobalConfig ||
         currentGlobalConfig.publishableKey !== stripeSettings.publishableKey ||
         currentGlobalConfig.secretKey !== stripeSettings.secretKey)) {

      console.log('🔧 CoursePurchase: Reconfiguring global Stripe service with course-specific settings for course:', course.id);
      await stripeContext.configureStripe({ // Use context to ensure global state is updated
        publishableKey: stripeSettings.publishableKey,
        secretKey: stripeSettings.secretKey,
        webhookSecret: stripeSettings.webhookSecret, // Use course specific or global? For now, course.
        testMode: stripeSettings.testMode,
      });
    } else {
      console.log('🔧 CoursePurchase: Using existing global Stripe configuration for course:', course.id);
      if (!globalStripeServiceInstance.isConfigured()) {
        throw new Error("Stripe service is not configured globally, and no course-specific keys were sufficient to initialize.");
      }
    }
  };

  // Renamed to avoid confusion with stripeContext.createCheckoutSession (which is deprecated and calls initiateUpgrade)
  const createCourseCheckoutSessionDirect = async (course: Course, plan: CoursePricingPlan): Promise<{sessionId?: string, error?: string}> => {
    const stripeSettings = course.stripeSettings!;

    if (!globalStripeServiceInstance.isConfigured()) {
      throw new Error('Stripe service is not configured. Cannot create course checkout session.');
    }
    if (!plan.stripePriceId) {
      throw new Error(`Plan "${plan.name}" does not have a Stripe Price ID configured.`);
    }

    const successUrl = stripeSettings.successUrl || `${window.location.origin}/course/${course.id}/purchase-success?course_id=${course.id}&plan_id=${plan.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = stripeSettings.cancelUrl || `${window.location.origin}/course/${course.id}`;

    // Use stripeContext.customer for email and potentially Stripe Customer ID
    const customerEmail = stripeContext.customer?.email || 'customer@example.com'; // Fallback, ideally get from logged-in user
    const stripeCustomerId = stripeContext.customer?.stripeCustomerId;


    // Directly use the imported globalStripeServiceInstance
    const sessionResponse = await globalStripeServiceInstance.createCheckoutSession({
      priceId: plan.stripePriceId,
      customerEmail: customerEmail,
      customerId: stripeCustomerId, // Pass Stripe Customer ID if available
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      mode: plan.interval === 'one_time' ? 'payment' : 'subscription',
      trialPeriodDays: plan.trialDays,
    });

    if (!sessionResponse.success || !sessionResponse.sessionId) {
        console.error('❌ Course checkout session creation failed via globalStripeServiceInstance:', sessionResponse.error);
        throw new Error(sessionResponse.error || 'Failed to create course checkout session.');
    }

    console.log('✅ Course checkout session created via globalStripeServiceInstance:', {
      sessionId: sessionResponse.sessionId,
      courseId: course.id,
      planId: plan.id,
    });

    return { sessionId: sessionResponse.sessionId };
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Purchase Course Access</DialogTitle>
              <DialogDescription className="text-lg mt-2">
                {course.title}
              </DialogDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <CoursePricing
            courseId={course.id}
            courseTitle={course.title}
            stripeSettings={course.stripeSettings}
            onSelectPlan={handlePlanSelect}
            selectedPlanId={selectedPlan?.id}
            loading={loading}
          />
        </div>

        {/* Purchase Confirmation Modal */}
        {showConfirmation && selectedPlan && (
          <Dialog open onOpenChange={() => setShowConfirmation(false)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Purchase</DialogTitle>
                <DialogDescription>
                  Review your selection before proceeding to payment
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{selectedPlan.description}</p>

                  <div className="mt-3">
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedPlan.price, selectedPlan.currency)}
                      {selectedPlan.interval !== 'one_time' && ` / ${selectedPlan.interval}`}
                    </div>

                    {selectedPlan.trialDays && selectedPlan.trialDays > 0 && (
                      <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                        <Gift className="h-4 w-4" />
                        <span>{selectedPlan.trialDays} day free trial</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium text-sm">What's included:</h4>
                    <ul className="mt-2 space-y-1">
                      {selectedPlan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {selectedPlan.features.length > 3 && (
                        <li className="text-sm text-gray-500">
                          +{selectedPlan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Secure Payment</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Your payment will be processed securely by Stripe.
                      {course.stripeSettings.testMode && ' This is in test mode - no real charges will be made.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handlePurchase}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
