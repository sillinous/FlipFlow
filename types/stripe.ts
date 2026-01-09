// Stripe-related types for FlipFlow

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'free' | 'trialing' | 'past_due';

export type PlanInterval = 'month' | 'year' | 'one-time';

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  credits?: number; // -1 for unlimited, 0+ for fixed amount
  priceId?: string; // Stripe Price ID
  interval?: PlanInterval;
  features: string[];
  description?: string;
  phase?: number; // Which phase this feature launches in
}

export interface SubscriptionData {
  userId: string;
  email: string;
  planId: string;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  credits: number; // Total credits available
  usedCredits: number; // Credits consumed
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutSessionData {
  sessionId: string;
  url: string;
  planId: string;
  userId: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface UsageStats {
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  totalCredits: number | 'Unlimited';
  usedCredits: number;
  remainingCredits: number | 'Unlimited';
  usagePercentage: number;
  isUnlimited: boolean;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  sessionId?: string;
  url?: string;
}

export interface CreditConsumption {
  success: boolean;
  remainingCredits: number;
  error?: string;
}

export interface AnalysisPermission {
  allowed: boolean;
  reason?: string;
  remainingCredits?: number;
}
