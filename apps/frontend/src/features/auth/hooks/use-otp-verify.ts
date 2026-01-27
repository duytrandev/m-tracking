import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'
import type { AuthResponse } from '@/types/api/auth'

interface UseOtpVerifyReturn {
  verifyOtp: (code: string) => void
  isLoading: boolean
  error: string | null
  attemptsRemaining: number | null
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

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error = mutation.error.response?.data?.message || 'Invalid code'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    verifyOtp: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    attemptsRemaining,
  }
}
