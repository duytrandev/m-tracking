import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { ApiResponse } from '@m-tracking/shared'

// Re-export for backwards compatibility
export type { ApiResponse } from '@m-tracking/shared'

/**
 * Transform interceptor
 *
 * Wraps all successful responses in a standard format.
 * Adds success flag and timestamp to responses.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      }))
    )
  }
}
