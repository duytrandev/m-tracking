'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'

interface UseLogoutReturn {
  logout: () => void
  isLoading: boolean
}

/**
 * Hook to handle user logout
 *
 * Flow:
 * 1. Call /auth/logout endpoint (clears refresh token cookie)
 * 2. Clear local auth state via auth store
 * 3. Clear all cached queries
 * 4. Navigate to login page
 */
export function useLogout(): UseLogoutReturn {
  const router = useRouter()
  const { logout: clearAuth } = useAuthStore()

  const mutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Always clear local state, even if API call fails
      clearAuth()
      // Navigate to login
      router.push('/auth/login')
    },
  })

  return {
    logout: () => mutation.mutate(),
    isLoading: mutation.isPending,
  }
}
