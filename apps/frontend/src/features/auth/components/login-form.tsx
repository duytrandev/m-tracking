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
          <div className="rounded-full bg-green-100 p-4">
            <Check className="h-12 w-12 text-green-600" />
          </div>
        </m.div>
        <div>
          <p className="text-lg font-medium text-gray-900">Welcome back!</p>
          <p className="text-sm text-gray-600 mt-1">Redirecting to your dashboard...</p>
        </div>
      </m.div>
    )
  }

  return (
    <AnimatedFormWrapper>
      <m.form
        onSubmit={handleSubmit(onSubmit)}
        animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.4,
          ease: 'easeInOut'
        }}
        className="space-y-6"
      >
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
                className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20"
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
          <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-gray-700">
            Remember Me
          </Label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-[#5046E5] hover:text-[#4338CA] hover:underline transition-colors"
        >
          Forgot Your Password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-base"
        isLoading={isLoading}
        loadingText="Signing in..."
        disabled={isLoading}
      >
        Log In
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or Login With</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <OAuthButtons />

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-600">
        Don't Have An Account?{' '}
        <Link
          href="/auth/register"
          className="font-semibold text-[#5046E5] hover:text-[#4338CA] hover:underline transition-colors"
        >
          Register Now.
        </Link>
      </p>
      </m.form>
    </AnimatedFormWrapper>
  )
}
