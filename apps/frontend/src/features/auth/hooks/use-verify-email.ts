import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth-api'
import { isApiError } from '@/lib/api-client'

interface UseVerifyEmailReturn {
  verifyEmail: (token: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: string | null
}

export function useVerifyEmail(): UseVerifyEmailReturn {
  const mutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail({ token }),
  })

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error =
        mutation.error.response?.data?.message || 'Email verification failed'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    verifyEmail: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
  }
}
