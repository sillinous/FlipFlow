'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function CallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/dashboard'
    if (!code) { router.push('/login?error=no_code'); return }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) { setStatus('Sign in failed. Redirecting...'); setTimeout(() => router.push('/login?error=auth_failed'), 1500) }
        else { setStatus('Signed in! Redirecting...'); router.push(next) }
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-gray-400">{status}</p>
      </div>
    </div>
  )
}
