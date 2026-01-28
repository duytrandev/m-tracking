# Backend Configuration Guide

**Project:** M-Tracking Backend (NestJS 11)
**Last Updated:** January 19, 2026
**Status:** Active - Production Ready

---

## Overview

Complete configuration guide for the M-Tracking backend API built with NestJS 11, TypeScript 5.9, and TypeORM 0.3.28.

**Technology Stack:**

- **Framework:** NestJS 11.1.12
- **Language:** TypeScript 5.9.x (strict mode)
- **ORM:** TypeORM 0.3.28
- **Database:** PostgreSQL 17.7 (Supabase)
- **Caching:** Redis 7.x
- **Queue:** RabbitMQ 3.12
- **Build System:** Nx 22.3.3 + pnpm 10.28.0

**Location:** `services/backend/`
**Port:** 4000

---

## TypeScript Configuration

### Configuration Hierarchy

```
tsconfig.base.json (root)             # Shared strict configuration
└── services/backend/tsconfig.json    # Backend-specific overrides
```

### Backend tsconfig.json

**File:** `services/backend/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    // Module System
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES2021",
    "lib": ["ES2021"],

    // Output
    "outDir": "./dist",
    "rootDir": "./src",

    // NestJS Specific
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,

    // Build Optimization
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",

    // Module Path Mappings
    "paths": {
      // Internal modules
      "@gateway/*": ["src/gateway/*"],
      "@auth/*": ["src/auth/*"],
      "@transactions/*": ["src/transactions/*"],
      "@banking/*": ["src/banking/*"],
      "@budgets/*": ["src/budgets/*"],
      "@notifications/*": ["src/notifications/*"],
      "@shared/*": ["src/shared/*"],
      "@integrations/*": ["src/integrations/*"],

      // Shared monorepo libraries
      "@m-tracking/common": ["../../libs/common/src/index.ts"],
      "@m-tracking/types": ["../../libs/types/src/index.ts"],
      "@m-tracking/constants": ["../../libs/constants/src/index.ts"],
      "@m-tracking/utils": ["../../libs/utils/src/index.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"]
}
```

### Inherited from tsconfig.base.json

**Strict Type Checking (100% coverage):**

- ✅ `strict: true` - All strict checks enabled
- ✅ `strictNullChecks: true` - Null/undefined safety
- ✅ `noImplicitAny: true` - No implicit any types
- ✅ `strictBindCallApply: true` - Strict function binding
- ✅ `strictFunctionTypes: true` - Strict function types
- ✅ `noUnusedLocals: true` - Detect unused variables
- ✅ `noUnusedParameters: true` - Detect unused parameters
- ✅ `noImplicitReturns: true` - All code paths must return

**Build Performance:**

- ✅ `incremental: true` - 50-80% faster rebuilds
- ✅ `skipLibCheck: true` - Skip type checking of declaration files
- ✅ `composite: true` - Enable project references

---

## NestJS Configuration

### nest-cli.json

**File:** `services/backend/nest-cli.json`

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": ["**/*.proto"],
    "watchAssets": true
  }
}
```

### Configuration Module

**Architecture:** Feature-based configuration with `registerAs` pattern

```typescript
// src/config/database.config.ts
import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
}))
```

**Loading Configuration:**

```typescript
// src/app.module.ts
import { ConfigModule } from '@nestjs/config'
import databaseConfig from './config/database.config'
import authConfig from './config/auth.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig],
      validationSchema: validationSchema,
    }),
  ],
})
export class AppModule {}
```

---

## Package Configuration

### package.json

**File:** `services/backend/package.json`

```json
{
  "name": "@m-tracking/backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d ormconfig.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d ormconfig.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d ormconfig.ts"
  },
  "dependencies": {
    // Core
    "@nestjs/common": "^11.1.11",
    "@nestjs/core": "^11.1.11",
    "@nestjs/platform-express": "^11.1.11",

    // Configuration
    "@nestjs/config": "^3.3.0",

    // Database
    "@nestjs/typeorm": "^10.0.2",
    "typeorm": "^0.3.28",
    "pg": "^8.16.3",

    // Authentication
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.1",

    // Validation
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",

    // Queue
    "bullmq": "^5.28.3",

    // Utilities
    "winston": "^3.18.0",
    "axios": "^1.8.3",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.1.11",
    "typescript": "^5.9.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5"
  }
}
```

---

## Nx Project Configuration

### project.json

**File:** `services/backend/project.json`

```json
{
  "name": "backend",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "root": "services/backend",
  "sourceRoot": "services/backend/src",
  "prefix": "api",
  "tags": ["type:app", "scope:backend", "platform:node"],
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm dev",
        "cwd": "services/backend"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "services/backend"
      },
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm test",
        "cwd": "services/backend"
      },
      "cache": true
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm lint",
        "cwd": "services/backend"
      },
      "cache": true
    }
  }
}
```

### Nx Tags Explained

**`type:app`** - Application (not a library)

- Can only depend on libraries (`type:lib`)
- Cannot be depended upon by other projects

**`scope:backend`** - Backend scope

- Can import from `scope:backend` and `scope:shared` libraries
- Cannot import from `scope:frontend` (enforced by ESLint)

**`platform:node`** - Node.js runtime

- Uses CommonJS module system
- Server-side execution

---

## Build & Caching

### Nx Caching Configuration

**File:** `nx.json` (relevant sections)

```json
{
  "namedInputs": {
    "nestBuild": [
      "{projectRoot}/src/**/*.ts",
      "{projectRoot}/package.json",
      "{projectRoot}/tsconfig.json",
      "{projectRoot}/tsconfig.build.json",
      "{projectRoot}/nest-cli.json",
      "^production"
    ]
  },
  "targetDefaults": {
    "build": {
      "inputs": ["nestBuild"],
      "cache": true
    }
  }
}
```

### Cache Benefits

**Local Development:**

- Incremental builds: <30 seconds (vs 2-3 minutes full build)
- Type checking: <10 seconds (incremental)
- Hot reload: <1 second (with watch mode)

**CI/CD (with Nx Cloud):**

- Cache hit: 85%+ (instant replay)
- Full build: 2-3 minutes (vs 10-15 minutes without cache)
- Affected tests only: 70-85% faster CI

---

## Project Structure

```
services/backend/
├── src/
│   ├── main.ts                # Application entry point
│   ├── app.module.ts          # Root module
│   │
│   ├── gateway/               # API Gateway Module
│   │   ├── middleware/        # Express middleware
│   │   ├── guards/            # Route guards
│   │   ├── interceptors/      # HTTP interceptors
│   │   └── filters/           # Exception filters
│   │
│   ├── auth/                  # Authentication Module
│   │   ├── controllers/       # Auth endpoints
│   │   ├── services/          # Auth business logic
│   │   ├── strategies/        # Passport strategies
│   │   ├── guards/            # JWT/OAuth guards
│   │   └── dto/               # Data transfer objects
│   │
│   ├── transactions/          # Transaction Module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/      # Database repositories
│   │   ├── entities/          # TypeORM entities
│   │   └── dto/
│   │
│   ├── banking/               # Banking Integration Module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── providers/         # Bank API providers
│   │   └── dto/
│   │
│   ├── budgets/               # Budget Management Module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── notifications/         # Notification Module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── telegram/          # Telegram bot
│   │   └── dto/
│   │
│   ├── shared/                # Shared Infrastructure
│   │   ├── config/            # Configuration service
│   │   ├── database/          # Database module
│   │   ├── cache/             # Redis cache service
│   │   ├── queue/             # RabbitMQ queue service
│   │   ├── logger/            # Winston logger
│   │   └── utils/             # Helper functions
│   │
│   └── migrations/            # TypeORM migrations
│
├── test/                      # E2E tests
├── tsconfig.json              # TypeScript config
├── nest-cli.json              # NestJS CLI config
├── project.json               # Nx config
├── package.json               # Dependencies
└── Dockerfile                 # Container definition
```

---

## Module Architecture

### Modular Monolith Pattern

**Key Principles:**

1. **Clear Boundaries** - Each module is self-contained
2. **Explicit Exports** - Only expose what's needed
3. **Dependency Injection** - Use NestJS DI for loose coupling
4. **Event-Driven** - Modules communicate via events

### Module Example

```typescript
// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionsController } from './controllers/transactions.controller'
import { TransactionsService } from './services/transactions.service'
import { TransactionRepository } from './repositories/transaction.repository'
import { Transaction } from './entities/transaction.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository],
  exports: [TransactionsService], // Only export service
})
export class TransactionsModule {}
```

---

## Path Aliases

### Import Patterns

```typescript
// ✅ CORRECT - Using @ aliases for internal modules
import { AuthGuard } from '@auth/guards/auth.guard'
import { TransactionService } from '@transactions/services/transaction.service'
import { DatabaseModule } from '@shared/database/database.module'

// ✅ CORRECT - Importing shared libraries
import { formatCurrency } from '@m-tracking/utils'
import { TRANSACTION_CATEGORIES } from '@m-tracking/constants'
import type { Transaction } from '@m-tracking/types'

// ❌ WRONG - Relative imports
import { AuthGuard } from '../../auth/guards/auth.guard'
import { formatCurrency } from '../../../libs/utils/src/currency'
```

### Configured Aliases

```json
{
  "@gateway/*": ["src/gateway/*"],
  "@auth/*": ["src/auth/*"],
  "@transactions/*": ["src/transactions/*"],
  "@banking/*": ["src/banking/*"],
  "@budgets/*": ["src/budgets/*"],
  "@notifications/*": ["src/notifications/*"],
  "@shared/*": ["src/shared/*"],
  "@integrations/*": ["src/integrations/*"],
  "@m-tracking/common": ["../../libs/common/src/index.ts"],
  "@m-tracking/types": ["../../libs/types/src/index.ts"],
  "@m-tracking/constants": ["../../libs/constants/src/index.ts"],
  "@m-tracking/utils": ["../../libs/utils/src/index.ts"]
}
```

---

## Environment Variables

### Required Variables

```bash
# .env
NODE_ENV=development
PORT=4000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=mtracking

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# External APIs
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox
```

### Environment Files

- `.env` - Default values (committed to git)
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production values (gitignored)
- `.env.example` - Template (committed)

---

## Development Commands

### Local Development

```bash
# Start development server (port 4000)
pnpm dev:backend

# Or with Nx
nx run backend:dev

# Build for production
pnpm build:backend
nx run backend:build

# Start production server
pnpm start:backend
```

### Starting Services

```bash
# Start all services
pnpm nx run dev

# Start individual services
pnpm nx run dev:frontend    # Next.js (port 3000)
pnpm nx run frontend:serve
pnpm nx run dev:backend     # NestJS (port 4000)
pnpm nx run dev:analytics   # FastAPI (port 5000)
```

### Type Checking

```bash
# Type check only (no emit)
cd services/backend
pnpm exec tsc --noEmit

# Or with Nx
nx run backend:type-check
```

### Testing

```bash
# Unit tests (Jest)
pnpm test
pnpm test:watch
pnpm test:cov

# E2E tests
pnpm test:e2e
```

### Database Migrations

```bash
# Generate migration
pnpm migration:generate -- src/migrations/AddUserTable

# Run migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show
```

### Linting

```bash
# Lint
pnpm lint

# Lint with auto-fix
pnpm lint --fix
```

---

## Module Boundaries

### ESLint Enforcement

**Rule:** Backend can only import from backend or shared libraries

```json
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "depConstraints": [
        {
          "sourceTag": "scope:backend",
          "onlyDependOnLibsWithTags": ["scope:backend", "scope:shared"]
        }
      ]
    }
  ]
}
```

### What Backend Can Import

✅ **Allowed:**

- `@m-tracking/common` (scope:shared)
- `@m-tracking/types` (scope:shared)
- `@m-tracking/constants` (scope:shared)
- `@m-tracking/utils` (scope:shared)

❌ **Not Allowed:**

- Frontend code (scope:frontend)
- Frontend-specific utilities
- Client-side modules

---

## Performance Optimization

### Build Optimizations

1. **Incremental Builds** ✅
   - `composite: true` in tsconfig
   - `tsBuildInfoFile` for cache
   - 50-80% faster rebuilds

2. **Tree Shaking** ✅
   - Import only what you need
   - Shared libs have `sideEffects: false`
   - Smaller bundle size

3. **NestJS Optimizations** ✅
   - Lazy-loaded modules
   - Request scoped providers only when needed
   - Singleton services by default

### Runtime Optimizations

1. **Database Connection Pooling**
   - Min 5, Max 20 connections
   - Optimized for concurrent requests

2. **Caching with Redis**
   - Cache frequently accessed data
   - TTL-based expiration
   - Cache invalidation strategies

3. **Queue with RabbitMQ**
   - Async job processing
   - Event-driven architecture
   - Decoupled services

---

## Common Issues & Solutions

### Issue: Type Errors After Config Update

**Symptom:** Strict mode catching new type errors

**Solution:**

```bash
# Clear build cache
rm -rf services/backend/dist
rm -rf services/backend/tsconfig.tsbuildinfo

# Rebuild
pnpm install
nx run backend:build
```

### Issue: Module Not Found

**Symptom:** Cannot resolve @auth/\* imports

**Solution:**

1. Verify `tsconfig.json` has correct path mappings
2. Restart TypeScript server in IDE
3. Clear build cache

### Issue: Decorator Errors

**Symptom:** Decorators not working

**Solution:**

1. Verify `emitDecoratorMetadata: true` in tsconfig
2. Verify `experimentalDecorators: true` in tsconfig
3. Import `reflect-metadata` in main.ts

### Issue: Nx Cache Stale

**Symptom:** Builds using old code

**Solution:**

```bash
# Clear Nx cache
nx reset

# Rebuild
nx run backend:build
```

---

## Related Documentation

- [Code Standards](./code-standards.md) - TypeScript and NestJS conventions
- [Frontend Configuration](./frontend-configuration.md) - Frontend setup
- [System Architecture](./system-architecture.md) - Overall architecture
- [Development Guide](./development-guide.md) - Development workflows
- [Configuration Changes](./configuration-changes-2026-01-19.md) - Recent updates

---

**Last Updated:** January 19, 2026
**Status:** ✅ Production Ready
