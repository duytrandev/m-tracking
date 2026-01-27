import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { tokenService } from '@/features/auth/services/token-service'
import * as Sentry from '@sentry/nextjs'

/**
 * Auth event system for handling authentication state changes
 * Allows components to react to auth events without tight coupling
 */
type AuthEventType = 'logout' | 'session-expired'
const authEvents = new EventTarget()

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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Skip refresh for auth endpoints to prevent loops
    // const isAuthEndpoint = originalRequest.url?.startsWith('/auth/')
    const isRefreshEndpoint = originalRequest.url === '/auth/refresh'

    // If 401 and not already retrying and not a refresh request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshEndpoint
    ) {
      if (isRefreshing) {
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
          },
        },
        tags: {
          api_endpoint: error.config?.url?.split('?')[0], // URL without query params
          http_method: error.config?.method?.toUpperCase(),
          http_status: String(error.response.status),
        },
      })
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
}

/**
 * Type guard to check if error is an API error
 */
export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error)
}
