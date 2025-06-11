import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Star,
  Clock,
  CreditCard,
  Calendar,
  Gift
} from 'lucide-react';
import type { CoursePricingPlan, CourseStripeSettings } from '@/types';

interface CoursePricingProps {
  courseId: string;
  courseTitle: string;
  stripeSettings: CourseStripeSettings;
  onSelectPlan: (planId: string) => void;
  selectedPlanId?: string;
  loading?: boolean;
}

export function CoursePricing({
  courseId,
  courseTitle,
  stripeSettings,
  onSelectPlan,
  selectedPlanId,
  loading
}: CoursePricingProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const formatInterval = (interval: string) => {
    switch (interval) {
      case 'month':
        return 'per month';
      case 'year':
        return 'per year';
      case 'one_time':
        return 'one-time payment';
      default:
        return '';
    }
  };

  const enabledPlans = stripeSettings.plans.filter(plan => plan.isEnabled);

  if (enabledPlans.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No pricing plans available</h3>
        <p className="text-gray-600">
          This course does not have any active pricing plans configured.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600 mb-4">
          Get access to "{courseTitle}" and start learning today
        </p>
        {stripeSettings.testMode && (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Test Mode - No real charges
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledPlans
          .sort((a, b) => a.order - b.order)
          .map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${
                plan.isPopular
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : selectedPlanId === plan.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>

                <div className="py-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(plan.price, plan.currency)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatInterval(plan.interval)}
                  </div>
                </div>

                {plan.trialDays && plan.trialDays > 0 && (
                  <div className="flex items-center justify-center gap-1 text-green-600 text-sm">
                    <Gift className="h-4 w-4" />
                    <span>{plan.trialDays} day free trial</span>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  variant={plan.isPopular ? 'default' : 'outline'}
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={loading || selectedPlanId === plan.id}
                >
                  {selectedPlanId === plan.id ? (
                    'Selected'
                  ) : loading ? (
                    'Processing...'
                  ) : plan.interval === 'one_time' ? (
                    'Purchase Now'
                  ) : (
                    'Subscribe'
                  )}
                </Button>

                {plan.interval !== 'one_time' && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Cancel anytime
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <h3 className="font-medium text-gray-900">Secure Payment</h3>
            <p className="text-sm text-gray-600">
              Powered by Stripe. Your payment information is encrypted and secure.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h3 className="font-medium text-gray-900">Instant Access</h3>
            <p className="text-sm text-gray-600">
              Get immediate access to all course content after successful payment.
            </p>
          </div>

          {stripeSettings.allowFreeTrial && (
            <div className="flex flex-col items-center gap-2">
              <Clock className="h-8 w-8 text-purple-600" />
              <h3 className="font-medium text-gray-900">Free Trial</h3>
              <p className="text-sm text-gray-600">
                Try for free with our {stripeSettings.freeTrialDays} day trial period.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">What payment methods do you accept?</h4>
            <p className="text-sm text-gray-600 mt-1">
              We accept all major credit cards, debit cards, and other payment methods supported by Stripe.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Can I cancel my subscription?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Do you offer refunds?</h4>
            <p className="text-sm text-gray-600 mt-1">
              We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.
            </p>
          </div>

          {stripeSettings.supportEmail && (
            <div>
              <h4 className="font-medium text-gray-900">Need help?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Contact our support team at{' '}
                <a
                  href={`mailto:${stripeSettings.supportEmail}`}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  {stripeSettings.supportEmail}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
