import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import {
  AuthErrorCode,
  type AuthErrorCodeType,
  getBackendErrorMessage,
} from '@m-tracking/shared'

interface AuthExceptionResponse {
  message: string
  code: AuthErrorCodeType
  error?: string
}

/**
 * Custom Auth Exception with error code for consistent frontend handling.
 */
export class AuthException extends HttpException {
  constructor(
    message: string,
    code: AuthErrorCodeType,
    status: HttpStatus = HttpStatus.UNAUTHORIZED
  ) {
    const response: AuthExceptionResponse = {
      message,
      code,
      error: HttpStatus[status],
    }
    super(response, status)
  }
}

/**
 * Factory functions for common auth exceptions
 */
export const AuthExceptions = {
  invalidCredentials: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.INVALID_CREDENTIALS),
      AuthErrorCode.INVALID_CREDENTIALS,
      HttpStatus.UNAUTHORIZED
    ),

  emailNotVerified: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.EMAIL_NOT_VERIFIED),
      AuthErrorCode.EMAIL_NOT_VERIFIED,
      HttpStatus.UNAUTHORIZED
    ),

  emailAlreadyRegistered: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.EMAIL_ALREADY_REGISTERED),
      AuthErrorCode.EMAIL_ALREADY_REGISTERED,
      HttpStatus.CONFLICT
    ),

  invalidToken: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.INVALID_TOKEN),
      AuthErrorCode.INVALID_TOKEN,
      HttpStatus.NOT_FOUND
    ),

  tokenExpired: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.TOKEN_EXPIRED),
      AuthErrorCode.TOKEN_EXPIRED,
      HttpStatus.UNAUTHORIZED
    ),

  tokenRevoked: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.TOKEN_REVOKED),
      AuthErrorCode.TOKEN_REVOKED,
      HttpStatus.UNAUTHORIZED
    ),

  sessionExpired: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.SESSION_EXPIRED),
      AuthErrorCode.SESSION_EXPIRED,
      HttpStatus.UNAUTHORIZED
    ),

  sessionInvalid: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.SESSION_INVALID),
      AuthErrorCode.SESSION_INVALID,
      HttpStatus.UNAUTHORIZED
    ),

  userNotFound: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.USER_NOT_FOUND),
      AuthErrorCode.USER_NOT_FOUND,
      HttpStatus.UNAUTHORIZED
    ),

  refreshTokenMissing: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.REFRESH_TOKEN_MISSING),
      AuthErrorCode.REFRESH_TOKEN_MISSING,
      HttpStatus.UNAUTHORIZED
    ),

  oauthAccountNotFound: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.OAUTH_ACCOUNT_NOT_FOUND),
      AuthErrorCode.OAUTH_ACCOUNT_NOT_FOUND,
      HttpStatus.UNAUTHORIZED
    ),

  oauthEmailConflict: (email: string) =>
    new AuthException(
      `Email ${email} is already associated with another account`,
      AuthErrorCode.OAUTH_EMAIL_CONFLICT,
      HttpStatus.CONFLICT
    ),

  passwordNotSet: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.PASSWORD_NOT_SET),
      AuthErrorCode.PASSWORD_NOT_SET,
      HttpStatus.UNAUTHORIZED
    ),

  passwordAlreadySet: () =>
    new AuthException(
      getBackendErrorMessage(AuthErrorCode.PASSWORD_ALREADY_SET),
      AuthErrorCode.PASSWORD_ALREADY_SET,
      HttpStatus.CONFLICT
    ),
}

// Re-export the standard NestJS exceptions for non-auth errors
export { UnauthorizedException, ConflictException, NotFoundException }
