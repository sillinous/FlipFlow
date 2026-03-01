import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { analysis_id } = await req.json()
    const { data: analysis } = await supabase.from('analyses').select('id').eq('id', analysis_id).eq('user_id', user.id).single()
    if (!analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString()
    await supabase.from('shared_reports').insert({ analysis_id, user_id: user.id, token, expires_at: expiresAt })
    return NextResponse.json({ token, url: `/report/${token}` })
  } catch (e) {
    return NextResponse.json({ error: 'Share failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
    const supabase = createServerClient()
    const { data: share } = await supabase
      .from('shared_reports').select('*, analyses(*)')
      .eq('token', token).gt('expires_at', new Date().toISOString()).single()
    if (!share) return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
    return NextResponse.json({ analysis: (share.analyses as any).raw_listing_data, expires_at: share.expires_at })
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }) }
}
