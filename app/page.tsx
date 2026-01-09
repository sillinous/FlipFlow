'use client';

import { useState } from 'react';
import { ArrowRight, Zap, TrendingUp, Shield, Brain, Database, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from '@/components/UserMenu';

export default function HomePage() {
  const [url, setUrl] = useState('');

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
          <div className="flex items-center space-x-6">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              AI-Powered Business Intelligence
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Find Undervalued Digital Businesses{' '}
            <span className="gradient-text">Before Everyone Else</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stop wasting hours analyzing Flippa listings. Our AI instantly evaluates deals,
            identifies red flags, and uncovers hidden opportunities worth thousands.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/analyze"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all flex items-center space-x-2 group"
            >
              <span>Analyze Your First Deal Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-lg font-semibold text-lg hover:border-gray-400 transition-colors"
            >
              See How It Works
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>Results in 10 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">$2.3M+</div>
            <div className="text-gray-600">Listings Analyzed</div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">10 sec</div>
            <div className="text-gray-600">Average Analysis Time</div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">94%</div>
            <div className="text-gray-600">Accuracy Rate</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Make Smart Decisions
            </h2>
            <p className="text-xl text-gray-600">
              Powered by Claude AI with expertise from thousands of analyzed deals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600">
                From URL to insights in three simple steps
              </p>
            </div>

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-lg">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/analyze"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all space-x-2"
              >
                <span>Try It Now - It's Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${tier.featured ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105' : 'bg-white border-2 border-gray-200'}`}
              >
                <div className="text-center">
                  <h3 className={`text-2xl font-bold mb-2 ${tier.featured ? 'text-white' : 'text-gray-900'}`}>
                    {tier.name}
                  </h3>
                  <div className="mb-6">
                    <span className={`text-5xl font-bold ${tier.featured ? 'text-white' : 'text-gray-900'}`}>
                      ${tier.price}
                    </span>
                    <span className={tier.featured ? 'text-blue-100' : 'text-gray-600'}>
                      {tier.period}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8 text-left">
                    {tier.features.map((feature, i) => (
                      <li key={i} className={`flex items-start space-x-2 ${tier.featured ? 'text-white' : 'text-gray-600'}`}>
                        <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/analyze"
                    className={`block w-full py-3 rounded-lg font-semibold transition-colors ${
                      tier.featured
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Find Your Next Profitable Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of investors using AI to make smarter acquisition decisions
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:shadow-2xl transition-all space-x-2"
          >
            <span>Start Analyzing Free</span>
            <ArrowRight className="w-5 h-5" />
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
            <div className="text-sm">
              © 2026 FlipFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Claude AI evaluates every aspect of the business using data from thousands of successful deals',
    color: 'bg-blue-600',
  },
  {
    icon: TrendingUp,
    title: 'Valuation Engine',
    description: 'Get accurate fair value estimates and see if you\'re overpaying before making an offer',
    color: 'bg-purple-600',
  },
  {
    icon: AlertCircle,
    title: 'Risk Detection',
    description: 'Automatically identify red flags, suspicious metrics, and potential deal-breakers',
    color: 'bg-red-600',
  },
  {
    icon: Zap,
    title: 'Opportunity Scanner',
    description: 'Discover untapped revenue streams and quick wins that could 2-10x your ROI',
    color: 'bg-green-600',
  },
  {
    icon: Database,
    title: 'Market Intelligence',
    description: 'Compare against industry benchmarks and similar successful acquisitions',
    color: 'bg-yellow-600',
  },
  {
    icon: Shield,
    title: 'Due Diligence Reports',
    description: 'Professional-grade analysis reports you can trust for investment decisions',
    color: 'bg-indigo-600',
  },
];

const steps = [
  {
    title: 'Paste the Flippa URL',
    description: 'Copy any Flippa listing URL and paste it into our analyzer',
  },
  {
    title: 'AI Analyzes in Seconds',
    description: 'Our Claude AI reads the listing, checks metrics, and compares to market data',
  },
  {
    title: 'Get Actionable Insights',
    description: 'Receive a detailed report with score, valuation, risks, opportunities, and recommendation',
  },
];

const pricingTiers = [
  {
    name: 'Free Trial',
    price: 0,
    period: '/3 analyses',
    features: [
      '3 free analyses',
      'Basic AI insights',
      'Deal score 0-100',
      'Risk identification',
      'Limited opportunities',
    ],
    cta: 'Start Free',
    featured: false,
  },
  {
    name: 'Pro',
    price: 49,
    period: '/month',
    features: [
      'Unlimited analyses',
      'Advanced AI insights',
      'Full valuation reports',
      'Priority support',
      'Export PDF reports',
      'Coming: Auto deal finder',
    ],
    cta: 'Get Started',
    featured: true,
  },
  {
    name: 'Pay-as-you-go',
    price: 9.99,
    period: '/10 analyses',
    features: [
      '10 detailed analyses',
      'Never expires',
      'Full AI insights',
      'All features included',
      'No subscription',
    ],
    cta: 'Buy Credits',
    featured: false,
  },
];
