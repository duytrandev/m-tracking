import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import type { RegisterRequest } from '@/types/api/auth'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

interface UseRegisterReturn {
  register: (data: RegisterRequest) => void
  isLoading: boolean
  error: AuthFailureInfo | null
  clearError: () => void
}

export function useRegister(): UseRegisterReturn {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (_, variables) => {
      // Navigate to verify email page with email in query
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(variables.email)}`
      )
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message || 'Registration failed'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    clearError: mutation.reset,
  }
}
