import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'FlipFlow — AI-Powered Deal Analysis for Digital Business Acquisitions',
  description: 'Instantly analyze any Flippa listing with AI. Get FlipScores, red flag detection, and growth opportunity mapping in seconds.',
  openGraph: {
    title: 'FlipFlow',
    description: 'AI-Powered Deal Analysis for Digital Business Acquisitions',
    url: 'https://flipflow.app',
    siteName: 'FlipFlow',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen font-sans">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
