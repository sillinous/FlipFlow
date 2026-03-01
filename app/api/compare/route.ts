import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { analysis_ids } = await req.json()
    if (!Array.isArray(analysis_ids) || analysis_ids.length < 2) {
      return NextResponse.json({ error: 'Provide 2-3 analysis IDs' }, { status: 400 })
    }
    const { data: analyses } = await supabase.from('analyses').select('*').in('id', analysis_ids).eq('user_id', user.id)
    if (!analyses || analyses.length < 2) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ analyses })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
