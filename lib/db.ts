import { supabase, getServiceSupabase } from './supabase';
import type {
  User,
  UserInsert,
  Listing,
  ListingInsert,
  Analysis,
  AnalysisInsert,
  Alert,
  AlertInsert,
  ListingWithAnalysis,
  ListingFilters,
  AnalysisData,
} from './types';

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get or create user by email (typically from auth)
 */
export async function getOrCreateUser(email: string, name?: string): Promise<User> {
  const client = getServiceSupabase();

  // Check if user exists
  const { data: existingUser, error: fetchError } = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser && !fetchError) {
    return existingUser;
  }

  // Create new user
  const userData: UserInsert = {
    email,
    name: name || null,
    subscription_tier: 'free',
    subscription_status: 'active',
    analysis_credits: 3, // Free tier gets 3 analyses
  };

  const { data: newUser, error: insertError } = await client
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create user: ${insertError.message}`);
  }

  return newUser;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Update user's analysis credits
 */
export async function updateUserCredits(
  userId: string,
  credits: number
): Promise<void> {
  const client = getServiceSupabase();

  const { error } = await client
    .from('users')
    .update({ analysis_credits: credits, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user credits: ${error.message}`);
  }
}

/**
 * Decrement user's analysis credits (for usage tracking)
 */
export async function decrementUserCredits(userId: string): Promise<number> {
  const client = getServiceSupabase();

  // Get current credits
  const { data: user, error: fetchError } = await client
    .from('users')
    .select('analysis_credits')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    throw new Error('User not found');
  }

  const newCredits = Math.max(0, user.analysis_credits - 1);

  // Update credits
  const { error: updateError } = await client
    .from('users')
    .update({
      analysis_credits: newCredits,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to decrement credits: ${updateError.message}`);
  }

  return newCredits;
}

// ============================================
// LISTING OPERATIONS
// ============================================

/**
 * Save or update a scraped listing
 */
export async function saveListing(listingData: ListingInsert): Promise<Listing> {
  const client = getServiceSupabase();

  // Try to update existing listing first (by URL)
  const { data: existing } = await client
    .from('listings')
    .select('id')
    .eq('url', listingData.url)
    .single();

  if (existing) {
    // Update existing listing
    const { data, error } = await client
      .from('listings')
      .update(listingData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update listing: ${error.message}`);
    }

    return data;
  }

  // Insert new listing
  const { data, error } = await client
    .from('listings')
    .insert(listingData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save listing: ${error.message}`);
  }

  return data;
}

/**
 * Get listing by URL
 */
export async function getListingByUrl(url: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('url', url)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get listing by Flippa ID
 */
export async function getListingByFlippaId(flippaId: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('flippa_id', flippaId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Query listings with filters
 */
export async function getListings(
  filters: ListingFilters = {}
): Promise<ListingWithAnalysis[]> {
  let query = supabase
    .from('listings')
    .select(`
      *,
      analyses(*)
    `)
    .eq('listing_status', 'active')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.max_price) {
    query = query.lte('asking_price', filters.max_price);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  // Apply pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch listings: ${error.message}`);
  }

  // Filter by score if specified (post-query filter since it's in analyses table)
  let results = data as any[];

  if (filters.min_score) {
    results = results.filter(
      (listing) =>
        listing.analyses &&
        listing.analyses.length > 0 &&
        listing.analyses[0].score >= filters.min_score!
    );
  }

  if (filters.deal_quality) {
    results = results.filter(
      (listing) =>
        listing.analyses &&
        listing.analyses.length > 0 &&
        listing.analyses[0].deal_quality === filters.deal_quality
    );
  }

  // Transform the data to match our type
  return results.map((listing) => ({
    ...listing,
    analysis: listing.analyses && listing.analyses.length > 0
      ? listing.analyses[0]
      : undefined,
  }));
}

// ============================================
// ANALYSIS OPERATIONS
// ============================================

/**
 * Save AI analysis results to database
 */
export async function saveAnalysis(
  userId: string,
  listingUrl: string,
  analysisData: AnalysisData
): Promise<Analysis> {
  const client = getServiceSupabase();

  // First, ensure we have a listing record
  let listing = await getListingByUrl(listingUrl);

  if (!listing) {
    // Extract Flippa ID from URL
    const flippaIdMatch = listingUrl.match(/flippa\.com\/.*?([a-zA-Z0-9-]+)$/);
    const flippaId = flippaIdMatch ? flippaIdMatch[1] : listingUrl;

    // Create minimal listing record
    listing = await saveListing({
      flippa_id: flippaId,
      url: listingUrl,
      title: 'Untitled Listing', // Will be updated later
      asking_price: analysisData.valuation?.asking || null,
      monthly_revenue: analysisData.financials?.revenue || null,
      monthly_profit: analysisData.financials?.profit || null,
    });
  }

  // Create analysis record
  const analysisInsert: AnalysisInsert = {
    listing_id: listing.id,
    score: analysisData.score,
    deal_quality: analysisData.dealQuality,
    recommendation: JSON.stringify(analysisData.recommendation),
    summary: analysisData.summary,
  };

  const { data, error } = await client
    .from('analyses')
    .insert(analysisInsert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`);
  }

  return data;
}

/**
 * Get user's analysis history
 */
export async function getAnalyses(userId: string): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select(`
      *,
      listings(*)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch analyses: ${error.message}`);
  }

  return data || [];
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(analysisId: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select(`
      *,
      listings(*)
    `)
    .eq('id', analysisId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get latest analysis for a listing
 */
export async function getLatestAnalysisForListing(
  listingId: string
): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// ============================================
// ALERT OPERATIONS
// ============================================

/**
 * Create a new alert for a user
 */
export async function createAlert(
  userId: string,
  alertData: Omit<AlertInsert, 'user_id'>
): Promise<Alert> {
  const client = getServiceSupabase();

  const { data, error } = await client
    .from('alerts')
    .insert({
      ...alertData,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create alert: ${error.message}`);
  }

  return data;
}

/**
 * Get user's active alerts
 */
export async function getAlerts(userId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch alerts: ${error.message}`);
  }

  return data || [];
}

/**
 * Update alert
 */
export async function updateAlert(
  alertId: string,
  updates: Partial<AlertInsert>
): Promise<Alert> {
  const client = getServiceSupabase();

  const { data, error } = await client
    .from('alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update alert: ${error.message}`);
  }

  return data;
}

/**
 * Delete (deactivate) alert
 */
export async function deleteAlert(alertId: string): Promise<void> {
  const client = getServiceSupabase();

  const { error } = await client
    .from('alerts')
    .update({ is_active: false })
    .eq('id', alertId);

  if (error) {
    throw new Error(`Failed to delete alert: ${error.message}`);
  }
}

/**
 * Get all active alerts (for system-wide alert checking)
 */
export async function getAllActiveAlerts(): Promise<Alert[]> {
  const client = getServiceSupabase();

  const { data, error } = await client
    .from('alerts')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch active alerts: ${error.message}`);
  }

  return data || [];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user has available analysis credits
 */
export async function hasAnalysisCredits(userId: string): Promise<boolean> {
  const user = await getUserById(userId);

  if (!user) {
    return false;
  }

  // Unlimited plans have -1 credits
  if (user.analysis_credits === -1) {
    return true;
  }

  return user.analysis_credits > 0;
}

/**
 * Get user's remaining credits
 */
export async function getRemainingCredits(userId: string): Promise<number> {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  return user.analysis_credits;
}
