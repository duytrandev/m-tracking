# M-Tracking Backend (NestJS Modular Monolith)

**Version:** 1.0.0
**Last Updated:** January 19, 2026
**Status:** ✅ Production Ready with TypeScript Strict Mode

NestJS-based modular monolith backend service handling all core business logic for M-Tracking Personal Finance Management Platform.

---

## Architecture

- **Pattern:** Modular Monolith with Domain-Driven Design
- **Framework:** NestJS 11.1.12
- **Runtime:** Node.js >= 20.10.0
- **Language:** TypeScript 5.9.x (strict mode enabled)
- **Database:** PostgreSQL 17.7 (Supabase)
- **ORM:** TypeORM 0.3.28
- **Cache:** Redis 7.x
- **Queue:** RabbitMQ 3.12
- **Build System:** Nx 22.3.3 + pnpm 10.28.0

---

## Module Structure

```
src/
├── main.ts                # Application entry point
├── app.module.ts          # Root module
│
├── gateway/               # API Gateway
│   ├── middleware/        # Express middleware
│   ├── guards/            # Route guards
│   ├── interceptors/      # HTTP interceptors
│   └── filters/           # Exception filters
│
├── auth/                  # Authentication Module
│   ├── controllers/       # Auth endpoints
│   ├── services/          # Business logic
│   ├── strategies/        # Passport strategies
│   ├── guards/            # JWT/OAuth guards
│   └── dto/               # Data transfer objects
│
├── transactions/          # Transaction Module
│   ├── controllers/
│   ├── services/
│   ├── repositories/      # Database repositories
│   ├── entities/          # TypeORM entities
│   └── dto/
│
├── banking/               # Banking Integration
│   ├── controllers/
│   ├── services/
│   ├── providers/         # Bank API providers
│   └── dto/
│
├── budgets/               # Budget Management
│   ├── controllers/
│   ├── services/
│   ├── entities/
│   └── dto/
│
├── notifications/         # Notifications
│   ├── controllers/
│   ├── services/
│   ├── telegram/          # Telegram bot
│   └── dto/
│
├── shared/                # Shared Infrastructure
│   ├── config/            # Configuration
│   ├── database/          # Database module
│   ├── cache/             # Redis cache
│   ├── queue/             # RabbitMQ queue
│   ├── logger/            # Winston logger
│   └── utils/             # Utilities
│
└── migrations/            # TypeORM migrations
```

---

## Getting Started

### Prerequisites

- **Node.js:** >= 20.10.0
- **pnpm:** >= 10.28.0
- **PostgreSQL:** 15+ (or Supabase account)
- **Redis:** 7.x (or Docker)
- **Docker:** (optional) For local infrastructure

### Quick Start

```bash
# From monorepo root
pnpm install

# Start Docker services (PostgreSQL, Redis, RabbitMQ)
pnpm docker:up

# Run migrations
pnpm --filter @m-tracking/backend run migration:run

# Start backend only
pnpm dev:backend

# Or start all services
pnpm dev
```

API runs on [http://localhost:4000](http://localhost:4000)

### Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
NODE_ENV=development
PORT=4000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=mtracking

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
```

---

## Configuration

### TypeScript Strict Mode ✅

**Status:** Fully enabled (100% type coverage)

```json
// Inherited from tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Benefits:**

- Catches bugs at compile time
- Better IDE autocomplete
- Safer refactoring

### Path Aliases

```typescript
// ✅ Import from internal modules using @ aliases
import { AuthGuard } from '@auth/guards/auth.guard'
import { TransactionService } from '@transactions/services/transaction.service'
import { DatabaseModule } from '@shared/database/database.module'

// ✅ Import shared monorepo libraries
import { formatCurrency } from '@m-tracking/utils'
import { TRANSACTION_CATEGORIES } from '@m-tracking/constants'
import type { Transaction } from '@m-tracking/types'
```

### Nx Integration

**Project Tags:**

- `type:app` - Backend application
- `scope:backend` - Can only import shared libraries
- `platform:node` - Node.js runtime

**Module Boundaries Enforced:**

- ✅ Can import: `@m-tracking/common`, `@m-tracking/types`, `@m-tracking/utils`, `@m-tracking/constants`
- ❌ Cannot import: Frontend code (`scope:frontend`)

---

## Development

### Commands

```bash
# Development server (port 4000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm exec tsc --noEmit

# Linting
pnpm lint

# Unit tests
pnpm test
pnpm test:watch
pnpm test:cov

# E2E tests
pnpm test:e2e
```

### Nx Commands

```bash
# Run from monorepo root
nx run backend:dev
nx run backend:build
nx run backend:test
nx run backend:lint

# View dependency graph
nx graph

# Clear cache
nx reset
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

---

## API Documentation

### Endpoints

**Base URL:** `http://localhost:4000/api/v1`

**Health Check:**

```bash
GET /api/v1/health
```

**Authentication:**

```bash
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

**Transactions:**

```bash
GET    /api/v1/transactions
POST   /api/v1/transactions
GET    /api/v1/transactions/:id
PUT    /api/v1/transactions/:id
DELETE /api/v1/transactions/:id
```

**Full API Documentation:** See [API Documentation](../../docs/api-documentation.md)

---

## Key Patterns

### NestJS Modules

```typescript
// Feature module pattern
@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository],
  exports: [TransactionsService], // Only export what's needed
})
export class TransactionsModule {}
```

### Configuration

```typescript
// Feature-based configuration
import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  // ...
}))
```

### Repository Pattern

```typescript
// Clean data access layer
@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>
  ) {}

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.repository.find({ where: { userId } })
  }
}
```

---

## Performance

### Build Optimization

- **Incremental Builds:** 50-80% faster (TypeScript composite: true)
- **Nx Caching:** 85%+ cache hit rate (instant rebuilds)
- **Tree Shaking:** Smaller bundle size

### Runtime Optimization

- **Database Connection Pooling:** Min 5, Max 20
- **Redis Caching:** Frequently accessed data
- **RabbitMQ Queue:** Async job processing
- **Lazy-Loaded Modules:** On-demand loading

---

## Testing

### Unit Tests (Jest)

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e
```

Test files: `test/**/*.e2e-spec.ts`

---

## CI/CD

### GitHub Actions

Automated workflow on every PR:

1. Type checking
2. Linting
3. Unit tests
4. Build verification
5. E2E tests

**Nx Affected Commands:**

- Only tests changed code (70-85% faster)
- Cache results across CI runs

---

## Related Documentation

- **[Backend Configuration](../../docs/backend-configuration.md)** - Detailed configuration guide
- **[Code Standards](../../docs/code-standards.md)** - Coding conventions
- **[Development Guide](../../docs/development-guide.md)** - Development workflows
- **[System Architecture](../../docs/system-architecture.md)** - Overall architecture
- **[API Documentation](../../docs/api-documentation.md)** - API reference
- **[Configuration Changes](../../docs/configuration-changes-2026-01-19.md)** - Recent updates

---

## Troubleshooting

### Type Errors

```bash
# Clear build cache
rm -rf dist
rm -rf tsconfig.tsbuildinfo

# Reinstall
pnpm install

# Rebuild
pnpm build
```

### Module Not Found

```bash
# Restart TypeScript server in IDE
# CMD+Shift+P > "TypeScript: Restart TS Server"

# Verify tsconfig.json has correct paths
cat tsconfig.json | grep paths
```

### Decorator Errors

Verify these are set in `tsconfig.json`:

```json
{
  "emitDecoratorMetadata": true,
  "experimentalDecorators": true
}
```

### Database Connection

```bash
# Test connection
psql -h localhost -U postgres -d mtracking

# Check Docker services
docker ps
pnpm docker:logs
```

### Nx Cache Issues

```bash
# Clear Nx cache
nx reset

# Rebuild
nx run backend:build
```

---

**Port:** 4000
**Health Endpoint:** http://localhost:4000/api/v1/health
**Status:** ✅ Production Ready
