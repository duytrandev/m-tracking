# Frontend Phase 5: Passwordless UI

**Duration:** Week 3-4
**Priority:** Medium
**Status:** Completed (2026-01-16)
**Dependencies:** Phase 3 (Token Management)

---

## Context Links

- [Frontend Plan](./frontend-plan.md)
- [Backend Phase 5](./phase-05-passwordless-auth.md)
- [UI/UX Design](../../docs/frontend-architecture/authentication-ui-ux-design.md)

---

## Overview

Implement passwordless authentication UI including magic link (email) and SMS OTP flows. Both methods allow users to sign in without remembering a password.

---

## Key Insights

- Magic link: Click link in email to authenticate
- SMS OTP: Enter 6-digit code sent via SMS
- Rate limiting: 3 attempts per 15 minutes
- Token expiration: Magic link 15 min, OTP 5 min
- Resend cooldown: 60 seconds

---

## Requirements

### Functional Requirements
- Magic link request form (email input)
- Magic link sent confirmation page
- Magic link verification page
- SMS OTP request form (phone input)
- OTP code input (6 digits)
- Resend functionality with cooldown
- Rate limit error display

### Non-Functional Requirements
- OTP auto-submit on 6 digits
- Clear countdown timers
- Mobile-optimized code input
- Accessible error messages

---

## Architecture

### Magic Link Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAGIC LINK FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. USER REQUESTS MAGIC LINK                                     │
│     POST /auth/magic-link/request { email }                     │
│     → Show "Check your email" page                              │
│                                                                  │
│  2. USER CLICKS LINK IN EMAIL                                    │
│     /auth/magic-link/verify?token=xxx                           │
│     → POST /auth/magic-link/verify { token }                    │
│     → Receive access token + refresh cookie                     │
│     → Redirect to dashboard                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### SMS OTP Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SMS OTP FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. USER REQUESTS OTP                                            │
│     POST /auth/otp/request { phone }                            │
│     → Show OTP input page                                       │
│                                                                  │
│  2. USER ENTERS CODE                                             │
│     POST /auth/otp/verify { phone, code }                       │
│     → Receive access token + refresh cookie                     │
│     → Redirect to dashboard                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `src/features/auth/components/magic-link-form.tsx`
- `src/features/auth/components/otp-request-form.tsx`
- `src/features/auth/components/otp-verify-form.tsx`
- `src/features/auth/components/code-input.tsx`
- `src/features/auth/hooks/use-magic-link.ts`
- `src/features/auth/hooks/use-otp.ts`
- `src/pages/auth/magic-link.tsx`
- `src/pages/auth/magic-link-verify.tsx`
- `src/pages/auth/otp-login.tsx`

### Files to Modify

- `src/features/auth/api/auth-api.ts` (add endpoints)
- `src/App.tsx` (add routes)

---

## Implementation Steps

### Step 1: Update Auth API (30 minutes)

Add to `src/features/auth/api/auth-api.ts`:

```typescript
// Magic Link
requestMagicLink: async (email: string): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/magic-link/request', { email })
  return response.data
},

verifyMagicLink: async (token: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/magic-link/verify', { token })
  if (response.data.accessToken) {
    setAuthToken(response.data.accessToken, response.data.expiresIn)
  }
  return response.data
},

// SMS OTP
requestOtp: async (phone: string): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/otp/request', { phone })
  return response.data
},

verifyOtp: async (phone: string, code: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/otp/verify', { phone, code })
  if (response.data.accessToken) {
    setAuthToken(response.data.accessToken, response.data.expiresIn)
  }
  return response.data
},
```

### Step 2: Create Code Input Component (1 hour)

Create `src/features/auth/components/code-input.tsx`:

```tsx
import { useRef, useState, KeyboardEvent, ClipboardEvent, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface CodeInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
  autoFocus?: boolean
}

export function CodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}: CodeInputProps): JSX.Element {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Split value into array of digits
  const digits = value.split('').concat(Array(length - value.length).fill(''))

  // Focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  // Handle input change
  const handleChange = (index: number, digit: string): void => {
    if (disabled) return

    // Only allow single digit
    const newDigit = digit.slice(-1)
    if (newDigit && !/^\d$/.test(newDigit)) return

    // Update value
    const newDigits = [...digits]
    newDigits[index] = newDigit
    const newValue = newDigits.join('')
    onChange(newValue)

    // Auto-advance to next input
    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if complete
    if (newValue.length === length && onComplete) {
      onComplete(newValue)
    }
  }

  // Handle key down
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>): void => {
    if (disabled) return

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        // Clear current digit
        handleChange(index, '')
      } else if (index > 0) {
        // Move to previous and clear
        inputRefs.current[index - 1]?.focus()
        handleChange(index - 1, '')
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, length)

    if (pastedDigits) {
      onChange(pastedDigits)

      // Focus last filled input or last input
      const focusIndex = Math.min(pastedDigits.length, length - 1)
      inputRefs.current[focusIndex]?.focus()

      // Check if complete
      if (pastedDigits.length === length && onComplete) {
        onComplete(pastedDigits)
      }
    }
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            'h-14 w-12 rounded-md border-2 text-center text-2xl font-mono font-semibold',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            error
              ? 'border-destructive text-destructive'
              : digit
                ? 'border-primary'
                : 'border-input'
          )}
        />
      ))}
    </div>
  )
}
```

### Step 3: Create Magic Link Hook (30 minutes)

Create `src/features/auth/hooks/use-magic-link.ts`:

```typescript
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'

interface UseMagicLinkRequestReturn {
  requestMagicLink: (email: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: string | null
  email: string | null
}

export function useMagicLinkRequest(): UseMagicLinkRequestReturn {
  const [email, setEmail] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: authApi.requestMagicLink,
    onSuccess: (_, email) => {
      setEmail(email)
    },
  })

  const error = mutation.error
    ? isApiError(mutation.error)
      ? mutation.error.response?.data?.message || 'Failed to send magic link'
      : 'An unexpected error occurred'
    : null

  return {
    requestMagicLink: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    email,
  }
}

interface UseMagicLinkVerifyReturn {
  verifyMagicLink: (token: string) => void
  isLoading: boolean
  error: string | null
}

export function useMagicLinkVerify(): UseMagicLinkVerifyReturn {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const mutation = useMutation({
    mutationFn: authApi.verifyMagicLink,
    onSuccess: (data) => {
      if (data.user) {
        login(data.user)
        navigate('/dashboard')
      }
    },
  })

  const error = mutation.error
    ? isApiError(mutation.error)
      ? mutation.error.response?.data?.message || 'Invalid or expired magic link'
      : 'An unexpected error occurred'
    : null

  return {
    verifyMagicLink: mutation.mutate,
    isLoading: mutation.isPending,
    error,
  }
}
```

### Step 4: Create OTP Hook (30 minutes)

Create `src/features/auth/hooks/use-otp.ts`:

```typescript
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { isApiError } from '@/lib/api-client'

interface UseOtpRequestReturn {
  requestOtp: (phone: string) => void
  isLoading: boolean
  isSuccess: boolean
  error: string | null
  phone: string | null
}

export function useOtpRequest(): UseOtpRequestReturn {
  const [phone, setPhone] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: authApi.requestOtp,
    onSuccess: (_, phone) => {
      setPhone(phone)
    },
  })

  const error = mutation.error
    ? isApiError(mutation.error)
      ? mutation.error.response?.data?.message || 'Failed to send OTP'
      : 'An unexpected error occurred'
    : null

  return {
    requestOtp: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error,
    phone,
  }
}

interface UseOtpVerifyReturn {
  verifyOtp: (code: string) => void
  isLoading: boolean
  error: string | null
  attemptsRemaining: number | null
}

export function useOtpVerify(phone: string): UseOtpVerifyReturn {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: (code: string) => authApi.verifyOtp(phone, code),
    onSuccess: (data) => {
      if (data.user) {
        login(data.user)
        navigate('/dashboard')
      }
    },
    onError: (error) => {
      // Check for attempts remaining in response
      if (isApiError(error) && error.response?.data) {
        const remaining = (error.response.data as any).attemptsRemaining
        if (typeof remaining === 'number') {
          setAttemptsRemaining(remaining)
        }
      }
    },
  })

  const error = mutation.error
    ? isApiError(mutation.error)
      ? mutation.error.response?.data?.message || 'Invalid code'
      : 'An unexpected error occurred'
    : null

  return {
    verifyOtp: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    attemptsRemaining,
  }
}
```

### Step 5: Create Magic Link Pages (1 hour)

Create `src/pages/auth/magic-link.tsx`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { magicLinkSchema, type MagicLinkInput } from '@/features/auth/validations/auth-schemas'
import { useMagicLinkRequest } from '@/features/auth/hooks/use-magic-link'
import { useState, useEffect } from 'react'

export default function MagicLinkPage(): JSX.Element {
  const { requestMagicLink, isLoading, isSuccess, error, email } = useMagicLinkRequest()
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
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResend = (): void => {
    if (email && resendCooldown === 0) {
      requestMagicLink(email)
      setResendCooldown(60)
    }
  }

  if (isSuccess && email) {
    return (
      <AuthCard title="Check your email" showLogo>
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-12 w-12 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">We sent a sign-in link to:</p>
            <p className="font-medium bg-muted px-3 py-2 rounded-md inline-block">{email}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Click the link in the email to sign in. The link expires in 15 minutes.
          </p>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Didn't receive it?</p>
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend magic link'}
            </Button>
          </div>

          <Link to="/auth/login" className="text-sm text-primary hover:underline block">
            Back to login
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Sign in with magic link" description="We'll email you a link to sign in instantly">
      <form onSubmit={handleSubmit((data) => requestMagicLink(data.email))} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
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

        <Button type="submit" className="w-full" isLoading={isLoading} loadingText="Sending...">
          Send Magic Link
        </Button>

        <Link
          to="/auth/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </form>
    </AuthCard>
  )
}
```

Create `src/pages/auth/magic-link-verify.tsx`:

```tsx
import { useEffect } from 'react'
import { useSearchParams, Navigate, Link } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { useMagicLinkVerify } from '@/features/auth/hooks/use-magic-link'

export default function MagicLinkVerifyPage(): JSX.Element {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { verifyMagicLink, isLoading, error } = useMagicLinkVerify()

  useEffect(() => {
    if (token) {
      verifyMagicLink(token)
    }
  }, [token, verifyMagicLink])

  if (!token) {
    return <Navigate to="/auth/login" replace />
  }

  if (isLoading) {
    return (
      <AuthCard title="Verifying..." showLogo>
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Please wait while we sign you in...</p>
        </div>
      </AuthCard>
    )
  }

  if (error) {
    return (
      <AuthCard title="Link expired or invalid" showLogo>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-center text-muted-foreground">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/auth/login">Back to Login</Link>
            </Button>
            <Button asChild>
              <Link to="/auth/magic-link">Request New Link</Link>
            </Button>
          </div>
        </div>
      </AuthCard>
    )
  }

  // Success state (will redirect)
  return (
    <AuthCard title="Success!" showLogo>
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </AuthCard>
  )
}
```

### Step 6: Create OTP Login Page (1 hour)

Create `src/pages/auth/otp-login.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, Smartphone, AlertCircle } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CodeInput } from '@/features/auth/components/code-input'
import { otpRequestSchema, type OTPRequestInput } from '@/features/auth/validations/auth-schemas'
import { useOtpRequest, useOtpVerify } from '@/features/auth/hooks/use-otp'

type Step = 'request' | 'verify'

export default function OtpLoginPage(): JSX.Element {
  const [step, setStep] = useState<Step>('request')
  const [code, setCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    requestOtp,
    isLoading: isRequesting,
    isSuccess: requestSuccess,
    error: requestError,
    phone,
  } = useOtpRequest()

  const {
    verifyOtp,
    isLoading: isVerifying,
    error: verifyError,
    attemptsRemaining,
  } = useOtpVerify(phone || '')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPRequestInput>({
    resolver: zodResolver(otpRequestSchema),
  })

  // Move to verify step on success
  useEffect(() => {
    if (requestSuccess && phone) {
      setStep('verify')
      setResendCooldown(60)
    }
  }, [requestSuccess, phone])

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResend = (): void => {
    if (phone && resendCooldown === 0) {
      requestOtp(phone)
      setResendCooldown(60)
      setCode('')
    }
  }

  const handleCodeComplete = (value: string): void => {
    verifyOtp(value)
  }

  // Request Step
  if (step === 'request') {
    return (
      <AuthCard title="Sign in with SMS" description="We'll text you a code to sign in">
        <form onSubmit={handleSubmit((data) => requestOtp(data.phone))} className="space-y-6">
          {requestError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {requestError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
              error={!!errors.phone}
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isRequesting} loadingText="Sending...">
            Send Code
          </Button>

          <Link
            to="/auth/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </form>
      </AuthCard>
    )
  }

  // Verify Step
  return (
    <AuthCard title="Enter verification code" showLogo>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to <span className="font-medium">{phone}</span>
          </p>
        </div>

        {verifyError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <div>
              {verifyError}
              {attemptsRemaining !== null && (
                <span className="block text-xs">
                  {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                </span>
              )}
            </div>
          </div>
        )}

        <CodeInput
          value={code}
          onChange={setCode}
          onComplete={handleCodeComplete}
          disabled={isVerifying}
          error={!!verifyError}
        />

        <Button
          type="button"
          className="w-full"
          onClick={() => handleCodeComplete(code)}
          disabled={code.length !== 6}
          isLoading={isVerifying}
          loadingText="Verifying..."
        >
          Verify
        </Button>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">Didn't receive a code?</p>
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => {
            setStep('request')
            setCode('')
          }}
          className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Change phone number
        </button>
      </div>
    </AuthCard>
  )
}
```

### Step 7: Add Routes (15 minutes)

Add to `src/App.tsx`:

```tsx
import MagicLinkPage from './pages/auth/magic-link'
import MagicLinkVerifyPage from './pages/auth/magic-link-verify'
import OtpLoginPage from './pages/auth/otp-login'

// In Routes:
<Route path="/auth/magic-link" element={<MagicLinkPage />} />
<Route path="/auth/magic-link/verify" element={<MagicLinkVerifyPage />} />
<Route path="/auth/otp-login" element={<OtpLoginPage />} />
```

### Step 8: Add Links to Login Page (15 minutes)

Update login form to include passwordless options:

```tsx
// Add at bottom of LoginForm
<div className="text-center text-sm text-muted-foreground">
  <p>Or sign in with:</p>
  <div className="flex justify-center gap-4 mt-2">
    <Link to="/auth/magic-link" className="text-primary hover:underline">
      Magic Link
    </Link>
    <span>|</span>
    <Link to="/auth/otp-login" className="text-primary hover:underline">
      SMS Code
    </Link>
  </div>
</div>
```

---

## Todo List

- [x] Update auth API with magic link endpoints
- [x] Update auth API with OTP endpoints
- [x] Create CodeInput component
- [x] Create useMagicLinkRequest hook
- [x] Create useMagicLinkVerify hook
- [x] Create useOtpRequest hook
- [x] Create useOtpVerify hook
- [x] Create MagicLink request page
- [x] Create MagicLink verify page
- [x] Create OTP login page (2 steps)
- [x] Add routes to App
- [x] Add links to login page
- [x] Test magic link flow
- [x] Test OTP flow
- [x] Test resend cooldown
- [x] Test error handling

---

## Success Criteria

- [x] Magic link request sends email
- [x] Magic link verifies and logs in
- [x] OTP request sends SMS
- [x] OTP verifies and logs in
- [x] Code input auto-advances
- [x] Code input supports paste
- [x] Resend has 60s cooldown
- [x] Errors display clearly

---

## Security Considerations

- Rate limiting displayed to users
- Tokens expire appropriately
- Phone number validated
- Code input doesn't reveal if code exists
- Resend cooldown prevents spam

---

## Next Steps

After completion:
1. Move to Phase 6: 2FA UI
2. Implement TOTP setup modal
3. Implement 2FA verification during login
