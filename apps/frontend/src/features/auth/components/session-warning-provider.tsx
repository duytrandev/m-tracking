'use client'

import { useEffect, useRef } from 'react'
import { onAuthEvent } from '@/lib/api-client'
import { useToastStore } from '@/components/ui/use-toast'
import { authApi } from '../api/auth-api'

/**
 * Session Warning Provider
 * Listens for session expiration events and shows warning toast
 * Allows user to extend session before it expires
 */
export function SessionWarningProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const warningShownRef = useRef(false)
  const addToast = useToastStore(state => state.addToast)

  useEffect(() => {
    // Listen for session-expired event from API client
    const unsubscribeExpired = onAuthEvent('session-expired', () => {
      addToast({
        title: 'Session expired',
        description: 'Please log in again to continue.',
        variant: 'destructive',
        duration: 10000,
      })
      warningShownRef.current = false
    })

    return () => {
      unsubscribeExpired()
    }
  }, [addToast])

  return <>{children}</>
}

/**
 * Hook to manually trigger session refresh
 * Can be called from anywhere to extend the session
 */
export function useSessionRefresh() {
  const refreshSession = async (): Promise<boolean> => {
    try {
      const result = await authApi.refresh()
      return !!result?.accessToken
    } catch {
      return false
    }
  }

  return { refreshSession }
}
