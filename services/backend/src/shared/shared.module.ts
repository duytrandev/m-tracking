import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RedisService } from './redis/redis.service'
import { LoggerService } from './logger/logger.service'
import { QueueService } from './queue/queue.service'

/**
 * Shared Module
 * Provides shared infrastructure services like Redis, Logger, Queue
 * Global module - imported once and available everywhere
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, LoggerService, QueueService],
  exports: [RedisService, LoggerService, QueueService],
})
export class SharedModule {}
