import { createClient } from './supabase'

/** Authenticated fetch — automatically includes the Supabase JWT */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''

  const base = path.startsWith('/api/')
    ? path.replace('/api/', '/.netlify/functions/')
    : path

  return fetch(base, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}
