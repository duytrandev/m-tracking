import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth-api'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseVerifyEmailReturn {
  verifyEmail: (token: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useVerifyEmail(): UseVerifyEmailReturn {
  const mutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail({ token }),
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message || 'Email verification failed'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    verifyEmail: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    clearError: mutation.reset,
  }
}
