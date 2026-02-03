import { useState, useCallback, useRef, useEffect } from 'react'
import { authApi } from '../api/auth-api'

interface UseResendVerificationReturn {
  resendVerification: (email: string) => Promise<void>
  isLoading: boolean
  isSuccess: boolean
  error: string | null
  countdown: number
  canResend: boolean
}

const COOLDOWN_SECONDS = 60

export function useResendVerification(): UseResendVerificationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startCountdown = useCallback(() => {
    setCountdown(COOLDOWN_SECONDS)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const resendVerification = useCallback(
    async (email: string) => {
      if (countdown > 0) return

      setIsLoading(true)
      setError(null)
      setIsSuccess(false)

      try {
        await authApi.resendVerification(email)
        setIsSuccess(true)
        startCountdown()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to resend verification email'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [countdown, startCountdown]
  )

  return {
    resendVerification,
    isLoading,
    isSuccess,
    error,
    countdown,
    canResend: countdown === 0 && !isLoading,
  }
}
