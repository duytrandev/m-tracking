import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'

export type SetupStep = 'qr' | 'verify' | 'backup'

interface Use2FASetupReturn {
  // State
  step: SetupStep
  qrCode: string | null
  secret: string | null
  backupCodes: string[]
  isLoading: boolean
  error: string | null

  // Actions
  startSetup: () => void
  verifyCode: (code: string) => void
  completeSetup: () => void
  goBack: () => void
  reset: () => void
  setStep: (step: SetupStep) => void
}

export function use2FASetup(): Use2FASetupReturn {
  const [step, setStep] = useState<SetupStep>('qr')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const { updateUser } = useAuthStore()

  // Enroll mutation (Step 1)
  const enrollMutation = useMutation({
    mutationFn: authApi.enroll2FA,
    onSuccess: data => {
      setQrCode(data.qrCode)
      setSecret(data.secret)
    },
  })

  // Verify mutation (Step 2)
  const verifyMutation = useMutation({
    mutationFn: authApi.verify2FASetup,
    onSuccess: async () => {
      // Fetch backup codes
      const codesResponse = await authApi.getBackupCodes()
      setBackupCodes(codesResponse.codes)
      setStep('backup')
    },
  })

  const startSetup = (): void => {
    enrollMutation.mutate()
  }

  const verifyCode = (code: string): void => {
    verifyMutation.mutate(code)
  }

  const completeSetup = (): void => {
    // Update user state to reflect 2FA enabled
    updateUser({ twoFactorEnabled: true })
  }

  const goBack = (): void => {
    if (step === 'verify') {
      setStep('qr')
    }
  }

  const reset = (): void => {
    setStep('qr')
    setQrCode(null)
    setSecret(null)
    setBackupCodes([])
    enrollMutation.reset()
    verifyMutation.reset()
  }

  const isLoading = enrollMutation.isPending || verifyMutation.isPending

  interface ErrorResponse {
    message?: string
  }

  const getErrorMessage = (): string | null => {
    const mutationError = enrollMutation.error ?? verifyMutation.error
    if (!mutationError) return null
    if (isApiError(mutationError)) {
      return (
        (mutationError.response?.data as ErrorResponse | undefined)?.message ??
        'An error occurred'
      )
    }
    return 'An unexpected error occurred'
  }

  const error = getErrorMessage()

  return {
    step,
    qrCode,
    secret,
    backupCodes,
    isLoading,
    error,
    startSetup,
    verifyCode,
    completeSetup,
    goBack,
    reset,
    setStep,
  }
}
