import { useState } from 'react'
import { authApi } from '../api/auth-api'
import type { ForgotPasswordRequest, MessageResponse } from '@/types/api/auth'
import type { AuthFailureInfo } from '@m-tracking/shared'
import { useAuthMutation } from './use-auth-mutation'

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

  const mutation = useAuthMutation<MessageResponse, ForgotPasswordRequest>(
    {
      mutationFn: authApi.forgotPassword,
      onSuccess: (_, variables) => {
        setEmail(variables.email)
      },
    },
    'Failed to send reset link'
  )

  return {
    requestReset: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    email,
    clearError: mutation.reset,
  }
}
