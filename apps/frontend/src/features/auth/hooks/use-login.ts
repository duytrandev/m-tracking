import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import type { LoginRequest, AuthResponse } from '@/types/api/auth'
import { getRedirectUrl } from '@/lib/redirect-utils'
import type { AuthFailureInfo } from '@m-tracking/shared'
import { useAuthMutation } from './use-auth-mutation'

interface UseLoginReturn {
  login: (data: LoginRequest) => void
  isLoading: boolean
  isSuccess: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useLogin(): UseLoginReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: setUser, setRequires2FA } = useAuthStore()

  const mutation = useAuthMutation<AuthResponse, LoginRequest>(
    {
      mutationFn: authApi.login,
      onSuccess: (data: AuthResponse) => {
        // Check if 2FA is required
        if (data.user?.twoFactorEnabled && !data.accessToken) {
          setRequires2FA(true, data.user.email)
          router.push('/auth/2fa-verify')
          return
        }

        // Normal login success
        if (data.user) {
          setUser(data.user)

          // Redirect to intended destination or dashboard (validated for security)
          const destination = getRedirectUrl(searchParams)
          router.push(destination)
        }
      },
    },
    'Login failed'
  )

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    clearError: mutation.reset,
  }
}
