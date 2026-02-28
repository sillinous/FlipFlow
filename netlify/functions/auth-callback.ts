import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  const params = new URLSearchParams(event.rawQuery || '')
  const code = params.get('code')
  const next = params.get('next') || '/dashboard'
  const origin = event.headers.origin || `https://${event.headers.host}`

  if (!code) return { statusCode: 302, headers: { Location: `${origin}/login?error=no_code` }, body: '' }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.session) throw error

    const { access_token, refresh_token, expires_in } = data.session
    const cookieOpts = `Path=/; Max-Age=${expires_in}; SameSite=Lax; Secure`

    return {
      statusCode: 302,
      headers: {
        Location: `${origin}${next}`,
        'Set-Cookie': [
          `sb-access-token=${access_token}; ${cookieOpts}`,
          `sb-refresh-token=${refresh_token}; ${cookieOpts}`,
        ].join(', '),
      },
      body: '',
    }
  } catch {
    return { statusCode: 302, headers: { Location: `${origin}/login?error=auth_failed` }, body: '' }
  }
}
