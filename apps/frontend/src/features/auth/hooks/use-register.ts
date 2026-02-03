import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import type { RegisterRequest, MessageResponse } from '@/types/api/auth'
import { type AuthFailureInfo, AuthErrorCode } from '@m-tracking/shared'
import { useAuthMutation } from './use-auth-mutation'

interface UseRegisterReturn {
  register: (data: RegisterRequest) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  clearError: () => void
  passwordSetupEmailSent: boolean
}

export function useRegister(): UseRegisterReturn {
  const router = useRouter()
  const [passwordSetupEmailSent, setPasswordSetupEmailSent] = useState(false)

  const mutation = useAuthMutation<MessageResponse, RegisterRequest>(
    {
      mutationFn: authApi.register,
      onSuccess: (response, variables) => {
        // Check if this is OAuth user needing password setup
        if (response.code === AuthErrorCode.PASSWORD_SETUP_EMAIL_SENT) {
          setPasswordSetupEmailSent(true)
          return
        }

        // Navigate to verify email page with email in query
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(variables.email)}`
        )
      },
    },
    'Registration failed'
  )

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    clearError: mutation.reset,
    passwordSetupEmailSent,
  }
}
