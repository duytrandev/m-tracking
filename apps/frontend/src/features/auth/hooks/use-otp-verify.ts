import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'
import type { AuthResponse } from '@/types/api/auth'
import type { AuthFailureInfo } from '@m-tracking/shared'
import { useAuthMutation } from './use-auth-mutation'

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

  const mutation = useAuthMutation<AuthResponse, string>(
    {
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
    },
    'Invalid code'
  )

  return {
    verifyOtp: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    attemptsRemaining,
    clearError: mutation.reset,
  }
}
