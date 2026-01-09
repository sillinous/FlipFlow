-- Migration: Add Stripe-related fields to users table
-- Run this in your Supabase SQL editor or via supabase db push

-- Add Stripe subscription fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- Add credits tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0;

-- Add subscription status
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);

-- Add a comment to document the schema
COMMENT ON COLUMN users.plan_id IS 'Current pricing tier: free, starter, pro, scout_starter, scout_pro';
COMMENT ON COLUMN users.credits IS 'Total analysis credits available';
COMMENT ON COLUMN users.used_credits IS 'Number of credits consumed';
COMMENT ON COLUMN users.subscription_status IS 'Stripe subscription status: free, active, cancelled, expired, trialing, past_due';
