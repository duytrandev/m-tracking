import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'
import { getRedirectUrl } from '@/lib/redirect-utils'
import type { AuthFailureInfo } from '@m-tracking/shared'
import type { AuthResponse } from '@/types/api/auth'
import { useAuthMutation } from './use-auth-mutation'

interface Use2FAVerifyReturn {
  verify: (code: string) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  attemptsRemaining: number | null
  clearError: () => void
}

interface ErrorResponse {
  message?: string
  attemptsRemaining?: number
}

export function use2FAVerify(): Use2FAVerifyReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, pendingEmail, setRequires2FA } = useAuthStore()

  const mutation = useAuthMutation<AuthResponse, string>(
    {
      mutationFn: (code: string) => {
        if (!pendingEmail) {
          throw new Error('No pending email for 2FA verification')
        }
        return authApi.validate2FA(code, pendingEmail)
      },
      onSuccess: data => {
        if (data.user) {
          login(data.user)
          setRequires2FA(false)

          // Redirect to intended destination or dashboard (validated for security)
          const destination = getRedirectUrl(searchParams)
          router.push(destination)
        }
      },
    },
    'Invalid verification code'
  )

  // Extract attempts remaining from error response
  const attemptsRemaining =
    mutation.rawError && isApiError(mutation.rawError)
      ? ((mutation.rawError.response?.data as ErrorResponse | undefined)
          ?.attemptsRemaining ?? null)
      : null

  return {
    verify: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    attemptsRemaining,
    clearError: mutation.reset,
  }
}
