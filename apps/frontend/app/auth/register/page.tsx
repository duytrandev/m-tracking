'use client'

import { useTranslations } from 'next-intl'
import { AuthCard } from '@/features/auth/components/auth-card'
import { RegisterForm } from '@/features/auth/components/register-form'

export default function RegisterPage() {
  const t = useTranslations('auth.signup')

  return (
    <AuthCard title={t('title')} description={t('subtitle')}>
      <RegisterForm />
    </AuthCard>
  )
}
