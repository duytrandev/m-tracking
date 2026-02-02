import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import type { AuthResponse } from '@/types/api/auth'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseOtpVerifyReturn {
  verifyOtp: (code: string) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  attemptsRemaining: number | null
  clearError: () => void
}

export function useOtpVerify(phone: string): UseOtpVerifyReturn {
  const router = useRouter()
  const { login } = useAuthStore()
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(
    null
  )

  const mutation = useMutation({
    mutationFn: (code: string) => authApi.verifyOtp(phone, code),
    onSuccess: (data: AuthResponse) => {
      if (data.user) {
        login(data.user)
        router.push('/dashboard')
      }
    },
    onError: error => {
      if (isApiError(error) && error.response?.data) {
        const remaining = (
          error.response.data as { attemptsRemaining?: number }
        ).attemptsRemaining
        if (typeof remaining === 'number') {
          setAttemptsRemaining(remaining)
        }
      }
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage = mutation.error.response?.data?.message || 'Invalid code'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    verifyOtp: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    attemptsRemaining,
    clearError: mutation.reset,
  }
}
