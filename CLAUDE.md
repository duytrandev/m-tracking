# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

M-Tracking is a personal finance management platform built with a hybrid modular monolith architecture. The project uses an Nx monorepo with pnpm workspaces, combining a NestJS backend, Next.js 16 frontend, and FastAPI analytics service.

**Tech Stack:**
- **Backend:** NestJS 11.1.12 (TypeScript), PostgreSQL 17 + TimescaleDB, Redis 7, RabbitMQ 3.12
- **Frontend:** Next.js 16.1, React 19.2, TypeScript 5.9, TailwindCSS 4.1, shadcn/ui
- **Analytics:** FastAPI (Python 3.13+) for AI/ML operations
- **Monorepo:** Nx 22.3.3, pnpm 10.28.0

## Essential Commands

### Development

```bash
# Start all services in parallel
pnpm dev

# Start individual services
pnpm nx serve @m-tracking/frontend    # Frontend (port 3000)
pnpm nx serve @m-tracking/backend     # Backend (port 4000)
pnpm nx serve @m-tracking/analytics   # Analytics (port 5000)

# Alternative: Use dev:* scripts
pnpm dev:frontend
pnpm dev:backend
pnpm dev:analytics
```

### Building

```bash
# Build all projects
pnpm build

# Build specific projects
pnpm nx build @m-tracking/frontend
pnpm nx build @m-tracking/backend
pnpm nx build @m-tracking/analytics

# Build only affected projects (after git changes)
pnpm build:affected
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific project
pnpm nx test @m-tracking/frontend
pnpm nx test @m-tracking/backend

# Run tests in watch mode
pnpm test:watch

# Run only affected tests
pnpm test:affected

# Run tests with coverage
pnpm nx test:cov @m-tracking/backend
pnpm nx test:cov @m-tracking/frontend
```

### Linting & Formatting

```bash
# Lint all projects
pnpm lint

# Lint with auto-fix
pnpm lint:fix

# Format all files
pnpm format

# Check formatting
pnpm format:check

# Type check all projects
pnpm type-check
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker exec -it mtracking-postgres psql -U mtracking -d mtracking

# Access Redis CLI
docker exec -it mtracking-redis redis-cli

# Generate migration
cd services/backend
pnpm migration:generate -- src/migrations/MigrationName

# Run migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert
```

### Infrastructure

```bash
# Start Docker containers (PostgreSQL, Redis, RabbitMQ)
pnpm docker:up

# Stop Docker containers
pnpm docker:down

# View container logs
pnpm docker:logs

# Rebuild containers
pnpm docker:build
```

### Bundle Analysis (Frontend)

```bash
# Primary analyzer (Turbopack-based, recommended)
cd apps/frontend
pnpm analyze:turbopack

# Alternative (Webpack-based)
pnpm analyze
```

## Architecture Overview

### Modular Monolith (Backend)

The backend uses a **modular monolith pattern** (not microservices) where all business logic runs in a single NestJS process. This provides:
- **Sub-millisecond inter-module communication** (direct function calls, no HTTP overhead)
- **ACID transactions** across domains
- **60% lower infrastructure costs** compared to microservices
- **Clear module boundaries** for future extraction if needed at scale

**Key Modules:**
- `auth/` - Authentication (JWT RS256/HS256, OAuth 2.1, 2FA)
- `transactions/` - Transaction CRUD with pagination, caching, aggregation
- `budgets/` - Budget management and tracking
- `banking/` - External banking API integration
- `notifications/` - User notifications
- `telegram/` - Telegram bot integration

**Communication Pattern:**
```typescript
// Direct service injection (in-process, <1ms)
constructor(
  private readonly budgetService: BudgetService,
  private readonly transactionService: TransactionService,
) {}

await this.budgetService.updateSpending(userId, amount);
```

### Separate Analytics Service

The **FastAPI analytics service** is the **only** microservice, isolated for:
- Leveraging Python's AI/ML ecosystem
- Independent scaling of LLM operations
- Cost isolation (LLM API calls)
- Aggressive caching (95%+ hit rate, reduces costs by 80%)

**Communication:** Backend → Analytics via HTTP (50-100ms latency, acceptable for non-critical AI operations)

### Frontend Architecture

**Next.js 16 App Router** with:
- **Server Components by default** - Reduce client-side JS bundle
- **Dynamic imports** for heavy libraries (Recharts, etc.)
- **shadcn/ui components** (Radix UI + Tailwind) for accessibility
- **Zustand** for client state management
- **TanStack Query (React Query)** for server state
- **Motion (Framer Motion)** for animations

**Performance Optimizations (Phase 01-02 Complete):**
- Initial bundle reduced from 500KB → ~350KB (Phase 02)
- jsPDF removed (200KB zombie dependency)
- Recharts code-split with dynamic imports (-150KB from initial load)
- Redis caching for API responses (5-min TTL)
- Database aggregation replaces in-memory processing

## File Organization

### Monorepo Structure

```
m-tracking/
├── apps/
│   └── frontend/                # Next.js 16 web application
│       ├── app/                 # App Router pages (Server Components)
│       ├── src/
│       │   ├── components/ui/   # shadcn/ui components
│       │   ├── features/        # Feature-specific components
│       │   ├── lib/             # Utilities, stores, API clients
│       │   └── types/           # Centralized TypeScript types
│       └── project.json
├── services/
│   ├── backend/                 # NestJS modular monolith
│   │   ├── src/
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── transactions/    # Transactions module
│   │   │   ├── budgets/         # Budgets module
│   │   │   └── [other modules]
│   │   └── project.json
│   └── analytics/               # FastAPI analytics service
│       ├── app/                 # Python application
│       └── pyproject.toml
├── libs/
│   ├── common/                  # Shared utilities
│   ├── constants/               # Shared constants
│   └── types/                   # Shared TypeScript types
├── docs/                        # Project documentation
├── plans/                       # Implementation plans & reports
├── .claude/                     # Claude Code configuration
│   ├── rules/                   # Development rules
│   └── skills/                  # Custom skills
├── docker-compose.yml           # Local infrastructure
├── nx.json                      # Nx configuration
├── package.json                 # Root package.json
├── pnpm-workspace.yaml          # pnpm workspace config
└── tsconfig.base.json           # Shared TypeScript config
```

### File Naming Conventions

**Use kebab-case with descriptive names** (even if long):
- ✅ `user-authentication.service.ts`
- ✅ `transaction-categorization.service.ts`
- ❌ `UserAuth.ts` or `service.ts`

**File size limit: 200 lines** - Split larger files into focused modules.

### Backend File Patterns

- Entities: `{entity-name}.entity.ts` (e.g., `user.entity.ts`)
- Services: `{service-name}.service.ts` (e.g., `auth.service.ts`)
- Controllers: `{controller-name}.controller.ts`
- DTOs: `{action}-{entity}.dto.ts` (e.g., `create-user.dto.ts`)
- Guards: `{guard-name}.guard.ts`
- Interceptors: `{interceptor-name}.interceptor.ts`

### Frontend Type System (Critical)

**All types MUST be imported from centralized locations** (`src/types/`):

```typescript
// ✅ CORRECT - Centralized imports
import type { LoginRequest, LoginResponse } from '@/types/api/auth'
import type { User } from '@/types/entities'

// ❌ WRONG - Feature-specific types
import type { LoginRequest } from '@/features/auth/types/auth-types'
```

**Type Organization:**
```
types/
├── api/              # API-related types (requests, responses, DTOs)
│   ├── auth.ts
│   ├── profile.ts
│   └── common.ts
└── entities/         # Domain models
    ├── user.ts
    ├── session.ts
    └── index.ts
```

## Key Architecture Decisions

### 1. Authentication System

**JWT Hybrid Strategy (RS256 + HS256):**
- **Access tokens:** RS256 (asymmetric), 15-minute expiry
- **Refresh tokens:** HS256 (symmetric), 7-day expiry, httpOnly cookies
- **Token blacklist:** Redis-backed for immediate logout
- **OAuth 2.1:** Social login with PKCE, encrypted token storage (AES-256-GCM)
- **Rate limiting:** 5 req/min for login/register (brute-force protection)

**Environment Setup:**
```env
JWT_PRIVATE_KEY_PATH=jwt-private-key.pem   # RS256 signing
JWT_PUBLIC_KEY_PATH=jwt-public-key.pem     # RS256 verification
JWT_REFRESH_SECRET=<64-hex-chars>          # HS256 secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 2. Performance Patterns (Phase 01 Complete)

**Database Aggregation over In-Memory Processing:**
```typescript
// ✅ Use QueryBuilder for aggregation (instant for any dataset size)
const breakdown = await this.transactionRepository
  .createQueryBuilder('t')
  .select('c.id', 'categoryId')
  .addSelect('SUM(t.amount)', 'total')
  .addSelect('COUNT(t.id)', 'count')
  .leftJoin('t.category', 'c')
  .where('t.userId = :userId', { userId })
  .groupBy('c.id')
  .getRawMany()

// ❌ Avoid in-memory aggregation (slow for large datasets)
const transactions = await this.repository.find({ where: { userId } })
const total = transactions.reduce((sum, t) => sum + t.amount, 0)
```

**Pagination with Safe Limits:**
```typescript
// PaginationDto enforces hard limits
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)  // Hard limit prevents memory exhaustion
  limit?: number = 20;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}
```

**Redis Caching (5-minute TTL):**
```typescript
// Generate unique cache key from query parameters
const cacheKey = `spending-summary:${userId}:${period}:${startDate}:${endDate}`

const cached = await this.cacheManager.get(cacheKey)
if (cached) return cached

// Expensive query here...

await this.cacheManager.set(cacheKey, result, 300000) // 5 minutes
```

**Composite Database Indexes:**
```sql
CREATE INDEX idx_transactions_user_date_type
  ON transactions(user_id, date DESC, type);

CREATE INDEX idx_transactions_user_category
  ON transactions(user_id, category_id);
```

### 3. Frontend Code-Splitting (Phase 02 Complete)

**Dynamic imports for heavy libraries:**
```typescript
import dynamic from 'next/dynamic'
import { ChartSkeleton } from '@/components/ui/chart-skeleton'

const SpendingChart = dynamic(
  () => import('@/features/spending/components/spending-chart'),
  {
    loading: () => <ChartSkeleton height={300} />,
    ssr: false // Charts don't benefit from SSR
  }
)
```

**Benefits:**
- Initial bundle: 500KB → 350KB (Phase 02)
- Recharts deferred to lazy chunk (-150KB)
- jsPDF removed completely (-200KB zombie dependency)

### 4. 4-Tier LLM Caching Strategy

Minimize expensive LLM API calls with 95%+ cache hit rate:
1. **Tier 1 (Redis):** Instant lookup, 80% hit rate
2. **Tier 2 (User History):** Personal patterns, 10% hit rate
3. **Tier 3 (Global DB):** Crowd-sourced, 5% hit rate
4. **Tier 4 (LLM API):** Last resort, 5% usage

**Impact:** Reduces LLM costs from $500/month to ~$100/month (80% savings)

### 5. shadcn/ui Component Library

**All UI components use shadcn/ui** (Radix UI + Tailwind):
- ✅ WCAG 2.1 AA accessibility built-in
- ✅ Keyboard navigation, ARIA labels, screen reader support
- ✅ Copy-paste components (no npm dependency bloat)
- ✅ Full Tailwind customization control

**Installed components:** Button, Input, DropdownMenu, ThemeToggle, Skeleton

## Common Development Workflows

### Adding a New Backend Feature

1. **Create module structure:**
```bash
cd services/backend/src
mkdir new-feature
cd new-feature
touch new-feature.module.ts new-feature.service.ts new-feature.controller.ts
mkdir dto
```

2. **Follow file patterns:**
- `new-feature.entity.ts` - Database entity
- `new-feature.service.ts` - Business logic
- `new-feature.controller.ts` - HTTP endpoints
- `dto/create-new-feature.dto.ts` - Request DTOs

3. **Register module in `app.module.ts`:**
```typescript
@Module({
  imports: [
    // ...
    NewFeatureModule,
  ],
})
export class AppModule {}
```

4. **Run type check before commit:**
```bash
pnpm type-check
```

### Adding a New Frontend Component

1. **For shadcn/ui components:**
```bash
cd apps/frontend
npx shadcn-ui@latest add [component-name]
```

2. **For custom components:**
- Place in `src/components/ui/` (shared) or `src/features/{feature}/components/` (feature-specific)
- Use Motion library for animations (respect `prefers-reduced-motion`)
- Import types from `@/types/api/` or `@/types/entities/`

3. **For heavy components (>50KB):**
- Use dynamic imports with loading skeleton
- Disable SSR if not needed (`ssr: false`)

### Running Tests

**Backend tests (Vitest):**
```bash
cd services/backend
pnpm test              # Run all tests
pnpm test auth         # Run tests matching "auth"
pnpm test:cov          # With coverage
```

**Frontend tests (Vitest):**
```bash
cd apps/frontend
pnpm test              # Run all tests
pnpm test:e2e          # E2E tests
pnpm test:coverage     # With coverage
```

### Database Migrations

**Create migration:**
```bash
cd services/backend
pnpm migration:generate -- src/migrations/MigrationName
```

**Run migrations:**
```bash
pnpm migration:run
```

**Revert migration:**
```bash
pnpm migration:revert
```

## Critical Rules

### TypeScript Strict Mode

- ✅ Explicit return types for functions
- ✅ Use `!` for property initialization in entities/DTOs
- ✅ Type-guard errors in catch blocks: `error as Error`
- ✅ No `any` types (use `unknown` with type guards)

### Error Handling Pattern

```typescript
async function processData(dto: CreateDto): Promise<Result> {
  try {
    const result = await this.repository.save(dto)
    await this.eventBus.publish(new DataCreatedEvent(result))
    return result
  } catch (error) {
    this.logger.error('Failed to process data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data: dto,
    })
    throw new DataProcessingException(
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}
```

### Security Best Practices

- ✅ Always validate DTOs with `class-validator`
- ✅ Use parameterized queries (never string concatenation)
- ✅ Hash passwords with bcrypt (cost factor 12)
- ✅ Encrypt OAuth tokens at rest (AES-256-GCM)
- ✅ Rate limit auth endpoints (5 req/min)
- ✅ Check token blacklist on every request

### Performance Rules

- ✅ Use database aggregation (not in-memory processing)
- ✅ Implement pagination with hard limits (max 100 items)
- ✅ Cache expensive queries with Redis (5-min TTL)
- ✅ Create composite indexes for common queries
- ✅ Invalidate cache on write operations
- ✅ Use dynamic imports for libraries >50KB

## Documentation

**Key documentation files:**
- `README.md` - Project overview and quick start
- `PROJECT_STRUCTURE.md` - Complete technical architecture
- `docs/code-standards.md` - Coding standards and conventions
- `docs/system-architecture.md` - Architecture decisions (ADRs)
- `docs/development-guide.md` - Detailed development workflows
- `.claude/rules/development-rules.md` - Claude-specific development rules

**Before making significant changes:**
1. Read relevant documentation in `docs/`
2. Follow patterns in existing code
3. Run tests and type checks
4. Update documentation if needed

## Support

- **Issues:** Common issues documented in `docs/troubleshooting.md`
- **Architecture Questions:** See `docs/system-architecture.md` for ADRs
- **Local Setup:** Follow `README.md` Quick Start section
- **API Documentation:** Swagger UI at http://localhost:4000/api/docs when backend is running
