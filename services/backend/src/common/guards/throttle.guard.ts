import { ThrottlerGuard } from '@nestjs/throttler'
import { Injectable } from '@nestjs/common'

/**
 * Rate limiting guard
 *
 * Prevents abuse by limiting request rate per IP address.
 * Extends @nestjs/throttler guard with custom configuration.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // Custom implementation can be added here if needed
  // For now, using default ThrottlerGuard behavior
}
