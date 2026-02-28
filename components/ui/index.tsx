import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 focus:ring-emerald-500',
      secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 focus:ring-gray-600',
      ghost: 'hover:bg-gray-800 text-gray-400 hover:text-gray-100 focus:ring-gray-700',
      danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500',
    }
    const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2',
    }
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
}

export function Card({ className, children, hover }: CardProps) {
  return (
    <div className={cn(
      'bg-gray-900 border border-gray-800 rounded-xl',
      hover && 'hover:border-gray-700 transition-colors',
      className
    )}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 py-4 border-b border-gray-800', className)}>{children}</div>
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple'

export function Badge({ variant = 'gray', children, className }: {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}) {
  const variants: Record<BadgeVariant, string> = {
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }
  return (
    <span className={cn(
      'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-gray-800 border rounded-lg text-gray-100 placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
              'text-sm py-2.5 transition-colors',
              icon ? 'pl-10 pr-3' : 'px-3',
              error ? 'border-red-500' : 'border-gray-700',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-gray-800 border rounded-lg text-gray-100 placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            'text-sm px-3 py-2.5 transition-colors resize-none',
            error ? 'border-red-500' : 'border-gray-700',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <svg
      className={cn('animate-spin text-current', sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
      <text
        x="50" y="50"
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90"
        style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}
        fill={color}
        fontSize="18"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {score}
      </text>
    </svg>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, label, className }: {
  value: number
  max?: number
  label?: string
  className?: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>{label}</span>
          <span className="font-medium text-gray-200">{Math.round(pct)}</span>
        </div>
      )}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Alert ────────────────────────────────────────────────────────────────────
type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export function Alert({ variant = 'info', title, children, className }: {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}) {
  const variants: Record<AlertVariant, string> = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    error: 'bg-red-500/10 border-red-500/20 text-red-300',
  }
  return (
    <div className={cn('rounded-lg border p-4', variants[variant], className)}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-sm opacity-90">{children}</div>
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-gray-800 my-4" />
  return (
    <div className="relative my-6">
      <hr className="border-gray-800" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="bg-gray-950 px-3 text-xs text-gray-500">{label}</span>
      </span>
    </div>
  )
}

// ─── Stat ─────────────────────────────────────────────────────────────────────
export function Stat({ label, value, sub, trend }: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-100 mt-1">{value}</p>
      {sub && (
        <p className={cn('text-xs mt-0.5', {
          'text-emerald-400': trend === 'up',
          'text-red-400': trend === 'down',
          'text-gray-500': !trend || trend === 'neutral',
        })}>
          {sub}
        </p>
      )}
    </div>
  )
}
