/**
 * Redirect URL validation utilities
 * Prevents open redirect vulnerabilities
 */

/**
 * Validate a redirect URL to prevent open redirect attacks
 *
 * Security checks:
 * - Must start with '/' (relative path)
 * - Cannot start with '//' (protocol-relative URL)
 * - Cannot contain protocol (http://, https://, etc.)
 * - Cannot navigate to auth pages (prevent loops)
 *
 * @param url - The redirect URL to validate
 * @param defaultUrl - Default URL if validation fails (default: '/dashboard')
 * @returns Validated safe URL
 */
export function validateRedirectUrl(url: string | null, defaultUrl = '/dashboard'): string {
  // No URL provided
  if (!url) {
    return defaultUrl
  }

  // Must start with '/' but not '//' (prevent protocol-relative URLs)
  if (!url.startsWith('/') || url.startsWith('//')) {
    return defaultUrl
  }

  // Check for protocol in URL (http://, https://, ftp://, etc.)
  if (url.includes('://')) {
    return defaultUrl
  }

  // Prevent redirect to auth pages (would cause loops)
  const authPaths = ['/auth/login', '/auth/register', '/auth/logout']
  if (authPaths.some(path => url.startsWith(path))) {
    return defaultUrl
  }

  return url
}

/**
 * Get redirect URL from search params or return default
 * Automatically validates the URL for security
 *
 * @param searchParams - URLSearchParams from useSearchParams()
 * @param defaultUrl - Default URL if no redirect param (default: '/dashboard')
 * @returns Validated safe redirect URL
 */
export function getRedirectUrl(searchParams: URLSearchParams | null, defaultUrl = '/dashboard'): string {
  const redirect = searchParams?.get('redirect') ?? null
  return validateRedirectUrl(redirect, defaultUrl)
}
