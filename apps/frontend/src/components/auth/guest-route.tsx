'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { FullPageLoader } from '@/components/ui/loading-spinner'
import { getRedirectUrl } from '@/lib/redirect-utils'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface GuestRouteProps {
  children: ReactNode
  /** Where to redirect authenticated users (default: /dashboard) */
  redirectTo?: string
}

/**
 * GuestRoute component
 * For pages that should only be accessible to unauthenticated users
 * (e.g., login, register)
 */
export function GuestRoute({
  children,
  redirectTo = '/dashboard',
}: GuestRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Check for redirect param from previous attempt (validated for security)
      const destination = getRedirectUrl(searchParams, redirectTo)
      router.replace(destination)
    }
  }, [isLoading, isAuthenticated, router, redirectTo, searchParams])

  // Show loading while checking auth
  if (isLoading) {
    return <FullPageLoader text="Loading..." />
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return <FullPageLoader text="Redirecting..." />
  }

  return <>{children}</>
}
