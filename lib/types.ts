// Database types matching supabase/schema.sql

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      listings: {
        Row: Listing;
        Insert: ListingInsert;
        Update: ListingUpdate;
      };
      analyses: {
        Row: Analysis;
        Insert: AnalysisInsert;
        Update: AnalysisUpdate;
      };
      alerts: {
        Row: Alert;
        Insert: AlertInsert;
        Update: AlertUpdate;
      };
    };
  };
}

// USER TYPES
export interface User {
  id: string;
  email: string;
  name: string | null;
  subscription_tier: string;
  subscription_status: string;
  analysis_credits: number;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id?: string;
  email: string;
  name?: string | null;
  subscription_tier?: string;
  subscription_status?: string;
  analysis_credits?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserUpdate {
  email?: string;
  name?: string | null;
  subscription_tier?: string;
  subscription_status?: string;
  analysis_credits?: number;
  updated_at?: string;
}

// LISTING TYPES
export interface Listing {
  id: string;
  flippa_id: string;
  url: string;
  title: string;
  description: string | null;
  asking_price: number | null;
  monthly_revenue: number | null;
  monthly_profit: number | null;
  category: string | null;
  listing_status: string;
  created_at: string;
}

export interface ListingInsert {
  id?: string;
  flippa_id: string;
  url: string;
  title: string;
  description?: string | null;
  asking_price?: number | null;
  monthly_revenue?: number | null;
  monthly_profit?: number | null;
  category?: string | null;
  listing_status?: string;
  created_at?: string;
}

export interface ListingUpdate {
  flippa_id?: string;
  url?: string;
  title?: string;
  description?: string | null;
  asking_price?: number | null;
  monthly_revenue?: number | null;
  monthly_profit?: number | null;
  category?: string | null;
  listing_status?: string;
}

// ANALYSIS TYPES
export interface Analysis {
  id: string;
  listing_id: string | null;
  score: number;
  deal_quality: string;
  recommendation: string;
  summary: string | null;
  created_at: string;
}

export interface AnalysisInsert {
  id?: string;
  listing_id?: string | null;
  score: number;
  deal_quality: string;
  recommendation: string;
  summary?: string | null;
  created_at?: string;
}

export interface AnalysisUpdate {
  listing_id?: string | null;
  score?: number;
  deal_quality?: string;
  recommendation?: string;
  summary?: string | null;
}

// ALERT TYPES
export interface Alert {
  id: string;
  user_id: string | null;
  name: string;
  min_score: number | null;
  max_price: number | null;
  is_active: boolean;
  created_at: string;
}

export interface AlertInsert {
  id?: string;
  user_id?: string | null;
  name: string;
  min_score?: number | null;
  max_price?: number | null;
  is_active?: boolean;
  created_at?: string;
}

export interface AlertUpdate {
  user_id?: string | null;
  name?: string;
  min_score?: number | null;
  max_price?: number | null;
  is_active?: boolean;
}

// EXTENDED TYPES FOR APPLICATION USE

// Extended listing with analysis data
export interface ListingWithAnalysis extends Listing {
  analysis?: Analysis;
}

// Filters for querying listings
export interface ListingFilters {
  min_score?: number;
  max_price?: number;
  category?: string;
  deal_quality?: string;
  limit?: number;
  offset?: number;
}

// Analysis result with full details (for saving to DB)
export interface AnalysisData {
  score: number;
  dealQuality: string;
  recommendation: {
    action: string;
    reasoning: string;
    targetPrice: number | null;
  };
  summary: string;
  valuation?: any;
  risks?: any[];
  opportunities?: any[];
  financials?: any;
  keyInsights?: string[];
}

// User subscription tiers
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

// User subscription status
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

// Deal quality levels
export type DealQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'avoid';
