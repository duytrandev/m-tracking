/**
 * Token expiry time constants (in milliseconds)
 * Centralized configuration for all auth token expiry times
 */

// Session and refresh token expiry
export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Verification and reset token expiry
export const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000 // 1 hour
export const PASSWORD_SETUP_EXPIRY_MS = 60 * 60 * 1000 // 1 hour (same as reset)

// Access token expiry (in seconds for JWT)
export const ACCESS_TOKEN_EXPIRY_SECONDS = 900 // 15 minutes
