# Frontend Phase 4: OAuth Integration

**Duration:** Week 3
**Priority:** High
**Status:** Completed (2026-01-16)
**Dependencies:** Phase 3 (Token Management)

---

## Context Links

- [Frontend Plan](./frontend-plan.md)
- [Backend Phase 4](./phase-04-oauth-social-login.md)
- [UI/UX Design - OAuth](../../docs/frontend-architecture/authentication-ui-ux-design.md#flow-3-google-oauth-loginregistration)

---

## Overview

Implement OAuth social login for Google, GitHub, and Facebook. Use server-side redirect flow (not popup) for better security and compatibility.

---

## Key Insights

- Backend handles OAuth redirect and callback
- Frontend initiates OAuth by redirecting to backend endpoint
- Backend redirects back to frontend with tokens set in cookies
- PKCE (Proof Key for Code Exchange) handled by backend
- Account linking handled server-side

---

## Requirements

### Functional Requirements
- Google OAuth login/signup button
- GitHub OAuth login/signup button
- Facebook OAuth login/signup button
- OAuth callback handling page
- Error handling for OAuth failures
- Loading states during OAuth flow

### Non-Functional Requirements
- OAuth flow < 3 seconds
- Graceful error messages
- Mobile-friendly OAuth flow
- Popup blocker fallback

---

## Architecture

### OAuth Flow (Redirect-based)

```
┌─────────────────────────────────────────────────────────────────┐
│                      OAUTH FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. USER CLICKS "Continue with Google"                           │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  window.location.href = API_URL + '/auth/google'         │ │
│     │  (with optional return_url param)                        │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  2. BACKEND REDIRECTS TO GOOGLE                                  │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  Google OAuth consent screen shown                       │ │
│     │  User authorizes app                                     │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  3. GOOGLE REDIRECTS TO BACKEND CALLBACK                         │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  GET /auth/google/callback?code=xxx                      │ │
│     │  Backend exchanges code for tokens                       │ │
│     │  Backend creates/links user account                      │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  4. BACKEND REDIRECTS TO FRONTEND                                │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  Set-Cookie: refreshToken (httpOnly)                     │ │
│     │  Redirect to: /auth/callback?access_token=xxx            │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  5. FRONTEND CALLBACK PAGE                                       │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  Extract access_token from URL                           │ │
│     │  Store in memory via tokenService                        │ │
│     │  Fetch user profile                                      │ │
│     │  Redirect to dashboard                                   │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `src/features/auth/components/oauth-buttons.tsx`
- `src/features/auth/components/oauth-button.tsx`
- `src/pages/auth/oauth-callback.tsx`
- `src/features/auth/hooks/use-oauth.ts`
- `src/features/auth/types/oauth-types.ts`

### Files to Modify

- `src/pages/auth/login.tsx` (add OAuth buttons)
- `src/pages/auth/register.tsx` (add OAuth buttons)
- `src/App.tsx` (add callback route)

---

## Implementation Steps

### Step 1: Create OAuth Types (15 minutes)

Create `src/features/auth/types/oauth-types.ts`:

```typescript
export type OAuthProvider = 'google' | 'github' | 'facebook'

export interface OAuthConfig {
  provider: OAuthProvider
  label: string
  icon: string
  bgColor: string
  textColor: string
  hoverBgColor: string
}

export const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig> = {
  google: {
    provider: 'google',
    label: 'Continue with Google',
    icon: 'google',
    bgColor: 'bg-white',
    textColor: 'text-slate-900',
    hoverBgColor: 'hover:bg-slate-50',
  },
  github: {
    provider: 'github',
    label: 'Continue with GitHub',
    icon: 'github',
    bgColor: 'bg-[#24292e]',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-[#2f363d]',
  },
  facebook: {
    provider: 'facebook',
    label: 'Continue with Facebook',
    icon: 'facebook',
    bgColor: 'bg-[#1877f2]',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-[#166fe5]',
  },
}

export interface OAuthCallbackParams {
  access_token?: string
  error?: string
  error_description?: string
}
```

### Step 2: Create OAuth Hook (30 minutes)

Create `src/features/auth/hooks/use-oauth.ts`:

```typescript
import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { authApi } from '../api/auth-api'
import { setAuthToken } from '@/lib/api-client'
import type { OAuthProvider } from '../types/oauth-types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface UseOAuthReturn {
  initiateOAuth: (provider: OAuthProvider) => void
  isLoading: boolean
}

/**
 * Hook to initiate OAuth flow
 */
export function useOAuth(): UseOAuthReturn {
  const [isLoading, setIsLoading] = useState(false)

  const initiateOAuth = useCallback((provider: OAuthProvider) => {
    setIsLoading(true)

    // Store current URL for redirect after auth
    const returnUrl = window.location.pathname
    sessionStorage.setItem('oauth_return_url', returnUrl)

    // Redirect to backend OAuth endpoint
    const oauthUrl = `${API_BASE_URL}/auth/${provider}`
    window.location.href = oauthUrl
  }, [])

  return {
    initiateOAuth,
    isLoading,
  }
}

interface UseOAuthCallbackReturn {
  isProcessing: boolean
  error: string | null
}

/**
 * Hook to handle OAuth callback
 */
export function useOAuthCallback(): UseOAuthCallbackReturn {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Process callback on mount
  useState(() => {
    const processCallback = async (): Promise<void> => {
      const accessToken = searchParams.get('access_token')
      const expiresIn = searchParams.get('expires_in')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        setError(errorDescription || 'OAuth authentication failed')
        setIsProcessing(false)
        return
      }

      if (!accessToken) {
        setError('No access token received')
        setIsProcessing(false)
        return
      }

      try {
        // Store the access token
        setAuthToken(accessToken, parseInt(expiresIn || '900', 10))

        // Fetch user profile
        const user = await authApi.getCurrentUser()
        login(user)

        // Get stored return URL or default to dashboard
        const returnUrl = sessionStorage.getItem('oauth_return_url') || '/dashboard'
        sessionStorage.removeItem('oauth_return_url')

        navigate(returnUrl, { replace: true })
      } catch (err) {
        setError('Failed to complete authentication')
        setIsProcessing(false)
      }
    }

    processCallback()
  })

  return {
    isProcessing,
    error,
  }
}
```

### Step 3: Create OAuth Button Component (1 hour)

Create `src/features/auth/components/oauth-button.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { OAuthProvider, OAuthConfig } from '../types/oauth-types'
import { OAUTH_CONFIGS } from '../types/oauth-types'

// SVG Icons for OAuth providers
const GoogleIcon = (): JSX.Element => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const GitHubIcon = (): JSX.Element => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
)

const FacebookIcon = (): JSX.Element => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
      clipRule="evenodd"
    />
  </svg>
)

const providerIcons: Record<OAuthProvider, () => JSX.Element> = {
  google: GoogleIcon,
  github: GitHubIcon,
  facebook: FacebookIcon,
}

interface OAuthButtonProps {
  provider: OAuthProvider
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
}

export function OAuthButton({
  provider,
  onClick,
  isLoading = false,
  disabled = false,
}: OAuthButtonProps): JSX.Element {
  const config = OAUTH_CONFIGS[provider]
  const Icon = providerIcons[provider]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex w-full items-center justify-center gap-3 rounded-md border px-4 py-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        config.bgColor,
        config.textColor,
        config.hoverBgColor,
        provider === 'google' && 'border-slate-200'
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon />
      )}
      {config.label}
    </button>
  )
}
```

### Step 4: Create OAuth Buttons Group (30 minutes)

Create `src/features/auth/components/oauth-buttons.tsx`:

```tsx
import { OAuthButton } from './oauth-button'
import { useOAuth } from '../hooks/use-oauth'
import type { OAuthProvider } from '../types/oauth-types'

interface OAuthButtonsProps {
  providers?: OAuthProvider[]
  disabled?: boolean
}

export function OAuthButtons({
  providers = ['google', 'github', 'facebook'],
  disabled = false,
}: OAuthButtonsProps): JSX.Element {
  const { initiateOAuth, isLoading } = useOAuth()

  // Check feature flags
  const enableOAuth = import.meta.env.VITE_ENABLE_OAUTH === 'true'

  if (!enableOAuth) {
    return <></>
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <OAuthButton
          key={provider}
          provider={provider}
          onClick={() => initiateOAuth(provider)}
          isLoading={isLoading}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
```

### Step 5: Create OAuth Callback Page (1 hour)

Create `src/pages/auth/oauth-callback.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { authApi } from '@/features/auth/api/auth-api'
import { setAuthToken } from '@/lib/api-client'

type CallbackStatus = 'processing' | 'success' | 'error'

export default function OAuthCallbackPage(): JSX.Element {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [status, setStatus] = useState<CallbackStatus>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async (): Promise<void> => {
      // Check for error params
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        setError(errorDescription || 'Authentication failed. Please try again.')
        setStatus('error')
        return
      }

      // Get access token from URL
      const accessToken = searchParams.get('access_token')
      const expiresIn = searchParams.get('expires_in')

      if (!accessToken) {
        setError('No access token received. Please try again.')
        setStatus('error')
        return
      }

      try {
        // Store the access token
        setAuthToken(accessToken, parseInt(expiresIn || '900', 10))

        // Fetch user profile
        const user = await authApi.getCurrentUser()
        login(user)

        setStatus('success')

        // Get stored return URL or default to dashboard
        const returnUrl = sessionStorage.getItem('oauth_return_url') || '/dashboard'
        sessionStorage.removeItem('oauth_return_url')

        // Short delay to show success state
        setTimeout(() => {
          navigate(returnUrl, { replace: true })
        }, 1000)
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError('Failed to complete authentication. Please try again.')
        setStatus('error')
      }
    }

    processCallback()
  }, [searchParams, navigate, login])

  if (status === 'processing') {
    return (
      <AuthCard title="Completing sign in..." showLogo>
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Please wait while we complete your sign in...</p>
        </div>
      </AuthCard>
    )
  }

  if (status === 'success') {
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

  // Error state
  return (
    <AuthCard title="Authentication Failed" showLogo>
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-center text-muted-foreground">{error}</p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/auth/login">Back to Login</Link>
          </Button>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    </AuthCard>
  )
}
```

### Step 6: Update Routes (15 minutes)

Update `src/App.tsx` to add OAuth callback route:

```tsx
import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/login'
import RegisterPage from './pages/auth/register'
import VerifyEmailPage from './pages/auth/verify-email'
import ForgotPasswordPage from './pages/auth/forgot-password'
import ResetPasswordPage from './pages/auth/reset-password'
import OAuthCallbackPage from './pages/auth/oauth-callback'

function App(): JSX.Element {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<div>Dashboard</div>} />

      {/* Default */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  )
}

export default App
```

---

## Todo List

- [x] Create OAuth types and configs
- [x] Create useOAuth hook
- [x] Create OAuthButton component with icons
- [x] Create OAuthButtons group component
- [x] Create OAuth callback page
- [x] Add callback route to App
- [x] Test Google OAuth flow
- [x] Test GitHub OAuth flow
- [x] Test Facebook OAuth flow
- [x] Test error handling
- [x] Test return URL preservation
- [x] Handle popup blockers gracefully

---

## Success Criteria

- [x] OAuth buttons display correctly
- [x] Clicking button redirects to provider
- [x] Callback page processes token
- [x] User logged in after OAuth
- [x] Errors display friendly messages
- [x] Return URL preserved through flow

---

## Security Considerations

- OAuth handled server-side (no client secrets)
- State parameter prevents CSRF (backend)
- PKCE flow for extra security (backend)
- Token passed via URL fragment or query
- Return URL stored in sessionStorage only

---

## Next Steps

After completion:
1. Move to Phase 5: Passwordless UI
2. Implement magic link flow
3. Implement SMS OTP flow
