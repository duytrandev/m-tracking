'use client'

import type { ReactNode } from 'react'
import { AuthDecorative } from '@/features/auth/components/auth-decorative'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * AuthLayout component
 * Provides split-screen layout for authentication pages
 * Left: Beautiful gradient background with decorative elements
 * Right: Login form
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative Background (hidden on mobile) */}
      <AuthDecorative />

      {/* Right Side - Form Content */}
      <div className="flex-1 flex items-center justify-center p-4 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
