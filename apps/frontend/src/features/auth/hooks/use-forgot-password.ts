import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import type { ForgotPasswordRequest } from '@/types/api/auth'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseForgotPasswordReturn {
  requestReset: (data: ForgotPasswordRequest) => void
  isLoading: boolean
  isSuccess: boolean
  error: AuthFailureInfo | null
  email: string | null
  clearError: () => void
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [email, setEmail] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (_, variables) => {
      setEmail(variables.email)
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message || 'Failed to send reset link'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    requestReset: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    email,
    clearError: mutation.reset,
  }
}
