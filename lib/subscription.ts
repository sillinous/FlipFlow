import { createClient } from '@supabase/supabase-js';
import { PRICING_TIERS, isUnlimitedTier } from './stripe';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not configured. Some features may not work.');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface UserSubscription {
  userId: string;
  email: string;
  planId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  credits: number;
  usedCredits: number;
  status: 'active' | 'cancelled' | 'expired' | 'free';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get user's current subscription status
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  if (!supabase) {
    // Fallback for development without Supabase
    return {
      userId,
      email: 'user@example.com',
      planId: 'free',
      credits: PRICING_TIERS.FREE.credits,
      usedCredits: 0,
      status: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.id,
    email: data.email,
    planId: data.plan_id || 'free',
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    credits: data.credits || PRICING_TIERS.FREE.credits,
    usedCredits: data.used_credits || 0,
    status: data.subscription_status || 'free',
    currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
    cancelAtPeriodEnd: data.cancel_at_period_end || false,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Check if user can perform an analysis
export async function canPerformAnalysis(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  remainingCredits?: number;
}> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return {
      allowed: false,
      reason: 'User not found. Please sign up or log in.',
    };
  }

  // Check if subscription is active and unlimited
  if (subscription.status === 'active' && isUnlimitedTier(subscription.planId)) {
    return {
      allowed: true,
      remainingCredits: -1, // unlimited
    };
  }

  // Check if user has credits available
  const remainingCredits = subscription.credits - subscription.usedCredits;

  if (remainingCredits <= 0) {
    return {
      allowed: false,
      reason: 'No credits remaining. Please upgrade your plan or purchase more credits.',
      remainingCredits: 0,
    };
  }

  return {
    allowed: true,
    remainingCredits,
  };
}

// Consume one analysis credit
export async function consumeAnalysisCredit(userId: string): Promise<{
  success: boolean;
  remainingCredits: number;
  error?: string;
}> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return {
      success: false,
      remainingCredits: 0,
      error: 'User not found',
    };
  }

  // Don't consume credits for unlimited plans
  if (isUnlimitedTier(subscription.planId) && subscription.status === 'active') {
    return {
      success: true,
      remainingCredits: -1, // unlimited
    };
  }

  const remainingCredits = subscription.credits - subscription.usedCredits;

  if (remainingCredits <= 0) {
    return {
      success: false,
      remainingCredits: 0,
      error: 'No credits remaining',
    };
  }

  if (!supabase) {
    // Fallback for development
    return {
      success: true,
      remainingCredits: remainingCredits - 1,
    };
  }

  // Increment used credits
  const { error } = await supabase
    .from('users')
    .update({
      used_credits: subscription.usedCredits + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error consuming credit:', error);
    return {
      success: false,
      remainingCredits,
      error: 'Failed to update credits',
    };
  }

  // Log the analysis
  await supabase.from('analyses').insert({
    user_id: userId,
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    remainingCredits: remainingCredits - 1,
  };
}

// Update user subscription after successful payment
export async function updateUserSubscription({
  userId,
  email,
  planId,
  stripeCustomerId,
  stripeSubscriptionId,
  status,
  currentPeriodStart,
  currentPeriodEnd,
}: {
  userId: string;
  email: string;
  planId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping subscription update');
    return false;
  }

  const tier = PRICING_TIERS[planId.toUpperCase() as keyof typeof PRICING_TIERS];
  const credits = tier?.credits || 0;

  const { error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email,
      plan_id: planId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      credits,
      used_credits: 0, // Reset used credits on new subscription
      subscription_status: status,
      current_period_start: currentPeriodStart?.toISOString(),
      current_period_end: currentPeriodEnd?.toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    });

  if (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }

  return true;
}

// Add credits to user account (for one-time purchases)
export async function addCredits(userId: string, credits: number): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping credit addition');
    return false;
  }

  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  const { error } = await supabase
    .from('users')
    .update({
      credits: subscription.credits + credits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error adding credits:', error);
    return false;
  }

  return true;
}

// Reset usage for subscription renewal
export async function resetMonthlyUsage(userId: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('users')
    .update({
      used_credits: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error resetting monthly usage:', error);
    return false;
  }

  return true;
}

// Cancel user subscription
export async function cancelUserSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const updates: Record<string, any> = {
    cancel_at_period_end: cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  };

  if (!cancelAtPeriodEnd) {
    updates.subscription_status = 'cancelled';
    updates.plan_id = 'free';
    updates.credits = PRICING_TIERS.FREE.credits;
    updates.used_credits = 0;
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }

  return true;
}

// Get subscription stats for a user
export async function getUserSubscriptionStats(userId: string) {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return null;
  }

  const remainingCredits = subscription.credits - subscription.usedCredits;
  const isUnlimited = isUnlimitedTier(subscription.planId) && subscription.status === 'active';
  const usagePercentage = isUnlimited
    ? 0
    : Math.round((subscription.usedCredits / subscription.credits) * 100);

  return {
    planId: subscription.planId,
    planName: PRICING_TIERS[subscription.planId.toUpperCase() as keyof typeof PRICING_TIERS]?.name || 'Unknown',
    status: subscription.status,
    totalCredits: isUnlimited ? 'Unlimited' : subscription.credits,
    usedCredits: subscription.usedCredits,
    remainingCredits: isUnlimited ? 'Unlimited' : remainingCredits,
    usagePercentage,
    isUnlimited,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}
