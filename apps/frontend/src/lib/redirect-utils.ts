/**
 * Client-side redirect validation utilities
 * Prevents open redirect vulnerabilities in client-side navigation
 */

/**
 * Validate redirect URL for client-side navigation
 * Prevents open redirect vulnerabilities
 * 
 * @param url - The URL to validate
 * @returns true if URL is safe to redirect to, false otherwise
 */
export function validateRedirectUrl(url: string): boolean {
  // Must start with '/' but not '//' (prevent protocol-relative URLs)
  if (!url.startsWith('/') || url.startsWith('//')) {
    return false
  }

  // Check for protocol in URL (e.g., javascript:, data:, http://)
  if (url.includes('://')) {
    return false
  }

  // Prevent redirect to auth pages (would cause loops)
  const authPaths = ['/auth/login', '/auth/register', '/auth/logout']
  if (authPaths.some(path => url.startsWith(path))) {
    return false
  }

  // Check for encoded characters that might bypass validation
  try {
    const decoded = decodeURIComponent(url)
    if (decoded.includes('://') || decoded.startsWith('//')) {
      return false
    }
  } catch {
    // Invalid URL encoding
    return false
  }

  return true
}

/**
 * Get safe redirect URL from query parameter
 * Returns validated redirect URL or default fallback
 * 
 * @param redirectParam - The redirect parameter from URL (can be null/undefined)
 * @param fallback - Fallback URL if redirect is invalid (default: '/dashboard')
 * @returns Safe redirect URL
 */
export function getSafeRedirectUrl(
  redirectParam: string | null | undefined,
  fallback: string = '/dashboard'
): string {
  if (!redirectParam) {
    return fallback
  }

  if (validateRedirectUrl(redirectParam)) {
    return redirectParam
  }

  console.warn(`Invalid redirect URL blocked: ${redirectParam}`)
  return fallback
}

/**
 * Build login URL with safe redirect parameter
 * 
 * @param returnPath - The path to return to after login
 * @returns Login URL with redirect parameter if valid
 */
export function buildLoginUrl(returnPath?: string): string {
  const baseUrl = '/auth/login'
  
  if (!returnPath || !validateRedirectUrl(returnPath)) {
    return baseUrl
  }

  return `${baseUrl}?redirect=${encodeURIComponent(returnPath)}`
}

/**
 * Get redirect URL from search params (for use after login)
 * Returns validated redirect URL or default fallback
 * 
 * @param searchParams - URLSearchParams from Next.js useSearchParams hook
 * @param fallback - Fallback URL if redirect is invalid (default: '/dashboard')
 * @returns Safe redirect URL
 */
export function getRedirectUrl(
  searchParams: URLSearchParams,
  fallback: string = '/dashboard'
): string {
  const redirectParam = searchParams.get('redirect')
  return getSafeRedirectUrl(redirectParam, fallback)
}
