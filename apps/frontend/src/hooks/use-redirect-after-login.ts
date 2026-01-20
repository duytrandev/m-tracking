'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const REDIRECT_KEY = 'auth_redirect_url'
const DEFAULT_REDIRECT = '/dashboard'

interface UseRedirectAfterLoginReturn {
  saveIntendedDestination: () => void
  redirectToIntendedDestination: () => void
  clearIntendedDestination: () => void
  getRedirectFromQuery: () => string | null
}

/**
 * Hook for managing redirect after login
 * Stores intended destination and redirects after successful authentication
 */
export function useRedirectAfterLogin(): UseRedirectAfterLoginReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const saveIntendedDestination = useCallback(() => {
    // Don't save auth routes as intended destination
    if (!pathname.startsWith('/auth')) {
      const search = searchParams.toString()
      const fullPath = search ? `${pathname}?${search}` : pathname
      sessionStorage.setItem(REDIRECT_KEY, fullPath)
    }
  }, [pathname, searchParams])

  const redirectToIntendedDestination = useCallback(() => {
    const intendedUrl = sessionStorage.getItem(REDIRECT_KEY)
    sessionStorage.removeItem(REDIRECT_KEY)
    router.replace(intendedUrl || DEFAULT_REDIRECT)
  }, [router])

  const clearIntendedDestination = useCallback(() => {
    sessionStorage.removeItem(REDIRECT_KEY)
  }, [])

  const getRedirectFromQuery = useCallback(() => {
    return searchParams.get('redirect')
  }, [searchParams])

  return {
    saveIntendedDestination,
    redirectToIntendedDestination,
    clearIntendedDestination,
    getRedirectFromQuery,
  }
}

/**
 * Get stored intended destination (utility function)
 */
export function getIntendedDestination(): string {
  if (typeof window === 'undefined') return DEFAULT_REDIRECT
  return sessionStorage.getItem(REDIRECT_KEY) || DEFAULT_REDIRECT
}

/**
 * Clear stored destination (utility function)
 */
export function clearStoredDestination(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(REDIRECT_KEY)
}
