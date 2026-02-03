import { useState } from 'react'
import { authApi } from '../api/auth-api'
import type { AuthFailureInfo } from '@m-tracking/shared'
import type { MessageResponse } from '@/types/api/auth'
import { useAuthMutation } from './use-auth-mutation'

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

  const mutation = useAuthMutation<MessageResponse, string>(
    {
      mutationFn: authApi.requestOtp,
      onSuccess: (_, requestPhone) => {
        setPhone(requestPhone)
      },
    },
    'Failed to send OTP'
  )

  return {
    requestOtp: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    phone,
    clearError: mutation.reset,
  }
}
