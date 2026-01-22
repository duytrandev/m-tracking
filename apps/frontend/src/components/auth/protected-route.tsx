'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { FullPageLoader } from '@/components/ui/loading-spinner'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  /** Optional fallback while loading (defaults to spinner) */
  fallback?: ReactNode
}

/**
 * ProtectedRoute component
 * Client-side auth check as fallback after middleware
 * Handles cases where cookie exists but token is invalid
 * Saves intended destination for post-login redirect
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Build redirect URL with current location
      const search = searchParams.toString()
      const fullPath = search ? `${pathname}?${search}` : pathname
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(fullPath)}`
      router.replace(loginUrl)
    }
  }, [isLoading, isAuthenticated, pathname, searchParams, router])

  // Show loading while checking auth
  if (isLoading) {
    return fallback || <FullPageLoader text="Verifying session..." />
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return fallback || <FullPageLoader text="Redirecting to login..." />
  }

  return <>{children}</>
}
