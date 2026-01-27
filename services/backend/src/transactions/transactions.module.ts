import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CacheModule } from '@nestjs/cache-manager'
import { redisStore } from 'cache-manager-redis-yet'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'
import { Transaction } from './entities/transaction.entity'
import { Category } from './entities/category.entity'

/**
 * Transactions Module
 * Handles transaction management, categorization, and spending analytics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Category]),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
          ttl: 300000, // 5 minutes default TTL in milliseconds
        }),
      }),
    }),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
// Module configuration is complete in decorator - no additional setup needed
export class TransactionsModule {}
