import type { User, Session } from '../entities'

// Re-export User for convenience
export type { User } from '../entities'

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * Login response payload
 */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
  expiresIn: number
}

/**
 * @deprecated Use LoginResponse instead
 */
export type AuthResponse = LoginResponse

/**
 * Register request payload
 */
export interface RegisterRequest {
  email: string
  password: string
  name: string
}

/**
 * Register response payload
 */
export interface RegisterResponse {
  user: User
  message: string
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string
  password: string
}

/**
 * Verify email request
 */
export interface VerifyEmailRequest {
  token: string
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Two-factor authentication enable request
 */
export interface Enable2FARequest {
  password: string
}

/**
 * Two-factor authentication enable response
 */
export interface Enable2FAResponse {
  qrCode: string
  secret: string
  backupCodes: string[]
}

/**
 * Two-factor authentication verify request
 */
export interface Verify2FARequest {
  code: string
}

/**
 * User sessions list response
 */
export interface SessionsResponse {
  sessions: Session[]
}

/**
 * Magic link request
 */
export interface MagicLinkRequest {
  email: string
}

/**
 * OTP request
 */
export interface OTPRequest {
  phone: string
}

/**
 * OTP verify request
 */
export interface OTPVerifyRequest {
  phone: string
  code: string
}

/**
 * Generic message response
 */
export interface MessageResponse {
  message: string
}

/**
 * Backup codes response
 */
export interface BackupCodesResponse {
  codes: string[]
}

/**
 * Session information detail
 */
export interface SessionInfo {
  id: string
  deviceInfo: {
    userAgent: string
    platform?: string
  }
  ipAddress: string
  lastActiveAt: string
  createdAt: string
  isCurrent: boolean
}

/**
 * Authentication error
 */
export interface AuthError {
  message: string
  statusCode: number
  error?: string
}

/**
 * Authentication flow state
 */
export type AuthFlowState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'requires_2fa'
  | 'requires_verification'

/**
 * OAuth provider type
 */
export type OAuthProvider = 'google' | 'github' | 'facebook'

/**
 * OAuth callback parameters
 */
export interface OAuthCallbackParams {
  access_token?: string
  expires_in?: string
  error?: string
  error_description?: string
}

/**
 * OAuth configuration for UI rendering
 */
export interface OAuthConfig {
  provider: OAuthProvider
  label: string
  icon: string
  bgColor: string
  textColor: string
  hoverBgColor: string
}
