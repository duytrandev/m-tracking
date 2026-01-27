import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth-store'
import { authApi } from '../api/auth-api'

interface UseAuthInitReturn {
  isInitializing: boolean
  error: Error | null
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
 */
export function useAuthInit(): UseAuthInitReturn {
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user, setUser, logout, setLoading } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      setLoading(true)

      try {
        // If we have persisted user data, try to restore session
        if (user) {
          // Attempt to refresh token (cookie should still be valid)
          const refreshResult = await authApi.refresh()

          if (refreshResult?.accessToken) {
            // Token refreshed, fetch fresh user data
            const freshUser = await authApi.getCurrentUser()
            setUser(freshUser)
          } else {
            // Refresh failed, clear session
            logout()
          }
        } else {
          // No persisted user, try refresh anyway (maybe returning user)
          const refreshResult = await authApi.refresh()

          if (refreshResult?.accessToken) {
            const freshUser = await authApi.getCurrentUser()
            setUser(freshUser)
          }
        }
      } catch (err) {
        // Auth initialization can fail silently - user will need to login
        logout()
        setError(
          err instanceof Error ? err : new Error('Auth initialization failed')
        )
      } finally {
        setLoading(false)
        setIsInitializing(false)
      }
    }

    void initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  return { isInitializing, error }
}
