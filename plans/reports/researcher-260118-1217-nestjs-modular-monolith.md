# Research Report: NestJS Modular Monolith Architecture Best Practices 2026

**Research Date:** 2026-01-18
**Status:** Comprehensive Analysis
**Focus:** Production-Ready Scalable Architecture

---

## Executive Summary

NestJS modular monolith architecture has matured into a robust, battle-tested pattern for building scalable backend systems. Key findings indicate that successful implementations emphasize **Domain-Driven Design (DDD) principles**, **feature-based module organization**, and **strict encapsulation boundaries**. The ecosystem has evolved with official support for Prisma (2024), new AI integration module, and K8s-ready cloud-native patterns. Architecture patterns leverage NestJS's built-in dependency injection to maintain loose coupling while preserving the operational simplicity of a single deployment unit—critical for teams balancing scalability with deployment complexity.

---

## Research Methodology

- **Sources Consulted:** 12+ authoritative sources (official docs, community projects, production templates)
- **Date Range:** 2024-2026 (current ecosystem standards)
- **Key Search Terms:** modular monolith, DDD, module boundaries, feature-based organization, CQRS, event-driven patterns
- **Primary Focus:** Production-ready patterns, not experimental approaches

---

## Key Findings

### 1. Architecture Overview

A **modular monolith** is a single deployable unit structured into independent, feature-driven modules with clear boundaries aligned to business domains (bounded contexts). This pattern bridges traditional monoliths and microservices—avoiding premature distribution complexity while maintaining loose coupling that enables future extraction.

**NestJS Advantages for Modular Monoliths:**
- Native module system with explicit encapsulation (`exports`, `providers` scoping)
- Dependency injection container manages lifecycle, testability, and circular dependency detection
- Decorator-based metadata simplifies boilerplate relative to manual DI frameworks
- Built-in support for guards, interceptors, pipes, filters at module/route levels
- TypeScript native—catches integration errors at compile time

### 2. Module Organization Patterns

#### 2.1 Feature Modules (Domain-Based)
**Organizing principle:** Each business domain/feature gets a dedicated top-level module.

**Examples:** `UsersModule`, `ProductsModule`, `OrdersModule`, `AuthModule`, `PaymentsModule`

**Internal Structure (Standardized):**
```
src/users/
├── controllers/
│   └── users.controller.ts          # HTTP handlers
├── services/
│   ├── users.service.ts             # Business logic
│   └── user-registration.service.ts # Feature-specific logic
├── repositories/
│   └── user.repository.ts           # Data access abstraction
├── entities/
│   └── user.entity.ts               # Database/domain entity
├── dtos/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── guards/ (optional)
│   └── user-ownership.guard.ts      # Feature-specific auth
├── interceptors/ (optional)
│   └── user-audit.interceptor.ts
└── users.module.ts                  # Module definition
```

**Key Principle:** Depth limit of 3-4 levels; descriptive names allow grep-based navigation.

#### 2.2 Shared Modules
**Purpose:** Prevent duplication of truly generic, non-domain-specific logic.

**Examples:** `LoggerModule`, `ConfigModule`, `ValidationModule`, `UtilsModule`, `DatabaseModule`

**Caution:** Shared modules must not contain business logic. Business-specific functionality belongs in feature modules. Overuse creates hidden coupling.

**Pattern:**
```typescript
// src/shared/logger/logger.module.ts
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
```

Use `@Global()` sparingly—only for truly application-wide services like logging or config.

#### 2.3 Core Modules (Infrastructure/Common)
**Purpose:** Application foundation—configuration, database connections, global middleware.

**Examples:**
- `ConfigModule` (environment variables, secrets)
- `DatabaseModule` (ORM setup, connection pooling)
- `AuthModule` (JWT validation, passport strategies)
- `ExceptionsModule` (global error handlers)

**Pattern:**
```typescript
// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
      validate: validateEnv, // Custom validation
    }),
  ],
})
export class AppConfigModule {}
```

**Note:** Register core modules in `AppModule.imports` once to make globally available.

### 3. Directory Structure (Production Baseline)

```
src/
├── main.ts                          # Entry point
├── app.module.ts                    # Root module
│
├── modules/                         # Feature modules (domain-driven)
│   ├── users/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── entities/
│   │   ├── dtos/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── users.module.ts
│   ├── products/
│   ├── orders/
│   ├── auth/                        # Auth often isolated due to cross-cutting nature
│   └── payments/
│
├── shared/                          # Cross-module utilities (genuinely shared)
│   ├── logger/
│   │   ├── logger.service.ts
│   │   ├── logger.module.ts
│   │   └── types/
│   ├── validation/
│   ├── decorators/
│   │   ├── api-response.decorator.ts
│   │   ├── role-guard.decorator.ts
│   │   └── validate-input.decorator.ts
│   └── shared.module.ts             # Aggregates shared exports
│
├── common/                          # Global NestJS middleware/utilities
│   ├── guards/
│   │   ├── jwt.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── error-handling.interceptor.ts
│   ├── pipes/
│   │   ├── validation.pipe.ts
│   │   └── parse-id.pipe.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── decorators/
│
├── config/                          # Configuration management
│   ├── app.config.ts               # Core app settings
│   ├── database.config.ts          # ORM setup
│   ├── validation.schema.ts        # Env validation
│   └── app.config.module.ts
│
├── database/                        # Data persistence layer
│   ├── data-source.ts              # TypeORM/Prisma config
│   ├── migrations/
│   │   ├── 1699564800000-InitialSchema.ts
│   │   └── 1699565000000-AddUserRole.ts
│   └── seeders/                    # Optional: test/demo data
│
├── types/                           # Global TypeScript types
│   ├── api.types.ts
│   ├── domain.types.ts
│   └── environment.types.ts
│
├── utils/                           # Generic utilities (no DI needed)
│   ├── date.utils.ts
│   ├── string.utils.ts
│   ├── array.utils.ts
│   └── constants.ts
│
└── events/                          # Event publishing infrastructure
    ├── event-emitter.service.ts    # Domain event system
    ├── events.module.ts
    └── domain-events/
        ├── user-created.event.ts
        └── product-updated.event.ts
```

**Critical Principle:** Keep root `src/` shallow. Nest complexity within feature modules.

### 4. Dependency Injection Patterns

#### 4.1 Constructor Injection (Standard)
```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService, // From shared module
    private readonly logger: LoggerService,      // From shared module
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.save(dto);
    this.logger.log(`User created: ${user.id}`);
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}
```

**Benefits:**
- Explicit dependencies—test code reads like documentation
- Type-safe—compile-time validation
- Easy mocking—pass test doubles in constructor during testing
- Circular dependency detection—NestJS fails fast

#### 4.2 Module Scope (Default Behavior)
Providers are **module-scoped** by default. Not accessible outside module unless explicitly exported.

```typescript
// src/products/products.module.ts
@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,          // INTERNAL—not exported
    ProductValidationService,   // INTERNAL
  ],
  exports: [ProductsService],   // ONLY export what external modules need
})
export class ProductsModule {}
```

**Pattern:** Export only public APIs (main service). Keep repositories, validators internal.

#### 4.3 Abstract Dependencies (Inversion of Control)
Depend on interfaces, not implementations. Critical for swappable, testable code.

```typescript
// src/shared/email/email.interface.ts
export interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

// src/shared/email/email.service.ts
@Injectable()
export class EmailService implements IEmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    // Real implementation
  }
}

// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject('EMAIL_SERVICE') private readonly emailService: IEmailService,
  ) {}
}

// src/shared/email/email.module.ts
@Module({
  providers: [
    {
      provide: 'EMAIL_SERVICE',
      useClass: EmailService, // Easily swap to MockEmailService in tests
    },
  ],
  exports: ['EMAIL_SERVICE'],
})
export class EmailModule {}
```

#### 4.4 Request-Scoped Providers (When Needed)
Avoid shared mutable state. For stateful operations, use request scope.

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private userId: string;

  setUserId(id: string) {
    this.userId = id;
  }

  getUserId(): string {
    return this.userId;
  }
}
```

**Note:** Transient scope (`Scope.TRANSIENT`) creates new instance per injection. Rarely needed; default Singleton is sufficient.

### 5. Shared Infrastructure Patterns

#### 5.1 Database Module (Centralized ORM Setup)
```typescript
// src/config/database.config.ts
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmAsyncOptions: TypeOrmModuleAsyncOptions = {
  useFactory: async (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [__dirname + '/../**/entities/*.entity{.ts,.js}'],
    synchronize: false, // Use migrations only in production
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsTableName: '_migrations',
  }),
  inject: [ConfigService],
};

// src/config/database.module.ts
@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeOrmAsyncOptions),
  ],
})
export class DatabaseModule {}
```

**Pattern:** Externalize config to `ConfigService`, not hardcoded values.

#### 5.2 Logging Module (Global Infrastructure)
```typescript
// src/shared/logger/logger.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService {
  private logger = new Logger('App');

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }
}

// src/shared/logger/logger.module.ts
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
```

Inject `LoggerService` into any provider. `@Global()` avoids repetitive imports.

#### 5.3 Configuration Management
```typescript
// src/config/validation.schema.ts
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validate } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  DB_HOST: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  JWT_SECRET: string;
}

export async function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = await validate(validatedConfig);
  if (errors.length > 0) {
    throw new Error(
      `Env validation failed: ${JSON.stringify(
        errors.map((e) => e.constraints),
      )}`,
    );
  }
  return validatedConfig;
}

// src/config/app.config.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
```

### 6. Module Boundaries & Responsibilities

#### 6.1 Encapsulation by Default
```typescript
// ❌ BAD: Exposing internal implementation
@Module({
  providers: [ProductsService, ProductRepository, ProductValidator],
  exports: [ProductsService, ProductRepository, ProductValidator], // Too much leaked
})
export class ProductsModule {}

// ✅ GOOD: Only public API exported
@Module({
  providers: [ProductsService, ProductRepository, ProductValidator],
  exports: [ProductsService], // Only service; repo/validator internal
})
export class ProductsModule {}
```

#### 6.2 Clear Responsibilities
Each module should have **one reason to change**:
- `UsersModule` → User management (CRUD, role assignment)
- `AuthModule` → Authentication/authorization (JWT, OAuth, guards)
- `ProductsModule` → Product catalog (inventory, pricing)
- `OrdersModule` → Orders (fulfillment, status tracking)

**Anti-pattern:** Don't combine authentication + users. Keep separate.

#### 6.3 Avoiding Circular Dependencies
```typescript
// ❌ BAD: Circular dependency
// UsersModule imports OrdersModule, OrdersModule imports UsersModule

// ✅ GOOD: Extracted domain event
// Both modules listen to UserCreatedEvent via event emitter (decoupled)

@EventEmitter2()
export class UserRegistrationService {
  constructor(private eventEmitter: EventEmitter2) {}

  async register(dto: CreateUserDto): Promise<User> {
    const user = await this.usersRepository.save(dto);
    this.eventEmitter.emit('user.created', new UserCreatedEvent(user.id));
    return user;
  }
}

@OnEvent('user.created')
export class CreateWelcomeOrderHandler {
  async handle(event: UserCreatedEvent) {
    await this.ordersService.createWelcomeOrder(event.userId);
  }
}
```

#### 6.4 Using `forwardRef()` (Last Resort)
```typescript
// Only if circular dependency unavoidable
@Module({
  imports: [
    forwardRef(() => OrdersModule),
  ],
})
export class UsersModule {}

@Module({
  imports: [
    forwardRef(() => UsersModule),
  ],
})
export class OrdersModule {}
```

**Note:** If you need `forwardRef()`, design likely needs review.

### 7. Integration Patterns

#### 7.1 Inter-Module Communication via Services
```typescript
// src/orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    private readonly usersService: UsersService, // Injected from UsersModule
    private readonly productsService: ProductsService,
  ) {}

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    // Validate user exists
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Validate products
    for (const item of items) {
      const product = await this.productsService.findById(item.productId);
      if (!product) throw new NotFoundException(`Product not found`);
    }

    return this.ordersRepository.save({
      userId,
      items,
      status: 'pending',
    });
  }
}

// src/users/users.module.ts
@Module({
  providers: [UsersService, UserRepository],
  exports: [UsersService], // Export for OrdersModule to import
})
export class UsersModule {}

// src/app.module.ts
@Module({
  imports: [
    UsersModule,
    ProductsModule,
    OrdersModule, // OrdersModule imports UsersModule + ProductsModule
  ],
})
export class AppModule {}
```

#### 7.2 Event-Driven Communication (Decoupled)
For complex interactions where modules shouldn't directly depend on each other:

```typescript
// src/events/user-created.event.ts
export class UserCreatedEvent {
  constructor(public readonly userId: string, public readonly email: string) {}
}

// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: CreateUserDto): Promise<User> {
    const user = await this.usersRepository.save(dto);
    this.eventEmitter.emit('user.created', new UserCreatedEvent(user.id, user.email));
    return user;
  }
}

// src/notifications/notification-on-user-created.handler.ts
@Injectable()
export class NotificationOnUserCreatedHandler {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent('user.created')
  async handle(event: UserCreatedEvent) {
    await this.emailService.send(
      event.email,
      'Welcome!',
      'Thanks for signing up.',
    );
  }
}

// src/notifications/notifications.module.ts
@Module({
  providers: [NotificationOnUserCreatedHandler],
  imports: [SharedModule], // Only imports shared (EmailService)
})
export class NotificationsModule {}

// src/app.module.ts
@Module({
  imports: [UsersModule, NotificationsModule], // No direct dependency between them
})
export class AppModule {}
```

**Benefit:** `NotificationsModule` doesn't need to know about `UsersModule`. Event-driven decoupling.

#### 7.3 CQRS Pattern (Advanced)
For complex modules with many queries/commands:

```typescript
// src/products/commands/create-product.command.ts
export class CreateProductCommand {
  constructor(public readonly name: string, public readonly price: number) {}
}

// src/products/commands/create-product.handler.ts
@CommandHandler(CreateProductCommand)
export class CreateProductHandler
  implements ICommandHandler<CreateProductCommand> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    return this.productRepository.save({
      name: command.name,
      price: command.price,
    });
  }
}

// src/products/queries/get-products.query.ts
export class GetProductsQuery {}

// src/products/queries/get-products.handler.ts
@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(query: GetProductsQuery): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}

// src/products/products.controller.ts
@Controller('products')
export class ProductsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.commandBus.execute(new CreateProductCommand(dto.name, dto.price));
  }

  @Get()
  async getAll() {
    return this.queryBus.execute(new GetProductsQuery());
  }
}

// src/products/products.module.ts
@Module({
  controllers: [ProductsController],
  providers: [CreateProductHandler, GetProductsHandler, ProductRepository],
})
export class ProductsModule {}
```

### 8. Database Migrations & Setup

#### 8.1 TypeORM Migrations (Recommended Approach)
```typescript
// src/database/data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: '_migrations',
  synchronize: false, // Always use migrations
});

// Run in package.json script context:
// "typeorm": "typeorm -d src/database/data-source.ts"
// "typeorm:migration:generate": "npm run typeorm -- migration:generate src/database/migrations/$npm_config_name"
// "typeorm:migration:run": "npm run typeorm -- migration:run"
```

#### 8.2 Writing Migrations
```typescript
// src/database/migrations/1699564800000-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1699564800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            length: '255',
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

#### 8.3 Prisma Alternative (Modern, Type-Safe)
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

// src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// src/database/prisma.module.ts
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 9. Testing Structure for Modular Monoliths

#### 9.1 Unit Tests (Service-Level)
```typescript
// src/users/users.service.spec.ts
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository } from './user.repository';
import { EmailService } from '../shared/email/email.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockEmailService = {
      send: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: 'EMAIL_SERVICE',
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('should create user and send welcome email', async () => {
    const dto = { email: 'test@example.com', password: 'hashed' };
    mockUserRepository.save.mockResolvedValue({ id: '1', ...dto });
    mockEmailService.send.mockResolvedValue(undefined);

    const result = await service.createUser(dto);

    expect(mockUserRepository.save).toHaveBeenCalledWith(dto);
    expect(mockEmailService.send).toHaveBeenCalledWith(
      'test@example.com',
      'Welcome!',
      expect.any(String),
    );
    expect(result.id).toBe('1');
  });
});
```

#### 9.2 Integration Tests (Module-Level)
```typescript
// src/users/users.module.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UsersModule (Integration)', () => {
  let module: TestingModule;
  let service: UsersService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        UsersModule,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should create user and persist to database', async () => {
    const dto = { email: 'test@example.com', password: 'hashed' };
    const user = await service.createUser(dto);

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');

    // Verify persistence
    const found = await service.findById(user.id);
    expect(found).toBeDefined();
  });
});
```

#### 9.3 E2E Tests (Full Application Flow)
```typescript
// test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users - should create user', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toBe('test@example.com');
      });
  });

  it('GET /users/:id - should retrieve user', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'user@example.com', password: 'password123' });

    return request(app.getHttpServer())
      .get(`/users/${createRes.body.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe('user@example.com');
      });
  });
});
```

---

## Comparative Analysis

### Modular Monolith vs. Microservices vs. Monolith

| Aspect | Monolith | Modular Monolith | Microservices |
|---|---|---|---|
| **Deployment** | Single unit | Single unit | Multiple units |
| **Development Speed** | Fast initially | Fast (clear boundaries) | Slow (coordination) |
| **Operational Complexity** | Low | Low | High |
| **Module Coupling** | High (risk) | Low (designed) | Zero |
| **Database Sharing** | Single DB (tight) | Single DB + clear access patterns | Per-service DB |
| **Testing** | Complex (tangled) | Clear (bounded) | Distributed (challenges) |
| **Scalability** | Scale entire app | Scale entire app | Scale per module |
| **Migration Path** | Hard to split | Natural evolution | Starting point |

**Verdict:** Modular monolith is optimal for 50-100 person teams, products in growth phase. Enables starting simple, evolving complex without premature distribution costs.

---

## Implementation Recommendations

### Quick Start Checklist
- [ ] Define bounded contexts (feature modules) based on business domains
- [ ] Create feature module folder structure with standardized layout
- [ ] Implement `SharedModule` for truly generic utilities only
- [ ] Set up `ConfigModule` with environment validation
- [ ] Configure TypeORM/Prisma with migrations
- [ ] Establish export/import patterns in modules
- [ ] Implement event-driven communication for decoupled modules
- [ ] Write unit + integration + E2E tests
- [ ] Document module boundaries in README

### Code Examples

#### Example 1: Feature Module (Users)
```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UserRepository } from './repositories/user.repository';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService], // Only export service
})
export class UsersModule {}

// src/users/services/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.save(dto);
    this.logger.log(`User created: ${user.id}`);
    return user;
  }
}

// src/users/controllers/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }
}
```

#### Example 2: App Module Composition
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from './config/database.module';
import { AppConfigModule } from './config/app.config.module';
import { LoggerModule } from './shared/logger/logger.module';
import { SharedModule } from './shared/shared.module';

import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    // Core configuration
    AppConfigModule,
    DatabaseModule,
    LoggerModule,
    SharedModule,

    // Event system
    EventEmitterModule.forRoot(),

    // Feature modules
    UsersModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

### Common Pitfalls & Solutions

| Pitfall | Consequence | Solution |
|---------|-------------|----------|
| **Over-sharing in SharedModule** | Hidden coupling, circular deps | Only export truly generic utilities; business logic stays in feature modules |
| **Exporting too much from modules** | Breaks encapsulation | Export only main service; keep repos, validators, guards internal |
| **Circular dependencies** | Brittle code, hard to refactor | Use domain events for decoupled inter-module communication |
| **No migration strategy** | Database schema divergence | Use TypeORM/Prisma migrations as source of truth; version all migrations |
| **Weak module boundaries** | Hard to test, hard to split later | Use linting rules (Nx, ESLint) to enforce import restrictions |
| **Database per feature** (premature) | Synchronization nightmare | Start with single DB; only split when proven necessity |
| **Testing only E2E** | Slow CI, unclear failures | Pyramid: many unit tests, fewer integration, sparse E2E |
| **Global modules everywhere** | Hidden dependencies | Use `@Global()` only for logging, config; prefer explicit imports |

---

## Security Considerations

1. **Authentication Module Isolation:** Keep auth logic (JWT, passport, OAuth) in dedicated `AuthModule`. Don't scatter across features.

2. **Authorization Guards:** Use role-based guards at controller level. Centralize permission logic in shared guards.

   ```typescript
   @UseGuards(AuthGuard, RoleGuard)
   @Roles('ADMIN')
   @Post()
   adminOnlyEndpoint() {}
   ```

3. **Input Validation:** Use class-validator DTOs globally via validation pipe.

   ```typescript
   @UseGlobalPipes(new ValidationPipe({ transform: true }))
   export class AppModule {}
   ```

4. **Database Access Control:** Repositories should validate ownership/permissions, not rely on controllers.

   ```typescript
   async updateUser(id: string, dto: UpdateUserDto, currentUserId: string) {
     const user = await this.userRepository.findById(id);
     if (user.id !== currentUserId) {
       throw new ForbiddenException('Cannot update other user');
     }
     return this.userRepository.update(id, dto);
   }
   ```

5. **Secrets Management:** Use `ConfigModule` with `@nestjs/config`. Never hardcode or check in `.env` files.

6. **Cross-Cutting Security:** Implement global interceptors for request logging, response sanitization.

---

## Performance Insights

1. **Module Scoping:** Providers are singletons by default—efficient memory usage. Request-scoped providers create per-request instances; use sparingly.

2. **Lazy Loading:** NestJS compiles modules at startup. For large monoliths (100+ modules), consider lazy-loading non-critical features.

   ```typescript
   @Controller('admin')
   @UseGuards(AuthGuard)
   export class AdminController {
     async onModuleInit() {
       const { AdminModule } = await import('./admin/admin.module');
       // Load AdminModule only on first admin request
     }
   }
   ```

3. **Database Query Optimization:** Use repositories with eager loading, indexes, pagination to prevent N+1 queries.

4. **Caching:** Implement caching at service layer for frequently accessed data.

   ```typescript
   @Injectable()
   export class CachingService {
     private cache = new Map();

     get(key: string) {
       return this.cache.get(key);
     }

     set(key: string, value: any, ttl: number) {
       this.cache.set(key, value);
       setTimeout(() => this.cache.delete(key), ttl);
     }
   }
   ```

---

## Resources & References

### Official Documentation
- [NestJS Official Docs](https://docs.nestjs.com) - Complete reference; modules, DI, decorators
- [NestJS GitHub](https://github.com/nestjs) - Source code, examples, issue tracker

### Recommended Tutorials & Guides
- [FreeCodeCamp: NestJS Handbook](https://www.freecodecamp.org/news/the-nestjs-handbook-learn-to-use-nest-with-code-examples/) - Practical guide with examples
- [Level Up Coding: NestJS Modular Architecture](https://levelup.gitconnected.com/nest-js-and-modular-architecture-principles-and-best-practices-806c2cb008d5) - Principles & patterns by Lucas Silveira
- [Medium: NestJS with DDD](https://medium.com/@fvdavid/nest-with-ddd-297c24041638) - Domain-Driven Design integration

### Community Resources & Example Projects
- [deadislove/nestJS-modular-monolith-cqrs-event-sourcing-architecture-template](https://github.com/deadislove/nestJS-modular-monolith-cqrs-event-sourcing-architecture-template) - Production-ready with CQRS, event sourcing, DDD
- [deadislove/nestJS-modular-monolith-event-driven-architecture-template](https://github.com/deadislove/nestJS-modular-monolith-event-driven-architecture-template) - Event-driven patterns, pluggable DB
- [jsantanders/modular-monolith-nestjs](https://github.com/jsantanders/modular-monolith-nestjs) - Clean DDD approach
- [NestJS-DDD-DevOps](https://andrea-acampora.github.io/nestjs-ddd-devops/) - DDD + DevOps integration guide
- [felipfr/nestjs-nx-modular-monolith-microservices](https://github.com/felipfr/nestjs-nx-modular-monolith-microservices) - Nx monorepo integration with Prisma

### Advanced Topics
- [Mastering NestJS: Clean Architecture & DDD](https://dev.to/nestjs-ninja/mastering-nestjs-unleashing-the-power-of-clean-architecture-and-ddd-in-e-commerce-development-part-1-5b7h) - E-commerce case study
- [Modulith with NestJS](https://medium.com/@viniciosbiluca.particular/modulith-with-nestjs-a-practical-approach-to-better-monolithic-applications-b1ca89192fde) - Modular monolith in depth
- [Applying DDD to NestJS](https://dev.to/bendix/applying-domain-driven-design-principles-to-a-nest-js-project-5f7b) - Bounded contexts, aggregates, value objects
- [DEV Community: NestJS 2025 Roadmap](https://dev.to/tak089/nestjs-roadmap-for-2025-5jj) - Ecosystem trends, upcoming features

### Monitoring & DevOps
- Docker containerization: Use multi-stage builds for optimal images
- Kubernetes: NestJS compatible; stateless design enables horizontal scaling
- Monitoring: Integrate Prometheus/ELK stack for observability
- CI/CD: GitHub Actions, GitLab CI, or Jenkins with automated testing gates

---

## Appendices

### A. Glossary

- **Bounded Context:** Domain-Driven Design term; clear boundary around a specific business domain
- **DDD (Domain-Driven Design):** Software design approach prioritizing business domain model
- **CQRS (Command Query Responsibility Segregation):** Pattern separating read/write operations
- **Event Sourcing:** Store application state changes as immutable events
- **Provider:** NestJS term for injectable class (service, repository, factory)
- **Module Scope:** Visibility/availability of a provider within NestJS modules
- **Singleton:** Single instance per application lifetime (default NestJS provider scope)
- **Transient:** New instance per injection (rare use case)
- **Repository Pattern:** Abstraction for data access; isolates persistence logic from business logic
- **DTO (Data Transfer Object):** Object for transferring data between layers; enforces structure/validation

### B. Module Template

Use this template for new feature modules:

```typescript
// [feature]/[feature].module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Controller } from './controllers/[feature].controller';
import { Service } from './services/[feature].service';
import { Repository } from './repositories/[feature].repository';
import { Entity } from './entities/[feature].entity';

@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [Controller],
  providers: [Service, Repository],
  exports: [Service],
})
export class [Feature]Module {}
```

### C. Environment Validation Template

```typescript
// config/validation.schema.ts
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validate } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;
}

export async function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = await validate(validatedConfig);

  if (errors.length > 0) {
    const messages = errors.map((err) =>
      Object.values(err.constraints || {}).join(', '),
    );
    throw new Error(`Env validation failed: ${messages.join('; ')}`);
  }

  return validatedConfig;
}
```

---

## Unresolved Questions / Future Research

1. **Monorepo vs. Single-Repo Trade-offs:** How do team size and deployment frequency affect monorepo adoption? When is it worth the extra tooling complexity (Nx, Turbo)?

2. **GraphQL in Modular Monoliths:** How to structure GraphQL resolvers across feature modules? Shared types vs. per-module schemas?

3. **Database Scaling in Monoliths:** At what scale does shared database become bottleneck? When to introduce read replicas, sharding, or separate databases?

4. **Module Dependency Graphs:** Tools for visualizing/enforcing module boundaries? (Nx provides some; fully automated validation?)

5. **Event Bus Implementation:** In-process EventEmitter2 vs. distributed message brokers (RabbitMQ, Kafka)? When to switch?

6. **API Versioning Strategy:** How to version APIs within modular monolith? Per-module versions or application-wide?

7. **Testing Performance:** Optimal balance of unit/integration/E2E for CI/CD pipelines? Parallel test execution strategies?

---

**Report Generated:** 2026-01-18 14:17 UTC
**Total Sources Consulted:** 12+ authoritative sources
**Confidence Level:** High (consensus across multiple production projects & official docs)
