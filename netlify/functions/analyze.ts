import type { Handler, HandlerEvent } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { fetchFlippaListing } from '../../lib/flippa'
import { analyzeListingWithAI } from '../../lib/ai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TIER_LIMITS: Record<string, number> = { free: 3, starter: 25, pro: 100, scout: 9999 }

function cors(body: object, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' }
  if (event.httpMethod !== 'POST') return cors({ error: 'Method not allowed' }, 405)

  const { url, guest_token } = JSON.parse(event.body || '{}')
  if (!url?.includes('flippa.com')) return cors({ error: 'Invalid Flippa URL' }, 400)

  // Auth check
  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()

  // Guest mode
  if (!token) {
    const used = guest_token ? await checkGuestUsage(guest_token) : false
    if (used) return cors({ error: 'Sign up free to analyze more listings.', guest_limit_reached: true }, 429)

    const listing = await fetchFlippaListing(url)
    const analysis = await analyzeListingWithAI(listing)
    const payload = buildPayload(listing, analysis)
    if (guest_token) await markGuestUsed(guest_token)

    return cors({
      ...payload,
      is_guest: true,
      gated: { flip_plan: true, roi_scenarios: true, negotiation: true },
      analysis: { ...payload.analysis, flip_plan: null, roi_scenarios: null, negotiation: null },
      quota_remaining: 0,
    })
  }

  // Authenticated
  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) return cors({ error: 'Unauthorized' }, 401)

  const admin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return cors({ error: 'Profile not found' }, 404)

  const tier = profile.subscription_tier || 'free'
  const limit = TIER_LIMITS[tier] ?? 3
  const used = profile.analyses_used_this_month ?? 0
  if (used >= limit) return cors({ error: `Monthly limit reached (${limit}). Upgrade to continue.`, upgrade_required: true }, 429)

  // Cache check
  const { data: cached } = await admin.from('analyses').select('*').eq('flippa_url', url).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
  if (cached?.raw_listing_data) {
    const age = Date.now() - new Date(cached.created_at).getTime()
    if (age < 86400000) return cors({ ...cached.raw_listing_data, cached: true, analysis_id: cached.id, quota_remaining: limit - used })
  }

  const listing = await fetchFlippaListing(url)
  const analysis = await analyzeListingWithAI(listing)
  const payload = buildPayload(listing, analysis)
  const hasAdvanced = ['starter', 'pro', 'scout'].includes(tier)

  const listingId = url.match(/\/(\d+)\/?$/)?.[1] || url.split('/').pop() || ''
  const { data: saved } = await admin.from('analyses').insert({
    user_id: user.id, flippa_url: url, listing_id: listingId,
    listing_title: listing.title, listing_type: analysis.listing_type,
    asking_price: listing.asking_price, monthly_revenue: listing.monthly_revenue,
    monthly_profit: listing.monthly_profit, annual_revenue: listing.annual_revenue || listing.monthly_revenue * 12,
    flip_score: analysis.flip_score.overall, score_breakdown: analysis.flip_score,
    red_flags: analysis.red_flags, growth_opportunities: analysis.growth_opportunities,
    recommendation: analysis.valuation.recommendation, summary: analysis.summary,
    raw_listing_data: payload,
  }).select().single()

  await admin.from('profiles').update({ analyses_used_this_month: used + 1 }).eq('id', user.id)

  return cors({
    ...payload,
    analysis: {
      ...payload.analysis,
      flip_plan: hasAdvanced ? payload.analysis.flip_plan : null,
      roi_scenarios: hasAdvanced ? payload.analysis.roi_scenarios : null,
      negotiation: hasAdvanced ? payload.analysis.negotiation : null,
    },
    analysis_id: saved?.id,
    quota_remaining: limit - used - 1,
    gated: hasAdvanced ? {} : { flip_plan: true, roi_scenarios: true, negotiation: true },
  })
}

function buildPayload(listing: any, analysis: any) {
  return {
    listing: {
      title: listing.title, url: listing.url, asking_price: listing.asking_price,
      monthly_profit: listing.monthly_profit, monthly_revenue: listing.monthly_revenue,
      annual_revenue: listing.annual_revenue || listing.monthly_revenue * 12,
      listing_type: analysis.listing_type, age_months: listing.age_months,
      monetization: listing.monetization || [], niche: analysis.niche, description: listing.description || '',
    },
    analysis: {
      flip_score: analysis.flip_score.overall,
      score_breakdown: { financials: analysis.flip_score.financials, traffic: analysis.flip_score.traffic, risk: analysis.flip_score.risk, growth: analysis.flip_score.growth, operations: analysis.flip_score.operations },
      red_flags: analysis.red_flags, growth_opportunities: analysis.growth_opportunities,
      valuation: analysis.valuation, summary: analysis.summary, investment_thesis: analysis.investment_thesis,
      flip_plan: analysis.flip_plan || null, roi_scenarios: analysis.roi_scenarios || null, negotiation: analysis.negotiation || null,
    }
  }
}

async function checkGuestUsage(token: string): Promise<boolean> {
  try {
    const admin = createClient(supabaseUrl, supabaseServiceKey)
    const { data } = await admin.from('guest_analyses').select('id').eq('token', token).single()
    return !!data
  } catch { return false }
}

async function markGuestUsed(token: string): Promise<void> {
  try {
    const admin = createClient(supabaseUrl, supabaseServiceKey)
    await admin.from('guest_analyses').insert({ token })
  } catch {}
}
