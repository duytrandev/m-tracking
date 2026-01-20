import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'

// Configuration
import { configModules } from './config'

// Infrastructure
import { DatabaseModule } from './database'
import { EventsModule } from './events'
import { SharedModule } from './shared/shared.module'
import { SentryModule } from './shared/sentry/sentry.module'

// Gateway (cross-cutting concerns)
import { GatewayModule } from './gateway/gateway.module'

// Domain modules
import { AuthModule } from './auth/auth.module'
import { TransactionsModule } from './transactions/transactions.module'
import { BankingModule } from './banking/banking.module'
import { BudgetsModule } from './budgets/budgets.module'
import { NotificationsModule } from './notifications/notifications.module'

@Module({
  imports: [
    // Configuration - Load config modules globally
    ConfigModule.forRoot({
      isGlobal: true,
      load: configModules,
      envFilePath: '.env',
    }),

    // Rate limiting - Global throttling
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),

    // Database - Centralized TypeORM configuration
    DatabaseModule,

    // Events - Domain event system
    EventsModule,

    // Shared infrastructure
    SharedModule,

    // Sentry - Error tracking and monitoring
    SentryModule,

    // Gateway (cross-cutting concerns)
    GatewayModule,

    // Domain modules
    AuthModule,
    TransactionsModule,
    BankingModule,
    BudgetsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
