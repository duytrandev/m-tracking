import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

/**
 * Logging interceptor
 *
 * Logs all incoming requests and their response times.
 * Useful for monitoring API performance and debugging.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string
      url: string
    }>()
    const { method, url } = request
    const now = Date.now()

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now
        this.logger.log(`${method} ${url} +${responseTime}ms`)
      })
    )
  }
}
