import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// POST — create a share link for an analysis
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { analysis_id } = await req.json()
  if (!analysis_id) return NextResponse.json({ error: 'analysis_id required' }, { status: 400 })

  // Verify ownership
  const { data: analysis } = await supabase
    .from('analyses').select('id').eq('id', analysis_id).eq('user_id', user.id).single()
  if (!analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Generate share token
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const { data: share, error } = await supabase.from('shared_reports').insert({
    analysis_id,
    user_id: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  }).select().single()

  if (error) {
    // If table doesn't exist yet, return a helpful error
    return NextResponse.json({ error: 'Share feature requires DB migration', token: null }, { status: 500 })
  }

  return NextResponse.json({ token, url: `/report/${token}` })
}

// GET — fetch a shared report by token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: share } = await supabase
    .from('shared_reports')
    .select(`*, analyses(*)`)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!share) return NextResponse.json({ error: 'Report not found or expired' }, { status: 404 })

  const analysis = share.analyses as any
  return NextResponse.json({
    analysis: analysis.raw_listing_data,
    created_at: share.created_at,
    expires_at: share.expires_at,
  })
}
