import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { fetchFlippaSearch } from '@/lib/flippa'
import { quickScoreListing } from '@/lib/ai'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const [{ data: filters }, { data: alerts }] = await Promise.all([
      supabase.from('scout_filters').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('scout_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ])
    return NextResponse.json({ filters: filters || [], alerts: alerts || [] })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
    if (!['pro', 'scout'].includes(profile?.subscription_tier || '')) {
      return NextResponse.json({ error: 'Scout requires Pro plan', upgrade_required: true }, { status: 403 })
    }

    const { action, filter } = await req.json()
    if (action === 'run_now') {
      const results = await runScoutScan(filter, user.id, supabase)
      return NextResponse.json({ success: true, results })
    }

    const { data, error } = await supabase.from('scout_filters')
      .upsert({ ...filter, user_id: user.id, updated_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return NextResponse.json({ success: true, filter: data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { filter_id } = await req.json()
    await supabase.from('scout_filters').delete().eq('id', filter_id).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

async function runScoutScan(filter: any, userId: string, supabase: any) {
  const { listings } = await fetchFlippaSearch({ max_price: filter.max_asking_price, per_page: 20 })
  const results = []
  for (const listing of listings) {
    try {
      const score = await quickScoreListing(listing)
      if (score >= (filter.min_flip_score || 60)) {
        const { data: existing } = await supabase.from('scout_alerts').select('id').eq('user_id', userId).eq('listing_id', listing.id).single()
        if (!existing) {
          const alert = { user_id: userId, filter_id: filter.id, listing_id: listing.id, listing_url: listing.url, listing_title: listing.title, asking_price: listing.asking_price, monthly_profit: listing.monthly_profit, flip_score: score, is_read: false }
          await supabase.from('scout_alerts').insert(alert)
          results.push(alert)
        }
      }
    } catch {}
  }
  return results
}
