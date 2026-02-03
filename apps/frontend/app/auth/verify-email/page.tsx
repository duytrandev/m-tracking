'use client'

import { Suspense, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { useVerifyEmail } from '@/features/auth/hooks/use-verify-email'
import { useResendVerification } from '@/features/auth/hooks/use-resend-verification'

function VerifyEmailContent() {
  const t = useTranslations('auth.verifyEmail')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const email = searchParams.get('email') || 'your@email.com'

  const { verifyEmail, isLoading, isSuccess, error } = useVerifyEmail()
  const {
    resendVerification,
    isLoading: isResending,
    countdown,
    canResend,
  } = useResendVerification()

  // Automatically verify token when present in URL
  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token, verifyEmail])

  const handleResend = () => {
    if (canResend && email !== 'your@email.com') {
      void resendVerification(email)
    }
  }

  // Token verification mode - show loading/success/error states
  if (token) {
    if (isLoading) {
      return (
        <AuthCard title={t('verifying') || 'Verifying Email'}>
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-muted-foreground">
              {t('verifyingMessage') || 'Verifying your email address...'}
            </p>
          </div>
        </AuthCard>
      )
    }

    if (isSuccess) {
      return (
        <AuthCard title={t('successTitle') || 'Email Verified'}>
          <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                {t('successMessage') ||
                  'Your email has been verified successfully!'}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('successDescription') ||
                  'You can now log in to your account.'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              {t('continueToLogin') || 'Continue to Login'}
            </Button>
          </div>
        </AuthCard>
      )
    }

    if (error) {
      return (
        <AuthCard title={t('errorTitle') || 'Verification Failed'}>
          <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                {t('errorMessage') || 'Email verification failed'}
              </p>
              <p className="text-sm text-muted-foreground">
                {error.message ||
                  t('errorDescription') ||
                  'The verification link may be invalid or expired.'}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToLogin') || 'Back to Login'}
              </Button>
            </div>
          </div>
        </AuthCard>
      )
    }
  }

  // No token - show instructions to check email
  return (
    <AuthCard title={t('title')}>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
          <Mail className="h-12 w-12 text-blue-600" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">{t('message')}</p>
          <p className="rounded-md bg-slate-50 px-3 py-2 font-medium text-slate-900">
            {email}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">{t('instructions')}</p>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">{t('didntReceive')}</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• {t('checkSpam')}</li>
            <li>
              •{' '}
              <button
                onClick={handleResend}
                disabled={!canResend || isResending}
                className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {isResending
                  ? t('sending') || 'Sending...'
                  : countdown > 0
                    ? t('resendAvailable', { seconds: countdown })
                    : t('resend')}
              </button>
            </li>
          </ul>
        </div>

        <Button variant="ghost" asChild className="w-full">
          <a href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToLogin')}
          </a>
        </Button>
      </div>
    </AuthCard>
  )
}

function VerifyEmailLoading() {
  return (
    <AuthCard title="Verifying...">
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </AuthCard>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
