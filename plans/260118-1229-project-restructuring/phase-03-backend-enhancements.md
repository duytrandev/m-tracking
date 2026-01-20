# Phase 3: Backend Enhancements

## Context Links
- [Project Structure Review](/docs/project-structure-review.md#priority-6-backend-config--common-directories)
- [Backend Architecture](/docs/backend-architecture/index.md)
- [Code Standards - NestJS Patterns](/docs/code-standards.md#nestjs-patterns)

## Overview

| Item | Value |
|------|-------|
| Priority | P2 - High |
| Status | Pending |
| Effort | 3 hours |
| Dependencies | None (can run parallel with Phase 1) |

Add missing backend structure: `config/` for centralized configuration, `common/` for global guards/interceptors/pipes/filters, and `events/` for domain event system.

## Key Insights

1. **Existing shared/** directory contains Redis service
2. **Auth module** has guards, decorators - some should be global
3. **No centralized config** - ConfigModule used but not organized
4. **Event system missing** - needed for domain events (ADR references this)

## Requirements

### Functional
- F1: Create `config/` directory with app, database, jwt configs
- F2: Create `common/` directory with global guards, interceptors, pipes, filters
- F3: Create `events/` directory with event emitter service
- F4: Create `database/` module for TypeORM configuration
- F5: Install @nestjs/event-emitter package

### Non-Functional
- NF1: Files under 200 lines
- NF2: Maintain backward compatibility
- NF3: Follow NestJS best practices

## Architecture

### Backend Structure After Enhancement
```
services/backend/src/
├── config/                      # NEW - Centralized configuration
│   ├── index.ts                 # Barrel export
│   ├── app.config.ts            # App-level config
│   ├── database.config.ts       # Database config
│   ├── jwt.config.ts            # JWT config
│   ├── redis.config.ts          # Redis config
│   └── validation.schema.ts     # Zod/Joi validation schemas
├── common/                      # NEW - Global cross-cutting concerns
│   ├── index.ts                 # Barrel export
│   ├── guards/
│   │   ├── index.ts
│   │   └── throttle.guard.ts    # Rate limiting guard
│   ├── interceptors/
│   │   ├── index.ts
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   ├── index.ts
│   │   └── parse-uuid.pipe.ts
│   ├── filters/
│   │   ├── index.ts
│   │   └── http-exception.filter.ts
│   └── decorators/
│       ├── index.ts
│       └── api-response.decorator.ts
├── events/                      # NEW - Domain event system
│   ├── index.ts
│   ├── events.module.ts
│   ├── event-emitter.service.ts
│   └── domain-events/
│       ├── index.ts
│       ├── user-created.event.ts
│       ├── transaction-created.event.ts
│       └── budget-exceeded.event.ts
├── database/                    # NEW - Database module
│   ├── database.module.ts
│   └── typeorm.config.ts
├── auth/                        # Existing
├── shared/                      # Existing
└── ...
```

## Related Code Files

### Files to Create
- `services/backend/src/config/index.ts`
- `services/backend/src/config/app.config.ts`
- `services/backend/src/config/database.config.ts`
- `services/backend/src/config/jwt.config.ts`
- `services/backend/src/config/redis.config.ts`
- `services/backend/src/common/index.ts`
- `services/backend/src/common/guards/index.ts`
- `services/backend/src/common/guards/throttle.guard.ts`
- `services/backend/src/common/interceptors/index.ts`
- `services/backend/src/common/interceptors/logging.interceptor.ts`
- `services/backend/src/common/interceptors/transform.interceptor.ts`
- `services/backend/src/common/filters/index.ts`
- `services/backend/src/common/filters/http-exception.filter.ts`
- `services/backend/src/common/pipes/index.ts`
- `services/backend/src/common/decorators/index.ts`
- `services/backend/src/events/index.ts`
- `services/backend/src/events/events.module.ts`
- `services/backend/src/events/domain-events/index.ts`
- `services/backend/src/events/domain-events/user-created.event.ts`
- `services/backend/src/database/database.module.ts`

### Files to Modify
- `services/backend/src/app.module.ts` - Import new modules
- `services/backend/package.json` - Add @nestjs/event-emitter

## Implementation Steps

### Step 1: Install dependencies (5 min)

```bash
cd services/backend
pnpm add @nestjs/event-emitter @nestjs/throttler
```

### Step 2: Create config directory (30 min)

2.1 Create `config/app.config.ts`:
```typescript
import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}))
```

2.2 Create `config/database.config.ts`:
```typescript
import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'm_tracking',
  ssl: process.env.DB_SSL === 'true',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
}))
```

2.3 Create `config/jwt.config.ts`:
```typescript
import { registerAs } from '@nestjs/config'

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}))
```

2.4 Create `config/redis.config.ts`:
```typescript
import { registerAs } from '@nestjs/config'

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  cacheDb: parseInt(process.env.REDIS_CACHE_DB || '0', 10),
  queueDb: parseInt(process.env.REDIS_QUEUE_DB || '1', 10),
}))
```

2.5 Create `config/index.ts`:
```typescript
import appConfig from './app.config'
import databaseConfig from './database.config'
import jwtConfig from './jwt.config'
import redisConfig from './redis.config'

export const configModules = [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
]

export { default as appConfig } from './app.config'
export { default as databaseConfig } from './database.config'
export { default as jwtConfig } from './jwt.config'
export { default as redisConfig } from './redis.config'
```

### Step 3: Create common directory (45 min)

3.1 Create `common/filters/http-exception.filter.ts`:
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    const errorResponse = {
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message,
      error: typeof message === 'object' ? (message as any).error : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      exception instanceof Error ? exception.stack : undefined,
    )

    response.status(status).json(errorResponse)
  }
}
```

3.2 Create `common/interceptors/logging.interceptor.ts`:
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, body } = request
    const startTime = Date.now()

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse()
        const duration = Date.now() - startTime
        this.logger.log(
          `${method} ${url} ${response.statusCode} - ${duration}ms`,
        )
      }),
    )
  }
}
```

3.3 Create `common/interceptors/transform.interceptor.ts`:
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

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
```

3.4 Create `common/guards/throttle.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip
  }
}
```

3.5 Create barrel exports:

`common/filters/index.ts`:
```typescript
export * from './http-exception.filter'
```

`common/interceptors/index.ts`:
```typescript
export * from './logging.interceptor'
export * from './transform.interceptor'
```

`common/guards/index.ts`:
```typescript
export * from './throttle.guard'
```

`common/pipes/index.ts`:
```typescript
// Add custom pipes as needed
export {}
```

`common/decorators/index.ts`:
```typescript
// Add custom decorators as needed
export {}
```

`common/index.ts`:
```typescript
export * from './filters'
export * from './interceptors'
export * from './guards'
export * from './pipes'
export * from './decorators'
```

### Step 4: Create events directory (30 min)

4.1 Create `events/domain-events/user-created.event.ts`:
```typescript
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}
```

4.2 Create `events/domain-events/transaction-created.event.ts`:
```typescript
export class TransactionCreatedEvent {
  constructor(
    public readonly transactionId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly category: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}
```

4.3 Create `events/domain-events/budget-exceeded.event.ts`:
```typescript
export class BudgetExceededEvent {
  constructor(
    public readonly budgetId: string,
    public readonly userId: string,
    public readonly budgetAmount: number,
    public readonly currentSpending: number,
    public readonly exceededBy: number,
    public readonly triggeredAt: Date = new Date(),
  ) {}
}
```

4.4 Create `events/domain-events/index.ts`:
```typescript
export * from './user-created.event'
export * from './transaction-created.event'
export * from './budget-exceeded.event'
```

4.5 Create `events/events.module.ts`:
```typescript
import { Module, Global } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards for event names
      wildcard: true,
      // Delimiter for namespaced events
      delimiter: '.',
      // Show stack trace on errors
      verboseMemoryLeak: true,
      // Ignore errors from listeners
      ignoreErrors: false,
    }),
  ],
  exports: [EventEmitterModule],
})
export class EventsModule {}
```

4.6 Create `events/index.ts`:
```typescript
export * from './events.module'
export * from './domain-events'
```

### Step 5: Create database module (15 min)

5.1 Create `database/database.module.ts`:
```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        ssl: configService.get('database.ssl'),
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

### Step 6: Update app.module.ts (15 min)

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'

// Config
import { configModules } from './config'

// Infrastructure modules
import { DatabaseModule } from './database/database.module'
import { EventsModule } from './events'

// Common
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  TransformInterceptor,
  CustomThrottlerGuard,
} from './common'

// Feature modules
import { AuthModule } from './auth/auth.module'
import { SharedModule } from './shared/shared.module'
// ... other modules

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: configModules,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Infrastructure
    DatabaseModule,
    EventsModule,

    // Feature modules
    AuthModule,
    SharedModule,
    // ... other modules
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global response transformer
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

## Todo List

- [ ] Install @nestjs/event-emitter and @nestjs/throttler
- [ ] Create `config/app.config.ts`
- [ ] Create `config/database.config.ts`
- [ ] Create `config/jwt.config.ts`
- [ ] Create `config/redis.config.ts`
- [ ] Create `config/index.ts`
- [ ] Create `common/filters/http-exception.filter.ts`
- [ ] Create `common/interceptors/logging.interceptor.ts`
- [ ] Create `common/interceptors/transform.interceptor.ts`
- [ ] Create `common/guards/throttle.guard.ts`
- [ ] Create common barrel exports
- [ ] Create domain events (user-created, transaction-created, budget-exceeded)
- [ ] Create `events/events.module.ts`
- [ ] Create `database/database.module.ts`
- [ ] Update `app.module.ts`
- [ ] Run lint
- [ ] Run tests
- [ ] Run build

## Success Criteria

1. Config directory centralizes all configuration
2. Common directory contains reusable infrastructure
3. Events module enables domain event publishing
4. Database module properly configured
5. All existing tests pass
6. Backend starts without errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing config | Keep ConfigService usage, add organization |
| Event listener issues | Start with empty listeners, add gradually |
| Throttler conflicts | Configure per-route overrides |

## Security Considerations

- Config values from environment variables only
- Sensitive configs not logged
- Rate limiting prevents abuse
- Exception filter doesn't leak internal errors

## Next Steps

After completion:
1. Proceed to Phase 4: Shared Libraries
2. Add event listeners to feature modules
3. Migrate existing guards to common/
