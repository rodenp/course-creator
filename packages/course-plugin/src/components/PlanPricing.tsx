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

interface PlanPricingProps {
  onBack: () => void;
  onGoToExtensions: () => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  maxCourses: number;
  accessLevel: 'basic' | 'pro' | 'enterprise';
  isPopular?: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export function PlanPricing({ onBack, onGoToExtensions }: PlanPricingProps) {
  const { t } = useTranslation();
  const { isConfigured: isStripeConfigured, isTestMode } = useStripe();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

  // Form state for creating/editing plans
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    interval: 'month' as 'month' | 'year',
    stripePriceId: '',
    features: [''],
    maxCourses: 10,
    accessLevel: 'basic' as 'basic' | 'pro' | 'enterprise',
    isPopular: false,
    isActive: true,
    trialPeriodDays: 0 // 0 means no trial, > 0 means trial period in days
  });

  // Load plans from localStorage
  useEffect(() => {
    const savedPlans = localStorage.getItem('subscriptionPlans');
    if (savedPlans) {
      const parsedPlans = JSON.parse(savedPlans).map((plan: any) => ({
        ...plan,
        createdAt: new Date(plan.createdAt),
        updatedAt: new Date(plan.updatedAt)
      }));
      setPlans(parsedPlans);
    } else {
      // Initialize with default plans
      const defaultPlans: SubscriptionPlan[] = [
        {
          id: 'basic',
          name: 'Basic',
          description: 'Perfect for individuals getting started',
          price: 9.99,
          currency: 'USD',
          interval: 'month',
          features: ['Access to 5 courses', 'Basic analytics', 'Email support'],
          maxCourses: 5,
          accessLevel: 'basic',
          isActive: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'For professionals and small teams',
          price: 29.99,
          currency: 'USD',
          interval: 'month',
          features: ['Access to 50 courses', 'Advanced analytics', 'Priority support', 'Custom certificates'],
          maxCourses: 50,
          accessLevel: 'pro',
          isPopular: true,
          isActive: true,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'For large organizations and enterprises',
          price: 99.99,
          currency: 'USD',
          interval: 'month',
          features: ['Unlimited courses', 'Advanced analytics', 'Dedicated support', 'Custom branding', 'API access'],
          maxCourses: 999999,
          accessLevel: 'enterprise',
          isActive: true,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setPlans(defaultPlans);
      localStorage.setItem('subscriptionPlans', JSON.stringify(defaultPlans));
    }
  }, []);

  const savePlans = (updatedPlans: SubscriptionPlan[]) => {
    setPlans(updatedPlans);
    localStorage.setItem('subscriptionPlans', JSON.stringify(updatedPlans));
  };

  const handleCreatePlan = () => {
    if (!formData.name.trim()) return;

    // Validate Stripe Price ID for paid plans
    if (formData.price > 0 && !formData.stripePriceId.trim()) {
      alert('Stripe Price ID is required for paid plans. Please enter a valid price ID from your Stripe dashboard.');
      return;
    }

    const newPlan: SubscriptionPlan = {
      id: formData.accessLevel === 'basic' ? 'basic' :
          formData.accessLevel === 'pro' ? 'pro' :
          formData.accessLevel === 'enterprise' ? 'enterprise' :
          `plan-${Date.now()}`, // Fallback for custom plans
      name: formData.name,
      description: formData.description,
      price: formData.price,
      currency: formData.currency,
      interval: formData.interval,
      stripePriceId: formData.stripePriceId,
      features: formData.features.filter(f => f.trim()),
      maxCourses: formData.maxCourses,
      accessLevel: formData.accessLevel,
      isPopular: formData.isPopular,
      isActive: formData.isActive,
      trialPeriodDays: formData.trialPeriodDays > 0 ? formData.trialPeriodDays : undefined,
      order: plans.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    savePlans([...plans, newPlan]);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEditPlan = () => {
    if (!editingPlan || !formData.name.trim()) return;

    // Validate Stripe Price ID for paid plans
    if (formData.price > 0 && !formData.stripePriceId.trim()) {
      alert('Stripe Price ID is required for paid plans. Please enter a valid price ID from your Stripe dashboard.');
      return;
    }

    const updatedPlans = plans.map(plan =>
      plan.id === editingPlan.id
        ? {
            ...plan,
            name: formData.name,
            description: formData.description,
            price: formData.price,
            currency: formData.currency,
            interval: formData.interval,
            stripePriceId: formData.stripePriceId,
            features: formData.features.filter(f => f.trim()),
            maxCourses: formData.maxCourses,
            accessLevel: formData.accessLevel,
            isPopular: formData.isPopular,
            isActive: formData.isActive,
            trialPeriodDays: formData.trialPeriodDays > 0 ? formData.trialPeriodDays : undefined,
            updatedAt: new Date()
          }
        : plan
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
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      interval: 'month',
      stripePriceId: '',
      features: [''],
      maxCourses: 10,
      accessLevel: 'basic',
      isPopular: false,
      isActive: true,
      trialPeriodDays: 0
    });
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      stripePriceId: plan.stripePriceId || '',
      features: [...plan.features, ''],
      maxCourses: plan.maxCourses,
      accessLevel: plan.accessLevel,
      isPopular: plan.isPopular || false,
      isActive: plan.isActive,
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
                        /{plan.interval}
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

                  {/* Access Level Badge */}
                  <div className="flex justify-center">
                    <Badge className={getAccessLevelColor(plan.accessLevel)}>
                      {plan.accessLevel.charAt(0).toUpperCase() + plan.accessLevel.slice(1)}
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

                  {/* Course Limit */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Course Access: {plan.maxCourses === 999999 ? 'Unlimited' : plan.maxCourses}
                    </div>
                  </div>

                  {/* Stripe Integration */}
                  {plan.stripePriceId && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CreditCard className="h-3 w-3" />
                      <span>Stripe ID: {plan.stripePriceId}</span>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600">Active</span>
                    <Switch checked={plan.isActive} disabled />
                  </div>
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
