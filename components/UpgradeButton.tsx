'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import { purchasePlan } from '@/lib/stripe-client';
import Link from 'next/link';

interface UpgradeButtonProps {
  planId?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showIcon?: boolean;
  className?: string;
}

export default function UpgradeButton({
  planId = 'pro',
  variant = 'primary',
  size = 'md',
  text = 'Upgrade to Pro',
  showIcon = true,
  className = '',
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      await purchasePlan(planId);
    } catch (error) {
      console.error('Upgrade failed:', error);
      setIsLoading(false);
    }
  };

  // If no specific plan, link to pricing page
  if (!planId) {
    return (
      <Link
        href="/pricing"
        className={`inline-flex items-center justify-center space-x-2 font-semibold rounded-lg transition-all ${getSizeClasses(
          size
        )} ${getVariantClasses(variant)} ${className}`}
      >
        {showIcon && <Zap className={getIconSize(size)} />}
        <span>{text}</span>
        <ArrowRight className={getIconSize(size)} />
      </Link>
    );
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={isLoading}
      className={`inline-flex items-center justify-center space-x-2 font-semibold rounded-lg transition-all ${getSizeClasses(
        size
      )} ${getVariantClasses(variant)} ${
        isLoading ? 'opacity-75 cursor-wait' : ''
      } ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className={`${getIconSize(size)} animate-spin`} />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {showIcon && <Zap className={getIconSize(size)} />}
          <span>{text}</span>
          <ArrowRight className={getIconSize(size)} />
        </>
      )}
    </button>
  );
}

function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'px-4 py-2 text-sm';
    case 'lg':
      return 'px-8 py-4 text-lg';
    case 'md':
    default:
      return 'px-6 py-3 text-base';
  }
}

function getVariantClasses(variant: 'primary' | 'secondary' | 'minimal'): string {
  switch (variant) {
    case 'primary':
      return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl';
    case 'secondary':
      return 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50';
    case 'minimal':
      return 'text-blue-600 hover:text-blue-700 underline underline-offset-4';
  }
}

function getIconSize(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'w-4 h-4';
    case 'lg':
      return 'w-6 h-6';
    case 'md':
    default:
      return 'w-5 h-5';
  }
}
