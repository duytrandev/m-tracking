'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { FullPageLoader } from '@/components/ui/loading-spinner'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * ProtectedRoute component
 * Redirects to login if user is not authenticated
 * Saves intended destination for post-login redirect
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
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
    return <FullPageLoader text="Loading..." />
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return <FullPageLoader text="Redirecting..." />
  }

  return <>{children}</>
}
