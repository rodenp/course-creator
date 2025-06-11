export type PlanType = 'basic' | 'pro' | 'enterprise';

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface PlanLimits {
  maxCourses: number;
  maxStudents?: number;
  storageGB?: number;
  apiCalls?: number;
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  currency: string;
  billing: 'monthly' | 'yearly';
  description: string;
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
  stripePriceId?: string;
  trialPeriodDays?: number; // Number of days for trial period, if any
}

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanType;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: Date;
  dueDate?: Date;
  description: string;
  downloadUrl?: string;
  stripeInvoiceId?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
}

export interface BillingDetails {
  name: string;
  email: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
}

// Feature definitions
export type FeatureKey =
  | 'basic_editor'
  | 'advanced_editor'
  | 'import_export'
  | 'templates'
  | 'analytics_basic'
  | 'analytics_advanced'
  | 'leaderboard'
  | 'certificates'
  | 'unlimited_courses'
  | 'collaboration'
  | 'api_access'
  | 'priority_support'
  | 'custom_branding';

export interface FeatureConfig {
  [key: string]: {
    plans: PlanType[];
    description: string;
    component?: string;
  };
}

export const FEATURE_CONFIG: FeatureConfig = {
  basic_editor: {
    plans: ['basic', 'pro', 'enterprise'],
    description: 'Basic course editing capabilities',
  },
  advanced_editor: {
    plans: ['pro', 'enterprise'],
    description: 'Advanced editing with rich media support',
  },
  import_export: {
    plans: ['pro', 'enterprise'],
    description: 'Import and export courses',
  },
  templates: {
    plans: ['pro', 'enterprise'],
    description: 'Save and use course templates',
  },
  analytics_basic: {
    plans: ['pro', 'enterprise'],
    description: 'Basic analytics and reporting',
  },
  analytics_advanced: {
    plans: ['enterprise'],
    description: 'Advanced analytics dashboard',
  },
  leaderboard: {
    plans: ['enterprise'],
    description: 'Student leaderboards and rankings',
  },
  certificates: {
    plans: ['enterprise'],
    description: 'Course completion certificates',
  },
  unlimited_courses: {
    plans: ['enterprise'],
    description: 'Create unlimited courses',
  },
  collaboration: {
    plans: ['enterprise'],
    description: 'Team collaboration features',
  },
  api_access: {
    plans: ['enterprise'],
    description: 'Full API access',
  },
  priority_support: {
    plans: ['pro', 'enterprise'],
    description: 'Priority customer support',
  },
  custom_branding: {
    plans: ['enterprise'],
    description: 'Custom branding and white-label options',
  },
};

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    currency: 'USD',
    billing: 'monthly',
    description: 'Perfect for getting started with course creation',
    features: [
      'Create up to 3 courses',
      'Basic course editor',
      'Course viewing',
      'Progress tracking',
      'Community support'
    ],
    limits: {
      maxCourses: 3,
      maxStudents: 50,
      storageGB: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    currency: 'USD',
    billing: 'monthly',
    description: 'Advanced features for serious course creators',
    features: [
      'Create up to 25 courses',
      'Advanced course editor',
      'Import/Export courses',
      'Lesson templates',
      'Basic analytics',
      'Email support'
    ],
    limits: {
      maxCourses: 25,
      maxStudents: 500,
      storageGB: 10,
      apiCalls: 1000,
    },
    popular: true,
    stripePriceId: 'price_pro_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49,
    currency: 'USD',
    billing: 'monthly',
    description: 'Full-featured solution for organizations',
    features: [
      'Unlimited courses',
      'Full analytics dashboard',
      'Leaderboard & certificates',
      'Advanced templates',
      'Priority support',
      'Custom integrations'
    ],
    limits: {
      maxCourses: -1, // unlimited
      maxStudents: -1,
      storageGB: 100,
      apiCalls: -1,
    },
    stripePriceId: 'price_enterprise_monthly',
  },
];
