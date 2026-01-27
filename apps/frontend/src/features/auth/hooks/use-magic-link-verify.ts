import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'
import type { AuthResponse } from '@/types/api/auth'

interface UseMagicLinkVerifyReturn {
  verifyMagicLink: (token: string) => void
  isLoading: boolean
  error: string | null
}

export function useMagicLinkVerify(): UseMagicLinkVerifyReturn {
  const router = useRouter()
  const { login } = useAuthStore()

  const mutation = useMutation({
    mutationFn: authApi.verifyMagicLink,
    onSuccess: (data: AuthResponse) => {
      if (data.user) {
        login(data.user)
        router.push('/dashboard')
      }
    },
  })

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error =
        mutation.error.response?.data?.message ||
        'Invalid or expired magic link'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    verifyMagicLink: mutation.mutate,
    isLoading: mutation.isPending,
    error,
  }
}
