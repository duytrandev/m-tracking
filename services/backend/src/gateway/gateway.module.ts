import { Module } from '@nestjs/common'

/**
 * Gateway Module
 * Handles cross-cutting concerns like authentication guards,
 * rate limiting, logging interceptors, and middleware
 */
@Module({
  providers: [],
  exports: [],
})
export class GatewayModule {}
