import { useMemo } from 'react'
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import { isApiError, getApiErrorCode } from '@/lib/api-client'
import {
  type AuthFailureInfo,
  createAuthFailure,
  GENERIC_ERROR_MESSAGE,
} from '@m-tracking/shared'

/**
 * Parse error from mutation into AuthFailureInfo
 * Handles both API errors and generic errors
 */
function parseAuthError(
  error: unknown,
  fallbackMessage: string
): AuthFailureInfo {
  let errorCode: string | null = null
  let errorMessage = GENERIC_ERROR_MESSAGE

  if (isApiError(error)) {
    errorCode = getApiErrorCode(error) || null
    errorMessage = error.response?.data?.message || fallbackMessage
  } else if (error instanceof Error) {
    errorMessage = error.message || GENERIC_ERROR_MESSAGE
  }

  return createAuthFailure(errorCode, errorMessage)
}

/**
 * Enhanced return type that includes parsed AuthFailureInfo
 */
export interface UseAuthMutationReturn<TData, TVariables> extends Omit<
  UseMutationResult<TData, unknown, TVariables>,
  'error'
> {
  error: AuthFailureInfo | null
  rawError: unknown
}

/**
 * Wrapper hook for auth mutations that standardizes error handling
 * Eliminates duplicate error parsing logic across all auth hooks
 *
 * @param options - Standard useMutation options
 * @param fallbackMessage - Error message to use if API doesn't provide one
 * @returns Mutation result with parsed AuthFailureInfo error
 *
 * @example
 * ```typescript
 * const mutation = useAuthMutation(
 *   { mutationFn: authApi.login },
 *   'Login failed'
 * )
 * // mutation.error is now typed as AuthFailureInfo | null
 * // mutation.rawError is the original error for extracting additional data
 * ```
 */
export function useAuthMutation<TData, TVariables>(
  options: UseMutationOptions<TData, unknown, TVariables>,
  fallbackMessage: string
): UseAuthMutationReturn<TData, TVariables> {
  const mutation = useMutation(options)

  const error = useMemo(() => {
    if (!mutation.error) return null
    return parseAuthError(mutation.error, fallbackMessage)
  }, [mutation.error, fallbackMessage])

  return {
    ...mutation,
    error,
    rawError: mutation.error,
  }
}
