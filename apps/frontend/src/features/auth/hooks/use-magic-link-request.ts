import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseMagicLinkRequestReturn {
  requestMagicLink: (email: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: AuthFailureInfo | null
  email: string | null
  clearError: () => void
}

export function useMagicLinkRequest(): UseMagicLinkRequestReturn {
  const [email, setEmail] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: authApi.requestMagicLink,
    onSuccess: (_, requestEmail) => {
      setEmail(requestEmail)
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message || 'Failed to send magic link'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    requestMagicLink: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    email,
    clearError: mutation.reset,
  }
}
