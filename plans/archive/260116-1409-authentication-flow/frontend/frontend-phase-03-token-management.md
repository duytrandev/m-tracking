# Frontend Phase 3: Token Management

**Duration:** Week 2
**Priority:** Critical
**Status:** Completed (2026-01-16)
**Dependencies:** Phase 2 (Email/Password UI)

---

## Context Links

- [Frontend Plan](./frontend-plan.md)
- [Backend Phase 3](./phase-03-jwt-session-management.md)
- [API Client Setup](./frontend-phase-01-setup-infrastructure.md#step-4-create-api-client)

---

## Overview

Implement secure token management with in-memory access token storage, automatic token refresh, and seamless session persistence across page reloads.

---

## Key Insights

- Access token: 15 minutes, stored in memory (NOT localStorage)
- Refresh token: 7 days, httpOnly cookie (managed by backend)
- Auto-refresh should be transparent to user
- Token refresh queuing prevents multiple simultaneous refreshes
- Session restoration on page reload via refresh endpoint

---

## Requirements

### Functional Requirements
- Store access token in memory (not localStorage)
- Auto-refresh token before expiration
- Handle 401 errors with token refresh retry
- Queue failed requests during refresh
- Restore session on page reload
- Clear tokens on logout

### Non-Functional Requirements
- Token refresh < 500ms
- Transparent to user experience
- No race conditions during refresh
- Graceful degradation on refresh failure

---

## Architecture

### Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOKEN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOGIN SUCCESS                                                │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  Response Body: { accessToken, expiresIn: 900 }          │ │
│     │  Set-Cookie: refreshToken=xyz; HttpOnly; Secure           │ │
│     └──────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  Store accessToken in memory variable                    │ │
│     │  Calculate expiration time (now + 900s)                  │ │
│     │  Schedule refresh at (expiration - 60s)                  │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  2. API REQUEST                                                  │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  Request Interceptor adds Authorization header           │ │
│     │  Authorization: Bearer {accessToken}                     │ │
│     │  withCredentials: true (sends cookie)                    │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  3. TOKEN EXPIRED (401 Response)                                 │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  Response Interceptor catches 401                        │ │
│     │  Call POST /auth/refresh (cookie sent automatically)     │ │
│     │  Store new accessToken                                   │ │
│     │  Retry original request                                  │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  4. REFRESH FAILED                                               │
│     ┌──────────────────────────────────────────────────────────┐ │
│     │  Clear accessToken from memory                           │ │
│     │  Clear auth store                                        │ │
│     │  Redirect to /auth/login                                 │ │
│     └──────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Session Restoration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAGE LOAD / REFRESH                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. App mounts → useAuthInit() hook runs                        │
│                                                                  │
│  2. Check if we have user in sessionStorage (persisted)         │
│     └─ If yes: Set loading state, attempt token refresh         │
│                                                                  │
│  3. Call POST /auth/refresh                                     │
│     ├─ Success: Store new token, fetch user, set authenticated │
│     └─ Failure: Clear store, user needs to login again         │
│                                                                  │
│  4. Set loading = false                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Files to Create

- `src/features/auth/hooks/use-auth-init.ts`
- `src/features/auth/hooks/use-logout.ts`
- `src/features/auth/services/token-service.ts`
- `src/features/auth/components/auth-initializer.tsx`

### Files to Modify

- `src/lib/api-client.ts` (enhance interceptors)
- `src/features/auth/store/auth-store.ts` (add token timing)
- `src/providers/app-providers.tsx` (add auth initializer)

---

## Implementation Steps

### Step 1: Create Token Service (1 hour)

Create `src/features/auth/services/token-service.ts`:

```typescript
/**
 * Token Service
 * Manages access token storage, timing, and refresh scheduling
 */

type TokenRefreshCallback = () => Promise<string | null>

class TokenService {
  private accessToken: string | null = null
  private tokenExpiresAt: number | null = null
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null
  private refreshCallback: TokenRefreshCallback | null = null

  // Buffer time before actual expiration to refresh (60 seconds)
  private readonly REFRESH_BUFFER_MS = 60 * 1000

  /**
   * Set the access token and schedule refresh
   */
  setToken(token: string, expiresInSeconds: number): void {
    this.accessToken = token
    this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000
    this.scheduleRefresh(expiresInSeconds)
  }

  /**
   * Get the current access token
   */
  getToken(): string | null {
    return this.accessToken
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true
    return Date.now() >= this.tokenExpiresAt - this.REFRESH_BUFFER_MS
  }

  /**
   * Clear token and cancel scheduled refresh
   */
  clearToken(): void {
    this.accessToken = null
    this.tokenExpiresAt = null
    this.cancelScheduledRefresh()
  }

  /**
   * Set callback for token refresh
   */
  setRefreshCallback(callback: TokenRefreshCallback): void {
    this.refreshCallback = callback
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleRefresh(expiresInSeconds: number): void {
    this.cancelScheduledRefresh()

    // Refresh 60 seconds before expiration
    const refreshIn = (expiresInSeconds * 1000) - this.REFRESH_BUFFER_MS

    if (refreshIn > 0) {
      this.refreshTimeoutId = setTimeout(async () => {
        if (this.refreshCallback) {
          try {
            const newToken = await this.refreshCallback()
            if (!newToken) {
              // Refresh failed, token will be cleared by the callback
              console.warn('Token refresh returned null')
            }
          } catch (error) {
            console.error('Scheduled token refresh failed:', error)
          }
        }
      }, refreshIn)
    }
  }

  /**
   * Cancel any scheduled refresh
   */
  private cancelScheduledRefresh(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId)
      this.refreshTimeoutId = null
    }
  }
}

// Singleton instance
export const tokenService = new TokenService()
```

### Step 2: Enhanced API Client (1 hour)

Update `src/lib/api-client.ts`:

```typescript
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { tokenService } from '@/features/auth/services/token-service'

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

// Request interceptor - attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
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
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  config: InternalAxiosRequestConfig
}> = []

const processQueue = (error: Error | null): void => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
    } else {
      // Retry with new token
      const token = tokenService.getToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      resolve(apiClient(config))
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Skip refresh for auth endpoints
    const isAuthEndpoint = originalRequest.url?.startsWith('/auth/')
    const isRefreshEndpoint = originalRequest.url === '/auth/refresh'

    // If 401 and not already retrying and not a refresh request
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        // Queue this request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint (cookie sent automatically)
        const response = await apiClient.post<{ accessToken: string; expiresIn: number }>(
          '/auth/refresh'
        )

        const { accessToken, expiresIn } = response.data
        tokenService.setToken(accessToken, expiresIn)

        processQueue(null)

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error)
        tokenService.clearToken()

        // Only redirect if not already on auth page
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/login'
        }

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

// Helper to set token from login response
export function setAuthToken(token: string, expiresIn: number): void {
  tokenService.setToken(token, expiresIn)
}

// Helper to clear token
export function clearAuthToken(): void {
  tokenService.clearToken()
}

// Helper to get current token
export function getAuthToken(): string | null {
  return tokenService.getToken()
}
```

### Step 3: Update Auth API (30 minutes)

Update `src/features/auth/api/auth-api.ts`:

```typescript
import { apiClient, setAuthToken, clearAuthToken } from '@/lib/api-client'
import { tokenService } from '../services/token-service'
import type {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  AuthResponse,
  MessageResponse,
  User,
} from '../types/auth-types'

export const authApi = {
  // Registration
  register: async (data: RegisterRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/register', data)
    return response.data
  },

  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    if (response.data.accessToken) {
      setAuthToken(response.data.accessToken, response.data.expiresIn)
    }
    return response.data
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      clearAuthToken()
    }
  },

  // Refresh token - returns new access token
  refresh: async (): Promise<AuthResponse | null> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh')
      if (response.data.accessToken) {
        setAuthToken(response.data.accessToken, response.data.expiresIn)
      }
      return response.data
    } catch {
      clearAuthToken()
      return null
    }
  },

  // Email verification
  verifyEmail: async (data: VerifyEmailRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/verify-email', data)
    return response.data
  },

  resendVerification: async (email: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/resend-verification', { email })
    return response.data
  },

  // Password reset
  forgotPassword: async (data: ForgotPasswordRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/forgot-password', data)
    return response.data
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/reset-password', data)
    return response.data
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },
}

// Set up refresh callback for automatic refresh
tokenService.setRefreshCallback(async () => {
  const result = await authApi.refresh()
  return result?.accessToken || null
})
```

### Step 4: Create Auth Initialization Hook (1 hour)

Create `src/features/auth/hooks/use-auth-init.ts`:

```typescript
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth-store'
import { authApi } from '../api/auth-api'

interface UseAuthInitReturn {
  isInitializing: boolean
  error: Error | null
}

/**
 * Hook to initialize auth state on app load
 * Attempts to refresh token and restore session
 */
export function useAuthInit(): UseAuthInitReturn {
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user, setUser, logout, setLoading } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      setLoading(true)

      try {
        // If we have persisted user data, try to restore session
        if (user) {
          // Attempt to refresh token (cookie should still be valid)
          const refreshResult = await authApi.refresh()

          if (refreshResult?.accessToken) {
            // Token refreshed, fetch fresh user data
            const freshUser = await authApi.getCurrentUser()
            setUser(freshUser)
          } else {
            // Refresh failed, clear session
            logout()
          }
        } else {
          // No persisted user, try refresh anyway (maybe returning user)
          const refreshResult = await authApi.refresh()

          if (refreshResult?.accessToken) {
            const freshUser = await authApi.getCurrentUser()
            setUser(freshUser)
          }
        }
      } catch (err) {
        // Silently fail - user will need to login
        console.debug('Auth initialization failed:', err)
        logout()
        setError(err instanceof Error ? err : new Error('Auth initialization failed'))
      } finally {
        setLoading(false)
        setIsInitializing(false)
      }
    }

    initializeAuth()
  }, []) // Only run once on mount

  return { isInitializing, error }
}
```

### Step 5: Create Auth Initializer Component (30 minutes)

Create `src/features/auth/components/auth-initializer.tsx`:

```tsx
import { ReactNode } from 'react'
import { useAuthInit } from '../hooks/use-auth-init'

interface AuthInitializerProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wraps app to handle auth initialization
 * Shows loading state while checking auth
 */
export function AuthInitializer({ children, fallback }: AuthInitializerProps): JSX.Element {
  const { isInitializing } = useAuthInit()

  if (isInitializing) {
    return (
      <>
        {fallback || (
          <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
```

### Step 6: Create Logout Hook (30 minutes)

Create `src/features/auth/hooks/use-logout.ts`:

```typescript
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { queryClient } from '@/lib/query-client'

interface UseLogoutReturn {
  logout: () => void
  isLoading: boolean
}

export function useLogout(): UseLogoutReturn {
  const navigate = useNavigate()
  const { logout: clearAuth } = useAuthStore()

  const mutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Always clear local state, even if API call fails
      clearAuth()
      // Clear all cached queries
      queryClient.clear()
      // Navigate to login
      navigate('/auth/login')
    },
  })

  return {
    logout: () => mutation.mutate(),
    isLoading: mutation.isPending,
  }
}
```

### Step 7: Update App Providers (30 minutes)

Update `src/providers/app-providers.tsx`:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'
import { queryClient } from '../lib/query-client'
import { Toaster } from '../components/ui/toaster'
import { AuthInitializer } from '@/features/auth/components/auth-initializer'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        {children}
      </AuthInitializer>
      <Toaster />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
```

### Step 8: Add Token Timing to Auth Store (30 minutes)

Update `src/features/auth/store/auth-store.ts`:

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
  pendingEmail?: string

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
      isLoading: true,
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
        user: state.user,
      }),
    }
  )
)

// Selector hooks for common patterns
export const useUser = (): User | null => useAuthStore((state) => state.user)
export const useIsAuthenticated = (): boolean => useAuthStore((state) => state.isAuthenticated)
export const useIsAuthLoading = (): boolean => useAuthStore((state) => state.isLoading)
```

### Step 9: Create useAuth Convenience Hook (15 minutes)

Create `src/features/auth/hooks/use-auth.ts`:

```typescript
import { useAuthStore, User } from '../store/auth-store'
import { useLogout } from './use-logout'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
  isLoggingOut: boolean
}

/**
 * Convenience hook for common auth operations
 */
export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { logout, isLoading: isLoggingOut } = useLogout()

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    isLoggingOut,
  }
}
```

---

## Todo List

- [x] Create TokenService class
- [x] Update API client interceptors
- [x] Update auth API with token helpers
- [x] Create useAuthInit hook
- [x] Create AuthInitializer component
- [x] Create useLogout hook
- [x] Update AppProviders with AuthInitializer
- [x] Add selector hooks to auth store
- [x] Create useAuth convenience hook
- [x] Test token storage in memory
- [x] Test auto-refresh before expiration
- [x] Test 401 handling with retry
- [x] Test request queuing during refresh
- [x] Test session restoration on page reload
- [x] Test logout clears all state

---

## Success Criteria

- [x] Access token never stored in localStorage
- [x] Token refresh happens before expiration
- [x] Failed requests retry after refresh
- [x] Multiple requests queue during refresh
- [x] Session restored after page reload
- [x] Logout clears all tokens and state
- [x] Redirect to login on refresh failure

---

## Security Considerations

- Access token in memory only (XSS mitigation)
- Refresh token in httpOnly cookie (backend responsibility)
- Token cleared on logout
- Redirect to login on auth failure
- No token logging in console

---

## Next Steps

After completion:
1. Move to Phase 4: OAuth Integration
2. Add OAuth callback handling
3. Test complete auth flows
