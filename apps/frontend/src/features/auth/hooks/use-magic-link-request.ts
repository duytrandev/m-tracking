import { useState } from 'react'
import { authApi } from '../api/auth-api'
import type { AuthFailureInfo } from '@m-tracking/shared'
import type { MessageResponse } from '@/types/api/auth'
import { useAuthMutation } from './use-auth-mutation'

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

  const mutation = useAuthMutation<MessageResponse, string>(
    {
      mutationFn: authApi.requestMagicLink,
      onSuccess: (_, requestEmail) => {
        setEmail(requestEmail)
      },
    },
    'Failed to send magic link'
  )

  return {
    requestMagicLink: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    email,
    clearError: mutation.reset,
  }
}
