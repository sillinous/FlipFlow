import { Suspense } from 'react'
import CallbackClient from './client'

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Completing sign in...</div>}>
      <CallbackClient />
    </Suspense>
  )
}
