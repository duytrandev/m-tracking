import { useState, useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth-api'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

// Cooldown period matches backend throttle (5 minutes)
const COOLDOWN_MS = 5 * 60 * 1000

interface UseAddPasswordReturn {
  requestAddPassword: () => void
  isLoading: boolean
  error: AuthFailureInfo | null
  emailSent: boolean
  reset: () => void
  /** Seconds remaining in cooldown, 0 if no cooldown */
  cooldownSeconds: number
  /** True if request is on cooldown */
  isOnCooldown: boolean
}

/**
 * Hook for OAuth users to request password setup email
 * Uses the authenticated /auth/add-password/request endpoint
 * Includes client-side cooldown to prevent spam
 */
export function useAddPassword(): UseAddPasswordReturn {
  const [emailSent, setEmailSent] = useState(false)
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  // Update cooldown countdown
  useEffect(() => {
    if (!cooldownEnd) {
      setCooldownSeconds(0)
      return
    }

    const updateCooldown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((cooldownEnd - Date.now()) / 1000)
      )
      setCooldownSeconds(remaining)
      if (remaining === 0) {
        setCooldownEnd(null)
      }
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 1000)
    return () => clearInterval(interval)
  }, [cooldownEnd])

  const mutation = useMutation({
    mutationFn: authApi.requestAddPassword,
    onSuccess: () => {
      setEmailSent(true)
      setCooldownEnd(Date.now() + COOLDOWN_MS)
    },
  })

  let error: AuthFailureInfo | null = null

  if (mutation.error) {
    let errorCode: string | null = null
    let errorMessage = GENERIC_ERROR_MESSAGE

    if (isApiError(mutation.error)) {
      errorCode = getApiErrorCode(mutation.error) || null
      errorMessage =
        mutation.error.response?.data?.message || 'Failed to send setup email'
    } else if (mutation.error instanceof Error) {
      errorMessage = mutation.error.message || GENERIC_ERROR_MESSAGE
    }

    error = createAuthFailure(errorCode, errorMessage)
  }

  const requestAddPassword = useCallback(() => {
    if (cooldownSeconds > 0) return
    mutation.mutate()
  }, [mutation, cooldownSeconds])

  return {
    requestAddPassword,
    isLoading: mutation.isPending,
    error,
    emailSent,
    reset: () => {
      mutation.reset()
      setEmailSent(false)
      setCooldownEnd(null)
    },
    cooldownSeconds,
    isOnCooldown: cooldownSeconds > 0,
  }
}
