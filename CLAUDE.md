# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

M-Tracking is a personal finance management platform with automatic transaction aggregation, AI-powered spending insights, and Telegram bot + web dashboard interfaces.

**Stack:** NestJS 11 backend, Next.js 16 frontend, FastAPI analytics, PostgreSQL 17 + TimescaleDB, Redis 7, RabbitMQ 3.12, Nx 22 monorepo with pnpm 10.

## Common Commands

```bash
# Development
pnpm run dev              # Start all services (frontend:3000, backend:4000, analytics:5000)
pnpm run dev:frontend     # Start frontend only
pnpm run dev:backend      # Start backend only

# Testing
pnpm run test                           # Run all tests
nx test @m-tracking/backend             # Run backend tests
nx test @m-tracking/frontend            # Run frontend tests
cd services/backend && pnpm test        # Run backend tests (Vitest)
cd apps/frontend && pnpm test           # Run frontend tests (Vitest)
cd apps/frontend && pnpm test:e2e       # Run Playwright E2E tests

# Linting & Formatting
pnpm run lint             # Lint all projects
pnpm run lint:fix         # Auto-fix lint issues
pnpm run format           # Format with Prettier

# Build
pnpm run build            # Build all projects
pnpm run type-check       # TypeScript type checking

# Database (from services/backend)
pnpm migration:generate src/migrations/{MigrationName} # Generate migration from entity changes
pnpm migration:run        # Run pending migrations
pnpm migration:revert     # Revert last migration
pnpm migration:show       # Show migration status

# Infrastructure
pnpm run docker:up        # Start PostgreSQL, Redis, RabbitMQ containers
pnpm run docker:down      # Stop containers
```

## Architecture

**Hybrid Modular Monolith:**

```
apps/frontend/           # Next.js 16 web app (React 19, Zustand, React Query, shadcn/ui)
services/backend/        # NestJS modular monolith
services/analytics/      # FastAPI for AI/LLM operations (Python 3.12+, uv)
libs/shared/             # Shared types and utilities
```

**Backend Modules:**

- `auth/` - Authentication (JWT RS256, OAuth, 2FA, sessions in Redis)
- `transactions/` - Transaction CRUD and spending analytics
- `banking/`, `budgets/`, `notifications/` - Placeholder modules

**Frontend Structure:**

```
src/features/{feature}/
├── components/          # UI components
├── hooks/               # Custom hooks (use-{name}.ts)
├── api/                 # API clients
├── store/               # Zustand stores
└── validations/         # Zod schemas
```

**Authentication Flow:**

- Access tokens: JWT RS256, 15m expiry, stored in memory
- Refresh tokens: 7d expiry, httpOnly cookie, stored in Redis with O(1) lookup
- Sessions: Device tracking, XSS-sanitized, configurable limit (AUTH_MAX_SESSIONS)

**Error Handling:**

- Backend: `AuthExceptions` factories with typed error codes
- Frontend: `showErrorToast()` with automatic retry countdown for rate limits

## Key Patterns

**NestJS Service:**

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}
}
```

**Frontend Hook with React Query:**

```typescript
const { data, isLoading } = useQuery({
  queryKey: queryKeys.auth.user,
  queryFn: () => authApi.getMe(),
})
```

**Validation (Backend DTO):**

```typescript
export class RegisterDto {
  @IsEmail()
  email: string

  @MinLength(12)
  password: string
}
```

**Validation (Frontend Zod):**

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

## Database Access

```bash
# PostgreSQL (user: postgres, password: postgres)
docker exec -it mtracking-postgres psql -U postgres -d m_tracking

# Redis
docker exec -it mtracking-redis redis-cli

# RabbitMQ UI: http://localhost:15672 (user: mtracking, password: mtracking_dev_password)
```

## Code Guidelines

- **File size:** Keep under 200 LOC, split into focused modules
- **File naming:** kebab-case (`user-service.ts`, `login-form.tsx`)
- **No `any` types:** Use `unknown` with type guards
- **Explicit return types** on functions
- **Error handling:** Use typed exceptions, try-catch with proper error narrowing
- **Commits:** Conventional format `type(scope): description`

## Documentation

- `docs/code-standards.md` - Full coding standards
- `docs/system-architecture.md` - System design, auth flows, caching
- `docs/database-migrations.md` - TypeORM migration guide
- `docs/error-handling-guide.md` - Error patterns and factories
