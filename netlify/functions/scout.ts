import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { fetchFlippaSearch } from '../../lib/flippa'
import { quickScoreListing } from '../../lib/ai'

const cors = (body: object, status = 200) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' },
  body: JSON.stringify(body),
})

function getUser(event: any) {
  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${token}` } } })
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' }, body: '' }

  const supabase = getUser(event)
  if (!supabase) return cors({ error: 'Unauthorized' }, 401)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return cors({ error: 'Unauthorized' }, 401)

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (event.httpMethod === 'GET') {
    const [{ data: filters }, { data: alerts }] = await Promise.all([
      admin.from('scout_filters').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      admin.from('scout_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    ])
    return cors({ filters: filters || [], alerts: alerts || [] })
  }

  if (event.httpMethod === 'POST') {
    const { data: profile } = await admin.from('profiles').select('subscription_tier').eq('id', user.id).single()
    if (!['pro', 'scout'].includes(profile?.subscription_tier || '')) return cors({ error: 'Scout Agent requires Pro plan', upgrade_required: true }, 403)

    const { action, filter } = JSON.parse(event.body || '{}')
    if (action === 'run_now') {
      const { listings } = await fetchFlippaSearch({ max_price: filter.max_asking_price, listing_type: filter.business_type, per_page: 20 })
      const results = []
      for (const listing of listings) {
        try {
          const score = await quickScoreListing(listing)
          if (score >= (filter.min_flip_score || 60)) {
            const { data: existing } = await admin.from('scout_alerts').select('id').eq('user_id', user.id).eq('listing_id', listing.id).single()
            if (!existing) {
              const alert = { user_id: user.id, filter_id: filter.id, listing_id: listing.id, listing_url: listing.url, listing_title: listing.title, asking_price: listing.asking_price, monthly_revenue: listing.monthly_revenue, monthly_profit: listing.monthly_profit, flip_score: score, is_read: false }
              await admin.from('scout_alerts').insert(alert)
              results.push(alert)
            }
          }
        } catch {}
      }
      return cors({ success: true, results })
    }
    const { data, error } = await admin.from('scout_filters').upsert({ ...filter, user_id: user.id }).select().single()
    if (error) return cors({ error: error.message }, 500)
    return cors({ success: true, filter: data })
  }

  if (event.httpMethod === 'DELETE') {
    const { filter_id } = JSON.parse(event.body || '{}')
    await admin.from('scout_filters').delete().eq('id', filter_id).eq('user_id', user.id)
    return cors({ success: true })
  }

  return cors({ error: 'Method not allowed' }, 405)
}
