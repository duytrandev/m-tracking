'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Mail, ArrowLeft } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'

export default function ResetLinkSentPage() {
  const t = useTranslations('auth.verifyEmail')
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your@email.com'

  return (
    <AuthCard title={t('title')} showLogo>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
          <Mail className="h-12 w-12 text-blue-600" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, you'll receive a password reset link shortly.
          </p>
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">{t('didntReceive')}</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• {t('checkSpam')}</li>
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
