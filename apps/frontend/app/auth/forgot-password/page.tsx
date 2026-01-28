'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/auth/validations/auth-schemas'
import { useForgotPassword } from '@/features/auth/hooks/use-forgot-password'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const router = useRouter()
  const { requestReset, isLoading, isSuccess, error, email } =
    useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  useEffect(() => {
    if (isSuccess && email) {
      router.push(
        `/auth/forgot-password/sent?email=${encodeURIComponent(email)}`
      )
    }
  }, [isSuccess, email, router])

  const onSubmit = (data: ForgotPasswordInput): void => {
    requestReset(data)
  }

  return (
    <AuthCard title={t('title')} description={t('subtitle')}>
      <form
        onSubmit={e => {
          void handleSubmit(onSubmit)(e)
        }}
        className="space-y-6"
      >
        {error && (
          <div
            className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            autoComplete="email"
            error={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p
              id="email-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          loadingText="Sending..."
        >
          {t('sendLink')}
        </Button>

        <Button variant="ghost" asChild className="w-full">
          <a href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToLogin')}
          </a>
        </Button>
      </form>
    </AuthCard>
  )
}
