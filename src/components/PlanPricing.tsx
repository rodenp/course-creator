import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Settings,
  Check,
  CreditCard,
  Users,
  Crown,
  Star,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useStripe } from '@/contexts/StripeContext';
import { useTranslation } from '@/i18n';
import { PLANS as DEFAULT_PLANS, type Plan as AppPlan, type PlanType } from '@/types/billing'; // Import AppPlan and default plans

interface PlanPricingProps {
  onBack: () => void;
  onGoToExtensions: () => void;
}

// The internal state for plans in this component will now use AppPlan
// interface SubscriptionPlan { // This internal interface is replaced by AppPlan
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   currency: string;
//   interval: 'month' | 'year'; // Will be mapped to AppPlan's 'billing'
//   stripePriceId?: string;
//   features: string[];
//   maxCourses: number; // This is part of AppPlan.limits
//   accessLevel: 'basic' | 'pro' | 'enterprise'; // This can map to AppPlan.id or a specific field
//   isPopular?: boolean;
//   isActive: boolean;
//   order: number;
//   createdAt: Date;
//   updatedAt: Date;
//   trialPeriodDays?: number; // Added to match form data
// }

export function PlanPricing({ onBack, onGoToExtensions }: PlanPricingProps) {
  const { t } = useTranslation();
  const { isConfigured: isStripeConfigured, isTestMode } = useStripe();

  const [plans, setPlans] = useState<AppPlan[]>(DEFAULT_PLANS); // Use AppPlan and initialize with defaults
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AppPlan | null>(null); // Use AppPlan
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<AppPlan | null>(null); // Use AppPlan

  // Form state for creating/editing plans, aligned with AppPlan structure
  const [formData, setFormData] = useState<Partial<Omit<AppPlan, 'id' | 'limits' | 'createdAt' | 'updatedAt' | 'order'> & {
    id?: PlanType | string; // Allow string for new, custom IDs
    maxCourses: number;
    trialPeriodDays?: number;
    accessLevel: PlanType; // Keep for mapping to ID if standard plan
  }>>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billing: 'monthly', // Changed from interval
    stripePriceId: '',
    features: [''],
    maxCourses: 10, // Directly part of form, will be put into limits
    accessLevel: 'basic', // Used for ID mapping for standard plans
    isPopular: false,
    isActive: true,
    trialPeriodDays: 0 // 0 means no trial, > 0 means trial period in days
  });

  // Load plans from localStorage or use defaults from billing.ts
  useEffect(() => {
    const savedPlans = localStorage.getItem('subscriptionPlans');
    if (savedPlans) {
      try {
        const parsedPlans: AppPlan[] = JSON.parse(savedPlans).map((plan: any): AppPlan => ({
          ...plan,
          price: parseFloat(plan.price || 0),
          billing: plan.billing || (plan.interval === 'year' ? 'annually' : 'monthly'), // Ensure billing field
          interval: undefined, // remove old interval
          createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date(),
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt) : new Date(),
          limits: plan.limits || DEFAULT_PLANS.find(p => p.id === plan.id)?.limits || { maxCourses: 0 }
        }));
        setPlans(parsedPlans);
      } catch (e) {
        console.error("Failed to parse saved plans, using default.", e);
        setPlans(DEFAULT_PLANS);
        localStorage.setItem('subscriptionPlans', JSON.stringify(DEFAULT_PLANS));
      }
    } else {
      // Initialize with default plans from billing.ts if localStorage is empty
      setPlans(DEFAULT_PLANS);
      localStorage.setItem('subscriptionPlans', JSON.stringify(DEFAULT_PLANS));
    }
  }, []);

  const savePlans = (updatedPlans: AppPlan[]) => { // Parameter type updated to AppPlan[]
    setPlans(updatedPlans);
    localStorage.setItem('subscriptionPlans', JSON.stringify(updatedPlans));
    // Also update StripeContext's plans if it's already loaded them (optional, as it reloads on configure)
    // This direct update is tricky due to context boundaries. Better to rely on StripeContext reloading.
  };

  const handleCreatePlan = () => {
    if (!formData.name.trim()) return;

    // Validate Stripe Price ID for paid plans
    if (formData.price! > 0 && !formData.stripePriceId?.trim()) {
      alert('Stripe Price ID is required for paid plans. Please enter a valid price ID from your Stripe dashboard.');
      return;
    }

    const newPlanData: AppPlan = {
      // Determine ID: use accessLevel if it's a standard plan type, otherwise generate.
      id: (['basic', 'pro', 'enterprise'].includes(formData.accessLevel!) ? formData.accessLevel! : `plan_${Date.now()}`) as PlanType,
      name: formData.name!,
      description: formData.description!,
      price: formData.price!,
      currency: formData.currency!,
      billing: formData.billing!, // Changed from interval
      stripePriceId: formData.stripePriceId,
      features: formData.features!.filter(f => f.trim()),
      limits: {
        maxCourses: formData.maxCourses!,
        // Add other limits if they are part of formData, or use defaults
        maxStudents: 1000, storageGB: 5, apiCalls: 10000
      },
      popular: formData.isPopular,
      // isActive: formData.isActive, // isActive is not in AppPlan, but was in internal SubscriptionPlan. Assume true for new.
      trialPeriodDays: formData.trialPeriodDays! > 0 ? formData.trialPeriodDays : undefined,
      // order: plans.length + 1, // order is not in AppPlan
      // createdAt: new Date(), // Not part of AppPlan in billing.ts
      // updatedAt: new Date()  // Not part of AppPlan in billing.ts
    };

    savePlans([...plans, newPlanData]);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEditPlan = () => {
    if (!editingPlan || !formData.name.trim()) return;

    // Validate Stripe Price ID for paid plans
    if (formData.price! > 0 && !formData.stripePriceId?.trim()) {
      alert('Stripe Price ID is required for paid plans. Please enter a valid price ID from your Stripe dashboard.');
      return;
    }

    const updatedPlans = plans.map(p =>
      p.id === editingPlan.id
        ? ({
            ...p, // Spread existing AppPlan fields
            name: formData.name!,
            description: formData.description!,
            price: formData.price!,
            currency: formData.currency!,
            billing: formData.billing!, // Changed from interval
            stripePriceId: formData.stripePriceId,
            features: formData.features!.filter(f => f.trim()),
            limits: {
                ...p.limits, // Preserve other limits
                maxCourses: formData.maxCourses!
            },
            popular: formData.isPopular,
            // isActive: formData.isActive, // Not in AppPlan
            trialPeriodDays: formData.trialPeriodDays! > 0 ? formData.trialPeriodDays : undefined,
            // updatedAt: new Date() // Not in AppPlan
          } as AppPlan)
        : p
    );

    savePlans(updatedPlans);
    setShowEditDialog(false);
    setEditingPlan(null);
    resetForm();
  };

  const handleDeletePlan = () => {
    if (!deletingPlan) return;

    const updatedPlans = plans.filter(plan => plan.id !== deletingPlan.id);
    savePlans(updatedPlans);
    setShowDeleteDialog(false);
    setDeletingPlan(null);
  };

  const resetForm = () => {
    setFormData({ // Reset form, ensure fields match new formData structure
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billing: 'monthly',
      stripePriceId: '',
      features: [''],
      maxCourses: 10,
      accessLevel: 'basic',
      isPopular: false,
      // isActive: true, // Not in AppPlan form data
      trialPeriodDays: 0
    });
  };

  const openEditDialog = (plan: AppPlan) => { // Parameter type updated to AppPlan
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billing: plan.billing, // Changed from interval
      stripePriceId: plan.stripePriceId || '',
      features: [...plan.features, ''],
      maxCourses: plan.limits.maxCourses, // Get from limits
      accessLevel: plan.id as PlanType, // Assuming plan.id is one of 'basic', 'pro', 'enterprise'
      isPopular: plan.popular || false,
      // isActive: plan.isActive, // Not in AppPlan
      trialPeriodDays: plan.trialPeriodDays || 0
    });
    setShowEditDialog(true);
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;

    // Add new empty feature if the last one is being edited
    if (index === newFeatures.length - 1 && value.trim()) {
      newFeatures.push('');
    }

    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'basic':
        return <Users className="h-4 w-4" />;
      case 'pro':
        return <Star className="h-4 w-4" />;
      case 'enterprise':
        return <Crown className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isStripeConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Plan Pricing</h1>
          </div>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <CardTitle className="text-orange-800">Stripe Not Configured</CardTitle>
              </div>
              <CardDescription className="text-orange-700">
                You need to configure Stripe integration first before you can manage subscription plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onGoToExtensions} className="bg-orange-600 hover:bg-orange-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Configure Stripe in Extensions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plan Pricing</h1>
              <p className="text-gray-600 mt-1">Manage your subscription plans and pricing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isTestMode && (
              <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
                Test Mode
              </Badge>
            )}
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans
            .sort((a, b) => a.order - b.order)
            .map((plan) => (
              <Card key={plan.id} className={`relative ${plan.isPopular ? 'ring-2 ring-purple-500 shadow-lg' : ''}`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAccessLevelIcon(plan.accessLevel)}
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingPlan(plan);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                      <span className="text-lg font-normal text-gray-600">
                        /{plan.billing}
                      </span>
                    </div>
                  </div>

                  {/* Trial Period */}
                  {plan.trialPeriodDays && plan.trialPeriodDays > 0 && (
                    <div className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {plan.trialPeriodDays} Day Trial
                      </Badge>
                    </div>
                  )}

                  {/* Access Level Badge (using plan.id which is PlanType) */}
                  <div className="flex justify-center">
                    <Badge className={getAccessLevelColor(plan.id)}>
                      {plan.name} {/* Display plan name, as id might be just 'basic' */}
                    </Badge>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Course Limit from plan.limits */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Course Access: {plan.limits.maxCourses === -1 ? 'Unlimited' : plan.limits.maxCourses}
                    </div>
                  </div>

                  {/* Stripe Integration */}
                  {plan.stripePriceId && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CreditCard className="h-3 w-3" />
                      <span>Stripe ID: {plan.stripePriceId}</span>
                    </div>
                  )}

                  {/* Status (AppPlan does not have isActive, assume all displayed plans are active or manage status elsewhere if needed) */}
                  {/*
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600">Active</span>
                    <Switch checked={true} disabled /> {}
                  </div>
                  */}
                </CardContent>
              </Card>
            ))}
        </div>

        {plans.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <CreditCard className="h-12 w-12 text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">No plans yet</h3>
                  <p className="text-gray-600">Create your first subscription plan to get started.</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Plan Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
              <DialogDescription>
                Create a new subscription plan for your users.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Plan Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Basic, Pro, Enterprise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Access Level</label>
                  <Select
                    value={formData.accessLevel}
                    onValueChange={(value: 'basic' | 'pro' | 'enterprise') =>
                      setFormData({ ...formData, accessLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this plan"
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Interval</label>
                  <Select
                    value={formData.interval}
                    onValueChange={(value: 'month' | 'year') => setFormData({ ...formData, interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stripe Integration */}
              <div>
                <label className="block text-sm font-medium mb-2">Stripe Price ID (Optional)</label>
                <Input
                  value={formData.stripePriceId}
                  onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                  placeholder="price_xxxxxxxxxxxxx"
                />
              </div>

              {/* Trial Period */}
              <div>
                <label className="block text-sm font-medium mb-2">Trial Period (Days)</label>
                <Input
                  type="number"
                  value={formData.trialPeriodDays}
                  onChange={(e) => setFormData({ ...formData, trialPeriodDays: Number.parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter number of trial days (0 = no trial, subscription starts immediately)
                </p>
              </div>

              {/* Course Limit */}
              <div>
                <label className="block text-sm font-medium mb-2">Max Courses</label>
                <Input
                  type="number"
                  value={formData.maxCourses}
                  onChange={(e) => setFormData({ ...formData, maxCourses: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium mb-2">Features</label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter a feature"
                      />
                      {formData.features.length > 1 && feature && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                  />
                  <label className="text-sm font-medium">Mark as Popular</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <label className="text-sm font-medium">Active</label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan}>
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>
                Update the subscription plan details.
              </DialogDescription>
            </DialogHeader>

            {/* Same form as create dialog */}
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Plan Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Basic, Pro, Enterprise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Access Level</label>
                  <Select
                    value={formData.accessLevel}
                    onValueChange={(value: 'basic' | 'pro' | 'enterprise') =>
                      setFormData({ ...formData, accessLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this plan"
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Interval</label>
                  <Select
                    value={formData.interval}
                    onValueChange={(value: 'month' | 'year') => setFormData({ ...formData, interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stripe Integration */}
              <div>
                <label className="block text-sm font-medium mb-2">Stripe Price ID (Optional)</label>
                <Input
                  value={formData.stripePriceId}
                  onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                  placeholder="price_xxxxxxxxxxxxx"
                />
              </div>

              {/* Trial Period */}
              <div>
                <label className="block text-sm font-medium mb-2">Trial Period (Days)</label>
                <Input
                  type="number"
                  value={formData.trialPeriodDays}
                  onChange={(e) => setFormData({ ...formData, trialPeriodDays: Number.parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter number of trial days (0 = no trial, subscription starts immediately)
                </p>
              </div>

              {/* Course Limit */}
              <div>
                <label className="block text-sm font-medium mb-2">Max Courses</label>
                <Input
                  type="number"
                  value={formData.maxCourses}
                  onChange={(e) => setFormData({ ...formData, maxCourses: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium mb-2">Features</label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter a feature"
                      />
                      {formData.features.length > 1 && feature && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                  />
                  <label className="text-sm font-medium">Mark as Popular</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <label className="text-sm font-medium">Active</label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPlan}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Plan Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Plan</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingPlan?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeletePlan}>
                Delete Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
