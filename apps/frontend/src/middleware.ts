import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales } from './lib/i18n/request'
import {
  protectedRoutes,
  authRoutes,
  matchesRoute,
  hasAuthCookie,
  createLoginRedirect,
  createDashboardRedirect,
} from './lib/auth-middleware'

// i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'never',
})

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const hasAuth = hasAuthCookie(request)

  // Protected routes: redirect to login if no auth cookie
  if (matchesRoute(pathname, protectedRoutes)) {
    if (!hasAuth) {
      return createLoginRedirect(request)
    }
  }

  // Auth routes: redirect to dashboard if already authenticated
  if (matchesRoute(pathname, authRoutes)) {
    if (hasAuth) {
      // Check for redirect param
      const redirectTo = request.nextUrl.searchParams.get('redirect')
      if (redirectTo && redirectTo.startsWith('/')) {
        const url = request.nextUrl.clone()
        url.pathname = redirectTo
        url.searchParams.delete('redirect')
        return NextResponse.redirect(url)
      }
      return createDashboardRedirect(request)
    }
  }

  // Apply i18n middleware
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
