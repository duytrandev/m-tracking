'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { AlertCircle, Check, Mail } from 'lucide-react'
import { m, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { AnimatedInput } from './animated-input'
import { AnimatedPasswordInput } from './animated-password-input'
import { PasswordStrengthIndicator } from './password-strength'
import { OAuthButtons } from './oauth-buttons'
import { FormField } from './form-field'
import { AnimatedFormWrapper } from './animated-form-wrapper'
import { registerSchema, type RegisterInput } from '../validations/auth-schemas'
import { useRegister } from '../hooks/use-register'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { AuthErrorCode } from '@m-tracking/shared'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function RegisterForm() {
  const [formState, setFormState] = useState<FormState>('idle')
  const { register: registerUser, isLoading, error } = useRegister()
  const prefersReducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  })

  const password = watch('password')

  // Handle form state based on mutation status
  useEffect(() => {
    if (error && formState === 'submitting') {
      setFormState('error')
      const timer = setTimeout(() => setFormState('idle'), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [error, formState])

  const onSubmit = (data: RegisterInput): void => {
    setFormState('submitting')
    registerUser(data)
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
          <p className="text-lg font-medium text-gray-900">
            Account created successfully!
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Check your email to verify your account.
          </p>
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
          ease: 'easeInOut',
        }}
        className="space-y-6"
      >
        {/* OAuth Buttons First */}
        <OAuthButtons />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or Register With Email
            </span>
          </div>
        </div>

        {/* Global Error Banner - Enhanced based on error code */}
        <AnimatePresence mode="wait">
          {error && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            >
              {error.code === AuthErrorCode.EMAIL_ALREADY_REGISTERED ? (
                <div
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium text-blue-700">
                          {error.message}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          {error.fieldHints.email ||
                            'An account with this email already exists. Try logging in instead, or use the password recovery if you forgot your credentials.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {error.recoveryAction && (
                          <Link
                            href={error.recoveryAction.href}
                            className="inline-flex items-center gap-2 rounded-md bg-[#5046E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338CA] transition-colors"
                          >
                            {error.recoveryAction.label}
                          </Link>
                        )}
                        <Link
                          href="/auth/forgot-password"
                          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700">
                        Registration Failed
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        {error.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Name Field */}
        <FormField
          label="Full Name"
          htmlFor="name"
          error={errors.name?.message}
          success={dirtyFields.name && !errors.name}
        >
          <AnimatedInput
            id="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            error={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
            className="transition-form"
            {...register('name')}
          />
        </FormField>

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
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={!!errors.password}
            aria-describedby={
              errors.password ? 'password-error' : 'password-strength'
            }
            aria-invalid={!!errors.password}
            className="transition-form"
            {...register('password')}
          />
          <PasswordStrengthIndicator password={password} />
        </FormField>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base"
          isLoading={isLoading}
          loadingText="Creating account..."
          disabled={isLoading}
        >
          Create Account
        </Button>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600">
          Already Have An Account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-[#5046E5] hover:text-[#4338CA] hover:underline transition-colors"
          >
            Log In
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500">
          By signing up, you agree to our{' '}
          <Link
            href="/terms"
            className="text-[#5046E5] hover:text-[#4338CA] hover:underline"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="text-[#5046E5] hover:text-[#4338CA] hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
      </m.form>
    </AnimatedFormWrapper>
  )
}
