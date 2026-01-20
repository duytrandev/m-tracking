import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import type { ForgotPasswordRequest } from '@/types/api/auth'
import { isApiError } from '@/lib/api-client'

interface UseForgotPasswordReturn {
  requestReset: (data: ForgotPasswordRequest) => void
  isLoading: boolean
  isSuccess: boolean
  error: string | null
  email: string | null
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [email, setEmail] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (_, variables) => {
      setEmail(variables.email)
    },
  })

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error = mutation.error.response?.data?.message || 'Failed to send reset link'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    requestReset: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    email,
  }
}
