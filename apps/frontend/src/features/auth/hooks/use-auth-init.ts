import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/auth-store'
import { authApi } from '../api/auth-api'
import { AuthErrorCode } from '@m-tracking/shared'

const INIT_TIMEOUT_MS = 10000 // 10 seconds timeout

interface UseAuthInitReturn {
  isInitializing: boolean
  error: string | null
  errorCode: string | null
  retry: () => void
}

/**
 * Hook to initialize auth state on app load
 * Attempts to refresh token and restore session
 *
 * Flow:
 * 1. Check if we have persisted user in sessionStorage
 * 2. Call /auth/refresh to validate refresh token cookie
 * 3. If successful, fetch fresh user data and update store
 * 4. If failed, clear auth state (user needs to login)
 *
 * IMPORTANT: Does NOT silently swallow errors - surfaces them to UI
 */
export function useAuthInit(): UseAuthInitReturn {
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const { user, setUser, logout, setLoading } = useAuthStore()

  const initializeAuth = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setLoading(true)
      setError(null)
      setErrorCode(null)

      try {
        // If we have persisted user data, try to restore session
        if (user) {
          // Attempt to refresh token (cookie should still be valid)
          const refreshResult = await authApi.refresh()

          if (refreshResult?.accessToken) {
            // Token refreshed, fetch fresh user data
            const freshUser = await authApi.getCurrentUser()
            if (!signal?.aborted) {
              setUser(freshUser)
            }
          } else {
            // Refresh failed, clear session
            if (!signal?.aborted) {
              logout()
            }
          }
        } else {
          // No persisted user, try refresh anyway (maybe returning user)
          const refreshResult = await authApi.refresh()

          if (refreshResult?.accessToken) {
            const freshUser = await authApi.getCurrentUser()
            if (!signal?.aborted) {
              setUser(freshUser)
            }
          }
        }
      } catch (err) {
        if (signal?.aborted) return

        const errWithCode = err as Error & { code?: string }
        const code = errWithCode.code || null

        // For expected auth errors (token expired, etc), just clear auth
        const expectedAuthErrors: string[] = [
          AuthErrorCode.TOKEN_EXPIRED,
          AuthErrorCode.SESSION_EXPIRED,
          AuthErrorCode.INVALID_TOKEN,
          AuthErrorCode.REFRESH_TOKEN_MISSING,
        ]

        if (code && expectedAuthErrors.includes(code)) {
          // Expected error - just log out, no need to show error
          logout()
        } else {
          // Unexpected error - show to user so they know something went wrong
          logout()
          setError(errWithCode.message || 'Failed to initialize authentication')
          setErrorCode(code)
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
          setIsInitializing(false)
        }
      }
    },
    [user, setUser, logout, setLoading]
  )

  useEffect(() => {
    const controller = new AbortController()

    // Set timeout for init
    const timeoutId = setTimeout(() => {
      controller.abort()
      setError('Connection timed out. Please refresh the page.')
      setIsInitializing(false)
      setLoading(false)
    }, INIT_TIMEOUT_MS)

    void initializeAuth(controller.signal).finally(() => {
      clearTimeout(timeoutId)
    })

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const retry = useCallback(() => {
    setIsInitializing(true)
    setError(null)
    setErrorCode(null)
    void initializeAuth()
  }, [initializeAuth])

  return { isInitializing, error, errorCode, retry }
}
