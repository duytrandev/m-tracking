/**
 * Token expiry time constants (in milliseconds)
 * Centralized configuration for all auth token expiry times
 */

import { AUTH_EXPIRY } from '@m-tracking/shared'

// Session and refresh token expiry
export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Verification and reset token expiry - sync with shared lib
export const EMAIL_VERIFICATION_EXPIRY_MS = AUTH_EXPIRY.EMAIL_VERIFICATION_MS
export const PASSWORD_RESET_EXPIRY_MS = AUTH_EXPIRY.PASSWORD_SETUP_MS // 1 hour
export const PASSWORD_SETUP_EXPIRY_MS = AUTH_EXPIRY.PASSWORD_SETUP_MS

// Access token expiry (in seconds for JWT)
export const ACCESS_TOKEN_EXPIRY_SECONDS = 900 // 15 minutes
