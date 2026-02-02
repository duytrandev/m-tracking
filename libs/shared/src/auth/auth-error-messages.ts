import { AuthErrorCode, type AuthErrorCodeType } from './auth-error-codes'

/**
 * Fallback error messages for common scenarios
 */
export const GENERIC_ERROR_MESSAGE = 'An unexpected error occurred'
export const NETWORK_ERROR_MESSAGE =
  'Network error. Please check your connection.'

/**
 * Frontend-specific error UI configuration
 */
export interface FrontendErrorConfig {
  title: string
  hints: {
    email?: string
    password?: string
  }
  recovery?: {
    label: string
    href: string
  }
}

/**
 * Complete error message configuration for both backend and frontend
 */
export interface AuthErrorMessage {
  backend: string
  frontend: FrontendErrorConfig
}

/**
 * Centralized auth error messages for backend and frontend.
 * Single source of truth for all error messages across the platform.
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCodeType, AuthErrorMessage> =
  {
    [AuthErrorCode.INVALID_CREDENTIALS]: {
      backend: 'Invalid email or password',
      frontend: {
        title: 'Login failed',
        hints: {
          email: 'Double-check this email address is correct',
          password: 'Make sure your password is entered correctly',
        },
        recovery: {
          label: 'Forgot password?',
          href: '/auth/forgot-password',
        },
      },
    },

    [AuthErrorCode.EMAIL_NOT_VERIFIED]: {
      backend: 'Please verify your email first',
      frontend: {
        title: 'Email not verified',
        hints: {
          email:
            'Check your inbox for a verification email. Look in spam if needed.',
        },
        recovery: {
          label: 'Resend verification email',
          href: '/auth/verify-email',
        },
      },
    },

    [AuthErrorCode.EMAIL_ALREADY_REGISTERED]: {
      backend: 'Email already registered',
      frontend: {
        title: 'Email already registered',
        hints: {
          email: 'This email is already associated with an account',
        },
        recovery: {
          label: 'Try logging in instead',
          href: '/auth/login',
        },
      },
    },

    [AuthErrorCode.INVALID_TOKEN]: {
      backend: 'Invalid or expired token',
      frontend: {
        title: 'Invalid token',
        hints: {},
        recovery: {
          label: 'Request a new link',
          href: '/auth/forgot-password',
        },
      },
    },

    [AuthErrorCode.TOKEN_EXPIRED]: {
      backend: 'Token has expired',
      frontend: {
        title: 'Token expired',
        hints: {},
        recovery: {
          label: 'Request a new link',
          href: '/auth/forgot-password',
        },
      },
    },

    [AuthErrorCode.TOKEN_REVOKED]: {
      backend: 'Token has been revoked',
      frontend: {
        title: 'Token revoked',
        hints: {},
        recovery: {
          label: 'Request a new link',
          href: '/auth/forgot-password',
        },
      },
    },

    [AuthErrorCode.SESSION_EXPIRED]: {
      backend: 'Session expired',
      frontend: {
        title: 'Session expired',
        hints: {},
        recovery: {
          label: 'Log in again',
          href: '/auth/login',
        },
      },
    },

    [AuthErrorCode.SESSION_INVALID]: {
      backend: 'Invalid session',
      frontend: {
        title: 'Invalid session',
        hints: {},
        recovery: {
          label: 'Log in again',
          href: '/auth/login',
        },
      },
    },

    [AuthErrorCode.USER_NOT_FOUND]: {
      backend: 'User not found',
      frontend: {
        title: 'User not found',
        hints: {
          email: 'No account exists with this email',
        },
        recovery: {
          label: 'Create an account',
          href: '/auth/register',
        },
      },
    },

    [AuthErrorCode.REFRESH_TOKEN_MISSING]: {
      backend: 'Refresh token not found',
      frontend: {
        title: 'Session not found',
        hints: {},
        recovery: {
          label: 'Log in again',
          href: '/auth/login',
        },
      },
    },

    [AuthErrorCode.OAUTH_ACCOUNT_NOT_FOUND]: {
      backend: 'OAuth account not found',
      frontend: {
        title: 'OAuth account not found',
        hints: {},
        recovery: {
          label: 'Try a different sign-in method',
          href: '/auth/login',
        },
      },
    },

    [AuthErrorCode.OAUTH_EMAIL_CONFLICT]: {
      backend: 'Email is already associated with another account',
      frontend: {
        title: 'Email conflict',
        hints: {
          email:
            'This email is already registered with a different authentication method',
        },
        recovery: {
          label: 'Log in with your existing method',
          href: '/auth/login',
        },
      },
    },
  }

/**
 * Get backend error message for a given error code
 */
export function getBackendErrorMessage(code: AuthErrorCodeType): string {
  return AUTH_ERROR_MESSAGES[code].backend
}

/**
 * Get frontend error configuration for a given error code
 */
export function getFrontendErrorConfig(
  code: AuthErrorCodeType
): FrontendErrorConfig {
  return AUTH_ERROR_MESSAGES[code].frontend
}

/**
 * Unified auth failure info for consistent handling across frontend
 */
export interface AuthFailureInfo {
  message: string
  code: string | null
  fieldHints: {
    email?: string
    password?: string
    [key: string]: string | undefined
  }
  recoveryAction?: {
    label: string
    href: string
  }
}

/**
 * Create an AuthFailureInfo from error code and fallback message
 * Maps known error codes to user-friendly messages with field hints
 */
export function createAuthFailure(
  code: string | null,
  fallbackMessage: string
): AuthFailureInfo {
  if (
    code &&
    Object.values(AuthErrorCode).includes(code as AuthErrorCodeType)
  ) {
    const config = getFrontendErrorConfig(code as AuthErrorCodeType)
    return {
      message: config.title,
      code,
      fieldHints: config.hints,
      recoveryAction: config.recovery,
    }
  }
  return {
    message: fallbackMessage || GENERIC_ERROR_MESSAGE,
    code,
    fieldHints: {},
    recoveryAction: undefined,
  }
}
