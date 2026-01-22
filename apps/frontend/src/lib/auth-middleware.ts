import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate redirect URL for middleware (server-side)
 * Prevents open redirect vulnerabilities
 */
function validateRedirectUrl(url: string): boolean {
  // Must start with '/' but not '//' (prevent protocol-relative URLs)
  if (!url.startsWith('/') || url.startsWith('//')) {
    return false
  }

  // Check for protocol in URL
  if (url.includes('://')) {
    return false
  }

  // Prevent redirect to auth pages (would cause loops)
  const authPaths = ['/auth/login', '/auth/register', '/auth/logout']
  if (authPaths.some(path => url.startsWith(path))) {
    return false
  }

  return true
}

/**
 * Routes that require authentication
 */
export const protectedRoutes = [
  '/dashboard',
  '/transactions',
  '/settings',
  '/budgets',
  '/accounts',
  '/reports',
]

/**
 * Routes that are only for unauthenticated users
 */
export const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
]

/**
 * Routes that are always public
 */
export const publicRoutes = [
  '/',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/oauth/callback',
  '/auth/magic-link/verify',
  '/auth/2fa-verify',
]

/**
 * Check if path matches any route pattern
 */
export function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route.endsWith('*')) {
      return path.startsWith(route.slice(0, -1))
    }
    return path === route || path.startsWith(route + '/')
  })
}

/**
 * Check if user has refresh token cookie
 * This doesn't validate the token, just checks existence
 */
export function hasAuthCookie(request: NextRequest): boolean {
  const refreshToken = request.cookies.get('refreshToken')
  return !!refreshToken?.value
}

/**
 * Create redirect to login with return URL
 * Validates redirect URL for security
 */
export function createLoginRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  const returnPath = url.pathname + url.search

  // Only set redirect param if it's a valid path
  if (validateRedirectUrl(returnPath)) {
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', returnPath)
    return NextResponse.redirect(url)
  }

  // Invalid path, redirect to login without redirect param
  url.pathname = '/auth/login'
  url.search = ''
  return NextResponse.redirect(url)
}

/**
 * Create redirect to dashboard (for auth pages when logged in)
 */
export function createDashboardRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'
  url.searchParams.delete('redirect')
  return NextResponse.redirect(url)
}
