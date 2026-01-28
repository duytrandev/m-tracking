'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { ArrowLeft, Smartphone, AlertCircle } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CodeInput } from '@/features/auth/components/code-input'
import {
  otpRequestSchema,
  type OTPRequestInput,
} from '@/features/auth/validations/auth-schemas'
import { useOtpRequest } from '@/features/auth/hooks/use-otp-request'
import { useOtpVerify } from '@/features/auth/hooks/use-otp-verify'

type Step = 'request' | 'verify'

export default function OtpLoginPage(): React.ReactElement {
  const [step, setStep] = useState<Step>('request')
  const [code, setCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    requestOtp,
    isLoading: isRequesting,
    isSuccess: requestSuccess,
    error: requestError,
    phone,
  } = useOtpRequest()

  const {
    verifyOtp,
    isLoading: isVerifying,
    error: verifyError,
    attemptsRemaining,
  } = useOtpVerify(phone || '')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPRequestInput>({
    resolver: zodResolver(otpRequestSchema),
  })

  // Move to verify step on success
  // Note: This effect synchronously sets state, but it's intentional
  // to transition between steps based on external state changes

  useEffect(() => {
    if (requestSuccess && phone && step === 'request') {
      setStep('verify')
      setResendCooldown(60)
    }
  }, [requestSuccess, phone, step])

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      )
      return () => clearTimeout(timer)
    }
    return undefined
  }, [resendCooldown])

  const handleResend = (): void => {
    if (phone && resendCooldown === 0) {
      requestOtp(phone)
      setResendCooldown(60)
      setCode('')
    }
  }

  const handleCodeComplete = (value: string): void => {
    verifyOtp(value)
  }

  const onSubmit = (data: OTPRequestInput): void => {
    requestOtp(data.phone)
  }

  // Request Step
  if (step === 'request') {
    return (
      <AuthCard
        title="Sign in with SMS"
        description="We'll text you a code to sign in"
      >
        <form
          onSubmit={e => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-6"
        >
          {requestError && (
            <div
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {requestError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
              error={!!errors.phone}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isRequesting}
            loadingText="Sending..."
          >
            Send Code
          </Button>

          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </form>
      </AuthCard>
    )
  }

  // Verify Step
  return (
    <AuthCard title="Enter verification code">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to{' '}
            <span className="font-medium">{phone}</span>
          </p>
        </div>

        {verifyError && (
          <div
            className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div>
              {verifyError}
              {attemptsRemaining !== null && (
                <span className="block text-xs mt-1">
                  {attemptsRemaining}{' '}
                  {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                </span>
              )}
            </div>
          </div>
        )}

        <CodeInput
          value={code}
          onChange={setCode}
          onComplete={handleCodeComplete}
          disabled={isVerifying}
          error={!!verifyError}
        />

        <Button
          type="button"
          className="w-full"
          onClick={() => handleCodeComplete(code)}
          disabled={code.length !== 6}
          isLoading={isVerifying}
          loadingText="Verifying..."
        >
          Verify
        </Button>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">Did not receive a code?</p>
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend code'}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => {
            setStep('request')
            setCode('')
          }}
          className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Change phone number
        </button>
      </div>
    </AuthCard>
  )
}
