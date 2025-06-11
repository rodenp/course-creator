export interface MediaContent {
  type: 'image' | 'video' | 'audio';
  url: string;
  title?: string;
  caption?: string;
}

export interface TextContent {
  type: 'text';
  content: string; // Rich text HTML content
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: TextContent | MediaContent;
  order: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: ContentBlock[];
  duration?: number; // in minutes
  isCompleted?: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
  isCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  modules: Module[];
  progress?: number; // 0-100
  isTemplate?: boolean;
  tags?: string[];

  // Simplified billing - courses are just paid or free
  isPaid?: boolean;
  accessLevel: 'free' | 'paid' | 'premium'; // premium requires higher subscription
  requiredPlan?: 'basic' | 'pro' | 'enterprise'; // minimum plan required
  stripeProductId?: string; // Stripe product ID for purchasing this course

  createdAt: Date;
  updatedAt: Date;
}

export interface LessonLibraryItem {
  id: string;
  title: string;
  description: string;
  content: ContentBlock[];
  duration?: number;
  tags?: string[];
  createdAt: Date;
}

export interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: Date;
}

export type ViewMode = 'view' | 'edit';

export interface StorageConfig {
  type: 'localStorage' | 'backend';
  apiUrl?: string;
  apiKey?: string;
}

// Stripe-related interfaces for course billing
export interface CoursePricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'one_time';
  stripePriceId?: string; // Stripe price ID for this plan
  features: string[];
  isPopular?: boolean;
  isEnabled: boolean;
  trialDays?: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseStripeSettings {
  enabled: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  testMode: boolean;
  plans: CoursePricingPlan[];
  defaultPlanId?: string;
  allowFreeTrial: boolean;
  freeTrialDays: number;
  collectBillingAddress: boolean;
  allowPromotionCodes: boolean;
  customDomain?: string;
  brandingColor?: string;
  logoUrl?: string;
  supportEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
