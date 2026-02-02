'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { FlexibleAuthRoute } from '@/components/auth/flexible-auth-route'
import { MotionProvider } from '@/components/providers/motion-provider'
import { AuthCard } from '@/features/auth/components/auth-card'
import { RegisterForm } from '@/features/auth/components/register-form'

export default function RegisterPage() {
  const t = useTranslations('auth.signup')
  const searchParams = useSearchParams()
  const isSetPasswordMode = searchParams.get('mode') === 'set-password'

  return (
    <FlexibleAuthRoute>
      {({ isOAuthUser }) => {
        // OAuth users adding password see different content
        const showAddPasswordMode = isOAuthUser || isSetPasswordMode
        const title = showAddPasswordMode ? t('addPassword.title') : t('title')
        const description = showAddPasswordMode
          ? t('addPassword.subtitle')
          : t('subtitle')

        return (
          <MotionProvider>
            <AuthCard title={title} description={description}>
              <RegisterForm
                isSetPasswordMode={isSetPasswordMode}
                isOAuthUserAddingPassword={isOAuthUser}
              />
            </AuthCard>
          </MotionProvider>
        )
      }}
    </FlexibleAuthRoute>
  )
}
