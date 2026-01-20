'use client'

import { useTranslations } from 'next-intl'
import { MotionProvider } from '@/components/providers/motion-provider'
import { AuthCard } from '@/features/auth/components/auth-card'
import { LoginForm } from '@/features/auth/components/login-form'

export default function LoginPage() {
  const t = useTranslations('auth.login')

  return (
    <MotionProvider>
      <AuthCard title={t('title')} description={t('subtitle')}>
        <LoginForm />
      </AuthCard>
    </MotionProvider>
  )
}
