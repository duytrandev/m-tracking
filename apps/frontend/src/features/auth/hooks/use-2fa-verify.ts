import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'
import { getRedirectUrl } from '@/lib/redirect-utils'

interface Use2FAVerifyReturn {
  verify: (code: string) => void
  isLoading: boolean
  error: string | null
  attemptsRemaining: number | null
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
    onSuccess: (data) => {
      if (data.user) {
        login(data.user)
        setRequires2FA(false)

        // Redirect to intended destination or dashboard (validated for security)
        const destination = getRedirectUrl(searchParams)
        router.push(destination)
      }
    },
  })

  const error = mutation.error
    ? isApiError(mutation.error)
      ? mutation.error.response?.data?.message || 'Invalid verification code'
      : 'An unexpected error occurred'
    : null

  // Extract attempts remaining from error response
  const attemptsRemaining = mutation.error && isApiError(mutation.error)
    ? (mutation.error.response?.data as any)?.attemptsRemaining ?? null
    : null

  return {
    verify: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    attemptsRemaining,
  }
}
