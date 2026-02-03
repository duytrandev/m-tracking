import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { tokenService } from '@/features/auth/services/token-service'
import * as Sentry from '@sentry/nextjs'
import { showErrorToast } from './toast-error-handler'
import { type AuthErrorCodeType } from '@m-tracking/shared'

/**
 * Auth event system for handling authentication state changes
 * Allows components to react to auth events without tight coupling
 */
type AuthEventType = 'logout' | 'session-expired'
const authEvents = new EventTarget()

/**
 * Error response structure from backend
 */
interface ApiErrorResponse {
  message?: string
  code?: AuthErrorCodeType
  error?: string
  retryAfter?: number
}

export function onAuthEvent(
  type: AuthEventType,
  callback: () => void
): () => void {
  const handler = () => callback()
  authEvents.addEventListener(type, handler)
  return () => authEvents.removeEventListener(type, handler)
}

function emitAuthEvent(type: AuthEventType): void {
  authEvents.dispatchEvent(new Event(type))
}

const API_BASE_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
    : process.env.API_URL || 'http://localhost:4000/api/v1'

/**
 * Create axios instance with base configuration
 * Includes timeout, default headers, and credentials support
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests for refresh token
})

/**
 * Helper functions for token management
 * Delegates to TokenService for centralized token handling
 */
export function setAuthToken(token: string, expiresIn: number): void {
  tokenService.setToken(token, expiresIn)
}

export function clearAuthToken(): void {
  tokenService.clearToken()
}

export function getAuthToken(): string | null {
  return tokenService.getToken()
}

/**
 * Request interceptor
 * Attaches access token to Authorization header if available
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor with automatic token refresh
 * Handles 401 errors by attempting to refresh the access token
 */
let isRefreshing = false

// Limit queue size to prevent memory exhaustion during refresh storms
const MAX_FAILED_QUEUE_SIZE = 100

let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: Error) => void
}> = []

const processQueue = (
  error: Error | null,
  token: string | null = null
): void => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error)
    } else if (token) {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const errorData = error.response?.data

    // Skip refresh for public auth endpoints to prevent loops and preserve error codes
    // Only skip for endpoints that don't require authentication (login, register, etc.)
    // Protected auth endpoints like /auth/me should still use refresh logic
    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/auth/resend-verification',
      '/auth/magic-link',
      '/auth/otp',
      '/auth/oauth/exchange',
      '/auth/2fa/validate',
    ]
    const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint =>
      originalRequest.url?.startsWith(endpoint)
    )

    // If 401 and not already retrying and not a public auth endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthEndpoint
    ) {
      if (isRefreshing) {
        // Prevent unbounded queue growth during refresh storms
        if (failedQueue.length >= MAX_FAILED_QUEUE_SIZE) {
          return Promise.reject(
            new Error('Too many concurrent requests during token refresh')
          )
        }

        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(apiClient(originalRequest))
            },
            reject: (err: Error) => {
              reject(err)
            },
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint (cookie sent automatically)
        const response = await apiClient.post<{
          accessToken: string
          expiresIn: number
        }>('/auth/refresh')
        const { accessToken, expiresIn } = response.data

        tokenService.setToken(accessToken, expiresIn)
        processQueue(null, accessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        tokenService.clearToken()

        // Emit event instead of redirecting (allows React Router to handle navigation)
        emitAuthEvent('session-expired')

        return Promise.reject(
          new Error(
            refreshError instanceof Error
              ? refreshError.message
              : 'Token refresh failed'
          )
        )
      } finally {
        isRefreshing = false
      }
    }

    // Capture API errors in Sentry (except auth errors which are expected)
    if (error.response && ![401, 403].includes(error.response.status)) {
      Sentry.captureException(error, {
        contexts: {
          api: {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            status: error.response.status,
            statusText: error.response.statusText,
            baseURL: error.config?.baseURL,
            errorCode: errorData?.code,
          },
        },
        tags: {
          api_endpoint: error.config?.url?.split('?')[0], // URL without query params
          http_method: error.config?.method?.toUpperCase(),
          http_status: String(error.response.status),
          error_code: errorData?.code,
        },
      })
    }

    // Show error toast for API errors (except 401 which triggers auth flow)
    if (error.response?.status !== 401) {
      showErrorToast(error)
    }

    // Create enhanced error with code for downstream handlers
    if (errorData?.code) {
      const enhancedError = new Error(
        errorData.message || error.message
      ) as Error & {
        code?: string
        retryAfter?: number
      }
      enhancedError.code = errorData.code
      if (errorData.retryAfter) {
        enhancedError.retryAfter = errorData.retryAfter
      }
      return Promise.reject(enhancedError)
    }

    return Promise.reject(error)
  }
)

/**
 * API error type for consistent error handling
 */
export interface ApiError {
  message: string
  statusCode: number
  error?: string
  code?: string
}

/**
 * Type guard to check if error is an API error
 */
export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error)
}

/**
 * Extract error code from API error response
 */
export function getApiErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.response?.data?.code
  }
  return undefined
}
