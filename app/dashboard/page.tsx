'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  BarChart3,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Clock,
  DollarSign,
  Activity,
} from 'lucide-react';
import { TopDeals } from '@/components/TopDeals';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-powered deal analysis command center
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">3</span>
            </div>
            <div className="text-sm text-gray-600">Analyses Remaining</div>
            <div className="text-xs text-gray-500 mt-1">Free Plan</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">0</span>
            </div>
            <div className="text-sm text-gray-600">Total Analyses</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">$0</span>
            </div>
            <div className="text-sm text-gray-600">Avg Deal Value</div>
            <div className="text-xs text-gray-500 mt-1">Analyzed</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">0</span>
            </div>
            <div className="text-sm text-gray-600">Saved Deals</div>
            <div className="text-xs text-gray-500 mt-1">Watchlist</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/analyze"
                  className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-all group"
                >
                  <Zap className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Analyze New Deal</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Paste a Flippa URL to get instant AI insights
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>Start Analysis</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <DollarSign className="w-8 h-8 text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Upgrade Plan</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Get unlimited analyses and advanced features
                  </p>
                  <div className="flex items-center text-gray-600 text-sm font-medium">
                    <span>Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Deals Widget */}
            <TopDeals />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Email</div>
                  <div className="font-medium text-gray-900">{user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Plan</div>
                  <div className="font-medium text-gray-900">Free Trial</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Member Since</div>
                  <div className="font-medium text-gray-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 shadow-lg text-white">
              <h2 className="text-xl font-bold mb-3">Pro Tip</h2>
              <p className="text-blue-100 text-sm mb-4">
                Use FlipFlow to analyze deals before making offers. Our AI has helped investors
                avoid overpaying by an average of $12,000 per deal.
              </p>
              <Link
                href="/analyze"
                className="inline-flex items-center text-sm font-semibold hover:underline"
              >
                <span>Try it now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
