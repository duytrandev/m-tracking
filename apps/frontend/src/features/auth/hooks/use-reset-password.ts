import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import type { ResetPasswordRequest } from '@/types/api/auth'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseResetPasswordReturn {
  resetPassword: (data: Omit<ResetPasswordRequest, 'token'>) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useResetPassword(token: string): UseResetPasswordReturn {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (data: Omit<ResetPasswordRequest, 'token'>) =>
      authApi.resetPassword({ ...data, token }),
    onSuccess: () => {
      router.push(
        '/auth/login?message=Password+reset+successfully.+Please+log+in.'
      )
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message || 'Failed to reset password'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    resetPassword: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    clearError: mutation.reset,
  }
}
