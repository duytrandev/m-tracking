import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import { getRedirectUrl } from '@/lib/redirect-utils'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

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

  const mutation = useMutation({
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
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message ?? 'Invalid verification code'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  // Extract attempts remaining from error response
  const attemptsRemaining =
    mutation.error && isApiError(mutation.error)
      ? ((mutation.error.response?.data as ErrorResponse | undefined)
          ?.attemptsRemaining ?? null)
      : null

  return {
    verify: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    attemptsRemaining,
    clearError: mutation.reset,
  }
}
