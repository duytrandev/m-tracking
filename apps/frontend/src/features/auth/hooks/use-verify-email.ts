import { authApi } from '../api/auth-api'
import type { MessageResponse } from '@/types/api/auth'
import type { AuthFailureInfo } from '@m-tracking/shared'
import { useAuthMutation } from './use-auth-mutation'

interface UseVerifyEmailReturn {
  verifyEmail: (token: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useVerifyEmail(): UseVerifyEmailReturn {
  const mutation = useAuthMutation<MessageResponse, string>(
    {
      mutationFn: (token: string) => authApi.verifyEmail({ token }),
    },
    'Email verification failed'
  )

  return {
    verifyEmail: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    clearError: mutation.reset,
  }
}
