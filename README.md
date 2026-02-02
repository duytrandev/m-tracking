# M-Tracking - Personal Finance Management Platform

AI-powered personal finance management platform with automatic transaction aggregation, intelligent spending insights through LLM technology, and hybrid Telegram bot + web dashboard experience.

**Version**: 1.0.0 | **Status**: Active Development | **Last Updated**: February 1, 2026

---

## Overview

M-Tracking eliminates manual transaction tracking by integrating directly with banking APIs (Plaid, Tink, momo.vn, Stripe), while also supporting manual entry for cash/untracked accounts via Telegram chat, enabling users to achieve real-time financial awareness and better control over their spending.

### Key Features

- **Automatic Transaction Aggregation** - Direct banking API integrations
- **Telegram Bot Interface** - Natural language transaction entry
- **AI-Powered Insights** - LLM-driven spending analysis
- **Web Dashboard** - Next.js 16 with modern UI
- **Budget Management** - Smart budget tracking and alerts
- **Multi-language Support** - English and Vietnamese

---

## Quick Start

### Prerequisites

- Node.js >= 20.10.0
- pnpm >= 10.28.0
- Python >= 3.12 (with uv)
- Docker & Docker Compose

### Installation

```bash
# 1. Clone and install
git clone <repository-url> && cd m-tracking
pnpm install

# 2. Start infrastructure
pnpm run docker:up

# 3. Configure environment
cp apps/frontend/.env.example apps/frontend/.env
cp services/backend/.env.example services/backend/.env
cp services/analytics/.env.example services/analytics/.env

# 4. Start all services
pnpm run dev
```

Services available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Analytics API: http://localhost:5000

---

## Technology Stack

| Layer         | Technology                                                            |
| ------------- | --------------------------------------------------------------------- |
| **Frontend**  | Next.js 16.1, React 19.2, TypeScript 5.9, TailwindCSS 4.1, shadcn/ui  |
| **Backend**   | NestJS 11.1.12, TypeScript 5.9, PostgreSQL 17, Redis 7, RabbitMQ 3.12 |
| **Analytics** | FastAPI, Python 3.13+, AsyncPG, Redis                                 |
| **Monorepo**  | Nx 22.3.3, pnpm 10.28.0                                               |

---

## Essential Commands

```bash
# Development
pnpm run dev              # Start all services
pnpm run dev:frontend     # Start frontend only
pnpm run dev:backend      # Start backend only
pnpm run dev:analytics    # Start analytics only

# Quality
pnpm run test             # Run all tests
pnpm run lint             # Lint all projects
pnpm run format           # Format with Prettier

# Build
pnpm run build            # Build all projects

# Infrastructure
pnpm run docker:up        # Start containers
pnpm run docker:down      # Stop containers
```

---

## Project Structure

```
m-tracking/
├── apps/frontend/           # Next.js 16 web application
├── services/
│   ├── backend/            # NestJS modular monolith
│   └── analytics/          # FastAPI analytics service
├── libs/shared/            # Shared types & utilities
├── docs/                   # Documentation
└── docker-compose.yml      # Local infrastructure
```

**Codebase Stats:**

- Frontend: 13,473 LOC (98 files)
- Backend: 8,774 LOC (106 files)
- Analytics: 88 LOC (7 files)
- Shared: 700 LOC (10 files)

---

## Documentation

| Document                                                       | Purpose                            |
| -------------------------------------------------------------- | ---------------------------------- |
| [docs/project-overview-pdr.md](./docs/project-overview-pdr.md) | Product overview & requirements    |
| [docs/codebase-summary.md](./docs/codebase-summary.md)         | Directory structure & organization |
| [docs/code-standards.md](./docs/code-standards.md)             | Coding standards & conventions     |
| [docs/system-architecture.md](./docs/system-architecture.md)   | System design & components         |
| [docs/project-roadmap.md](./docs/project-roadmap.md)           | Implementation status & timeline   |
| [docs/prd.md](./docs/prd.md)                                   | Complete product requirements      |

---

## Database Access

```bash
# PostgreSQL (user: postgres, password: postgres)
docker exec -it mtracking-postgres psql -U postgres -d m_tracking

# Redis
docker exec -it mtracking-redis redis-cli

# RabbitMQ Management UI
# http://localhost:15672 (user: mtracking, password: mtracking_dev_password)
```

---

## Architecture Overview

**Hybrid Modular Monolith:**

- NestJS backend with domain-driven design (Auth, Transactions, Banking, Budgets, Notifications)
- Standalone FastAPI analytics service for AI/LLM operations
- Next.js frontend with modern React patterns
- PostgreSQL + TimescaleDB for transactions, Redis for caching/sessions, RabbitMQ for jobs

See [docs/system-architecture.md](./docs/system-architecture.md) for detailed architecture.

---

## Development Guidelines

- **File Size**: Keep files under 200 LOC
- **Naming**: Use kebab-case for file names
- **Principles**: YAGNI, KISS, DRY
- **Commits**: Conventional format `type(scope): description`
- **Code Quality**: TypeScript strict mode, ESLint, Prettier formatting
- **Testing**: Write tests for all new features

See [docs/code-standards.md](./docs/code-standards.md) for complete standards.

---

## Troubleshooting

**Docker issues:**

```bash
pnpm run docker:down
docker-compose down -v
pnpm run docker:up
```

**Dependencies:**

```bash
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

See [docs/project-roadmap.md](./docs/project-roadmap.md) for more help.

---

## Contributing

Follow development guidelines in [docs/code-standards.md](./docs/code-standards.md) including:

- TypeScript strict mode enforcement
- ESLint flat config (v9)
- Pre-commit hooks for formatting
- Test coverage requirements

---

## Security

- Passwords: bcrypt (cost 12)
- JWT: RS256 with 15m access, 7d refresh tokens
- CORS: Configured for frontend origin
- Rate limiting: Global + endpoint-specific (auth: 5/min)
- Session tracking: Device info + IP address

---

## Support

- Documentation: [docs/](./docs/)
- Architecture: [docs/system-architecture.md](./docs/system-architecture.md)
- Issues: Create GitHub issue

---

Built with focus on financial awareness and intelligent spending insights.

_Last Updated: February 1, 2026_
