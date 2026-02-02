# M-Tracking Codebase Summary

**Last Updated**: February 3, 2026 | **Status**: Active Development | **Total LOC**: ~23,150

---

## Directory Structure Overview

```
m-tracking/
├── apps/
│   └── frontend/                    # Next.js 16 frontend (13,473 LOC, 98 files)
│       ├── app/                     # App Router pages & layouts
│       │   ├── auth/               # Auth pages (login, register, 2FA, OAuth callback)
│       │   ├── dashboard/          # Main dashboard with stats/charts
│       │   ├── settings/           # User settings (profile, security)
│       │   ├── transactions/       # Transaction management
│       │   ├── api/                # Server-side API routes
│       │   ├── layout.tsx          # Root layout with providers
│       │   ├── providers.tsx       # Client providers (React Query, Zustand, Theme)
│       │   └── globals.css         # Global styles
│       ├── src/
│       │   ├── components/         # UI components (~2,318 LOC)
│       │   │   ├── ui/            # shadcn/ui primitives
│       │   │   ├── auth/          # Auth guards & components
│       │   │   ├── layout/        # Page layouts
│       │   │   ├── shared/        # Shared components
│       │   │   └── providers/     # Context providers
│       │   ├── features/           # Feature modules (~6,566 LOC)
│       │   │   ├── auth/          # Authentication
│       │   │   ├── spending/      # Transactions & charts
│       │   │   ├── profile/       # User profile
│       │   │   └── preferences/   # Theme, localization
│       │   ├── hooks/              # Global hooks (~350 LOC)
│       │   ├── lib/                # Utilities & configuration (~1,864 LOC)
│       │   │   ├── api-client.ts  # Axios with interceptors
│       │   │   ├── auth-middleware.ts
│       │   │   ├── store/         # Zustand stores
│       │   │   ├── query/         # React Query setup
│       │   │   └── i18n/          # next-intl setup
│       │   ├── types/              # TypeScript definitions (~506 LOC)
│       │   ├── mocks/              # MSW handlers (~1,806 LOC)
│       │   └── middleware.ts       # Next.js middleware
│       ├── public/                 # Static assets
│       ├── next.config.ts          # Next.js config
│       ├── tailwind.config.js      # TailwindCSS theme
│       ├── eslint.config.js        # ESLint (flat config v9)
│       ├── tsconfig.json           # TypeScript config
│       ├── vitest.config.ts        # Unit test config
│       └── playwright.config.ts    # E2E test config
│
├── services/
│   ├── backend/                     # NestJS backend (8,774 LOC, 106 files)
│   │   ├── src/
│   │   │   ├── app.module.ts       # Root module
│   │   │   ├── main.ts             # Entry point
│   │   │   ├── auth/               # Authentication module
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── constants/      # Token expiry times (NEW)
│   │   │   │   ├── strategies/     # Passport strategies (JWT, OAuth)
│   │   │   │   ├── guards/         # Auth guards
│   │   │   │   ├── services/       # Token, Password, Session, OAuth
│   │   │   │   └── entities/       # DB entities (User, Session, etc.)
│   │   │   ├── transactions/       # Transactions module
│   │   │   │   ├── transactions.controller.ts
│   │   │   │   ├── transactions.service.ts
│   │   │   │   ├── entities/       # Transaction, Category
│   │   │   │   └── dto/            # Data transfer objects
│   │   │   ├── shared/             # Shared services
│   │   │   │   ├── redis.service.ts
│   │   │   │   ├── logger.service.ts
│   │   │   │   ├── queue.service.ts
│   │   │   │   └── email.service.ts (skeleton)
│   │   │   ├── config/             # Configuration
│   │   │   │   ├── app.config.ts
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── jwt.config.ts
│   │   │   │   └── redis.config.ts
│   │   │   ├── common/             # Global setup
│   │   │   │   ├── filters/        # Exception filter
│   │   │   │   ├── interceptors/   # Transform, logging
│   │   │   │   ├── pipes/          # Validation pipe
│   │   │   │   └── guards/         # Rate limiting, JWT
│   │   │   ├── migrations/         # Database migrations
│   │   │   ├── database/           # TypeORM setup
│   │   │   ├── events/             # Event emitter
│   │   │   ├── banking/            # Placeholder module
│   │   │   ├── budgets/            # Placeholder module
│   │   │   └── notifications/      # Placeholder module
│   │   ├── test/                   # Test fixtures
│   │   ├── .env.example            # Environment template
│   │   ├── tsconfig.json           # TS config
│   │   └── project.json            # Nx project config
│   │
│   └── analytics/                   # FastAPI service (88 LOC, 7 files)
│       ├── app/
│       │   ├── core/
│       │   │   ├── config.py       # Pydantic settings
│       │   │   └── __init__.py
│       │   ├── routers/            # API route handlers (TODO)
│       │   ├── services/           # Business logic
│       │   ├── models/             # Data models/schemas
│       │   └── main.py             # FastAPI app
│       ├── pyproject.toml          # Python dependencies
│       └── .env.example            # Environment template
│
├── libs/
│   └── shared/                      # Shared types & utilities (700 LOC, 10 files)
│       ├── src/
│       │   ├── interfaces/         # API response types
│       │   │   ├── api-response.interface.ts
│       │   │   └── user.interface.ts
│       │   ├── types/              # Domain types
│       │   │   └── index.ts        # Transaction, Budget, BankAccount
│       │   ├── constants/          # Shared constants
│       │   │   └── index.ts        # Categories, currencies, error codes
│       │   ├── utils/              # Utilities
│       │   │   └── index.ts        # Formatters, validators, logger
│       │   ├── index.ts            # Barrel export
│       │   └── tsconfig.json
│       └── eslint.config.js
│
├── docs/                            # Documentation
│   ├── prd.md                      # Complete product requirements (828 LOC)
│   ├── project-overview-pdr.md     # Project overview (this doc)
│   ├── codebase-summary.md         # Codebase structure (this doc)
│   ├── code-standards.md           # Development standards
│   ├── system-architecture.md      # System design
│   ├── project-roadmap.md          # Implementation status
│   ├── authentication.md           # Auth system & API documentation (803 LOC)
│   └── [other guides]
│
├── plans/                           # Project plans & reports
│   └── reports/                    # Scout reports, implementation reports
│
├── docker-compose.yml              # Local infrastructure
├── nx.json                         # Nx workspace config
├── package.json                    # Root package.json
├── pnpm-workspace.yaml             # pnpm workspace config
├── tsconfig.base.json              # Base TypeScript config
├── eslint.config.js                # Root ESLint config
├── prettier.config.js              # Prettier config
├── .env.example                    # Environment template
├── .husky/                         # Git hooks
├── .github/workflows/              # CI/CD pipelines
└── README.md                       # Project README
```

---

## Module Organization Patterns

### Frontend (Next.js 16 with App Router)

**Feature-Driven Architecture:**

```
features/{feature}/
├── api/              # Feature-specific API client (e.g., auth-api.ts)
├── components/       # UI components (max 200 LOC each)
├── hooks/            # Custom React hooks (useLogin, useProfile, etc.)
├── services/         # Business logic services
├── store/            # Zustand stores for feature state
├── validations/      # Zod validation schemas
└── index.ts          # Public API exports
```

**State Management:**

- **Zustand**: Global state (auth, UI preferences)
- **React Query**: Server state (API data caching)
- **Local state**: Component-level via useState

**Styling:**

- **TailwindCSS**: Utility-first CSS
- **CSS Modules**: Component-scoped styles
- **Dark mode**: Class-based via TailwindCSS

### Backend (NestJS Modular Monolith)

**Domain-Driven Design:**

```
{module}/
├── {module}.module.ts        # Module definition
├── {module}.controller.ts    # HTTP endpoints
├── {module}.service.ts       # Business logic
├── entities/                 # Database entities
├── dto/                      # Data transfer objects
├── repositories/             # Data access layer
├── guards/                   # Authorization guards
├── strategies/               # Auth strategies (Passport)
└── services/                 # Utility services
```

**Module Structure:**

- **AuthModule**: User registration, login, OAuth, 2FA, sessions
- **TransactionsModule**: CRUD operations, categorization, analytics
- **SharedModule**: Redis, Logger, Queue, Email services (global scope)
- **Placeholder Modules**: Banking, Budgets, Notifications (ready for implementation)

---

## Key Files & Their Purpose

### Frontend Core

| File                             | Lines | Purpose                                                 |
| -------------------------------- | ----- | ------------------------------------------------------- |
| `src/lib/api-client.ts`          | ~50   | Axios instance with auth interceptors & token refresh   |
| `src/lib/store/auth-store.ts`    | ~80   | Zustand auth state (user, login, logout)                |
| `src/lib/store/ui-store.ts`      | ~70   | UI state (theme, sidebar) with localStorage persistence |
| `src/lib/query/client.ts`        | ~40   | React Query client factory with sensible defaults       |
| `src/lib/query/keys.ts`          | ~60   | Query key factory patterns (hierarchical)               |
| `src/features/auth/index.ts`     | ~30   | Auth feature public API                                 |
| `src/features/spending/index.ts` | ~30   | Spending feature public API                             |
| `src/middleware.ts`              | ~50   | Next.js middleware (i18n + auth)                        |

### Backend Core

| File                                               | Lines | Purpose                                          |
| -------------------------------------------------- | ----- | ------------------------------------------------ |
| `src/app.module.ts`                                | ~40   | Root module definition                           |
| `src/main.ts`                                      | ~60   | Bootstrap sequence (Sentry, middleware, filters) |
| `src/auth/auth.service.ts`                         | ~150  | Auth business logic                              |
| `src/auth/strategies/jwt.strategy.ts`              | ~50   | JWT validation strategy                          |
| `src/shared/redis.service.ts`                      | ~150  | Redis wrapper with utility methods               |
| `src/config/database.config.ts`                    | ~40   | PostgreSQL/Supabase configuration                |
| `src/common/filters/http-exception.filter.ts`      | ~40   | Global error handling                            |
| `src/common/interceptors/transform.interceptor.ts` | ~30   | Response wrapping                                |

### Shared Library

| File                                       | Lines | Purpose                                    |
| ------------------------------------------ | ----- | ------------------------------------------ |
| `src/interfaces/api-response.interface.ts` | ~50   | Standard API response types                |
| `src/interfaces/user.interface.ts`         | ~80   | User, role, permission types               |
| `src/types/index.ts`                       | ~150  | Transaction, Budget, BankAccount types     |
| `src/constants/index.ts`                   | ~200  | Categories, currencies, error codes, regex |
| `src/utils/index.ts`                       | ~120  | Formatters, validators, logger utility     |

---

## Feature Inventory

### Implemented Features

**Authentication (100% Complete - Core Auth)**

- Email/password registration with email verification (24h tokens)
- OAuth 2.0 (Google PKCE, GitHub, Facebook with auto-linking)
- Password setup flow for OAuth-only users (NEW: Phase 1)
  - Users can request password setup email (3/min rate limit)
  - 1-hour TTL setup tokens, reuses password reset infrastructure
  - Audit logging with IP and user agent tracking
- 2FA (TOTP) infrastructure ready, UI pending
- Password reset with 1-hour token TTL
- JWT token refresh with 60-second pre-expiry refresh (15m access, 7d refresh)
- Session tracking with device fingerprinting and IP logging
- Role-Based Access Control (RBAC) via User → Roles → Permissions
- Centralized token expiry constants (NEW: Phase 1)
- Rate limiting (5/min login, 3/min password reset & setup)
- See [Authentication](./authentication.md) for complete documentation

**Transactions (100% Complete)**

- CRUD operations with pagination
- Search and filtering
- Category management
- Mock data with MSW
- Real-time spending summary
- 4-tier AI categorization infrastructure

**User Profile (100% Complete)**

- Profile CRUD
- Avatar upload
- Password change
- Session management & revocation
- Preference settings (language, currency)

**Frontend UI (100% Complete)**

- 13+ authentication components
- 8+ spending/transaction components
- Responsive dashboard
- Charts (Recharts) and visualizations
- Form validation (React Hook Form + Zod)
- Error handling & toast notifications
- Theme switching (light/dark/system)
- Accessibility patterns

**Telegram Bot (Infrastructure Ready)**

- Webhook endpoints configured
- Slash command parsing ready
- Notification templates structure
- User preference storage

### Placeholder Modules (Ready for Implementation)

- **BankingModule**: Plaid/Tink/MoMo integration endpoints
- **BudgetsModule**: Budget CRUD, threshold calculation, alerts
- **NotificationsModule**: Telegram delivery, email dispatch
- **GatewayModule**: Cross-cutting concerns (currently empty)

### Missing/Incomplete

- Email service implementation (skeleton exists, provider not configured)
- Event subscribers (domain events defined, no listeners implemented)
- Queue workers (BullMQ queues defined, no actual job processing)
- 2FA complete flow (database fields present, logic to be finalized)
- Sentry error handlers (initialized, handlers commented out)

---

## Code Quality Metrics

**Frontend:**

- ~13,473 LOC across 98 files
- Average file: ~137 LOC (well-sized)
- Component-based architecture with strict sizing (max 200 LOC)
- Type coverage: ~98% (TypeScript strict mode)
- Test coverage: Vitest + Playwright configured

**Backend:**

- ~8,774 LOC across 106 files
- Average service: ~85 LOC
- Domain-driven modular design
- Type coverage: ~100% (strict mode)
- 3 test spec files present (auth.service, oauth.service, oauth.controller)

**Shared Library:**

- ~700 LOC (10 files)
- Centralized types prevent divergence
- Barrel exports for clean imports

---

## Testing Infrastructure

**Unit Testing:**

- **Vitest** configured (4.0.17)
- Test files: `*.test.ts` alongside source
- Examples: ui-store.test.ts, safe-storage.test.ts, use-theme.test.ts

**E2E Testing:**

- **Playwright** configured (1.57.0)
- Browser automation ready

**Mocking:**

- **MSW** (Mock Service Worker) for API mocking
- Feature-specific handlers (auth, spending, profile)
- Pre-configured in app/providers.tsx

---

## Dependencies Overview

### Frontend Stack

- **React 19.2.0**: Latest with concurrent features
- **Next.js 16.1.4**: App Router, standalone output
- **TypeScript 5.9.3**: Strict mode
- **TailwindCSS 3.4.19**: Utility-first CSS
- **shadcn/ui**: Radix UI + Tailwind components
- **Zustand 5.0.10**: Lightweight state management
- **TanStack Query 5.90.17**: Server state & caching
- **React Hook Form 7.71.1**: Form state management
- **Zod 3.25.76**: Schema validation
- **Recharts 3.6.0**: Data visualization
- **Axios 1.13.2**: HTTP client

### Backend Stack

- **NestJS 11.1.12**: Framework
- **TypeORM**: Database ORM
- **PostgreSQL 17**: Database
- **Redis 7**: Cache/sessions
- **RabbitMQ 3.12**: Message queue (BullMQ)
- **Passport.js**: Authentication
- **Bcrypt**: Password hashing
- **Winston**: Logging
- **Class Validator**: DTO validation

### Development Tools

- **TypeScript 5.9.3**: Language
- **ESLint 9.39.2**: Flat config v9
- **Prettier 3.1.0**: Formatting
- **Nx 22.3.3**: Monorepo tool
- **Husky 9.1.7**: Git hooks
- **SWC 1.15.10**: Fast compiler

---

## Database Schema Summary

**Core Tables:**

- **users**: Authentication & profile (UUID PK, email unique)
- **sessions**: JWT sessions with device tracking
- **roles**: User roles (RBAC)
- **permissions**: Role permissions
- **oauth_accounts**: OAuth provider accounts
- **transactions**: User spending/income
- **categories**: Custom categories per user
- **verification_tokens**: Email verification
- **password_reset_tokens**: Password reset flow

**Indexes:**

- (user_id) on sessions, transactions, categories
- (refresh_token_hash) on sessions
- (email) on users
- (date) on transactions
- (user_id, date) composite on transactions

---

## Configuration Management

**Environment Variables:**

- Database: `DATABASE_URL`, `DB_HOST`, `DB_PASSWORD`
- Redis: `REDIS_HOST`, `REDIS_PORT`
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- OAuth: `OAUTH_GOOGLE_ID`, `OAUTH_GITHUB_ID`, etc.
- LLM: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- Telegram: `TELEGRAM_BOT_TOKEN`
- Sentry: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`

**Nx Configuration:**

- Cache settings in nx.json
- Named inputs for efficient builds
- Parallel execution (6 jobs default)
- Remote caching via NX Cloud (optional)

---

## CI/CD Pipeline

**GitHub Actions (`.github/workflows/ci.yml`):**

1. Setup (cache, dependencies)
2. Lint (ESLint on affected)
3. Type-Check (TypeScript compilation)
4. Test (Vitest with coverage)
5. Format-Check (Prettier validation)
6. Build (affected projects only)

**Local Pre-commit:**

- ESLint --fix
- Prettier formatting
- Type checking (via Husky)

---

## Performance Characteristics

**Frontend:**

- Query caching: 5-min stale time, 30-min GC
- Component re-render optimization via selectors
- Code splitting via dynamic imports
- Image optimization ready (next/image)
- Bundle analysis configured

**Backend:**

- Transaction query caching (Redis, 5-min TTL)
- Database indexes on hot paths
- Rate limiting (global + endpoint-specific)
- Pagination support (offset/limit)
- Efficient JSON aggregations (raw SQL)

---

## Security Measures

**Authentication:**

- RS256 JWT signing (asymmetric)
- Bcrypt password hashing (cost 12)
- Session tracking (device info, IP)
- Token blacklisting (Redis)

**Authorization:**

- JWT payload includes roles array
- Guards for role-based access
- RBAC infrastructure ready

**API Security:**

- CORS configured for frontend origin
- Rate limiting on auth endpoints (5/min)
- Input validation (class-validator)
- Error message sanitization

**Data Protection:**

- Sensitive fields encrypted (AES-256 ready)
- PII masking in logs
- HTTPS enforced in production
- TLS 1.2+ required

---

## Related Documentation

- [docs/system-architecture.md](./system-architecture.md) - Detailed system design
- [docs/code-standards.md](./code-standards.md) - Coding standards
- [docs/project-overview-pdr.md](./project-overview-pdr.md) - Product overview
- [docs/project-roadmap.md](./project-roadmap.md) - Implementation status
- [docs/prd.md](./prd.md) - Complete product requirements
