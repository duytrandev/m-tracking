/**
 * Timing Attack Mitigation Utilities
 * Prevents timing-based user enumeration attacks
 */

const MIN_DELAY_MS = 10
const MAX_DELAY_MS = 50
const DEFAULT_MIN_TIME_MS = 200

/**
 * Add random delay to prevent timing attacks on email enumeration
 * Use in: forgotPassword, resendVerification, any email-based lookup
 */
export async function addTimingJitter(): Promise<void> {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Ensure minimum execution time to prevent timing-based user enumeration
 * Wraps async function to always take at least minTimeMs
 *
 * @param fn - Async function to wrap
 * @param minTimeMs - Minimum execution time (default: 200ms)
 * @returns Promise resolving to fn's result after minimum time
 *
 * @example
 * const result = await withMinimumTime(
 *   () => this.userService.findByEmail(email),
 *   200
 * )
 */
export async function withMinimumTime<T>(
  fn: () => Promise<T>,
  minTimeMs = DEFAULT_MIN_TIME_MS
): Promise<T> {
  const startTime = Date.now()
  const result = await fn()
  const elapsed = Date.now() - startTime

  if (elapsed < minTimeMs) {
    await new Promise(resolve => setTimeout(resolve, minTimeMs - elapsed))
  }

  return result
}
