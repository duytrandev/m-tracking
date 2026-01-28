'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  magicLinkSchema,
  type MagicLinkInput,
} from '@/features/auth/validations/auth-schemas'
import { useMagicLinkRequest } from '@/features/auth/hooks/use-magic-link-request'

export default function MagicLinkPage(): React.ReactElement {
  const { requestMagicLink, isLoading, isSuccess, error, email } =
    useMagicLinkRequest()
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
  })

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      )
      return () => clearTimeout(timer)
    }
    return undefined
  }, [resendCooldown])

  const handleResend = (): void => {
    if (email && resendCooldown === 0) {
      requestMagicLink(email)
      setResendCooldown(60)
    }
  }

  const onSubmit = (data: MagicLinkInput): void => {
    requestMagicLink(data.email)
    setResendCooldown(60)
  }

  if (isSuccess && email) {
    return (
      <AuthCard title="Check your email">
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-12 w-12 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">We sent a sign-in link to:</p>
            <p className="font-medium bg-muted px-3 py-2 rounded-md inline-block break-all">
              {email}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Click the link in the email to sign in. The link expires in 15
            minutes.
          </p>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Did not receive it?</p>
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend magic link'}
            </Button>
          </div>

          <Link
            href="/auth/login"
            className="text-sm text-primary hover:underline block"
          >
            Back to login
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Sign in with magic link"
      description="We'll email you a link to sign in instantly"
    >
      <form
        onSubmit={e => {
          void handleSubmit(onSubmit)(e)
        }}
        className="space-y-6"
      >
        {error && (
          <div
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            autoComplete="email"
            error={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive" role="alert">
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
          Send Magic Link
        </Button>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </form>
    </AuthCard>
  )
}
