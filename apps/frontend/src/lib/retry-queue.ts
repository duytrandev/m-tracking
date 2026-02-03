/**
 * Retry Queue with Exponential Backoff
 * Prevents unbounded queue growth and handles transient failures gracefully
 */

import { AuthErrorCode, type AuthErrorCodeType } from '@m-tracking/shared'

interface QueuedRequest<T> {
  resolve: (value: T) => void
  reject: (error: Error) => void
  retryFn: () => Promise<T>
  retryCount: number
  addedAt: number
}

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000
const MAX_QUEUE_SIZE = 50
const REQUEST_TIMEOUT_MS = 30000 // 30 seconds max wait time

/**
 * Error codes that are safe to retry
 */
const RETRYABLE_ERROR_CODES: AuthErrorCodeType[] = [
  AuthErrorCode.SERVICE_UNAVAILABLE,
  AuthErrorCode.RATE_LIMITED,
]

/**
 * Check if an error is retryable based on its code
 */
export function isRetryableError(
  errorCode: string | null | undefined
): boolean {
  if (!errorCode) return false
  return RETRYABLE_ERROR_CODES.includes(errorCode as AuthErrorCodeType)
}

/**
 * Retry Queue for handling transient network failures
 * - Limits queue size to prevent memory exhaustion
 * - Uses exponential backoff for retries
 * - Times out stale requests
 */
class RetryQueue {
  private queue: QueuedRequest<unknown>[] = []
  private isProcessing = false
  private pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set()

  /**
   * Enqueue a request for retry handling
   * @throws Error if queue is full
   */
  async enqueue<T>(retryFn: () => Promise<T>): Promise<T> {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      throw new Error('Request queue full. Please try again later.')
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        retryFn,
        retryCount: 0,
        addedAt: Date.now(),
      })
      void this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    const request = this.queue.shift()

    if (!request) {
      this.isProcessing = false
      return
    }

    // Check if request has timed out
    if (Date.now() - request.addedAt > REQUEST_TIMEOUT_MS) {
      request.reject(new Error('Request timed out in queue'))
      this.isProcessing = false
      void this.processQueue()
      return
    }

    try {
      const result = await request.retryFn()
      request.resolve(result)
    } catch (error) {
      const errorCode = (error as { code?: string }).code

      if (isRetryableError(errorCode) && request.retryCount < MAX_RETRIES) {
        request.retryCount++
        const delay = INITIAL_DELAY_MS * Math.pow(2, request.retryCount - 1)

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 100

        const timeoutId = setTimeout(() => {
          this.pendingTimeouts.delete(timeoutId)
          this.queue.unshift(request)
          void this.processQueue()
        }, delay + jitter)

        this.pendingTimeouts.add(timeoutId)
      } else {
        request.reject(error as Error)
      }
    }

    this.isProcessing = false
    void this.processQueue()
  }

  /**
   * Clear all pending requests and timeouts
   * Use when user logs out or session expires
   */
  clear(): void {
    // Clear all pending timeouts to prevent memory leaks
    this.pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
    this.pendingTimeouts.clear()

    this.queue.forEach(req => req.reject(new Error('Queue cleared')))
    this.queue = []
    this.isProcessing = false
  }

  /**
   * Get current queue size (for monitoring)
   */
  get size(): number {
    return this.queue.length
  }
}

/**
 * Singleton retry queue instance
 */
export const retryQueue = new RetryQueue()
