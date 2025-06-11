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
import type { Course, CoursePricingPlan } from '@/types';

interface CoursePurchaseProps {
  course: Course;
  onClose: () => void;
  onPurchaseComplete?: (planId: string) => void;
}

export function CoursePurchase({ course, onClose, onPurchaseComplete }: CoursePurchaseProps) {
  const { createCheckoutSession, loading: stripeLoading } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState<CoursePricingPlan | null>(null);
  const [loading, setLoading] = useState(false);
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

      // Initialize Stripe service with course-specific settings if different from global
      await initializeCourseStripe(course.stripeSettings);

      // Create checkout session using the existing Stripe service
      const sessionId = await createCourseCheckoutSession(course, selectedPlan);

      // Use the global Stripe service to redirect to checkout
      const stripeService = (window as any).stripeService;
      if (stripeService) {
        await stripeService.redirectToCheckout(sessionId);
      } else {
        throw new Error('Stripe service not available');
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
    // Check if we need to reconfigure Stripe with course-specific settings
    const stripeService = (window as any).stripeService;
    const currentConfig = stripeService?.getConfig();

    // Only reconfigure if the course has different keys than what's currently configured
    if (!currentConfig ||
        currentConfig.publishableKey !== stripeSettings.publishableKey ||
        currentConfig.secretKey !== stripeSettings.secretKey) {

      console.log('🔧 Configuring Stripe with course-specific settings:', {
        courseId: course.id,
        testMode: stripeSettings.testMode,
        publishableKey: stripeSettings.publishableKey.substring(0, 20) + '...'
      });

      await stripeService?.initialize({
        publishableKey: stripeSettings.publishableKey,
        secretKey: stripeSettings.secretKey,
        webhookSecret: stripeSettings.webhookSecret,
        testMode: stripeSettings.testMode
      });
    }
  };

  const createCourseCheckoutSession = async (course: Course, plan: CoursePricingPlan): Promise<string> => {
    const stripeSettings = course.stripeSettings!;

    // Use course-specific success/cancel URLs if configured, otherwise use defaults
    const successUrl = stripeSettings.successUrl || `${window.location.origin}/course/${course.id}/welcome`;
    const cancelUrl = stripeSettings.cancelUrl || `${window.location.origin}/course/${course.id}`;

    // Create checkout session with course-specific settings using the global Stripe service
    const stripeService = (window as any).stripeService;

    if (!stripeService) {
      throw new Error('Stripe service not available');
    }

    // Ensure we have a valid price ID
    if (!plan.stripePriceId) {
      throw new Error('Plan does not have a Stripe price ID configured');
    }

    const sessionResponse = await stripeService.createCheckoutSession({
      priceId: plan.stripePriceId,
      customerEmail: 'customer@example.com', // In real app, get from user context
      successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl,
      mode: plan.interval === 'one_time' ? 'payment' : 'subscription',
      trialPeriodDays: plan.trialDays
    });

    console.log('✅ Course checkout session created:', {
      sessionId: sessionResponse.sessionId,
      courseId: course.id,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      currency: plan.currency
    });

    return sessionResponse.sessionId;
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
