import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseOtpRequestReturn {
  requestOtp: (phone: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: AuthFailureInfo | null
  phone: string | null
  clearError: () => void
}

export function useOtpRequest(): UseOtpRequestReturn {
  const [phone, setPhone] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: authApi.requestOtp,
    onSuccess: (_, requestPhone) => {
      setPhone(requestPhone)
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message || 'Failed to send OTP'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    requestOtp: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    phone,
    clearError: mutation.reset,
  }
}
