'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { GuestRoute } from '@/components/auth'
import { MotionProvider } from '@/components/providers/motion-provider'
import { AuthCard } from '@/features/auth/components/auth-card'
import { RegisterForm } from '@/features/auth/components/register-form'

export default function RegisterPage() {
  const t = useTranslations('auth.signup')
  const searchParams = useSearchParams()
  const isSetPasswordMode = searchParams.get('mode') === 'set-password'

  // Different content for set-password mode (OAuth users setting password)
  const title = isSetPasswordMode ? 'Set Your Password' : t('title')
  const description = isSetPasswordMode
    ? 'Add a password to login with email next time'
    : t('subtitle')

  return (
    <GuestRoute>
      <MotionProvider>
        <AuthCard title={title} description={description}>
          <RegisterForm isSetPasswordMode={isSetPasswordMode} />
        </AuthCard>
      </MotionProvider>
    </GuestRoute>
  )
}
