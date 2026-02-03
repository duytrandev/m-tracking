import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import type { AuthResponse } from '@/types/api/auth'
import type { AuthFailureInfo } from '@m-tracking/shared'
import { useAuthMutation } from './use-auth-mutation'

interface UseMagicLinkVerifyReturn {
  verifyMagicLink: (token: string) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useMagicLinkVerify(): UseMagicLinkVerifyReturn {
  const router = useRouter()
  const { login } = useAuthStore()

  const mutation = useAuthMutation<AuthResponse, string>(
    {
      mutationFn: authApi.verifyMagicLink,
      onSuccess: (data: AuthResponse) => {
        if (data.user) {
          login(data.user)
          router.push('/dashboard')
        }
      },
    },
    'Invalid or expired magic link'
  )

  return {
    verifyMagicLink: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    clearError: mutation.reset,
  }
}
