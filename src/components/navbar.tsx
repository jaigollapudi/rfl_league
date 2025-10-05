'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dumbbell, Trophy, Users, BookOpen, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Dumbbell },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/leaderboards', label: 'Leaderboards', icon: Trophy },
  { href: '/rules', label: 'Rules', icon: BookOpen },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const name = session?.user?.name ?? null

  return (
    <nav className="bg-rfl-navy text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* RFL Logo/Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-rfl-light-blue rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">RFL</h1>
                <p className="text-xs text-gray-300">Rotary Fitness League</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
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

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span className="text-sm">{name ?? 'Guest'}</span>
            </div>
            {name ? (
              <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" size="sm" className="text-rfl-navy border-white hover:bg-white hover:text-rfl-navy">
                Sign Out
              </Button>
            ) : (
              <Link href="/signin" className="text-sm underline">Sign In</Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-rfl-coral text-white'
                    : 'text-gray-300 hover:text-white hover:bg-rfl-light-blue'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
