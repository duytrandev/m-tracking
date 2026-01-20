import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { isApiError } from '@/lib/api-client'

interface UseOtpRequestReturn {
  requestOtp: (phone: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: string | null
  phone: string | null
}

export function useOtpRequest(): UseOtpRequestReturn {
  const [phone, setPhone] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: authApi.requestOtp,
    onSuccess: (_, requestPhone) => {
      setPhone(requestPhone)
    },
  })

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error = mutation.error.response?.data?.message || 'Failed to send OTP'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    requestOtp: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    phone,
  }
}
