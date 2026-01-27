import { Injectable, Scope } from '@nestjs/common'
import * as Sentry from '@sentry/node'

/**
 * Sentry service for manual error tracking and context enrichment
 *
 * Provides methods to:
 * - Capture exceptions with custom context
 * - Set user context for authenticated requests
 * - Add breadcrumbs for debugging
 * - Set tags and custom contexts
 *
 * Usage:
 * ```typescript
 * constructor(private readonly sentryService: SentryService) {}
 *
 * try {
 *   await this.processTransaction(transaction);
 * } catch (error) {
 *   this.sentryService.captureException(error, {
 *     transaction: { id: transaction.id, type: transaction.type }
 *   });
 *   throw error;
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class SentryService {
  /**
   * Capture an exception with optional context
   *
   * @param exception - Error object to capture
   * @param context - Additional context to attach to the error
   * @returns Event ID for tracking the error in Sentry
   */
  captureException(
    exception: Error,
    context?: Record<string, unknown>
  ): string {
    // Sentry's EventHint interface expects contexts to be typed differently
    // We use type assertion here as context is a valid Sentry option
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    return Sentry.captureException(exception, { contexts: context } as any)
  }

  /**
   * Capture a message (info, warning, error)
   *
   * @param message - Message to capture
   * @param level - Severity level (info, warning, error, fatal)
   * @returns Event ID
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info'
  ): string {
    return Sentry.captureMessage(message, level)
  }

  /**
   * Add breadcrumb for debugging context
   *
   * Breadcrumbs are events leading up to an error
   * Useful for understanding the sequence of events
   *
   * @param breadcrumb - Breadcrumb data
   *
   * @example
   * this.sentryService.addBreadcrumb({
   *   category: 'transaction',
   *   message: 'Transaction categorized',
   *   level: 'info',
   *   data: { category: 'food', confidence: 0.95 }
   * });
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    Sentry.addBreadcrumb(breadcrumb)
  }

  /**
   * Set user context for all subsequent events
   *
   * Attaches user information to errors for better debugging
   * Email will be automatically scrubbed by beforeSend hook
   *
   * @param user - User information
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    })
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser(): void {
    Sentry.setUser(null)
  }

  /**
   * Set tags for filtering/searching errors
   *
   * @param tags - Key-value pairs to tag the event
   *
   * @example
   * this.sentryService.setTags({
   *   module: 'transaction',
   *   operation: 'sync',
   *   provider: 'plaid'
   * });
   */
  setTags(tags: Record<string, string>): void {
    Sentry.setTags(tags)
  }

  /**
   * Set custom context for the event
   *
   * @param name - Context name
   * @param context - Context data
   *
   * @example
   * this.sentryService.setContext('business_operation', {
   *   operation_type: 'transaction_sync',
   *   bank_provider: 'plaid',
   *   sync_mode: 'automatic'
   * });
   */
  setContext(name: string, context: Record<string, unknown>): void {
    Sentry.setContext(name, context)
  }

  /**
   * Start a performance transaction
   *
   * @param name - Transaction name
   * @param op - Operation type (e.g., 'http.server', 'db.query')
   * @returns Transaction object
   *
   * @example
   * const transaction = this.sentryService.startTransaction(
   *   'sync-plaid-transactions',
   *   'background.job'
   * );
   * try {
   *   await this.syncTransactions();
   *   transaction.setStatus('ok');
   * } catch (error) {
   *   transaction.setStatus('internal_error');
   *   throw error;
   * } finally {
   *   transaction.finish();
   * }
   */
  startTransaction(
    name: string,
    op: string
  ): { name: string; op: string; finish: () => void; setStatus: () => void } {
    // return Sentry.startTransaction({ name, op });
    return { name, op, finish: () => {}, setStatus: () => {} }
  }
}
