import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import type { AuthResponse } from '@/types/api/auth'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseMagicLinkVerifyReturn {
  verifyMagicLink: (token: string) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useMagicLinkVerify(): UseMagicLinkVerifyReturn {
  const router = useRouter()
  const { login } = useAuthStore()

  const mutation = useMutation({
    mutationFn: authApi.verifyMagicLink,
    onSuccess: (data: AuthResponse) => {
      if (data.user) {
        login(data.user)
        router.push('/dashboard')
      }
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message ||
        'Invalid or expired magic link'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    verifyMagicLink: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    clearError: mutation.reset,
  }
}
