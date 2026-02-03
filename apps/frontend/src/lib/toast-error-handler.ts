import { useToastStore } from '@/components/ui/use-toast'
import { createAppError, ApiErrorCode, type AppError } from './api-errors'
import { isRetryableError } from './retry-queue'

/**
 * User-friendly error messages for each error code
 * Maps technical error codes to human-readable messages
 */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.NETWORK_ERROR]:
    'Unable to connect to server. Check your internet connection.',
  [ApiErrorCode.TIMEOUT]: 'Request timed out. Please try again.',
  [ApiErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
  [ApiErrorCode.FORBIDDEN]: "You don't have permission for this action.",
  [ApiErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ApiErrorCode.VALIDATION]: 'Please check your input and try again.',
  [ApiErrorCode.SERVER_ERROR]: 'Something went wrong. Please try again later.',
  [ApiErrorCode.UNKNOWN]: 'An unexpected error occurred.',
}

/**
 * Get user-friendly message for an error
 * Uses backend message if available, otherwise falls back to default
 */
function getErrorMessage(appError: AppError): string {
  // Use backend message if it's meaningful (not generic)
  if (
    appError.message &&
    appError.message !== 'Unknown error' &&
    appError.message !== 'Network error'
  ) {
    return appError.message
  }
  return ERROR_MESSAGES[appError.code]
}

interface ShowErrorOptions {
  customTitle?: string
  onRetry?: () => void
}

/**
 * Show error toast for any error
 * Converts error to AppError and displays appropriate toast
 * Supports retry action for retryable errors
 *
 * @param error - Any error (Axios, Error, or unknown)
 * @param options - Optional configuration (customTitle, onRetry callback)
 */
export function showErrorToast(
  error: unknown,
  options?: ShowErrorOptions | string
): void {
  const appError = createAppError(error)
  const message = getErrorMessage(appError)

  // Handle legacy string argument
  const opts: ShowErrorOptions =
    typeof options === 'string' ? { customTitle: options } : options || {}

  // Skip toast for auth errors that will trigger redirect
  if (appError.code === ApiErrorCode.UNAUTHORIZED) {
    return
  }

  // Check if error has a code from backend
  const errorCode = (error as { code?: string }).code
  const retryAfter = (error as { retryAfter?: number }).retryAfter

  // Build description with retry info if applicable
  let description = message
  if (retryAfter && isRetryableError(errorCode)) {
    const minutes = Math.ceil(retryAfter / 60)
    description = `${message} Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
  }

  useToastStore.getState().addToast({
    title: opts.customTitle || 'Error',
    description,
    variant: 'destructive',
    duration: isRetryableError(errorCode) ? 10000 : 5000,
  })
}

/**
 * React Query onError handler
 * Use this in useMutation/useQuery onError callbacks
 *
 * @example
 * useMutation({
 *   mutationFn: someApi,
 *   onError: createQueryErrorHandler('Failed to save')
 * })
 */
export function createQueryErrorHandler(customTitle?: string) {
  return (error: Error) => showErrorToast(error, { customTitle })
}

/**
 * Show success toast
 * Convenience function for success notifications
 */
export function showSuccessToast(title: string, description?: string): void {
  useToastStore.getState().addToast({
    title,
    description,
    variant: 'success',
  })
}

/**
 * Show warning toast
 * For non-critical issues that need user attention
 */
export function showWarningToast(title: string, description?: string): void {
  useToastStore.getState().addToast({
    title,
    description,
    variant: 'default',
    duration: 8000,
  })
}
