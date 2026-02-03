import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CryptoService } from './crypto/crypto.service'
import { RedisService } from './redis/redis.service'
import { LoggerService } from './logger/logger.service'
import { QueueService } from './queue/queue.service'

/**
 * Shared Module
 * Provides shared infrastructure services like Redis, Logger, Queue, Crypto
 * Global module - imported once and available everywhere
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, LoggerService, QueueService, CryptoService],
  exports: [RedisService, LoggerService, QueueService, CryptoService],
})
export class SharedModule {}
