import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return 'N/A'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toFixed(0)}`
}

export function formatMultiple(price: number, monthlyProfit: number): string {
  if (!monthlyProfit || monthlyProfit <= 0) return 'N/A'
  const multiple = price / (monthlyProfit * 12)
  return `${multiple.toFixed(1)}x`
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong Buy'
  if (score >= 65) return 'Consider'
  if (score >= 50) return 'Risky'
  return 'Pass'
}

export function getLimitsForTier(tier: string) {
  switch (tier) {
    case 'pro': return { analysesPerMonth: 50, scoutFilters: 3, emailAlerts: true }
    case 'agency': return { analysesPerMonth: Infinity, scoutFilters: 20, emailAlerts: true }
    default: return { analysesPerMonth: 3, scoutFilters: 0, emailAlerts: false }
  }
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}
