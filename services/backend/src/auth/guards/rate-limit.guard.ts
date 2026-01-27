import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

/**
 * Rate limiting guard for sensitive auth endpoints
 * Extends NestJS ThrottlerGuard with custom logic
 */
@Injectable()
export class AuthRateLimitGuard extends ThrottlerGuard {
  // Default NestJS behavior: 10 requests per minute
  // Can be overridden with @Throttle() decorator on specific routes
}
