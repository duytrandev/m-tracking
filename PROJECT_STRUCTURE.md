# M-Tracking Project Structure

**Last Updated**: January 19, 2026

## Overview

M-Tracking is a monorepo-based Personal Finance Management Platform using pnpm workspaces and Nx build system. The project follows a hybrid modular monolith architecture for backend services, with separate frontend and analytics services.

---

## Directory Structure

```
m-tracking/
├── apps/                           # Application layer
│   └── frontend/                   # Next.js 16 web application
│       ├── app/                    # Next.js App Router (routes)
│       │   ├── (auth)/             # Auth routes group
│       │   ├── (dashboard)/        # Dashboard routes group
│       │   ├── api/                # API routes
│       │   ├── layout.tsx          # Root layout
│       │   └── page.tsx            # Home page
│       ├── src/
│       │   ├── components/         # React components
│       │   │   ├── ui/             # shadcn/ui components
│       │   │   ├── features/       # Feature-specific components
│       │   │   └── shared/         # Shared components
│       │   ├── hooks/              # Custom React hooks
│       │   ├── lib/                # Frontend utilities
│       │   │   ├── api/            # API client functions
│       │   │   ├── stores/         # Zustand stores
│       │   │   └── utils/          # Helper functions
│       │   └── types/              # TypeScript types
│       ├── public/                 # Static assets
│       ├── locales/                # i18n translations
│       │   ├── en/                 # English
│       │   └── vi/                 # Vietnamese
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── package.json
│
├── services/                       # Backend services
│   ├── backend/                    # NestJS modular monolith (Port 4000)
│   │   ├── src/
│   │   │   ├── app.module.ts       # Root module
│   │   │   ├── main.ts             # Application entry point
│   │   │   │
│   │   │   ├── gateway/            # API Gateway Module
│   │   │   │   ├── middleware/     # Express middleware
│   │   │   │   ├── guards/         # Route guards
│   │   │   │   ├── interceptors/   # HTTP interceptors
│   │   │   │   └── filters/        # Exception filters
│   │   │   │
│   │   │   ├── auth/               # Authentication Module
│   │   │   │   ├── controllers/    # Auth endpoints
│   │   │   │   ├── services/       # Auth business logic
│   │   │   │   ├── strategies/     # Passport strategies
│   │   │   │   ├── guards/         # JWT/OAuth guards
│   │   │   │   └── dto/            # Data transfer objects
│   │   │   │
│   │   │   ├── transaction/        # Transaction Module
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/   # Database repositories
│   │   │   │   ├── entities/       # TypeORM entities
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── bank/               # Banking Integration Module
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── providers/      # Bank API providers (Plaid, Tink)
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── budget/             # Budget Management Module
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── entities/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── notification/       # Notification Module
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── telegram/       # Telegram bot handlers
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── shared/             # Shared Infrastructure
│   │   │   │   ├── config/         # Configuration service
│   │   │   │   ├── database/       # Database module
│   │   │   │   ├── cache/          # Redis cache service
│   │   │   │   ├── queue/          # RabbitMQ queue service
│   │   │   │   ├── logger/         # Winston logger
│   │   │   │   └── utils/          # Helper functions
│   │   │   │
│   │   │   └── migrations/         # TypeORM migrations
│   │   │
│   │   ├── test/                   # E2E tests
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── analytics/                  # Python Analytics Service (Port 5000)
│       ├── app/
│       │   ├── main.py             # FastAPI application
│       │   ├── core/               # Core configuration
│       │   │   ├── config.py       # Settings
│       │   │   └── logging.py      # Logging setup
│       │   ├── routers/            # API routes
│       │   │   ├── insights.py     # Spending insights
│       │   │   └── predictions.py  # Budget predictions
│       │   ├── services/           # Business logic
│       │   │   ├── llm_service.py  # LLM integration
│       │   │   └── analytics.py    # Data analytics
│       │   └── models/             # Data models (Pydantic)
│       ├── tests/                  # pytest tests
│       ├── pyproject.toml          # uv/rye config
│       ├── uv.lock
│       ├── Dockerfile
│       └── README.md
│
├── libs/                           # Shared libraries
│   ├── common/                     # Common utilities (@m-tracking/common)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── decorators/         # Custom decorators
│   │   │   ├── interfaces/         # Shared interfaces
│   │   │   └── validators/         # Custom validators
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── constants/                  # Constants (@m-tracking/constants)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── transaction-categories.ts
│   │   │   ├── currency-codes.ts
│   │   │   └── error-codes.ts
│   │   └── package.json
│   │
│   ├── types/                      # TypeScript types (@m-tracking/types)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── transaction.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── api.types.ts
│   │   └── package.json
│   │
│   ├── utils/                      # Utility functions (@m-tracking/utils)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── date.utils.ts
│   │   │   ├── currency.utils.ts
│   │   │   └── validation.utils.ts
│   │   └── package.json
│   │
│   └── config/                     # Configuration packages
│       ├── eslint-config/          # ESLint shared config
│       ├── prettier-config/        # Prettier shared config
│       └── typescript-config/      # TypeScript base configs
│
├── docs/                           # Project documentation
│   ├── README.md                   # Documentation index
│   ├── prd.md                      # Product requirements
│   ├── system-architecture.md      # System architecture
│   ├── api-documentation.md        # API specifications
│   ├── code-standards.md           # Coding standards
│   ├── development-guide.md        # Development guide
│   ├── development-roadmap.md      # Project roadmap
│   ├── project-changelog.md        # Change log
│   ├── deployment.md               # Deployment guide
│   ├── testing.md                  # Testing guide
│   └── troubleshooting.md          # Troubleshooting
│
├── plans/                          # Project plans
│   ├── 260118-1229-project-restructuring/
│   └── reports/                    # Planning reports
│
├── .github/                        # GitHub configuration
│   ├── workflows/                  # CI/CD workflows
│   │   ├── ci.yml                  # Continuous integration
│   │   ├── deploy-staging.yml      # Staging deployment
│   │   └── deploy-production.yml   # Production deployment
│   └── ISSUE_TEMPLATE/
│
├── .claude/                        # Claude AI configuration
│   ├── rules/                      # Development rules
│   └── skills/                     # Custom skills
│
├── .husky/                         # Git hooks
│   ├── pre-commit                  # Pre-commit hook
│   └── pre-push                    # Pre-push hook
│
├── docker-compose.yml              # Local development infrastructure
├── docker-compose.override.yml.example  # Local overrides example
├── pnpm-workspace.yaml             # pnpm workspace config
├── nx.json                         # Nx workspace config
├── tsconfig.json                   # Root TypeScript config
├── .eslintrc.json                  # Root ESLint config
├── .prettierrc                     # Prettier config
├── .editorconfig                   # Editor config
├── .env.example                    # Environment variables example
├── package.json                    # Root package.json
├── README.md                       # Project README
├── PROJECT_STRUCTURE.md            # This file
├── CONTRIBUTING.md                 # Contribution guidelines
├── SECURITY.md                     # Security policy
└── LICENSE                         # License file
```

---

## Technology Stack

### Backend (NestJS Monolith)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 24.13.0 LTS | JavaScript runtime (minimum: >= 20.10.0) |
| **NestJS** | 11.1.12 | Backend framework |
| **TypeScript** | 5.9.x | Type-safe JavaScript |
| **TypeORM** | 0.3.28 | Database ORM |
| **class-validator** | 0.14.x | DTO validation |
| **class-transformer** | 0.5.x | Object transformation |
| **bcrypt** | 5.1.x | Password hashing |
| **passport** | 0.7.x | Authentication middleware |
| **passport-jwt** | 4.0.x | JWT strategy |
| **@nestjs/jwt** | 10.2.x | JWT utilities |
| **winston** | 3.11.x | Logging |
| **helmet** | 7.1.x | Security headers |

### Analytics Service (FastAPI)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.13.11 | Runtime (minimum: >= 3.12) |
| **FastAPI** | 0.110+ | Web framework |
| **uvicorn** | 0.27+ | ASGI server |
| **pydantic** | 2.6+ | Data validation |
| **asyncpg** | 0.29+ | PostgreSQL async driver |
| **SQLAlchemy** | 2.0+ | ORM |
| **anthropic** | 0.18+ | Claude API client |
| **openai** | 1.12+ | OpenAI API client |

### Frontend (Next.js)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1 | React framework |
| **React** | 19.2 | UI library |
| **TypeScript** | 5.9.x | Type safety |
| **TailwindCSS** | 4.1.18 | Utility-first CSS |
| **shadcn/ui** | Latest | UI components |
| **Radix UI** | Latest | Headless UI primitives |
| **Zustand** | 5.0.x | Client state management |
| **TanStack Query** | 5.x | Server state management |
| **React Hook Form** | 7.50.x | Form handling |
| **Zod** | 3.22.x | Schema validation |
| **next-intl** | 3.9.x | Internationalization |
| **lucide-react** | Latest | Icons |

### Database & Caching

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 17.7 | Primary database |
| **TimescaleDB** | 2.14+ | Time-series extension |
| **pgvector** | 0.6+ | Vector similarity search |
| **Redis** | 7.x | Caching & session storage |
| **RabbitMQ** | 3.12 | Message broker |

### Infrastructure & DevOps

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | Latest | Containerization |
| **Docker Compose** | Latest | Local orchestration |
| **Nx** | 22.3.3 | Monorepo build system |
| **pnpm** | 10.28.0 | Package manager |
| **Husky** | 8.0.3 | Git hooks |
| **ESLint** | 8.x | Linting |
| **Prettier** | 3.1.0 | Code formatting |
| **Jest** | 29.x | Testing (Backend) |
| **Vitest** | 1.x | Testing (Frontend) |
| **Playwright** | 1.40.x | E2E testing |

---

## Architecture Patterns

### Backend Architecture

**Modular Monolith**
- All business domains in single codebase
- Modules: Auth, Transaction, Banking, Budget, Notification
- Shared infrastructure layer
- Clear module boundaries
- Repository pattern for data access

**Design Patterns**
- **Repository Pattern**: Data access abstraction
- **DTO Pattern**: Request/response validation
- **Strategy Pattern**: Multiple bank provider implementations
- **Observer Pattern**: Event-driven notifications via RabbitMQ
- **Singleton Pattern**: Configuration and logger services

### Frontend Architecture

**Server Components First**
- Default to React Server Components
- Client Components only when needed (interactivity)
- Minimize client-side JavaScript

**State Management**
- **Zustand**: Client state (UI, forms)
- **TanStack Query**: Server state (API data, caching)
- No Redux - simpler state management

**Code Organization**
- Feature-based folder structure
- Co-located components and hooks
- Shared UI components in `components/ui`
- Maximum 200 lines per file

### Database Architecture

**PostgreSQL + Extensions**
- **TimescaleDB**: Transaction time-series data
- **pgvector**: AI embeddings for transaction categorization
- **Partitioning**: Monthly transaction partitions
- **Indexing**: Optimized for common queries

**Schema Design**
- Multi-tenant (user_id in all tables)
- Audit columns (created_at, updated_at)
- Soft deletes where appropriate
- Normalized schema (3NF)

---

## Port Allocations

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| **Frontend** | 3000 | HTTP | Next.js development server |
| **Backend** | 4000 | HTTP | NestJS API |
| **Analytics** | 5000 | HTTP | FastAPI service |
| **PostgreSQL** | 5432 | TCP | Database server |
| **Redis** | 6379 | TCP | Cache server |
| **RabbitMQ** | 5672 | AMQP | Message broker |
| **RabbitMQ UI** | 15672 | HTTP | Management interface |

---

## Monorepo Organization

### Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - 'services/*'
  - 'libs/*'
  - 'apps/*'
```

### Shared Libraries

| Package | Scope | Purpose |
|---------|-------|---------|
| `@m-tracking/common` | Backend + Frontend | Shared utilities, decorators, interfaces |
| `@m-tracking/constants` | Backend + Frontend | Transaction categories, currency codes, error codes |
| `@m-tracking/types` | Backend + Frontend | TypeScript type definitions |
| `@m-tracking/utils` | Backend + Frontend | Helper functions (date, currency, validation) |
| `@m-tracking/eslint-config` | All | ESLint configuration |
| `@m-tracking/prettier-config` | All | Prettier configuration |
| `@m-tracking/typescript-config` | Backend + Frontend | TypeScript base configs |

### Nx Task Dependencies

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

---

## Module Descriptions

### Backend Modules

**Gateway Module**
- Rate limiting
- CORS configuration
- Global exception filters
- Request/response logging
- API versioning

**Auth Module**
- User registration & login
- JWT token generation & refresh
- Password reset flow
- OAuth integration (Google, GitHub)
- Role-based access control (RBAC)

**Transaction Module**
- Transaction CRUD operations
- Automatic categorization (AI-powered)
- Transaction search & filtering
- Bulk import/export
- Transaction analytics

**Bank Module**
- Bank account linking (Plaid, Tink, momo.vn)
- Automatic transaction sync
- Balance updates
- Multi-bank support
- Webhook handling

**Budget Module**
- Budget creation & management
- Category-based budgets
- Budget tracking & alerts
- Budget recommendations
- Spending analysis

**Notification Module**
- Telegram bot integration
- Email notifications
- Push notifications
- Budget alerts
- Transaction confirmations

---

## Development Guidelines

### File Naming

- **kebab-case**: `user-registration.service.ts`
- **Descriptive**: `transaction-categorization-logic.ts` (long names OK)
- **Extensions**: `.service.ts`, `.controller.ts`, `.dto.ts`, `.entity.ts`

### Code Organization

- **Maximum 200 lines per file**
- **Single Responsibility Principle**
- **Feature folders**: Group related files
- **Index exports**: Clean imports

### Principles

- **YAGNI** (You Aren't Gonna Need It)
- **KISS** (Keep It Simple, Stupid)
- **DRY** (Don't Repeat Yourself)
- **SOLID** principles

---

## Environment Configuration

### Backend (.env)

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/mtracking
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Analytics (.env)

```bash
PYTHON_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/mtracking
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ANALYTICS_URL=http://localhost:5000
```

---

## Database Migrations

```bash
# Generate migration
cd services/backend
pnpm run migration:generate -- src/migrations/AddUserTable

# Run migrations
pnpm run migration:run

# Revert migration
pnpm run migration:revert

# Show migrations
pnpm run migration:show
```

---

## Testing Strategy

### Backend Testing

- **Unit Tests**: Jest (services, utilities)
- **Integration Tests**: Testcontainers (database, Redis)
- **E2E Tests**: Supertest (API endpoints)
- **Target Coverage**: >= 80%

### Frontend Testing

- **Unit Tests**: Vitest (components, hooks)
- **Integration Tests**: Testing Library (component integration)
- **E2E Tests**: Playwright (user flows)
- **Target Coverage**: >= 80%

### Analytics Testing

- **Unit Tests**: pytest (services, utilities)
- **Integration Tests**: pytest + testcontainers
- **Target Coverage**: >= 70%

---

## Build & Deployment

### Development

```bash
# All services
pnpm run dev

# Individual services
pnpm run dev:frontend
pnpm run dev:backend
pnpm run dev:analytics
```

### Production Build

```bash
# Build all
pnpm run build

# Build individual
pnpm run build:frontend
pnpm run build:backend
```

### Docker

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

---

## CI/CD Pipeline

### GitHub Actions

1. **Lint & Format Check**
2. **Type Check** (TypeScript)
3. **Unit Tests** (all projects)
4. **Integration Tests**
5. **Build Check**
6. **E2E Tests** (Playwright)
7. **Deploy to Staging** (on main branch)
8. **Deploy to Production** (on release tag)

---

## Monitoring & Logging

### Backend Logging

- **Winston** logger with custom format
- Log levels: error, warn, info, debug
- Structured logging (JSON)
- Request/response logging

### Frontend Monitoring

- Client-side error tracking
- Performance monitoring (Web Vitals)
- User analytics

### Infrastructure Monitoring

- Docker container health checks
- Database connection monitoring
- Redis connection monitoring
- RabbitMQ queue monitoring

---

## Security Considerations

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Password Hashing**: bcrypt (cost factor 12)
- **Rate Limiting**: Express rate limit
- **CORS**: Configured origins only
- **Helmet**: Security headers
- **Input Validation**: class-validator, Zod
- **SQL Injection Prevention**: Parameterized queries (TypeORM)
- **XSS Prevention**: React automatic escaping

---

## Related Documentation

- [README.md](./README.md) - Quick start and overview
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development workflow
- [docs/system-architecture.md](./docs/system-architecture.md) - Detailed architecture
- [docs/code-standards.md](./docs/code-standards.md) - Coding conventions
- [docs/api-documentation.md](./docs/api-documentation.md) - API reference

---

*Last Updated: January 19, 2026*
