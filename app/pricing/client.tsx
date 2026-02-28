'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Try before you commit',
    features: [
      '3 analyses per month',
      'Full FlipScore™ breakdown',
      'Red flag detection',
      'Growth opportunity analysis',
      'Valuation analysis',
    ],
    limitations: [
      'No Scout Agent',
      'No email alerts',
    ],
    cta: 'Get Started Free',
    href: '/signup',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    description: 'For serious deal hunters',
    features: [
      '50 analyses per month',
      'Everything in Free',
      'Scout Agent (hourly scans)',
      'Instant email deal alerts',
      'Custom filter criteria',
      'Priority support',
    ],
    limitations: [],
    cta: 'Start Pro — $49/mo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    highlight: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 149,
    description: 'For teams and power users',
    features: [
      'Unlimited analyses',
      'Everything in Pro',
      'Multiple Scout agents',
      'API access',
      'White-label reports',
      'Dedicated support',
    ],
    limitations: [],
    cta: 'Start Agency — $149/mo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID,
    highlight: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const handleCheckout = async (planId: string, priceId: string) => {
    setLoading(planId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = `/signup?redirect=/pricing`
        return
      }

      const res = await apiFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <header className="border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center text-xs font-black">F</div>
            <span className="font-bold text-white">FlipFlow</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Sign in</Link>
            <Link href="/dashboard" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4">
            Find deals faster.{' '}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Buy smarter.
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            AI-powered deal analysis and automated scouting for digital business buyers who move fast.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 rounded-2xl border flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-blue-500/10 to-violet-500/10 border-blue-500/40 shadow-xl shadow-blue-500/10'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full text-xs font-bold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-black text-white">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-400 ml-1">/month</span>}
                {plan.price === 0 && <span className="text-gray-400 ml-1">forever</span>}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation) => (
                  <li key={limitation} className="flex items-start gap-2.5 text-sm">
                    <span className="text-gray-600 mt-0.5 shrink-0">✕</span>
                    <span className="text-gray-500">{limitation}</span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <Link
                  href={plan.href!}
                  className="block text-center py-3 px-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold rounded-xl transition-colors"
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id, plan.priceId || '')}
                  disabled={loading === plan.id}
                  className={`w-full py-3 px-6 font-semibold rounded-xl transition-all disabled:opacity-70 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg'
                      : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting...
                    </span>
                  ) : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'What is FlipScore™?',
                a: 'FlipScore™ is our proprietary AI scoring system that analyzes a Flippa listing across 5 dimensions: financials, traffic, risk, growth potential, and operational complexity. It gives you an instant 0-100 score to prioritize which deals are worth your time.'
              },
              {
                q: 'How does Scout Agent work?',
                a: 'Scout Agent runs on our servers every hour, scraping Flippa for new listings that match your custom filters. When it finds a match, it automatically runs a full FlipScore™ analysis and sends you an email alert — so you see scored deals before the competition.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel anytime from your account settings. You keep Pro access through the end of your billing period.'
              },
              {
                q: 'Is there a free trial?',
                a: 'The free plan gives you 3 full analyses per month forever. That\'s enough to validate whether FlipFlow works for you before upgrading.'
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-800 pb-6">
                <h3 className="font-semibold text-white mb-2">{q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
