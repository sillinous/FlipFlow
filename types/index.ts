// ─── Subscription ─────────────────────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'scout'

// ─── DB Tables ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  subscription_tier: SubscriptionTier
  subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  analyses_used_this_month: number
  analyses_reset_at: string
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: string
  user_id: string
  flippa_url: string
  listing_id: string
  listing_title: string | null
  listing_type: string | null
  asking_price: number | null
  monthly_revenue: number | null
  monthly_profit: number | null
  annual_revenue: number | null
  flip_score: number | null
  score_breakdown: Record<string, number> | null
  red_flags: Array<{ severity: string; title: string; description: string }> | null
  growth_opportunities: Array<{ impact: string; title: string; description: string; effort: string }> | null
  recommendation: string | null
  summary: string | null
  raw_listing_data: unknown
  created_at: string
}

export interface ScoutFilter {
  id: string
  user_id: string
  name: string
  min_score: number
  max_asking_price: number | null
  min_monthly_profit: number | null
  max_multiple: number | null
  listing_types: string[]
  keywords: string[]
  exclude_keywords: string[]
  is_active: boolean
  last_run_at: string | null
  created_at: string
}

export interface ScoutAlert {
  id: string
  user_id: string
  filter_id: string | null
  analysis_id: string
  is_read: boolean
  is_emailed: boolean
  created_at: string
}

// ─── AI Analysis (from lib/ai.ts) ────────────────────────────────────────────

export interface RedFlag {
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
}

export interface GrowthOpportunity {
  impact: 'low' | 'medium' | 'high'
  title: string
  description: string
  effort: string
}
