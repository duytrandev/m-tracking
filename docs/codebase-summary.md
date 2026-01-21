# M-Tracking Codebase Summary

**Generated:** 2026-01-21
**Project:** M-Tracking - Personal Finance Management Platform
**Repository Structure:** Monorepo (pnpm workspaces)

---

## Overview

M-Tracking is a personal finance management platform built with a modular monolith architecture. The codebase is organized as a monorepo using pnpm workspaces, featuring a Next.js 16 frontend, NestJS backend, and Python FastAPI analytics service.

**Repository Size:** ~150+ files across frontend, backend, and services
**Languages:** TypeScript, Python, JavaScript
**Build System:** NX with caching optimization
**Testing:** Jest (backend) + React Testing Library (frontend)

---

## Directory Structure Overview

```
m-tracking/
├── apps/
│   └── frontend/                # Next.js 16 frontend application
│       ├── app/                 # Routes (Next.js App Router)
│       ├── src/
│       │   ├── components/      # Shared UI components (shadcn/ui)
│       │   ├── features/        # Feature modules (auth, preferences, profile, etc.)
│       │   ├── hooks/           # Custom React hooks
│       │   ├── lib/             # Utility libraries (store, api client)
│       │   └── types/           # Centralized type definitions
│       └── public/              # Static assets
│
├── services/
│   ├── backend/                 # NestJS backend API
│   │   ├── src/
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── transactions/    # Transactions module
│   │   │   ├── banking/         # Banking integration module
│   │   │   ├── budgets/         # Budget management module
│   │   │   ├── notifications/   # Notifications module
│   │   │   ├── gateway/         # API gateway module
│   │   │   ├── common/          # Shared utilities, filters, interceptors
│   │   │   ├── config/          # Configuration modules
│   │   │   ├── database/        # Database module (TypeORM)
│   │   │   ├── events/          # Event emitter system
│   │   │   └── migrations/      # Database migrations
│   │   ├── test/                # Test configuration
│   │   └── jest.preset.js       # Jest workspace configuration (NEW)
│   └── analytics/               # FastAPI analytics service (Python)
│       └── app/                 # FastAPI application
│
├── libs/
│   ├── config/                  # Shared configuration
│   │   ├── eslint-config/       # ESLint shared config
│   │   ├── typescript-config/   # TypeScript shared config
│   │   └── prettier-config/     # Prettier shared config
│   ├── common/                  # Shared TypeScript utilities
│   ├── types/                   # Shared types
│   └── constants/               # Shared constants
│
├── docs/                        # Documentation
│   ├── code-standards.md        # Coding conventions and best practices
│   ├── system-architecture.md   # Architecture decisions and patterns
│   ├── development-guide.md     # Developer setup and workflows
│   ├── development-roadmap.md   # Project phases and progress
│   └── [other guides]
│
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI/CD
│
├── docker-compose.yml           # Local development services
├── package.json                 # Root workspace configuration
├── pnpm-lock.yaml               # Dependency lock file
├── tsconfig.json                # Root TypeScript config
├── .env.example                 # Environment variables template
└── .env.docker.example          # Docker secrets template (NEW)
```

---

## Frontend Application (`apps/frontend`)

### Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Components:** shadcn/ui (Radix UI + Tailwind)
- **State Management:** Zustand (UI state) + TanStack Query (server state)
- **Animations:** Motion/Framer Motion v12.27.1 with LazyMotion
- **Styling:** Tailwind CSS + CSS Modules
- **Testing:** Jest + React Testing Library

### Key Features
- **Authentication:** Email/password, OAuth (Google/GitHub/Facebook), passwordless, 2FA
- **Theme System:** Light/dark/system with FOUC prevention
- **Responsive Design:** Mobile-first approach with shadcn/ui components
- **Type Safety:** Centralized types in `types/` directory (NOT feature-specific)
- **Performance:** Next.js Server Components, code splitting, lazy loading

### Route Structure
```
auth/
├── login
├── register
├── forgot-password
├── reset-password
├── magic-link
├── otp
├── 2fa-verify
├── oauth/callback
└── verify-email

dashboard/
├── (main page)

transactions/
├── (main page)

settings/
├── profile
├── preferences
├── security
```

### Component Architecture
```
src/
├── components/
│   ├── ui/           # Shadcn/ui components (button, input, dropdown-menu, etc.)
│   ├── layout/       # Layout components (auth, dashboard, user menu)
│   ├── guards/       # Route guards (public-route, role-guard)
│   └── shared/       # Shared components (error boundary, sentry integration)
│
└── features/
    ├── auth/         # Authentication feature
    │   ├── api/      # API calls (auth-api.ts)
    │   ├── components/
    │   ├── hooks/    # Auth-specific hooks
    │   ├── store/    # Auth state (auth-store.ts)
    │   └── validations/
    │
    ├── preferences/  # Theme/preferences feature
    │   ├── components/
    │   └── utils/    # Theme utilities (theme-script.ts)
    │
    └── profile/      # User profile feature
        ├── api/
        └── components/
```

### Type Organization (Phase 0 Critical)
- **Location:** `src/types/`
- **Pattern:** Never create feature-specific types
- **Import:** `import type { TypeName } from '@/types/api/feature'`
- **Benefits:** Single source of truth, prevents type drift

---

## Backend API (`services/backend`)

### Technology Stack
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript (strict mode)
- **ORM:** TypeORM with PostgreSQL/Supabase
- **Database:** PostgreSQL 15+ with TimescaleDB + pgvector extensions
- **Authentication:** JWT (15m access tokens, 7d refresh)
- **API Documentation:** OpenAPI 3.0 (Swagger)
- **Testing:** Jest
- **Queue:** BullMQ (Redis-backed)
- **Caching:** Redis

### Module Structure
```
src/
├── auth/                # Authentication & authorization
├── transactions/        # Transaction management
├── banking/            # Bank account integration (Plaid)
├── budgets/            # Budget management
├── notifications/      # Push/email notifications
├── gateway/            # API gateway & webhooks
├── common/             # Shared utilities
│   ├── filters/        # Exception filters
│   ├── interceptors/   # Request/response interceptors
│   ├── decorators/     # Custom decorators
│   └── guards/         # Auth guards
├── config/             # Configuration
│   ├── auth.config.ts
│   ├── database.config.ts
│   └── cache.config.ts
├── database/           # Database module
├── events/             # Event emitter
└── migrations/         # Database migrations
```

### Key Patterns

**Error Handling (Phase 0):**
```typescript
// Type guard for errors
catch (error) {
  if (error instanceof Error) {
    // Safe to use error.message, error.stack
  }
  throw new CustomException(error?.message)
}
```

**DTO/Entity Initialization (Phase 0):**
```typescript
// Use ! assertion for non-optional properties
@Column()
userId!: string

@Column()
amount!: number
```

**Service Layer:**
- Controllers: Thin, just handle HTTP
- Services: Thick, contain business logic
- Repositories: TypeORM patterns with query builders

### Database
- **Connection Pooling:** PgBouncer (Supabase built-in)
- **Migrations:** TypeORM with generated scripts
- **Indexes:** Composite indexes on user_id, date for transaction queries
- **Features:** Time-series with TimescaleDB, vector search with pgvector

### API Routes
- Base: `/api/v1`
- Documentation: `/api/docs` (Swagger UI)
- Health: `/health`

---

## Analytics Service (`services/analytics`)

### Technology Stack
- **Framework:** FastAPI (Python)
- **Port:** 5000
- **Features:**
  - AI/LLM operations (OpenAI, Anthropic)
  - Transaction categorization
  - Spending analysis
  - Caching (95%+ hit rate target)

### 4-Tier Caching Strategy
1. **Tier 1 (Redis):** Instant lookup, 80% hit rate
2. **Tier 2 (User History):** Personal patterns, 10% hit rate
3. **Tier 3 (Global DB):** Crowd-sourced, 5% hit rate
4. **Tier 4 (LLM API):** Last resort, 5% usage
- **Target Impact:** 80% cost reduction ($500→$100/month)

---

## Configuration Files

### TypeScript (`tsconfig.json`)
- **Strict Mode:** ✅ Enabled
- **Module Resolution:** Node (ES2020)
- **Path Aliases:**
  - `@/` → Frontend src
  - `@app/` → Apps
  - `@services/` → Services
  - `@libs/` → Libs

### ESLint (Phase 0)
- **Config:** `libs/config/eslint-config`
- **Rules:** TypeScript strict, no any, explicit return types
- **Integration:** lint-staged for pre-commit checks

### Jest (Phase 0)
- **Preset:** `jest.preset.js` (workspace configuration)
- **Coverage:** Tracked across backend/frontend
- **Command:** `pnpm test` (all), `pnpm test:cov` (with coverage)

### Docker Compose
- **PostgreSQL:** Port 5432 (local dev)
- **Redis:** Port 6379 (cache + queue)
- **Backend:** Port 4000
- **Frontend:** Port 3000
- **Analytics:** Port 5000

### Environment Variables (Phase 0)
- **Pattern:** `.env` (development), `.env.production` (prod)
- **Secrets:** `.env.docker` for Docker services (gitignored)
- **Template:** `.env.example`, `.env.docker.example`

---

## Build & Development

### Package Manager
- **Tool:** pnpm (fast, disk-efficient)
- **Lock File:** pnpm-lock.yaml

### Build Tools
- **Module Bundler:** NX (monorepo orchestration)
- **Frontend Build:** Next.js (webpack)
- **Backend Build:** TypeScript compiler
- **Optimization:** NX caching for incremental builds

### Development Scripts
```bash
pnpm dev                    # All services
pnpm dev:frontend          # Next.js only
pnpm dev:backend           # NestJS only
pnpm build                 # Build all
pnpm lint                  # ESLint
pnpm test                  # Jest tests
pnpm docker:up            # Start services
```

---

## Testing Strategy

### Unit Tests
- **Location:** `*.test.ts` or `*.spec.ts`
- **Runner:** Jest
- **Coverage Target:** 80%+
- **Backend:** Service/controller isolation with mocks

### Integration Tests
- **Scope:** API endpoints with real database
- **Database:** Separate test database
- **Cleanup:** Transaction rollback after each test

### E2E Tests
- **Tools:** Playwright (frontend), Supertest (backend)
- **Scenarios:** Complete user flows

---

## Security Practices

### Authentication
- **Pattern:** JWT with short-lived access tokens
- **Tokens:** 15m access, 7d refresh (httpOnly cookie)
- **OAuth:** AES-256-GCM encryption for tokens at rest

### Input Validation
- **Tool:** class-validator decorators on DTOs
- **Pattern:** Pipes for automatic validation

### Secrets Management
- **Local:** `.env.docker` for Docker services (Phase 0)
- **Production:** AWS Secrets Manager (future)

### Rate Limiting
- **Backend:** 100 req/min (authenticated), 20 req/min (public)
- **Tool:** Redis-backed counters

---

## Monitoring & Observability

### Sentry Integration
- **Frontend DSN:** Environment variable
- **Backend DSN:** Environment variable
- **Features:** Error tracking, performance monitoring, session replay
- **PII Scrubbing:** Automatic on emails, financial data

### Logging
- **Backend:** Structured logging (Winston/default Logger)
- **Format:** JSON with context (userId, transactionId, etc.)
- **Levels:** ERROR, WARN, INFO, DEBUG

### Performance Metrics
- **Frontend:** Web Vitals (LCP, FID, CLS)
- **Backend:** Response times, database query duration
- **Cache:** Hit rate tracking

---

## Development Workflow

### Branch Strategy
```
main (production)
├── feature/auth-2fa
├── fix/token-refresh-bug
└── docs/api-documentation
```

### Commit Convention
```
type(scope): description

feat(auth): add 2FA support
fix(api): resolve token refresh issue
docs(readme): update setup instructions
```

### PR Process
1. Create feature branch
2. Implement with tests
3. Run linting/tests locally
4. Create PR with description
5. Code review
6. Merge when approved

---

## Phase 0 Completion Status

### ✅ Completed
- ESLint dependencies installed and configured
- Docker secrets management pattern implemented
- Jest preset created for monorepo testing
- 146 TypeScript errors resolved
- All DTOs/entities refactored with `!` assertions
- Error type casting pattern documented
- NX caching optimized
- Dependencies updated (husky@9, lint-staged@16, concurrently@9, @types/node@22)

### Impact
- Backend team can proceed without TypeScript compilation errors
- Improved developer experience (faster builds, better tooling)
- Security improved (secrets no longer in git)
- Testing infrastructure ready for Phase 1-4

---

## Key Statistics

- **Total Files:** ~150+
- **Frontend Components:** 30+
- **Backend Modules:** 7
- **TypeScript Strict:** ✅ 100%
- **Test Coverage Target:** 80%+
- **Documentation Pages:** 15+
- **Supported Languages:** English, Vietnamese

---

## Next Steps

1. **Phase 1:** Backend Core Implementation (JWT, OAuth, database)
2. **Phase 2:** Domain Modules (transactions, budgets, banking)
3. **Phase 3:** Analytics Service (LLM categorization, reporting)
4. **Phase 4:** Integration & Testing (E2E flows, performance)
5. **Phase 5:** Production Deployment

---

**Last Updated:** 2026-01-21
**Maintained By:** Development Team
**Questions?** See [Development Guide](./development-guide.md) or [Code Standards](./code-standards.md)
