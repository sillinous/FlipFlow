// Database Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'starter' | 'pro' | 'scout_starter' | 'scout_pro' | 'scout_enterprise';
  analyses_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  flippa_id: string;
  url: string;
  title: string;
  description?: string;
  asking_price: number;
  monthly_revenue?: number;
  monthly_profit?: number;
  monthly_traffic?: number;
  business_type?: string;
  status: 'active' | 'sold' | 'expired';
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  listing_id?: string;
  listing_url: string;
  listing_data: string;
  result: AnalysisResult;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  name: string;
  filters: AlertFilters;
  is_active: boolean;
  last_triggered?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertFilters {
  min_score?: number;
  max_price?: number;
  min_revenue?: number;
  business_types?: string[];
  keywords?: string[];
}

// Analysis Types
export interface AnalysisResult {
  score: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'pass' | 'avoid';
  key_insights: string[];
  valuation: ValuationAnalysis;
  financial_metrics: FinancialMetrics;
  risks: Risk[];
  opportunities: Opportunity[];
  summary: string;
}

export interface ValuationAnalysis {
  fair_value: number;
  value_range: {
    low: number;
    high: number;
  };
  multiple_analysis: {
    revenue_multiple: number;
    profit_multiple: number;
  };
  value_indicator: 'undervalued' | 'fair' | 'overvalued';
}

export interface FinancialMetrics {
  monthly_revenue: number;
  monthly_profit: number;
  profit_margin: number;
  revenue_multiple: number;
  profit_multiple: number;
}

export interface Risk {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
}

export interface Opportunity {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  potential_value?: number;
}

// Subscription Types
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlan =
  | 'free'
  | 'starter'
  | 'pro'
  | 'scout_starter'
  | 'scout_pro'
  | 'scout_enterprise';

export interface PricingTier {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  interval: 'one_time' | 'month' | 'year';
  features: string[];
  limits: {
    analyses_per_month: number | 'unlimited';
    alerts: number;
    scout_enabled: boolean;
  };
  popular?: boolean;
  stripe_price_id?: string;
}

// Scraper Types
export interface ScrapedListing {
  flippa_id: string;
  url: string;
  title: string;
  description: string;
  asking_price: number;
  business_type: string;
  monthly_revenue?: number;
  monthly_profit?: number;
  monthly_traffic?: number;
  age_months?: number;
  seller_info?: SellerInfo;
  images?: string[];
  raw_html?: string;
}

export interface SellerInfo {
  name?: string;
  verified: boolean;
  member_since?: string;
  listings_sold?: number;
  rating?: number;
}

export interface ScrapeJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  filters?: ScrapeFilters;
  total_pages?: number;
  pages_scraped: number;
  listings_found: number;
  errors: string[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ScrapeFilters {
  business_types?: string[];
  min_price?: number;
  max_price?: number;
  min_revenue?: number;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'revenue_desc';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Stripe-specific types
export type StripeSubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'free' | 'trialing' | 'past_due';

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
  planId: string;
  userId: string;
}

export interface StripeWebhookEvent {
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
  status: StripeSubscriptionStatus;
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
