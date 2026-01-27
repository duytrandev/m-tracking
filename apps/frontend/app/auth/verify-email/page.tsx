'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Mail, ArrowLeft } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function VerifyEmailPage() {
  const t = useTranslations('auth.verifyEmail')
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your@email.com'
  const [countdown, setCountdown] = useState(0)

  const handleResend = () => {
    setCountdown(60)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

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
                disabled={countdown > 0}
                className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {countdown > 0
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
