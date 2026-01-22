import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import type { LoginRequest, AuthResponse } from '@/types/api/auth'
import { isApiError } from '@/lib/api-client'
import { getRedirectUrl } from '@/lib/redirect-utils'

interface UseLoginReturn {
  login: (data: LoginRequest) => void
  isLoading: boolean
  error: string | null
}

export function useLogin(): UseLoginReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: setUser, setRequires2FA } = useAuthStore()

  const mutation = useMutation({
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
  })

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error = mutation.error.response?.data?.message || 'Login failed'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error,
  }
}
