/**
 * OAuth Error Humanizer
 * Converts technical OAuth errors to user-friendly messages
 * Maps internal error messages to understandable language
 */

/**
 * Map of technical OAuth errors to user-friendly messages
 */
const OAUTH_ERROR_MAP: Record<string, string> = {
  // PKCE errors
  'PKCE verifier not found':
    'Your login session was interrupted. Please try again.',
  'Invalid OAuth state - possible CSRF attack':
    'Login attempt interrupted. Please start over.',
  'State mismatch': 'Your login session expired. Please try again.',
  'code_verifier required': 'Login session data missing. Please try again.',

  // Provider errors
  access_denied: 'You cancelled the sign in. Try again when ready.',
  server_error: 'The sign in service is temporarily unavailable.',
  temporarily_unavailable:
    'Sign in is temporarily unavailable. Please try again.',
  invalid_request: 'Invalid sign in request. Please try again.',
  unauthorized_client: 'Authorization failed. Please contact support.',
  invalid_scope: 'Invalid permissions requested. Please try again.',
  consent_required: 'Please grant the required permissions to continue.',
  login_required: 'Please sign in to your account first.',
  account_selection_required: 'Please select an account to continue.',

  // Code errors
  'Invalid or expired code': 'Your login link has expired. Please try again.',
  'Code already used':
    'This login link was already used. Please sign in again.',
  invalid_grant: 'Login link expired or already used. Please try again.',

  // Email errors
  email_not_verified: 'Please verify your email with the provider first.',
}

/**
 * Convert technical OAuth error to user-friendly message
 * @param technicalError - The raw error message from OAuth
 * @returns Human-readable error message
 */
export function humanizeOAuthError(technicalError: string): string {
  // Normalize error string
  const normalizedError = technicalError.trim()

  // Check direct match
  if (OAUTH_ERROR_MAP[normalizedError]) {
    return OAUTH_ERROR_MAP[normalizedError]
  }

  // Check case-insensitive partial match
  const lowerError = normalizedError.toLowerCase()
  for (const [pattern, humanMessage] of Object.entries(OAUTH_ERROR_MAP)) {
    if (lowerError.includes(pattern.toLowerCase())) {
      return humanMessage
    }
  }

  // Default fallback - generic but helpful
  return 'Something went wrong during sign in. Please try again.'
}

/**
 * Parse URL error parameters from OAuth callback
 * @param searchParams - URLSearchParams from callback URL
 * @returns Humanized error message or null if no error
 */
export function parseOAuthCallbackError(
  searchParams: URLSearchParams
): string | null {
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (!error) return null

  // Use description if available, otherwise use error code
  const rawError = errorDescription || error
  return humanizeOAuthError(rawError)
}

/**
 * Provider display names for UI
 */
export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
}

/**
 * Get display name for OAuth provider
 */
export function getProviderDisplayName(provider: string): string {
  return PROVIDER_DISPLAY_NAMES[provider.toLowerCase()] || provider
}
