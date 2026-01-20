# Frontend Phase 1: Setup & Infrastructure

**Duration:** Week 1
**Priority:** Critical
**Status:** Completed (2026-01-16)
**Dependencies:** None (can start immediately)

---

## Context Links

- [Frontend Plan](./frontend-plan.md)
- [Backend Phase 1](./phase-01-database-infrastructure.md)
- [UI/UX Design](../../docs/frontend-architecture/authentication-ui-ux-design.md)
- [Frontend Architecture](../../docs/frontend-architecture/index.md)

---

## Overview

Set up the foundational infrastructure for frontend authentication including dependencies, project structure, API client configuration, state management, and routing.

---

## Key Insights

- Current frontend uses Vite + React 19.2 (not Next.js as docs suggest)
- React Router DOM 7.x already installed
- Tailwind CSS configured
- Need to add: shadcn/ui, Zustand, TanStack Query, Axios, Zod

---

## Requirements

### Functional Requirements
- Install all required dependencies
- Set up feature-based folder structure
- Configure API client with base URL and interceptors
- Initialize auth store with Zustand
- Set up TanStack Query provider
- Configure routing for auth pages

### Non-Functional Requirements
- Type-safe API client
- Environment variable management
- Error boundary for auth flows
- Loading state management

---

## Architecture

### Project Structure

```
apps/frontend/src/
├── features/
│   └── auth/
│       ├── components/       # Auth-specific components
│       ├── hooks/            # Custom hooks for auth
│       ├── api/              # API functions
│       ├── store/            # Zustand store
│       ├── types/            # TypeScript types
│       └── validations/      # Zod schemas
├── pages/
│   └── auth/                 # Auth page components
├── components/
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── api-client.ts         # Axios instance
│   ├── query-client.ts       # TanStack Query client
│   └── utils.ts              # Utility functions
├── providers/
│   └── app-providers.tsx     # Combined providers
└── routes/
    └── index.tsx             # Route definitions
```

---

## Related Code Files

### Files to Create

**Core Infrastructure:**
- `apps/frontend/src/lib/api-client.ts`
- `apps/frontend/src/lib/query-client.ts`
- `apps/frontend/src/lib/utils.ts`
- `apps/frontend/src/providers/app-providers.tsx`

**Auth Feature Structure:**
- `apps/frontend/src/features/auth/store/auth-store.ts`
- `apps/frontend/src/features/auth/types/auth-types.ts`
- `apps/frontend/src/features/auth/api/auth-api.ts`
- `apps/frontend/src/features/auth/validations/auth-schemas.ts`

**UI Components (shadcn/ui):**
- `apps/frontend/src/components/ui/button.tsx`
- `apps/frontend/src/components/ui/input.tsx`
- `apps/frontend/src/components/ui/card.tsx`
- `apps/frontend/src/components/ui/label.tsx`
- `apps/frontend/src/components/ui/checkbox.tsx`
- `apps/frontend/src/components/ui/toast.tsx`
- `apps/frontend/src/components/ui/dialog.tsx`

**Environment:**
- `apps/frontend/.env.example`
- `apps/frontend/.env.local`

### Files to Modify

- `apps/frontend/package.json`
- `apps/frontend/src/main.tsx`
- `apps/frontend/src/App.tsx`
- `apps/frontend/tailwind.config.js`

---

## Implementation Steps

### Step 1: Install Dependencies (15 minutes)

```bash
cd apps/frontend

# Core dependencies
pnpm add zustand @tanstack/react-query axios zod react-hook-form @hookform/resolvers

# UI dependencies (shadcn/ui prerequisites)
pnpm add class-variance-authority clsx tailwind-merge lucide-react

# Radix UI primitives (for shadcn/ui)
pnpm add @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-label @radix-ui/react-toast @radix-ui/react-slot

# Dev dependencies
pnpm add -D @types/node
```

### Step 2: Configure Tailwind for shadcn/ui (30 minutes)

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

Add CSS variables to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Step 3: Create Utility Functions (30 minutes)

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

### Step 4: Create API Client (1 hour)

Create `src/lib/api-client.ts`:

```typescript
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
})

// Token storage (in-memory for security)
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function clearAccessToken(): void {
  accessToken = null
}

// Request interceptor - attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: Error) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error)
    } else if (token) {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(apiClient(originalRequest))
            },
            reject: (err: Error) => {
              reject(err)
            },
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint (cookie sent automatically)
        const response = await apiClient.post('/auth/refresh')
        const newToken = response.data.accessToken

        setAccessToken(newToken)
        processQueue(null, newToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        clearAccessToken()
        // Redirect to login
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// API error type
export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error)
}
```

### Step 5: Create TanStack Query Client (30 minutes)

Create `src/lib/query-client.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401/403/404
        if (error instanceof Error && 'response' in error) {
          const status = (error as any).response?.status
          if ([401, 403, 404].includes(status)) {
            return false
          }
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
```

### Step 6: Create Auth Store (1 hour)

Create `src/features/auth/store/auth-store.ts`:

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  roles: string[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  requires2FA: boolean
  pendingEmail?: string // For 2FA flow

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setRequires2FA: (requires: boolean, email?: string) => void
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start loading until we check auth
      requires2FA: false,
      pendingEmail: undefined,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setRequires2FA: (requires2FA, pendingEmail) =>
        set({ requires2FA, pendingEmail }),

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          requires2FA: false,
          pendingEmail: undefined,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          requires2FA: false,
          pendingEmail: undefined,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Only persist user info, not loading/auth state
        user: state.user,
      }),
    }
  )
)
```

### Step 7: Create Auth Types (30 minutes)

Create `src/features/auth/types/auth-types.ts`:

```typescript
// Request types
export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface Verify2FARequest {
  code: string
  email?: string // For login flow
}

export interface MagicLinkRequest {
  email: string
}

export interface OTPRequest {
  phone: string
}

export interface OTPVerifyRequest {
  phone: string
  code: string
}

// Response types
export interface AuthResponse {
  accessToken: string
  expiresIn: number
  user?: User
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  roles: string[]
}

export interface MessageResponse {
  message: string
}

export interface TwoFactorEnrollResponse {
  qrCode: string // Base64 QR code image
  secret: string // Manual entry code
}

export interface BackupCodesResponse {
  codes: string[]
}

export interface SessionInfo {
  id: string
  deviceInfo: {
    userAgent: string
    platform?: string
  }
  ipAddress: string
  lastActiveAt: string
  createdAt: string
  isCurrent: boolean
}

// Error types
export interface AuthError {
  message: string
  statusCode: number
  error?: string
}

// Auth flow states
export type AuthFlowState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'requires_2fa'
  | 'requires_verification'
```

### Step 8: Create Validation Schemas (30 minutes)

Create `src/features/auth/validations/auth-schemas.ts`:

```typescript
import { z } from 'zod'

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(true),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const twoFactorCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
})

export const magicLinkSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export const otpRequestSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s-]+$/, 'Please enter a valid phone number'),
})

export const otpVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Type inference
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
export type OTPRequestInput = z.infer<typeof otpRequestSchema>
export type OTPVerifyInput = z.infer<typeof otpVerifySchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Password strength calculator
export type PasswordStrength = 'weak' | 'medium' | 'strong'

export function calculatePasswordStrength(password: string): PasswordStrength {
  let strength = 0

  if (password.length >= 12) strength++
  if (password.length >= 16) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}
```

### Step 9: Create App Providers (30 minutes)

Create `src/providers/app-providers.tsx`:

```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'
import { queryClient } from '../lib/query-client'
import { Toaster } from '../components/ui/toaster'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
```

### Step 10: Update Main Entry (30 minutes)

Update `src/main.tsx`:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from './providers/app-providers'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>
)
```

### Step 11: Set Up Environment Variables (15 minutes)

Create `apps/frontend/.env.example`:

```bash
# API Configuration
VITE_API_URL=http://localhost:4000

# OAuth (optional, for popup mode)
VITE_GOOGLE_CLIENT_ID=
VITE_GITHUB_CLIENT_ID=
VITE_FACEBOOK_APP_ID=

# Feature Flags
VITE_ENABLE_OAUTH=true
VITE_ENABLE_MAGIC_LINK=true
VITE_ENABLE_SMS_OTP=true
```

Create `apps/frontend/.env.local`:

```bash
VITE_API_URL=http://localhost:4000
VITE_ENABLE_OAUTH=true
VITE_ENABLE_MAGIC_LINK=true
VITE_ENABLE_SMS_OTP=true
```

### Step 12: Install tailwindcss-animate (5 minutes)

```bash
cd apps/frontend
pnpm add tailwindcss-animate
```

---

## Todo List

- [ ] Install core dependencies (Zustand, TanStack Query, Axios, Zod)
- [ ] Install UI dependencies (Radix UI primitives, CVA, clsx, tailwind-merge)
- [ ] Configure Tailwind CSS for shadcn/ui
- [ ] Add CSS variables to index.css
- [ ] Create lib/utils.ts
- [ ] Create lib/api-client.ts with interceptors
- [ ] Create lib/query-client.ts
- [ ] Create features/auth/store/auth-store.ts
- [ ] Create features/auth/types/auth-types.ts
- [ ] Create features/auth/validations/auth-schemas.ts
- [ ] Create providers/app-providers.tsx
- [ ] Update main.tsx with providers
- [ ] Create environment files
- [ ] Test API client with mock endpoint
- [ ] Verify Zustand store works
- [ ] Verify TanStack Query provider works

---

## Success Criteria

- [ ] All dependencies installed successfully
- [ ] No TypeScript errors
- [ ] API client makes requests with auth headers
- [ ] Auto-refresh interceptor works
- [ ] Auth store persists basic user info
- [ ] TanStack Query devtools visible in dev mode
- [ ] Tailwind CSS with shadcn/ui colors working

---

## Security Considerations

- Access token stored in memory only (not localStorage)
- Refresh token in httpOnly cookie (handled by backend)
- Credentials included in API requests (`withCredentials: true`)
- Token cleared on logout
- Auto-redirect to login on 401 after refresh failure

---

## Next Steps

After completion:
1. Move to Phase 2: Email/Password UI
2. Create base UI components (Button, Input, Card)
3. Implement registration form
