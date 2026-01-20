'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { AlertCircle, Check } from 'lucide-react'
import { m, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AnimatedInput } from './animated-input'
import { AnimatedPasswordInput } from './animated-password-input'
import { OAuthButtons } from './oauth-buttons'
import { FormField } from './form-field'
import { Divider } from './divider'
import { PasswordlessLinks } from './passwordless-links'
import { AnimatedFormWrapper } from './animated-form-wrapper'
import { loginSchema, type LoginInput } from '../validations/auth-schemas'
import { useLogin } from '../hooks/use-login'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function LoginForm() {
  const [formState, setFormState] = useState<FormState>('idle')
  const { login, isLoading, error } = useLogin()
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for initial entry
    reValidateMode: 'onChange', // Re-validate immediately on change after error
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  })

  const rememberMe = watch('rememberMe')

  const onSubmit = async (data: LoginInput): Promise<void> => {
    setFormState('submitting')
    try {
      await login(data)
      setFormState('success')
    } catch {
      setFormState('error')
      setTimeout(() => setFormState('idle'), 3000)
    }
  }

  // Success state UI
  if (formState === 'success') {
    return (
      <m.div
        key="success"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-4"
      >
        <m.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-block"
        >
          <div className="rounded-full bg-success/10 p-4">
            <Check className="h-12 w-12 text-success" />
          </div>
        </m.div>
        <div>
          <p className="text-lg font-medium text-foreground">Welcome back!</p>
          <p className="text-sm text-muted-foreground mt-1">Redirecting to your dashboard...</p>
        </div>
      </m.div>
    )
  }

  return (
    <AnimatedFormWrapper>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Global Error Banner */}
        <AnimatePresence mode="wait">
          {error && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            >
              <div
                className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Email Field */}
        <FormField
          label="Email"
          htmlFor="email"
          error={errors.email?.message}
          success={dirtyFields.email && !errors.email}
        >
          <AnimatedInput
            id="email"
            type="email"
            placeholder="your.email@example.com"
            autoComplete="email"
            error={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            className="transition-form"
            {...register('email')}
          />
        </FormField>

        {/* Password Field */}
        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <AnimatedPasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            aria-invalid={!!errors.password}
            className="transition-form"
            {...register('password')}
          />
        </FormField>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue('rememberMe', checked as boolean)}
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
            Remember me
          </Label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-primary hover:underline transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl"
        isLoading={isLoading}
        loadingText="Signing in..."
        disabled={isLoading}
      >
        Sign In
      </Button>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link
          href="/auth/register"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          Sign up
        </Link>
      </p>

      {/* Divider */}
      <Divider text="or continue with" />

      {/* OAuth Buttons */}
      <OAuthButtons />

        {/* Passwordless Options */}
        <div className="pt-2">
          <PasswordlessLinks />
        </div>
      </form>
    </AnimatedFormWrapper>
  )
}
