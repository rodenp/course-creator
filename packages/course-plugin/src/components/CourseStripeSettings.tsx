import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  TestTube,
  Globe,
  DollarSign,
  Settings,
  Star,
  Users,
  Calendar,
  Check
} from 'lucide-react';
import type { CourseStripeSettings, CoursePricingPlan } from '@/types';

interface CourseStripeSettingsProps {
  courseId: string;
  courseTitle: string;
  stripeSettings?: CourseStripeSettings;
  onUpdateSettings: (settings: CourseStripeSettings) => void;
  onBack: () => void;
}

export function CourseStripeSettings({
  courseId,
  courseTitle,
  stripeSettings,
  onUpdateSettings,
  onBack
}: CourseStripeSettingsProps) {
  const [settings, setSettings] = useState<CourseStripeSettings>(
    stripeSettings || {
      enabled: false,
      testMode: true,
      plans: [],
      allowFreeTrial: true,
      freeTrialDays: 7,
      collectBillingAddress: true,
      allowPromotionCodes: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );

  const [editingPlan, setEditingPlan] = useState<CoursePricingPlan | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<CoursePricingPlan> | null>(null);

  const handleSaveSettings = () => {
    const updatedSettings = {
      ...settings,
      updatedAt: new Date()
    };
    onUpdateSettings(updatedSettings);
    alert('Stripe settings saved successfully!');
  };

  const handleAddPlan = () => {
    const plan: CoursePricingPlan = {
      id: `plan_${Date.now()}`,
      name: newPlan?.name || '',
      description: newPlan?.description || '',
      price: newPlan?.price || 0,
      currency: newPlan?.currency || 'usd',
      interval: newPlan?.interval || 'month',
      features: newPlan?.features || [],
      isEnabled: true,
      order: settings.plans.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSettings(prev => ({
      ...prev,
      plans: [...prev.plans, plan]
    }));
    setNewPlan(null);
  };

  const handleUpdatePlan = (planId: string, updates: Partial<CoursePricingPlan>) => {
    setSettings(prev => ({
      ...prev,
      plans: prev.plans.map(plan =>
        plan.id === planId
          ? { ...plan, ...updates, updatedAt: new Date() }
          : plan
      )
    }));
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      setSettings(prev => ({
        ...prev,
        plans: prev.plans.filter(plan => plan.id !== planId)
      }));
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-2">
                ← Back to Course Settings
              </Button>
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Stripe Settings</h1>
                  <p className="text-gray-600">{courseTitle}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {settings.enabled && (
                <Badge className={settings.testMode ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                  {settings.testMode ? 'Test Mode' : 'Live Mode'}
                </Badge>
              )}
              <Button onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Configuration
                </CardTitle>
                <CardDescription>
                  Enable Stripe payments for this course and configure basic settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Stripe Payments</h3>
                    <p className="text-sm text-gray-600">Allow users to purchase access to this course</p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
                  />
                </div>

                {settings.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Test Mode</h3>
                        <p className="text-sm text-gray-600">Use test keys and process test payments</p>
                      </div>
                      <Switch
                        checked={settings.testMode}
                        onCheckedChange={(testMode) => setSettings(prev => ({ ...prev, testMode }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Publishable Key
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            type={showKeys ? 'text' : 'password'}
                            placeholder={settings.testMode ? 'pk_test_...' : 'pk_live_...'}
                            value={settings.publishableKey || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, publishableKey: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowKeys(!showKeys)}
                          >
                            {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Secret Key
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Input
                          type="password"
                          placeholder={settings.testMode ? 'sk_test_...' : 'sk_live_...'}
                          value={settings.secretKey || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, secretKey: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Webhook Secret</label>
                      <Input
                        type="password"
                        placeholder="whsec_..."
                        value={settings.webhookSecret || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Used to verify webhook signatures from Stripe
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pricing Plans */}
            {settings.enabled && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing Plans
                      </CardTitle>
                      <CardDescription>
                        Create and manage pricing plans for this course
                      </CardDescription>
                    </div>
                    <Button onClick={() => setNewPlan({})}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {settings.plans.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No pricing plans yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create your first pricing plan to start accepting payments
                      </p>
                      <Button onClick={() => setNewPlan({})}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Plan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {settings.plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`border rounded-lg p-4 ${
                            plan.isPopular ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{plan.name}</h3>
                                {plan.isPopular && (
                                  <Badge className="bg-blue-600">
                                    <Star className="h-3 w-3 mr-1" />
                                    Popular
                                  </Badge>
                                )}
                                {!plan.isEnabled && (
                                  <Badge variant="outline">Disabled</Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium">
                                  {formatCurrency(plan.price, plan.currency)}
                                  {plan.interval !== 'one_time' && ` / ${plan.interval}`}
                                </span>
                                {plan.trialDays && (
                                  <span className="text-green-600">
                                    {plan.trialDays} day trial
                                  </span>
                                )}
                                <span className="text-gray-500">
                                  {plan.features.length} features
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPlan(plan)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePlan(plan.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Settings */}
            {settings.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Settings</CardTitle>
                  <CardDescription>
                    Configure trial periods, billing, and checkout options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Allow Free Trial</h3>
                        <p className="text-sm text-gray-600">Offer free trial periods to new customers</p>
                      </div>
                      <Switch
                        checked={settings.allowFreeTrial}
                        onCheckedChange={(allowFreeTrial) => setSettings(prev => ({ ...prev, allowFreeTrial }))}
                      />
                    </div>

                    {settings.allowFreeTrial && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Free Trial Days</label>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          value={settings.freeTrialDays}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            freeTrialDays: Number.parseInt(e.target.value) || 7
                          }))}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Collect Billing Address</h3>
                        <p className="text-sm text-gray-600">Require billing address during checkout</p>
                      </div>
                      <Switch
                        checked={settings.collectBillingAddress}
                        onCheckedChange={(collectBillingAddress) => setSettings(prev => ({ ...prev, collectBillingAddress }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Allow Promotion Codes</h3>
                        <p className="text-sm text-gray-600">Enable discount codes in checkout</p>
                      </div>
                      <Switch
                        checked={settings.allowPromotionCodes}
                        onCheckedChange={(allowPromotionCodes) => setSettings(prev => ({ ...prev, allowPromotionCodes }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Success URL</label>
                      <Input
                        placeholder="https://yourdomain.com/success"
                        value={settings.successUrl || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, successUrl: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Cancel URL</label>
                      <Input
                        placeholder="https://yourdomain.com/cancel"
                        value={settings.cancelUrl || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, cancelUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Configuration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {settings.enabled ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Stripe Enabled</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {settings.publishableKey && settings.secretKey ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">API Keys Configured</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {settings.plans.length > 0 ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Pricing Plans</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {settings.webhookSecret ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm">Webhook Secret</span>
                  </div>
                </div>

                {settings.enabled && settings.publishableKey && settings.secretKey && settings.plans.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Ready for payments</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {settings.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Plans</span>
                      <span className="font-medium">{settings.plans.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Enabled Plans</span>
                      <span className="font-medium">
                        {settings.plans.filter(p => p.isEnabled).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price Range</span>
                      <span className="font-medium">
                        {settings.plans.length > 0 ? (
                          `${formatCurrency(Math.min(...settings.plans.map(p => p.price)), 'usd')} - ${formatCurrency(Math.max(...settings.plans.map(p => p.price)), 'usd')}`
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-sm">
                  <TestTube className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Test Mode</div>
                    <div className="text-gray-600 mt-1">
                      Use test API keys from your Stripe Dashboard. Test with card number 4242 4242 4242 4242.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Plan Modal */}
      {(newPlan !== null || editingPlan !== null) && (
        <PlanEditorModal
          plan={editingPlan || newPlan}
          isNew={newPlan !== null}
          onSave={(planData) => {
            if (editingPlan) {
              handleUpdatePlan(editingPlan.id, planData);
              setEditingPlan(null);
            } else {
              setNewPlan(planData);
              handleAddPlan();
            }
          }}
          onCancel={() => {
            setNewPlan(null);
            setEditingPlan(null);
          }}
        />
      )}
    </div>
  );
}

// Plan Editor Modal Component
interface PlanEditorModalProps {
  plan: Partial<CoursePricingPlan> | CoursePricingPlan | null;
  isNew: boolean;
  onSave: (plan: Partial<CoursePricingPlan>) => void;
  onCancel: () => void;
}

function PlanEditorModal({ plan, isNew, onSave, onCancel }: PlanEditorModalProps) {
  const [formData, setFormData] = useState<Partial<CoursePricingPlan>>(
    plan || {
      name: '',
      description: '',
      price: 0,
      currency: 'usd',
      interval: 'month',
      features: [],
      isPopular: false,
      isEnabled: true,
      trialDays: 0
    }
  );

  const [newFeature, setNewFeature] = useState('');

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{isNew ? 'Create New Plan' : 'Edit Plan'}</CardTitle>
          <CardDescription>
            Configure the pricing and features for this plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Plan Name</label>
              <Input
                placeholder="e.g., Basic Plan"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="29.99"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))}
                />
                <Select
                  value={formData.currency || 'usd'}
                  onValueChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Brief description of what's included in this plan"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Billing Interval</label>
              <Select
                value={formData.interval || 'month'}
                onValueChange={(interval: 'month' | 'year' | 'one_time') =>
                  setFormData(prev => ({ ...prev, interval }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                  <SelectItem value="one_time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trial Days (optional)</label>
              <Input
                type="number"
                min="0"
                max="30"
                placeholder="7"
                value={formData.trialDays || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  trialDays: Number.parseInt(e.target.value) || 0
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Features</label>
            <div className="space-y-2">
              {formData.features?.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                    {feature}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <Button onClick={handleAddFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isPopular || false}
                  onCheckedChange={(isPopular) => setFormData(prev => ({ ...prev, isPopular }))}
                />
                <span className="text-sm">Mark as popular</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isEnabled !== false}
                  onCheckedChange={(isEnabled) => setFormData(prev => ({ ...prev, isEnabled }))}
                />
                <span className="text-sm">Enabled</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={() => onSave(formData)}
              disabled={!formData.name || !formData.description || !formData.price}
            >
              {isNew ? 'Create Plan' : 'Update Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
