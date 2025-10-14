'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dumbbell, Trophy, Users, BookOpen, User, Menu, X } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Dumbbell },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/leaderboards', label: 'Leaderboards', icon: Trophy },
  { href: '/rules', label: 'Rules', icon: BookOpen },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const name = session?.user?.name ?? null
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-rfl-navy text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* RFL Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-rfl-light-blue rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">RFL</h1>
                <p className="text-xs text-gray-300">Rotary Fitness League</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links (desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/dashboard'
                ? (pathname === '/dashboard' || pathname === '/')
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-rfl-coral text-white'
                      : 'text-gray-300 hover:text-white hover:bg-rfl-light-blue'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu + Mobile toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span className="text-sm">{name ?? 'Guest'}</span>
            </div>
            {/* Desktop-only auth action */}
            <div className="hidden md:block">
              {name ? (
                <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" size="sm" className="text-rfl-navy border-white hover:bg-white hover:text-rfl-navy">
                  Sign Out
                </Button>
              ) : (
                <Link href="/signin">
                  <Button variant="outline" size="sm" className="text-rfl-navy border-white hover:bg-white hover:text-rfl-navy">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
            {/* Hamburger toggle (mobile only) */}
            <button
              className="md:hidden p-2 rounded hover:bg-rfl-light-blue/30"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-64 bg-rfl-navy text-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="text-sm">{name ?? 'Guest'}</span>
              </div>
              <button className="p-2 rounded hover:bg-rfl-light-blue/30" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon
              const isActive = item.href === '/dashboard'
                ? (pathname === '/dashboard' || pathname === '/')
                : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-rfl-coral text-white'
                        : 'text-gray-300 hover:text-white hover:bg-rfl-light-blue'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="mt-auto px-4 py-3 border-t border-white/10">
              {name ? (
                <button
                  className="w-full text-left px-3 py-2 rounded-md bg-white text-rfl-navy font-medium"
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }) }}
                >
                  Sign Out
                </button>
              ) : (
                <Link href="/signin" className="block px-3 py-2 rounded-md bg-white text-rfl-navy font-medium" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
