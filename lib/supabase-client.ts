import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createBrowserClient = () =>
  createSSRBrowserClient(supabaseUrl, supabaseAnonKey)

export const createClient = () =>
  createSSRBrowserClient(supabaseUrl, supabaseAnonKey)
