'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './index'

interface NavbarProps {
  user?: { email?: string } | null
  tier?: string | null
}

export function Navbar({ user, tier }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signing, setSigning] = useState(false)

  const handleSignOut = async () => {
    setSigning(true)
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = user
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/analyze', label: 'Analyze' },
      ]
    : []

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-gray-950 font-black text-sm">F</span>
            </div>
            <span className="font-bold text-gray-100">FlipFlow</span>
            {tier && tier !== 'free' && (
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </span>
            )}
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-gray-100 bg-gray-800'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-xs text-gray-500 truncate max-w-[160px]">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut} loading={signing}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
