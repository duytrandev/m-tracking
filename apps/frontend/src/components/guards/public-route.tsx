'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { FullPageLoader } from '@/components/ui/loading-spinner'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface PublicRouteProps {
  children: ReactNode
}

/**
 * PublicRoute component
 * Redirects to dashboard if user is already authenticated
 * Used for auth pages (login, register, etc.)
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Check for redirect parameter or default to dashboard
      const redirectUrl = searchParams.get('redirect') || '/dashboard'
      router.replace(redirectUrl)
    }
  }, [isLoading, isAuthenticated, searchParams, router])

  // Show loading while checking auth
  if (isLoading) {
    return <FullPageLoader text="Loading..." />
  }

  // Redirect if already authenticated (will redirect)
  if (isAuthenticated) {
    return <FullPageLoader text="Redirecting..." />
  }

  return <>{children}</>
}
