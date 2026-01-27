'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserAccountMenu } from '@/components/layout/user-account-menu'
import { LayoutDashboard, CreditCard, PiggyBank, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * DashboardLayout component
 * Main layout for authenticated pages with sidebar navigation
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
        <div className="flex-1">
          <span className="font-semibold">M-Tracking</span>
        </div>
        <ThemeToggle variant="minimal" size="sm" />
      </header>

      <div className="flex">
        {/* Sidebar - Always Fixed */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 border-r bg-background',
            'flex flex-col',
            'transition-transform lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo - Fixed Height */}
          <div className="flex h-16 flex-shrink-0 items-center border-b px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <span className="text-xl">M-Tracking</span>
            </Link>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto space-y-1 p-4">
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Section - Fixed at Bottom */}
          <div className="flex-shrink-0 border-t p-4">
            <UserAccountMenu />
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSidebarOpen(false)
              }
            }}
            aria-label="Close sidebar"
          />
        )}

        {/* Main Content - Add left margin for fixed sidebar on desktop */}
        <main className="flex-1 p-6 lg:ml-64">{children}</main>
      </div>
    </div>
  )
}
