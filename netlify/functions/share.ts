import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const cors = (body: object, status = 200) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' },
  body: JSON.stringify(body),
})

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }, body: '' }

  // GET — fetch shared report by token
  if (event.httpMethod === 'GET') {
    const token = new URLSearchParams(event.rawQuery || '').get('token')
    if (!token) return cors({ error: 'Token required' }, 400)
    const admin = createClient(url, serviceKey)
    const { data: share } = await admin.from('shared_reports').select('*, analyses(*)').eq('token', token).gt('expires_at', new Date().toISOString()).single()
    if (!share) return cors({ error: 'Report not found or expired' }, 404)
    const analysis = share.analyses as any
    await admin.from('shared_reports').update({ view_count: (share.view_count || 0) + 1 }).eq('id', share.id)
    return cors({ analysis: analysis.raw_listing_data, created_at: share.created_at, expires_at: share.expires_at })
  }

  // POST — create share link
  if (event.httpMethod === 'POST') {
    const authHeader = event.headers.authorization || event.headers.Authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return cors({ error: 'Unauthorized' }, 401)

    const userSupabase = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) return cors({ error: 'Unauthorized' }, 401)

    const { analysis_id } = JSON.parse(event.body || '{}')
    if (!analysis_id) return cors({ error: 'analysis_id required' }, 400)

    const admin = createClient(url, serviceKey)
    const { data: analysis } = await admin.from('analyses').select('id').eq('id', analysis_id).eq('user_id', user.id).single()
    if (!analysis) return cors({ error: 'Not found' }, 404)

    const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await admin.from('shared_reports').insert({ analysis_id, user_id: user.id, token: shareToken, expires_at: expiresAt })

    return cors({ token: shareToken, url: `/report?t=${shareToken}` })
  }

  return cors({ error: 'Method not allowed' }, 405)
}
