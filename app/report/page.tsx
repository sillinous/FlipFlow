import { Suspense } from 'react'
import SharedReportClient from './client'

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading...</div>}>
      <SharedReportClient />
    </Suspense>
  )
}
