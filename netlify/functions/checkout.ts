import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

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

  const { price_id } = JSON.parse(event.body || '{}')
  if (!price_id) return cors({ error: 'price_id required' }, 400)

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  const origin = event.headers.origin || `https://${event.headers.host}`

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{ price: price_id, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/pricing`,
    metadata: { user_id: user.id },
  })

  return cors({ url: session.url })
}
