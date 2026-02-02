/**
 * Auth error codes for consistent frontend-backend error handling.
 * Single source of truth for all authentication-related error codes.
 */
export const AuthErrorCode = {
  // Login errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

  // Registration errors
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',

  // Token errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',

  // Session errors
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',

  // OAuth errors
  OAUTH_ACCOUNT_NOT_FOUND: 'OAUTH_ACCOUNT_NOT_FOUND',
  OAUTH_EMAIL_CONFLICT: 'OAUTH_EMAIL_CONFLICT',

  // General
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',
} as const

export type AuthErrorCodeType =
  (typeof AuthErrorCode)[keyof typeof AuthErrorCode]
