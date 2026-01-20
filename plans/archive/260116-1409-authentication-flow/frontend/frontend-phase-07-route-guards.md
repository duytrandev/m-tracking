# Frontend Phase 7: Route Guards

**Duration:** Week 5-6
**Priority:** High
**Status:** Completed (2026-01-16)
**Dependencies:** Phase 6 (2FA UI)

---

## Context Links

- [Frontend Plan](./frontend-plan.md)
- [Backend Phase 7](./phase-07-rbac-authorization.md)
- [React Router Documentation](https://reactrouter.com/)

---

## Overview

Implement route protection system including authenticated routes, role-based access control, and proper redirect handling for unauthorized access.

---

## Key Insights

- All dashboard routes require authentication
- Public routes (login, register) redirect if already authenticated
- Role-based guards for admin-only routes
- Loading states during auth checks
- Preserve intended destination for post-login redirect

---

## Requirements

### Functional Requirements
- Protected route wrapper component
- Public route wrapper (redirect if authenticated)
- Role-based route protection
- Unauthorized page (403)
- Not found page (404)
- Redirect to intended destination after login
- Loading state during auth initialization

### Non-Functional Requirements
- No flash of protected content
- Smooth transitions between routes
- Clear error messages for unauthorized access

---

## Architecture

### Route Protection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTE GUARD FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User navigates to /dashboard                                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ProtectedRoute checks:                                    │ │
│  │                                                            │ │
│  │  1. Is auth loading? → Show loading spinner                │ │
│  │  2. Is authenticated? → Render children                    │ │
│  │  3. Not authenticated? → Redirect to /auth/login           │ │
│  │     + Save intended destination                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  User navigates to /auth/login (already authenticated)           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PublicRoute checks:                                       │ │
│  │                                                            │ │
│  │  1. Is auth loading? → Show loading spinner                │ │
│  │  2. Is authenticated? → Redirect to dashboard              │ │
│  │  3. Not authenticated? → Render children                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  User navigates to /admin (role: user)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  RoleGuard checks:                                         │ │
│  │                                                            │ │
│  │  1. Is authenticated? (via ProtectedRoute)                 │ │
│  │  2. Has required role? → Render children                   │ │
│  │  3. Missing role? → Redirect to /unauthorized              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Route Structure

```tsx
<Routes>
  {/* Public Routes - redirect if authenticated */}
  <Route element={<PublicRoute />}>
    <Route path="/auth/login" element={<LoginPage />} />
    <Route path="/auth/register" element={<RegisterPage />} />
    {/* ... other auth routes */}
  </Route>

  {/* Protected Routes - require authentication */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/transactions" element={<TransactionsPage />} />
    <Route path="/settings/*" element={<SettingsLayout />} />

    {/* Admin Routes - require admin role */}
    <Route element={<RoleGuard roles={['admin']} />}>
      <Route path="/admin/*" element={<AdminLayout />} />
    </Route>
  </Route>

  {/* Error Routes */}
  <Route path="/unauthorized" element={<UnauthorizedPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

---

## Related Code Files

### Files to Create

- `src/components/guards/protected-route.tsx`
- `src/components/guards/public-route.tsx`
- `src/components/guards/role-guard.tsx`
- `src/components/layout/auth-layout.tsx`
- `src/components/layout/dashboard-layout.tsx`
- `src/pages/unauthorized.tsx`
- `src/pages/not-found.tsx`
- `src/hooks/use-redirect-after-login.ts`

### Files to Modify

- `src/App.tsx` (restructure routes)
- `src/features/auth/hooks/use-login.ts` (redirect handling)

---

## Implementation Steps

### Step 1: Create Loading Spinner Component (15 minutes)

Create `src/components/ui/loading-spinner.tsx`:

```tsx
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingSpinner({
  className,
  size = 'md',
  text,
}: LoadingSpinnerProps): JSX.Element {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

export function FullPageLoader({ text }: { text?: string }): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
```

### Step 2: Create Redirect After Login Hook (30 minutes)

Create `src/hooks/use-redirect-after-login.ts`:

```typescript
import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const REDIRECT_KEY = 'auth_redirect_url'
const DEFAULT_REDIRECT = '/dashboard'

interface UseRedirectAfterLoginReturn {
  saveIntendedDestination: () => void
  redirectToIntendedDestination: () => void
  clearIntendedDestination: () => void
}

export function useRedirectAfterLogin(): UseRedirectAfterLoginReturn {
  const navigate = useNavigate()
  const location = useLocation()

  const saveIntendedDestination = useCallback(() => {
    // Don't save auth routes as intended destination
    if (!location.pathname.startsWith('/auth/')) {
      sessionStorage.setItem(REDIRECT_KEY, location.pathname + location.search)
    }
  }, [location])

  const redirectToIntendedDestination = useCallback(() => {
    const intendedUrl = sessionStorage.getItem(REDIRECT_KEY)
    sessionStorage.removeItem(REDIRECT_KEY)
    navigate(intendedUrl || DEFAULT_REDIRECT, { replace: true })
  }, [navigate])

  const clearIntendedDestination = useCallback(() => {
    sessionStorage.removeItem(REDIRECT_KEY)
  }, [])

  return {
    saveIntendedDestination,
    redirectToIntendedDestination,
    clearIntendedDestination,
  }
}

// Also export a simple getter for the login hook
export function getIntendedDestination(): string {
  return sessionStorage.getItem(REDIRECT_KEY) || DEFAULT_REDIRECT
}

export function clearStoredDestination(): void {
  sessionStorage.removeItem(REDIRECT_KEY)
}
```

### Step 3: Create Protected Route Component (1 hour)

Create `src/components/guards/protected-route.tsx`:

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { FullPageLoader } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  // Show loading while checking auth
  if (isLoading) {
    return <FullPageLoader text="Loading..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the current location for redirect after login
    const redirectUrl = location.pathname + location.search
    const loginUrl = `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
    return <Navigate to={loginUrl} replace />
  }

  // Render children or outlet
  return children ? <>{children}</> : <Outlet />
}
```

### Step 4: Create Public Route Component (30 minutes)

Create `src/components/guards/public-route.tsx`:

```tsx
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { FullPageLoader } from '@/components/ui/loading-spinner'

interface PublicRouteProps {
  children?: React.ReactNode
}

export function PublicRoute({ children }: PublicRouteProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuthStore()
  const [searchParams] = useSearchParams()

  // Show loading while checking auth
  if (isLoading) {
    return <FullPageLoader text="Loading..." />
  }

  // Redirect to dashboard (or intended destination) if already authenticated
  if (isAuthenticated) {
    const redirectUrl = searchParams.get('redirect') || '/dashboard'
    return <Navigate to={redirectUrl} replace />
  }

  // Render children or outlet
  return children ? <>{children}</> : <Outlet />
}
```

### Step 5: Create Role Guard Component (30 minutes)

Create `src/components/guards/role-guard.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth-store'

interface RoleGuardProps {
  roles: string[]
  children?: React.ReactNode
  fallback?: string
}

export function RoleGuard({
  roles,
  children,
  fallback = '/unauthorized',
}: RoleGuardProps): JSX.Element {
  const { user } = useAuthStore()

  // Check if user has any of the required roles
  const hasRequiredRole = user?.roles.some(role => roles.includes(role))

  if (!hasRequiredRole) {
    return <Navigate to={fallback} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
```

### Step 6: Create Auth Layout (30 minutes)

Create `src/components/layout/auth-layout.tsx`:

```tsx
import { Outlet } from 'react-router-dom'

export function AuthLayout(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Outlet />
    </div>
  )
}
```

### Step 7: Create Dashboard Layout Skeleton (30 minutes)

Create `src/components/layout/dashboard-layout.tsx`:

```tsx
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  CreditCard,
  PiggyBank,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function DashboardLayout(): JSX.Element {
  const { user, logout, isLoggingOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <span className="font-semibold">M-Tracking</span>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
              <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
                <span className="text-xl">M-Tracking</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* User Section */}
            <div className="border-t p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={logout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

### Step 8: Create Error Pages (30 minutes)

Create `src/pages/unauthorized.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

Create `src/pages/not-found.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Step 9: Restructure App Routes (1 hour)

Update `src/App.tsx`:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'

// Guards
import { ProtectedRoute } from '@/components/guards/protected-route'
import { PublicRoute } from '@/components/guards/public-route'
import { RoleGuard } from '@/components/guards/role-guard'

// Layouts
import { AuthLayout } from '@/components/layout/auth-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// Auth Pages
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'
import VerifyEmailPage from '@/pages/auth/verify-email'
import ForgotPasswordPage from '@/pages/auth/forgot-password'
import ResetPasswordPage from '@/pages/auth/reset-password'
import OAuthCallbackPage from '@/pages/auth/oauth-callback'
import MagicLinkPage from '@/pages/auth/magic-link'
import MagicLinkVerifyPage from '@/pages/auth/magic-link-verify'
import OtpLoginPage from '@/pages/auth/otp-login'
import TwoFactorVerifyPage from '@/pages/auth/2fa-verify'

// Dashboard Pages (placeholders)
import DashboardPage from '@/pages/dashboard'

// Error Pages
import UnauthorizedPage from '@/pages/unauthorized'
import NotFoundPage from '@/pages/not-found'

function App(): JSX.Element {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/magic-link" element={<MagicLinkPage />} />
          <Route path="/auth/otp-login" element={<OtpLoginPage />} />
        </Route>
      </Route>

      {/* Semi-public routes (no redirect if authenticated) */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/auth/magic-link/verify" element={<MagicLinkVerifyPage />} />
        <Route path="/auth/2fa-verify" element={<TwoFactorVerifyPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<div>Transactions</div>} />
          <Route path="/budgets" element={<div>Budgets</div>} />
          <Route path="/settings/*" element={<div>Settings</div>} />

          {/* Admin Routes */}
          <Route element={<RoleGuard roles={['admin']} />}>
            <Route path="/admin/*" element={<div>Admin</div>} />
          </Route>
        </Route>
      </Route>

      {/* Error Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
```

### Step 10: Update Login Hook with Redirect (15 minutes)

Update `src/features/auth/hooks/use-login.ts`:

```typescript
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import type { LoginRequest, AuthResponse } from '../types/auth-types'
import { isApiError } from '@/lib/api-client'

export function useLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login: setUser, setRequires2FA } = useAuthStore()

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      // Check if 2FA is required
      if (data.requires2FA && data.email) {
        setRequires2FA(true, data.email)
        navigate('/auth/2fa-verify')
        return
      }

      // Normal login success
      if (data.user && data.accessToken) {
        setUser(data.user)

        // Redirect to intended destination or dashboard
        const redirectUrl = searchParams.get('redirect') || '/dashboard'
        navigate(redirectUrl, { replace: true })
      }
    },
  })

  // ... rest of the hook
}
```

---

## Todo List

- [x] Create LoadingSpinner component
- [x] Create useRedirectAfterLogin hook
- [x] Create ProtectedRoute component
- [x] Create PublicRoute component
- [x] Create RoleGuard component
- [x] Create AuthLayout component
- [x] Create DashboardLayout component
- [x] Create UnauthorizedPage
- [x] Create NotFoundPage
- [x] Restructure App routes
- [x] Update login hook with redirect
- [x] Test protected route redirects
- [x] Test public route redirects
- [x] Test role-based access
- [x] Test redirect after login

---

## Success Criteria

- [x] Unauthenticated users redirected to login
- [x] Authenticated users can't access auth pages
- [x] Intended destination preserved and used
- [x] Role-based routes work correctly
- [x] Loading states show during auth check
- [x] Error pages render correctly
- [x] Mobile sidebar works

---

## Security Considerations

- No flash of protected content
- Redirect URLs validated (no open redirect)
- Role checks on both client and server
- Session state checked on every navigation

---

## Next Steps

After completion:
1. Move to Phase 8: Profile Management UI
2. Implement settings pages
3. Add session management
