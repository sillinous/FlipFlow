import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const cors = (body: object, status = 200) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' },
  body: JSON.stringify(body),
})

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' }
  if (event.httpMethod !== 'POST') return cors({ error: 'Method not allowed' }, 405)

  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return cors({ error: 'Unauthorized' }, 401)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return cors({ error: 'Unauthorized' }, 401)

  const { analysis_ids } = JSON.parse(event.body || '{}')
  if (!Array.isArray(analysis_ids) || analysis_ids.length < 2 || analysis_ids.length > 3) return cors({ error: 'Provide 2–3 analysis IDs' }, 400)

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: analyses } = await admin.from('analyses').select('*').in('id', analysis_ids).eq('user_id', user.id)
  if (!analyses || analyses.length < 2) return cors({ error: 'Analyses not found' }, 404)

  return cors({ analyses })
}
