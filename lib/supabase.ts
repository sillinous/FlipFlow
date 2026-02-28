// Re-export from split files for backwards compatibility
// Client-safe exports (no next/headers dependency)
export { createBrowserClient, createClient } from './supabase-client'

// Type exports
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          subscription_tier: 'free' | 'starter' | 'pro' | 'scout'
          analyses_used: number
          analyses_limit: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
      }
      analyses: {
        Row: {
          id: string
          user_id: string
          listing_url: string
          listing_title: string
          listing_id: string
          asking_price: number
          monthly_revenue: number
          monthly_profit: number
          flip_score_overall: number
          flip_score_data: Record<string, unknown>
          red_flags: Record<string, unknown>[]
          growth_opportunities: Record<string, unknown>[]
          raw_analysis: Record<string, unknown>
          created_at: string
        }
      }
      scout_filters: {
        Row: {
          id: string
          user_id: string
          name: string
          min_score: number
          max_price: number
          min_monthly_profit: number
          max_multiple: number
          business_types: string[]
          niches: string[]
          is_active: boolean
          created_at: string
        }
      }
      scout_alerts: {
        Row: {
          id: string
          user_id: string
          filter_id: string
          listing_id: string
          listing_url: string
          listing_title: string
          asking_price: number
          monthly_profit: number
          flip_score: number
          alert_reason: string
          is_read: boolean
          created_at: string
        }
      }
    }
  }
}
