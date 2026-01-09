'use client';

import { Zap, ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import PricingCard from '@/components/PricingCard';
import { PRICING_TIERS } from '@/lib/stripe';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PricingContent() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');
  const success = searchParams.get('success');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">FlipFlow</span>
          </Link>
          <Link
            href="/"
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </nav>

      {/* Success Message */}
      {success && (
        <div className="container mx-auto px-4 mt-8">
          <div className="max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Payment Cancelled</h3>
              <p className="text-sm text-green-700">
                Your payment was cancelled. No charges were made to your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Message */}
      {cancelled && (
        <div className="container mx-auto px-4 mt-8">
          <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <X className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Payment Cancelled</h3>
              <p className="text-sm text-yellow-700">
                Your payment was cancelled. No charges were made to your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Simple, Transparent{' '}
            <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with 3 free analyses, then choose the plan that fits your needs.
            Cancel anytime, no questions asked.
          </p>
        </div>
      </section>

      {/* Phase 1: FlipScore Analyzer Pricing */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              FlipScore Analyzer
            </h2>
            <p className="text-gray-600">
              AI-powered listing analysis and deal scoring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <PricingCard
              planId={PRICING_TIERS.FREE.id}
              name={PRICING_TIERS.FREE.name}
              price={PRICING_TIERS.FREE.price}
              period="/3 analyses"
              features={PRICING_TIERS.FREE.features}
              cta="Start Free"
              description="Perfect for trying out the platform"
            />

            <PricingCard
              planId={PRICING_TIERS.PRO.id}
              name={PRICING_TIERS.PRO.name}
              price={PRICING_TIERS.PRO.price}
              period="/month"
              features={PRICING_TIERS.PRO.features}
              featured
              cta="Get Started"
              description="Best for active investors"
            />

            <PricingCard
              planId={PRICING_TIERS.STARTER.id}
              name={PRICING_TIERS.STARTER.name}
              price={PRICING_TIERS.STARTER.price}
              period="/10 analyses"
              features={PRICING_TIERS.STARTER.features}
              cta="Buy Credits"
              description="Pay once, use anytime"
            />
          </div>
        </div>
      </section>

      {/* Phase 2: Scout Agent Pricing (Coming Soon) */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Coming in Phase 2 - February 2026
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Scout Agent
            </h2>
            <p className="text-gray-600">
              Automated 24/7 deal finding and real-time alerts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              planId={PRICING_TIERS.SCOUT_STARTER.id}
              name={PRICING_TIERS.SCOUT_STARTER.name}
              price={PRICING_TIERS.SCOUT_STARTER.price}
              period="/month"
              features={PRICING_TIERS.SCOUT_STARTER.features}
              comingSoon
              description="Automated deal discovery"
            />

            <PricingCard
              planId={PRICING_TIERS.SCOUT_PRO.id}
              name={PRICING_TIERS.SCOUT_PRO.name}
              price={PRICING_TIERS.SCOUT_PRO.price}
              period="/month"
              features={PRICING_TIERS.SCOUT_PRO.features}
              comingSoon
              description="Advanced automation & integrations"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-8">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-8 last:border-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Find Your Next Deal?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start with 3 free analyses and see how FlipFlow can help you make
            smarter investment decisions.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:shadow-2xl transition-all space-x-2"
          >
            <span>Start Analyzing Free</span>
            <Check className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FlipFlow</span>
            </div>
            <div className="text-sm">© 2026 FlipFlow. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}

const faqs = [
  {
    question: 'How do free analyses work?',
    answer:
      'Every new user gets 3 free analyses to try FlipFlow. No credit card required. After using your free analyses, you can purchase more credits or subscribe to a monthly plan.',
  },
  {
    question: 'What happens if I cancel my subscription?',
    answer:
      "You can cancel anytime from your account settings. You'll continue to have access until the end of your billing period, and we won't charge you again. No questions asked.",
  },
  {
    question: 'Do analysis credits expire?',
    answer:
      'One-time credit purchases (like the 10 analyses for $9.99) never expire! Use them at your own pace. Monthly subscriptions reset usage each billing period.',
  },
  {
    question: 'Can I upgrade or downgrade plans?',
    answer:
      'Yes! You can upgrade to a higher plan anytime. When upgrading, you\'ll be prorated for the remainder of your billing period. You can also switch between plans through your account settings.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through Stripe, our secure payment processor. We also support various local payment methods.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Absolutely. We use Stripe for payment processing, which is PCI-DSS compliant and used by millions of businesses worldwide. We never store your credit card information on our servers.',
  },
  {
    question: 'When is Phase 2 Scout Agent launching?',
    answer:
      'Scout Agent is scheduled to launch in February 2026. It will provide automated 24/7 Flippa monitoring, real-time deal alerts, and custom search filters. Sign up now to be notified when it launches!',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'We offer a 7-day money-back guarantee on all subscriptions. If you\'re not satisfied with FlipFlow, contact us within 7 days of purchase for a full refund.',
  },
];
