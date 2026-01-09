import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlipFlow - AI-Powered Digital Business Intelligence',
  description: 'Find, analyze, and profit from undervalued digital businesses using AI. Automated deal finding, instant analysis, and arbitrage opportunities.',
  keywords: ['flippa', 'digital business', 'AI analysis', 'business valuation', 'deal finding', 'arbitrage'],
  authors: [{ name: 'FlipFlow' }],
  openGraph: {
    title: 'FlipFlow - AI-Powered Digital Business Intelligence',
    description: 'Find undervalued digital businesses before everyone else with AI-powered analysis',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
