import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  CheckCircle,
  Settings,
  ArrowRight,
  Zap,
  Shield,
  BarChart,
  Mail,
  MessageSquare,
  Video,
  Globe,
  Database,
  Cloud,
  Copy,
  ExternalLink,
  Webhook
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useStripe } from '@/contexts/StripeContext';
import { getStripeWebhookURL, displayWebhookInstructions } from '@/services/stripe-webhook-endpoint';

interface Extension {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  category: 'payment' | 'analytics' | 'communication' | 'storage' | 'integration';
  status: 'available' | 'installed' | 'configured';
  featured?: boolean;
  comingSoon?: boolean;
  price?: string;
}

interface ExtensionsProps {
  onBack: () => void;
}

export function Extensions({ onBack }: ExtensionsProps) {
  const { t } = useTranslation();
  const { isConfigured: isStripeConfigured, isTestMode, configureStripe, loading } = useStripe();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showStripeConfig, setShowStripeConfig] = useState(false);

  const extensions: Extension[] = [
    {
      id: 'stripe',
      name: 'Stripe Payments',
      description: 'Accept payments and manage subscriptions',
      longDescription: 'Integrate Stripe for secure payment processing, subscription management, and billing. Support for one-time payments, recurring subscriptions, and customer management.',
      icon: <CreditCard className="h-6 w-6 text-purple-600" />,
      category: 'payment',
      status: isStripeConfigured ? 'configured' : 'available',
      featured: true,
      price: 'Free'
    },
    {
      id: 'analytics-pro',
      name: 'Advanced Analytics',
      description: 'Detailed insights and reporting',
      longDescription: 'Get comprehensive analytics with custom dashboards, advanced metrics, and exportable reports.',
      icon: <BarChart className="h-6 w-6 text-blue-600" />,
      category: 'analytics',
      status: 'available',
      price: '$19/month'
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp Integration',
      description: 'Email marketing and automation',
      longDescription: 'Connect with Mailchimp to automatically add students to mailing lists and create targeted email campaigns.',
      icon: <Mail className="h-6 w-6 text-yellow-600" />,
      category: 'communication',
      status: 'available',
      price: 'Free'
    },
    {
      id: 'zoom',
      name: 'Zoom Integration',
      description: 'Live video sessions and webinars',
      longDescription: 'Integrate Zoom for live classes, webinars, and one-on-one sessions directly within your courses.',
      icon: <Video className="h-6 w-6 text-blue-500" />,
      category: 'communication',
      status: 'available',
      comingSoon: true,
      price: 'Free'
    },
    {
      id: 'slack',
      name: 'Slack Integration',
      description: 'Course discussions and notifications',
      longDescription: 'Connect with Slack for course discussions, progress notifications, and community building.',
      icon: <MessageSquare className="h-6 w-6 text-green-600" />,
      category: 'communication',
      status: 'available',
      comingSoon: true,
      price: 'Free'
    },
    {
      id: 'aws-s3',
      name: 'AWS S3 Storage',
      description: 'Scalable file storage',
      longDescription: 'Store course videos, images, and files in AWS S3 for unlimited scalability and global delivery.',
      icon: <Cloud className="h-6 w-6 text-orange-600" />,
      category: 'storage',
      status: 'available',
      comingSoon: true,
      price: 'Pay per use'
    },
    {
      id: 'zapier',
      name: 'Zapier Integration',
      description: 'Connect with 5000+ apps',
      longDescription: 'Automate workflows by connecting your course platform with thousands of other applications.',
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      category: 'integration',
      status: 'available',
      comingSoon: true,
      price: 'Free'
    },
    {
      id: 'custom-domain',
      name: 'Custom Domain',
      description: 'White-label your platform',
      longDescription: 'Use your own domain name and branding to create a fully white-labeled course platform.',
      icon: <Globe className="h-6 w-6 text-indigo-600" />,
      category: 'integration',
      status: 'available',
      price: '$49/month'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Extensions', count: extensions.length },
    { id: 'payment', name: 'Payments', count: extensions.filter(e => e.category === 'payment').length },
    { id: 'analytics', name: 'Analytics', count: extensions.filter(e => e.category === 'analytics').length },
    { id: 'communication', name: 'Communication', count: extensions.filter(e => e.category === 'communication').length },
    { id: 'storage', name: 'Storage', count: extensions.filter(e => e.category === 'storage').length },
    { id: 'integration', name: 'Integration', count: extensions.filter(e => e.category === 'integration').length }
  ];

  const filteredExtensions = selectedCategory === 'all'
    ? extensions
    : extensions.filter(ext => ext.category === selectedCategory);

  const handleInstallExtension = (extensionId: string) => {
    if (extensionId === 'stripe') {
      setShowStripeConfig(true);
    } else {
      console.log('Installing extension:', extensionId);
      alert(`Extension "${extensionId}" installation coming soon!`);
    }
  };

  const getStatusBadge = (status: Extension['status']) => {
    switch (status) {
      case 'installed':
        return <Badge variant="secondary">Installed</Badge>;
      case 'configured':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      default:
        return null;
    }
  };

  const getStatusButton = (extension: Extension) => {
    if (extension.comingSoon) {
      return (
        <Button disabled variant="outline">
          Coming Soon
        </Button>
      );
    }

    switch (extension.status) {
      case 'available':
        return (
          <Button onClick={() => handleInstallExtension(extension.id)}>
            Install
          </Button>
        );
      case 'installed':
        return (
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        );
      case 'configured':
        return (
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        );
    }
  };

  if (showStripeConfig) {
    return (
      <StripeConfiguration
        onBack={() => setShowStripeConfig(false)}
        onComplete={() => {
          setShowStripeConfig(false);
          window.location.reload(); // Refresh to update status
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-2">
                ← Back to Courses
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Extensions</h1>
              <p className="text-gray-600 mt-1">
                Extend your course platform with powerful integrations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">All integrations are secure and verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Extensions */}
            {selectedCategory === 'all' && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {extensions.filter(ext => ext.featured).map((extension) => (
                    <Card key={extension.id} className="border-2 border-blue-200 bg-blue-50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {extension.icon}
                            <div>
                              <CardTitle className="text-lg">{extension.name}</CardTitle>
                              <CardDescription>{extension.description}</CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-blue-600">Featured</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">{extension.longDescription}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{extension.price}</span>
                            {getStatusBadge(extension.status)}
                          </div>
                          {getStatusButton(extension)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Extensions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedCategory === 'all' ? 'All Extensions' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExtensions.map((extension) => (
                  <Card key={extension.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {extension.icon}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{extension.name}</CardTitle>
                            {extension.comingSoon && (
                              <Badge variant="outline" className="text-xs">Soon</Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">{extension.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{extension.longDescription}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{extension.price}</span>
                        {getStatusButton(extension)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stripe Configuration Component
function StripeConfiguration({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const { t } = useTranslation();
  const { configureStripe, isConfigured, isTestMode: currentTestMode, loading, error } = useStripe();
  const [step, setStep] = useState(1);
  const [testMode, setTestMode] = useState(currentTestMode);
  const [formData, setFormData] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: ''
  });
  const [configuring, setConfiguring] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Get webhook URL on component mount
  useEffect(() => {
    const url = getStripeWebhookURL();
    setWebhookUrl(url);
  }, []);

  // Copy webhook URL to clipboard
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Show webhook instructions
  const showWebhookInstructions = () => {
    displayWebhookInstructions();
    alert('Webhook setup instructions have been logged to the console. Open Developer Tools > Console to see them.');
  };

  // Removed demo keys functionality - use real Stripe keys only

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.publishableKey.trim()) {
      alert('Please enter a publishable key');
      return;
    }

    if (!formData.secretKey.trim()) {
      alert('Please enter a secret key');
      return;
    }

    if (!formData.publishableKey.startsWith('pk_')) {
      alert('Publishable key must start with "pk_"');
      return;
    }

    if (!formData.secretKey.startsWith('sk_')) {
      alert('Secret key must start with "sk_"');
      return;
    }

    if (testMode && !formData.publishableKey.includes('test')) {
      alert('Test mode is enabled but the publishable key doesn\'t appear to be a test key (should contain "test")');
      return;
    }

    try {
      setConfiguring(true);
      console.log('🔧 Attempting to configure Stripe with:', {
        publishableKey: `${formData.publishableKey.substring(0, 20)}...`,
        secretKey: `${formData.secretKey.substring(0, 20)}...`,
        testMode,
        isDemoKeys: formData.publishableKey === 'pk_test_51234567890123456789012345678901234567890123'
      });

      await configureStripe({
        publishableKey: formData.publishableKey,
        secretKey: formData.secretKey,
        webhookSecret: formData.webhookSecret,
        testMode
      });

      console.log('✅ Stripe configuration successful - proceeding with connection test');

      // Test the connection
      try {
        const connectionTest = await (window as unknown as { stripeService: { testConnection: () => Promise<boolean> } }).stripeService?.testConnection();

        if (connectionTest) {
          const isDemoMode = formData.publishableKey === 'pk_test_51234567890123456789012345678901234567890123';
          alert(`✅ Stripe configured successfully!

${isDemoMode ? '🧪 Demo Mode: Using mock Stripe service' : '🔗 Real Mode: Connected to Stripe.js'}

✅ Configuration complete
✅ Connection test passed
✅ Ready for billing features

Available features:
• Create subscriptions
• Cancel subscriptions
• View billing history
• Download invoices
• Customer portal

${testMode ? '🧪 Test mode - no real charges' : '🔴 Live mode - real payments'}`);
        } else {
          alert('✅ Stripe configured successfully!\n\nYou can now access all billing features from the main dashboard.');
        }
      } catch (testError) {
        console.log('Connection test skipped:', testError);
        alert('✅ Stripe configured successfully!\n\nYou can now access all billing features from the main dashboard.');
      }

      console.log('🎯 Calling onComplete to refresh page...');
      onComplete();
    } catch (err) {
      console.error('❌ Failed to configure Stripe:', err);
      console.error('❌ Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      // Provide specific help based on error type
      let helpMessage = '';
      if (errorMessage.includes('Failed to load Stripe.js')) {
        helpMessage = '\n\n💡 Try using the "Use Demo Keys for Testing" button for offline testing, or check your internet connection for real Stripe keys.';
      } else if (errorMessage.includes('Invalid')) {
        helpMessage = '\n\n💡 Please check your API key formats. Publishable keys start with "pk_" and secret keys start with "sk_".';
      }

      alert(`❌ Failed to configure Stripe: ${errorMessage}${helpMessage}`);
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" onClick={onBack} className="mb-2">
            ← Back to Extensions
          </Button>
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stripe Integration</h1>
              <p className="text-gray-600">Configure secure payment processing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Steps */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center gap-3 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}>
                    1
                  </div>
                  <span>Configure API Keys</span>
                </div>
                <div className={`flex items-center gap-3 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}>
                    2
                  </div>
                  <span>Test Integration</span>
                </div>
                <div className={`flex items-center gap-3 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}>
                    3
                  </div>
                  <span>Go Live</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      API Configuration
                      {isConfigured && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configured
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isConfigured
                        ? `Stripe is configured in ${currentTestMode ? 'test' : 'live'} mode. Update settings below if needed.`
                        : 'Enter your Stripe API keys to enable payments'
                      }
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Test Mode</span>
                    <Switch checked={testMode} onCheckedChange={setTestMode} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-red-600 mt-0.5">⚠️</div>
                        <div>
                          <h4 className="font-medium text-red-900">Configuration Error</h4>
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publishable Key {testMode && <span className="text-blue-600">(Test)</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={testMode ? "pk_test_..." : "pk_live_..."}
                        value={formData.publishableKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, publishableKey: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secret Key {testMode && <span className="text-blue-600">(Test)</span>}
                      </label>
                      <input
                        type="password"
                        placeholder={testMode ? "sk_test_..." : "sk_live_..."}
                        value={formData.secretKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook Endpoint Secret
                      </label>
                      <input
                        type="password"
                        placeholder="whsec_..."
                        value={formData.webhookSecret}
                        onChange={(e) => setFormData(prev => ({ ...prev, webhookSecret: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional: Used to verify webhook signatures from Stripe
                      </p>
                    </div>

                    {/* Webhook URL Section */}
                    <div className="border-t pt-6 mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Webhook className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900">Webhook Configuration</h4>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Webhook URL (for Stripe Dashboard)
                          </label>
                          <div className="flex gap-2">
                            <Input
                              value={webhookUrl}
                              readOnly
                              className="flex-1 bg-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={copyWebhookUrl}
                              className="flex-shrink-0"
                            >
                              {copySuccess ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-blue-700 mt-1">
                            Copy this URL and add it to your Stripe webhook endpoints
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={showWebhookInstructions}
                            className="text-blue-700 border-blue-300 hover:bg-blue-100"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Setup Instructions
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                            className="text-blue-700 border-blue-300 hover:bg-blue-100"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Stripe Dashboard
                          </Button>
                        </div>

                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Events to enable:</p>
                          <div className="text-xs grid grid-cols-2 gap-1">
                            <span>• customer.subscription.created</span>
                            <span>• customer.subscription.updated</span>
                            <span>• invoice.payment_succeeded</span>
                            <span>• invoice.payment_failed</span>
                            <span>• checkout.session.completed</span>
                            <span>• payment_intent.succeeded</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {testMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">Test Mode Enabled</h4>
                          <p className="text-sm text-blue-700">
                            Use test API keys from your Stripe dashboard. No real payments will be processed.
                          </p>
                          <p className="text-sm text-blue-700 mt-2">
                            Test card: <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code>
                          </p>
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={true}
                              className="text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                              Disabled - Use Real Stripe Keys
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onBack}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={configuring || loading}>
                      {configuring ? 'Configuring...' : 'Save Configuration'}
                      {!configuring && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
