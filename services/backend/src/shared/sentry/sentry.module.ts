import { Module, Global } from '@nestjs/common'
import { SentryService } from './sentry.service'

/**
 * Sentry module for dependency injection
 *
 * Marked as @Global() to make SentryService available across all modules
 * without explicit imports
 *
 * Usage in other modules:
 * ```typescript
 * @Injectable()
 * export class TransactionService {
 *   constructor(private readonly sentryService: SentryService) {}
 *
 *   async processTransaction(transaction: Transaction) {
 *     try {
 *       // ... business logic ...
 *     } catch (error) {
 *       this.sentryService.captureException(error);
 *       throw error;
 *     }
 *   }
 * }
 * ```
 */
@Global()
@Module({
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {}
