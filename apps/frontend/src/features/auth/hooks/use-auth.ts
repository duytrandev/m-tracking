'use client'

import { useAuthStore, User } from '../store/auth-store'
import { useLogout } from './use-logout'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
  isLoggingOut: boolean
}

/**
 * Convenience hook for common auth operations
 * Combines auth store state with logout functionality
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, logout } = useAuth()
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { logout, isLoading: isLoggingOut } = useLogout()

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    isLoggingOut,
  }
}
