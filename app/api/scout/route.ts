import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { fetchFlippaSearch } from '@/lib/flippa'
import { quickScoreListing } from '@/lib/ai'

// GET - fetch user's scout filters + recent alerts
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: filters } = await supabase
      .from('scout_filters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: alerts } = await supabase
      .from('scout_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ filters: filters || [], alerts: alerts || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch scout data' }, { status: 500 })
  }
}

// POST - create or update a scout filter
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (!profile || !['pro', 'scout'].includes(profile.subscription_tier)) {
      return NextResponse.json({
        error: 'Scout Agent requires Pro or Scout plan',
        upgrade_required: true,
      }, { status: 403 })
    }

    const body = await req.json()
    const { action, filter } = body

    if (action === 'run_now') {
      // Immediately run scout scan for this filter
      const results = await runScoutScan(filter, user.id, supabase)
      return NextResponse.json({ success: true, results })
    }

    // Save filter
    const { data, error } = await supabase
      .from('scout_filters')
      .upsert({
        ...filter,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, filter: data })

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save filter'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE - remove a scout filter
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { filter_id } = await req.json()
    await supabase
      .from('scout_filters')
      .delete()
      .eq('id', filter_id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete filter' }, { status: 500 })
  }
}

async function runScoutScan(filter: any, userId: string, supabase: any) {
  const { listings } = await fetchFlippaSearch({
    max_price: filter.max_asking_price,
    listing_type: filter.business_type,
    per_page: 20,
  })

  const results = []

  for (const listing of listings) {
    try {
      // Quick score with Haiku (cheap + fast)
      const score = await quickScoreListing(listing)

      if (score >= (filter.min_flip_score || 60)) {
        // Check if we already alerted this listing
        const { data: existing } = await supabase
          .from('scout_alerts')
          .select('id')
          .eq('user_id', userId)
          .eq('listing_id', listing.id)
          .single()

        if (!existing) {
          const alert = {
            user_id: userId,
            filter_id: filter.id,
            listing_id: listing.id,
            listing_url: listing.url,
            listing_title: listing.title,
            asking_price: listing.asking_price,
            monthly_revenue: listing.monthly_revenue,
            monthly_profit: listing.monthly_profit,
            flip_score: score,
            alert_reasons: [],
            is_read: false,
          }

          await supabase.from('scout_alerts').insert(alert)
          results.push(alert)
        }
      }
    } catch (e) {
      console.error(`Scout error for listing ${listing.id}:`, e)
    }
  }

  return results
}
