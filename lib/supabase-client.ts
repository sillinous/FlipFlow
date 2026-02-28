import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export const createBrowserClient = () => createSSRBrowserClient(supabaseUrl, supabaseAnonKey)
export const createClient = () => createSSRBrowserClient(supabaseUrl, supabaseAnonKey)
