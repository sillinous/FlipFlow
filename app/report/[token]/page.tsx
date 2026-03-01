import { Suspense } from 'react'
import SharedReportClient from './client'

export default function ReportPage({ params }: { params: { token: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading report...</div>}>
      <SharedReportClient token={params.token} />
    </Suspense>
  )
}
