'use client';

import { useState } from 'react';
import { Check, Zap, Loader2 } from 'lucide-react';
import { purchasePlan } from '@/lib/stripe-client';

interface PricingCardProps {
  planId: string;
  name: string;
  price: number;
  period?: string;
  features: string[];
  featured?: boolean;
  comingSoon?: boolean;
  cta?: string;
  description?: string;
}

export default function PricingCard({
  planId,
  name,
  price,
  period = '',
  features,
  featured = false,
  comingSoon = false,
  cta = 'Get Started',
  description,
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (comingSoon) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await purchasePlan(planId);
    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative rounded-2xl p-8 transition-all duration-300 ${
        featured
          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105 border-2 border-transparent'
          : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg'
      } ${comingSoon ? 'opacity-75' : ''}`}
    >
      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
            Coming Soon
          </span>
        </div>
      )}

      {/* Featured Badge */}
      {featured && !comingSoon && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-1 px-4 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-bold">
            <Zap className="w-4 h-4" />
            <span>Most Popular</span>
          </div>
        </div>
      )}

      <div className="text-center">
        {/* Plan Name */}
        <h3
          className={`text-2xl font-bold mb-2 ${
            featured ? 'text-white' : 'text-gray-900'
          }`}
        >
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p
            className={`text-sm mb-4 ${
              featured ? 'text-blue-100' : 'text-gray-600'
            }`}
          >
            {description}
          </p>
        )}

        {/* Price */}
        <div className="mb-6">
          <span
            className={`text-5xl font-bold ${
              featured ? 'text-white' : 'text-gray-900'
            }`}
          >
            ${price}
          </span>
          <span
            className={`text-lg ml-1 ${
              featured ? 'text-blue-100' : 'text-gray-600'
            }`}
          >
            {period}
          </span>
        </div>

        {/* Features List */}
        <ul className="space-y-3 mb-8 text-left">
          {features.map((feature, i) => (
            <li
              key={i}
              className={`flex items-start space-x-3 ${
                featured ? 'text-white' : 'text-gray-600'
              }`}
            >
              <Check
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  featured ? 'text-blue-200' : 'text-green-500'
                }`}
              />
              <span className="text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handlePurchase}
          disabled={isLoading || comingSoon}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            comingSoon
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : featured
              ? 'bg-white text-blue-600 hover:bg-blue-50 hover:shadow-lg'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
          } ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : comingSoon ? (
            <span>Coming in Phase 2</span>
          ) : (
            <span>{cta}</span>
          )}
        </button>

        {/* Free Trial Note */}
        {price === 0 && (
          <p
            className={`text-xs mt-3 ${
              featured ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            No credit card required
          </p>
        )}
      </div>
    </div>
  );
}
