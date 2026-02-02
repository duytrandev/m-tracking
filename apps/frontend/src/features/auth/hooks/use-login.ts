import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import type { LoginRequest, AuthResponse } from '@/types/api/auth'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import { getRedirectUrl } from '@/lib/redirect-utils'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseLoginReturn {
  login: (data: LoginRequest) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useLogin(): UseLoginReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: setUser, setRequires2FA } = useAuthStore()

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      // Check if 2FA is required
      if (data.user?.twoFactorEnabled && !data.accessToken) {
        setRequires2FA(true, data.user.email)
        router.push('/auth/2fa-verify')
        return
      }

      // Normal login success
      if (data.user) {
        setUser(data.user)

        // Redirect to intended destination or dashboard (validated for security)
        const destination = getRedirectUrl(searchParams)
        router.push(destination)
      }
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage = mutation.error.response?.data?.message || 'Login failed'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    clearError: mutation.reset,
  }
}
