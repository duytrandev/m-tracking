import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import type { ResetPasswordRequest } from '@/types/api/auth'
import { isApiError } from '@/lib/api-client'

interface UseResetPasswordReturn {
  resetPassword: (data: Omit<ResetPasswordRequest, 'token'>) => void
  isLoading: boolean
  error: string | null
}

export function useResetPassword(token: string): UseResetPasswordReturn {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (data: Omit<ResetPasswordRequest, 'token'>) =>
      authApi.resetPassword({ ...data, token }),
    onSuccess: () => {
      router.push('/auth/login?message=Password+reset+successfully.+Please+log+in.')
    },
  })

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error = mutation.error.response?.data?.message || 'Failed to reset password'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    resetPassword: mutation.mutate,
    isLoading: mutation.isPending,
    error,
  }
}
