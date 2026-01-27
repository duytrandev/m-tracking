import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { isApiError } from '@/lib/api-client'

interface UseMagicLinkRequestReturn {
  requestMagicLink: (email: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: string | null
  email: string | null
}

export function useMagicLinkRequest(): UseMagicLinkRequestReturn {
  const [email, setEmail] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: authApi.requestMagicLink,
    onSuccess: (_, requestEmail) => {
      setEmail(requestEmail)
    },
  })

  let error: string | null = null
  if (mutation.error) {
    if (isApiError(mutation.error)) {
      error =
        mutation.error.response?.data?.message || 'Failed to send magic link'
    } else {
      error = 'An unexpected error occurred'
    }
  }

  return {
    requestMagicLink: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    email,
  }
}
