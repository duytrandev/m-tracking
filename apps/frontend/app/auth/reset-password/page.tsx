'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/features/auth/components/password-input'
import { PasswordStrengthIndicator } from '@/features/auth/components/password-strength'
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/features/auth/validations/auth-schemas'
import { useResetPassword } from '@/features/auth/hooks/use-reset-password'
import { useEffect } from 'react'

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const { resetPassword, isLoading, error } = useResetPassword(token)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Note: React Hook Form's watch() function is designed to work this way
  // and cannot be memoized. This is expected behavior.

  const password = watch('password')

  useEffect(() => {
    if (!token) {
      router.push('/auth/forgot-password')
    }
  }, [token, router])

  const onSubmit = (data: ResetPasswordInput): void => {
    resetPassword(data)
  }

  return (
    <AuthCard title={t('title')}>
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
          <Label htmlFor="password">{t('newPassword')}</Label>
          <PasswordInput
            id="password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={!!errors.password}
            aria-describedby={
              errors.password ? 'password-error' : 'password-strength'
            }
            {...register('password')}
          />
          <PasswordStrengthIndicator password={password} />
          {errors.password && (
            <p
              id="password-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? 'confirm-password-error' : undefined
            }
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p
              id="confirm-password-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          loadingText="Resetting..."
        >
          {t('resetButton')}
        </Button>
      </form>
    </AuthCard>
  )
}
