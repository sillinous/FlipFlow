import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { fetchFlippaListing } from '@/lib/flippa'
import { analyzeListingWithAI } from '@/lib/ai'

const TIER_LIMITS: Record<string, number> = {
  free: 3, starter: 25, pro: 100, scout: 9999,
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await req.json()
    const { url, guest_token } = body

    if (!url || !url.includes('flippa.com')) {
      return NextResponse.json({ error: 'Invalid Flippa URL' }, { status: 400 })
    }

    // Anonymous Guest Mode
    if (!user) {
      const used = guest_token ? await checkGuestUsage(guest_token, supabase) : false
      if (used) {
        return NextResponse.json({
          error: 'Sign up free to analyze more listings.',
          upgrade_required: true,
          guest_limit_reached: true,
        }, { status: 429 })
      }
      const listing = await fetchFlippaListing(url)
      const analysis = await analyzeListingWithAI(listing)
      const payload = buildPayload(listing, analysis)
      if (guest_token) await markGuestUsed(guest_token, supabase)
      return NextResponse.json({
        ...payload,
        is_guest: true,
        gated: { flip_plan: true, roi_scenarios: true, negotiation: true },
        analysis: { ...payload.analysis, flip_plan: null, roi_scenarios: null, negotiation: null },
        quota_remaining: 0,
      })
    }

    // Authenticated
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const tier = profile.subscription_tier || 'free'
    const limit = TIER_LIMITS[tier] ?? 3
    const used = profile.analyses_used_this_month ?? 0

    if (used >= limit) {
      return NextResponse.json({
        error: `Monthly limit reached (${limit} analyses). Upgrade to continue.`,
        upgrade_required: true,
      }, { status: 429 })
    }

    // Cache check (24h)
    const { data: cached } = await supabase
      .from('analyses').select('*').eq('flippa_url', url).eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).single()
    if (cached?.raw_listing_data) {
      const age = Date.now() - new Date(cached.created_at).getTime()
      if (age < 86400000) {
        return NextResponse.json({
          ...cached.raw_listing_data,
          cached: true,
          analysis_id: cached.id,
          quota_remaining: limit - used,
        })
      }
    }

    const listing = await fetchFlippaListing(url)
    const analysis = await analyzeListingWithAI(listing)
    const payload = buildPayload(listing, analysis)
    const hasAdvanced = ['starter', 'pro', 'scout'].includes(tier)

    const listingId = url.match(/\/(\d+)\/?$/)?.[1] || url.split('/').pop() || ''
    const { data: saved } = await supabase.from('analyses').insert({
      user_id: user.id, flippa_url: url, listing_id: listingId,
      listing_title: listing.title, listing_type: analysis.listing_type,
      asking_price: listing.asking_price, monthly_revenue: listing.monthly_revenue,
      monthly_profit: listing.monthly_profit,
      annual_revenue: listing.annual_revenue || listing.monthly_revenue * 12,
      flip_score: analysis.flip_score.overall, score_breakdown: analysis.flip_score,
      red_flags: analysis.red_flags, growth_opportunities: analysis.growth_opportunities,
      recommendation: analysis.valuation.recommendation, summary: analysis.summary,
      raw_listing_data: payload,
    }).select().single()

    await supabase.from('profiles').update({ analyses_used_this_month: used + 1 }).eq('id', user.id)

    return NextResponse.json({
      ...payload,
      analysis: {
        ...payload.analysis,
        flip_plan: hasAdvanced ? payload.analysis.flip_plan : null,
        roi_scenarios: hasAdvanced ? payload.analysis.roi_scenarios : null,
        negotiation: hasAdvanced ? payload.analysis.negotiation : null,
      },
      analysis_id: (saved as any)?.id,
      quota_remaining: limit - used - 1,
      gated: hasAdvanced ? {} : { flip_plan: true, roi_scenarios: true, negotiation: true },
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Analysis failed' }, { status: 500 })
  }
}

function buildPayload(listing: any, analysis: any) {
  return {
    listing: {
      title: listing.title, url: listing.url,
      asking_price: listing.asking_price, monthly_profit: listing.monthly_profit,
      annual_revenue: listing.annual_revenue || listing.monthly_revenue * 12,
      monthly_revenue: listing.monthly_revenue, listing_type: analysis.listing_type,
      age_months: listing.age_months, monetization: listing.monetization || [],
      niche: analysis.niche, description: listing.description || '',
    },
    analysis: {
      flip_score: analysis.flip_score.overall,
      score_breakdown: {
        financials: analysis.flip_score.financials, traffic: analysis.flip_score.traffic,
        risk: analysis.flip_score.risk, growth: analysis.flip_score.growth,
        operations: analysis.flip_score.operations,
      },
      red_flags: analysis.red_flags, growth_opportunities: analysis.growth_opportunities,
      valuation: analysis.valuation, summary: analysis.summary,
      investment_thesis: analysis.investment_thesis,
      flip_plan: analysis.flip_plan || null,
      roi_scenarios: analysis.roi_scenarios || null,
      negotiation: analysis.negotiation || null,
    }
  }
}

async function checkGuestUsage(token: string, supabase: any): Promise<boolean> {
  try {
    const { data } = await supabase.from('guest_analyses').select('id').eq('token', token).single()
    return !!data
  } catch { return false }
}

async function markGuestUsed(token: string, supabase: any): Promise<void> {
  try { await supabase.from('guest_analyses').insert({ token }) } catch {}
}
