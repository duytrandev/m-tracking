'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { GuestRoute } from '@/components/auth'
import { MotionProvider } from '@/components/providers/motion-provider'
import { AuthCard } from '@/features/auth/components/auth-card'
import { LoginForm } from '@/features/auth/components/login-form'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')

  return (
    <GuestRoute>
      <MotionProvider>
        <AuthCard title={t('title')} description={t('subtitle')}>
          {reason === 'session-expired' && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              Your session has expired. Please log in again.
            </div>
          )}
          <LoginForm />
        </AuthCard>
      </MotionProvider>
    </GuestRoute>
  )
}
