import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import type { ResetPasswordRequest, MessageResponse } from '@/types/api/auth'
import type { AuthFailureInfo } from '@m-tracking/shared'
import { useAuthMutation } from './use-auth-mutation'

interface UseResetPasswordReturn {
  resetPassword: (data: Omit<ResetPasswordRequest, 'token'>) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useResetPassword(token: string): UseResetPasswordReturn {
  const router = useRouter()

  const mutation = useAuthMutation<
    MessageResponse,
    Omit<ResetPasswordRequest, 'token'>
  >(
    {
      mutationFn: (data: Omit<ResetPasswordRequest, 'token'>) =>
        authApi.resetPassword({ ...data, token }),
      onSuccess: () => {
        router.push(
          '/auth/login?message=Password+reset+successfully.+Please+log+in.'
        )
      },
    },
    'Failed to reset password'
  )

  return {
    resetPassword: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    clearError: mutation.reset,
  }
}
