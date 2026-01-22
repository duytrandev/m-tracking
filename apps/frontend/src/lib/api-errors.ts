import axios from 'axios'

export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  code: ApiErrorCode
  message: string
  statusCode?: number
  details?: Record<string, unknown>
}

/**
 * Convert any error to a standardized AppError
 * Provides consistent error handling across the application
 */
export function createAppError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      // Network error
      if (error.code === 'ECONNABORTED') {
        return { code: ApiErrorCode.TIMEOUT, message: 'Request timed out' }
      }
      return { code: ApiErrorCode.NETWORK_ERROR, message: 'Network error' }
    }

    const status = error.response.status
    const message = error.response.data?.message || error.message

    switch (status) {
      case 401:
        return { code: ApiErrorCode.UNAUTHORIZED, message, statusCode: 401 }
      case 403:
        return { code: ApiErrorCode.FORBIDDEN, message, statusCode: 403 }
      case 404:
        return { code: ApiErrorCode.NOT_FOUND, message, statusCode: 404 }
      case 400:
      case 422:
        return {
          code: ApiErrorCode.VALIDATION,
          message,
          statusCode: status,
          details: error.response.data?.errors,
        }
      default:
        if (status >= 500) {
          return { code: ApiErrorCode.SERVER_ERROR, message, statusCode: status }
        }
        return { code: ApiErrorCode.UNKNOWN, message, statusCode: status }
    }
  }

  return {
    code: ApiErrorCode.UNKNOWN,
    message: error instanceof Error ? error.message : 'Unknown error',
  }
}
