import { useState, useCallback, useEffect } from 'react'
import { authApi } from '../api/auth-api'
import type { AuthFailureInfo } from '@m-tracking/shared'
import type { MessageResponse } from '@/types/api/auth'
import { useAuthMutation } from './use-auth-mutation'

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

  const mutation = useAuthMutation<MessageResponse, undefined>(
    {
      mutationFn: authApi.requestAddPassword,
      onSuccess: () => {
        setEmailSent(true)
        setCooldownEnd(Date.now() + COOLDOWN_MS)
      },
    },
    'Failed to send setup email'
  )

  const requestAddPassword = useCallback(() => {
    if (cooldownSeconds > 0) return
    mutation.mutate(undefined)
  }, [mutation, cooldownSeconds])

  return {
    requestAddPassword,
    isLoading: mutation.isPending,
    error: mutation.error,
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
