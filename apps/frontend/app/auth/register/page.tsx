'use client'

import { useTranslations } from 'next-intl'
import { GuestRoute } from '@/components/auth'
import { MotionProvider } from '@/components/providers/motion-provider'
import { AuthCard } from '@/features/auth/components/auth-card'
import { RegisterForm } from '@/features/auth/components/register-form'

export default function RegisterPage() {
  const t = useTranslations('auth.signup')

  return (
    <GuestRoute>
      <MotionProvider>
        <AuthCard title={t('title')} description={t('subtitle')}>
          <RegisterForm />
        </AuthCard>
      </MotionProvider>
    </GuestRoute>
  )
}
