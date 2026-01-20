import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

/**
 * Transform interceptor
 *
 * Wraps all successful responses in a standard format.
 * Adds success flag and timestamp to responses.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    )
  }
}
