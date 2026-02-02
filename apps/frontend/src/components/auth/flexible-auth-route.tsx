'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { FullPageLoader } from '@/components/ui/loading-spinner'
import { getRedirectUrl } from '@/lib/redirect-utils'
import type { ReactNode } from 'react'
import { useEffect, useState, useRef } from 'react'

// Timeout for auth check (10 seconds)
const AUTH_CHECK_TIMEOUT_MS = 10000

interface FlexibleAuthRouteProps {
  /** Render function receives isOAuthUser flag */
  children: (props: { isOAuthUser: boolean }) => ReactNode
  /** Where to redirect authenticated users WITH password (default: /dashboard) */
  redirectTo?: string
}

/**
 * FlexibleAuthRoute - allows both guests and OAuth-only users
 * - Guests: Show normal content (isOAuthUser=false)
 * - OAuth users without password: Show content with isOAuthUser=true
 * - Users with password: Redirect to dashboard
 * - Includes timeout fallback if auth check hangs
 */
export function FlexibleAuthRoute({
  children,
  redirectTo = '/dashboard',
}: FlexibleAuthRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOAuthUser, setIsOAuthUser] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Timeout fallback - if auth check takes too long, show guest view
  useEffect(() => {
    if (isLoading && !isReady) {
      timeoutRef.current = setTimeout(() => {
        setTimedOut(true)
        setIsReady(true)
      }, AUTH_CHECK_TIMEOUT_MS)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading, isReady])

  useEffect(() => {
    if (isLoading) return

    // Clear timeout since auth check completed
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (isAuthenticated && user) {
      // User has password - redirect to dashboard
      if (user.hasPassword) {
        const destination = getRedirectUrl(searchParams, redirectTo)
        router.replace(destination)
        return
      }
      // OAuth user without password - allow access
      setIsOAuthUser(true)
    }

    setIsReady(true)
  }, [isLoading, isAuthenticated, user, router, redirectTo, searchParams])

  // Show loading while checking auth (unless timed out)
  if ((isLoading || !isReady) && !timedOut) {
    return <FullPageLoader text="Loading..." />
  }

  // Authenticated with password - redirecting
  if (isAuthenticated && user?.hasPassword) {
    return <FullPageLoader text="Redirecting..." />
  }

  return <>{children({ isOAuthUser: timedOut ? false : isOAuthUser })}</>
}
