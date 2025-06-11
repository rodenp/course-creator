import type React from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Building, ArrowUp, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useBilling } from '@/contexts/BillingContext';
import { useTranslation } from '@/i18n';
import type { FeatureKey, PlanType } from '@/types/billing';
import { FEATURE_CONFIG, PLANS } from '@/types/billing';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  className?: string;
}

// Feature gate component that conditionally renders children based on plan
export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
  className
}: FeatureGateProps) {
  const { hasFeature, currentPlan, upgradePlan } = useBilling();
  const { t } = useTranslation();

  // If user has access to the feature, render children
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If showUpgrade is false, render nothing
  if (!showUpgrade) {
    return null;
  }

  // Find which plans support this feature
  const featureConfig = FEATURE_CONFIG[feature];
  const supportingPlans = PLANS.filter(plan =>
    featureConfig?.plans.includes(plan.id)
  );
  const lowestPlan = supportingPlans[0]; // Plans are ordered by price

  const getPlanIcon = (planId: PlanType) => {
    switch (planId) {
      case 'basic': return <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-gray-600 text-xs">B</div>;
      case 'pro': return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'enterprise': return <Building className="w-5 h-5 text-purple-500" />;
    }
  };

  const handleUpgrade = async () => {
    if (lowestPlan) {
      try {
        await upgradePlan(lowestPlan.id);
      } catch (error) {
        console.error('Upgrade failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`❌ Upgrade Failed\n\n${errorMessage}\n\nPlease check:\n• Stripe is configured in Extensions\n• Plan has valid Stripe Price ID\n• Network connection`);
      }
    }
  };

  // Render upgrade prompt
  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-8 w-8 text-gray-400" />
            {lowestPlan && getPlanIcon(lowestPlan.id)}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Premium Feature
          </h3>

          <p className="text-gray-600 mb-4 max-w-sm">
            {featureConfig?.description || 'This feature requires a premium plan.'}
          </p>

          {lowestPlan && (
            <div className="mb-4">
              <Badge variant="outline" className="text-sm">
                Available in {lowestPlan.name} plan
              </Badge>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleUpgrade} className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4" />
              Upgrade to {lowestPlan?.name}
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Starting at ${lowestPlan?.price || 0}/month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for easy feature checking
export function useFeatureAccess(feature: FeatureKey) {
  const { hasFeature } = useBilling();
  return {
    hasFeature: hasFeature(feature),
    feature,
  };
}

// Higher-order component for feature gating
export function withFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  feature: FeatureKey,
  fallback?: ReactNode
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={feature} fallback={fallback}>
        <Component {...props} />
      </FeatureGate>
    );
  };
}

// Inline feature check component
interface FeatureCheckProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureCheck({ feature, children, fallback }: FeatureCheckProps) {
  const { hasFeature } = useBilling();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Usage limit component
interface UsageLimitProps {
  current: number;
  limit: number;
  feature: string;
  className?: string;
}

export function UsageLimit({ current, limit, feature, className }: UsageLimitProps) {
  const { currentPlan, upgradePlan } = useBilling();
  const { t } = useTranslation();
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  const isAtLimit = current >= limit && limit !== -1;

  const handleUpgrade = async () => {
    try {
      await upgradePlan('pro');
    } catch (error) {
      console.error('Upgrade failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Upgrade Failed\n\n${errorMessage}\n\nPlease check:\n• Stripe is configured in Extensions\n• Plan has valid Stripe Price ID\n• Network connection`);
    }
  };

  return (
    <div className={`${className} inline-flex items-center gap-3 px-3 py-2 rounded-md text-xs ${
      isAtLimit
        ? 'bg-red-50 text-red-700 border border-red-200'
        : isNearLimit
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      <span className="font-medium">
        {current} / {limit === -1 ? '∞' : limit} {feature.toLowerCase()}
      </span>

      {limit !== -1 && (
        <div className="w-12 bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isAtLimit ? 'bg-red-400' :
              isNearLimit ? 'bg-amber-400' :
              'bg-blue-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {(isAtLimit || isNearLimit) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUpgrade}
          className="h-5 px-2 text-xs font-medium hover:bg-white/60"
        >
          {t('billing.upgradePlan')}
        </Button>
      )}
    </div>
  );
}
