import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '../api/auth-api'
import type { RegisterRequest } from '@/types/api/auth'
import { isApiError } from '@/lib/api-client'

interface UseRegisterReturn {
  register: (data: RegisterRequest) => void
  isLoading: boolean
  error: string | null
}

export function useRegister(): UseRegisterReturn {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (_, variables) => {
      // Navigate to verify email page with email in query
      router.push(`/auth/verify-email?email=${encodeURIComponent(variables.email)}`)
    },
  })

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error = mutation.error.response?.data?.message || 'Registration failed'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    error,
  }
}
