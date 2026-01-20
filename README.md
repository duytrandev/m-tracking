# M-Tracking - Personal Finance Management Platform

AI-powered personal finance management platform with automatic transaction aggregation, intelligent spending insights through LLM technology, and hybrid Telegram bot + web dashboard experience.

**Version**: 1.0.0 | **Status**: Active Development | **Last Updated**: January 19, 2026

---

## 📋 Overview

M-Tracking eliminates manual transaction tracking by integrating directly with banking APIs (Plaid, Tink, momo.vn, Stripe), while also supporting manual entry for cash/untracked accounts via Telegram chat, enabling users to achieve real-time financial awareness and better control over their spending.

### Key Features

- 🔗 **Automatic Transaction Aggregation** - Direct banking API integrations
- 🤖 **Telegram Bot Interface** - Natural language transaction entry
- 📊 **AI-Powered Insights** - LLM-driven spending analysis
- 🌐 **Web Dashboard** - Next.js 16 with modern UI
- 💰 **Budget Management** - Smart budget tracking and alerts
- 📱 **Multi-language Support** - English and Vietnamese

### Architecture

Hybrid modular monolith architecture:

- **NestJS Monolith** (Port 4000) - All core modules (Auth, Transactions, Banking, Budgets, Notifications)
- **Analytics Service** (FastAPI/Python, Port 5000) - Standalone AI/ML service
- **Frontend** (Next.js 16, Port 3000) - Web dashboard
- **Infrastructure** - PostgreSQL 17 + Redis 7 + RabbitMQ 3.12

For detailed architecture, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 20.10.0 (recommend 24.13.0 LTS)
- **pnpm**: >= 10.28.0 (enforced)
- **Python**: >= 3.12 (with uv)
- **Docker**: Latest version

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd m-tracking

# 2. Install dependencies
pnpm install

# 3. Install Python dependencies (Analytics)
cd services/analytics
uv sync
cd ../..

# 4. Start infrastructure (PostgreSQL, Redis, RabbitMQ)
pnpm run docker:up

# 5. Configure environment variables
cp apps/frontend/.env.example apps/frontend/.env
cp services/backend/.env.example services/backend/.env
cp services/analytics/.env.example services/analytics/.env

# 6. Start all services
pnpm run dev
```

Your application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Analytics API**: http://localhost:5000
- **RabbitMQ UI**: http://localhost:15672

---

## 📦 Essential Commands

### Development

```bash
# Start all services
pnpm nx run dev

# Start individual services
pnpm nx run dev:frontend    # Next.js (port 3000)
pnpm nx run frontend:serve
pnpm nx run dev:backend     # NestJS (port 4000)
pnpm nx run dev:analytics   # FastAPI (port 5000)
```

### Testing & Quality

```bash
pnpm nx run test           # Run all tests
pnpm nx run lint           # Lint all projects
pnpm nx run format         # Format code with Prettier
pnpm nx run format:check   # Check code formatting
```

### Building

```bash
pnpm nx run build              # Build all projects
pnpm nx run build:frontend     # Build frontend only
pnpm nx run build:backend      # Build backend only
```

### Infrastructure

```bash
pnpm nx run docker:up      # Start Docker containers
pnpm nx run docker:down    # Stop Docker containers
pnpm nx run docker:logs    # View container logs
```

For complete command reference and advanced usage, see [docs/development-guide.md](./docs/development-guide.md).

---

## 🛠️ Technology Stack

### Backend
- **NestJS** 11.1.12 (TypeScript)
- **FastAPI** (Python 3.13+)
- **PostgreSQL** 17.7 + TimescaleDB
- **Redis** 7
- **RabbitMQ** 3.12

### Frontend
- **Next.js** 16.1
- **React** 19.2
- **TypeScript** 5.9
- **TailwindCSS** 4.1.18
- **shadcn/ui**
- **Zustand** + **React Query**

### Tools
- **Nx** 22.3.3 (Monorepo)
- **pnpm** 10.28.0
- **Docker** + Docker Compose
- **ESLint** + **Prettier**
- **Husky** (Git hooks)

For detailed technology stack and versions, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

---

## 📁 Project Structure

```
m-tracking/
├── apps/
│   └── frontend/              # Next.js 16 web application
├── services/
│   ├── backend/              # NestJS modular monolith
│   └── analytics/            # FastAPI analytics service
├── libs/
│   ├── common/               # Shared utilities & types
│   ├── constants/            # Shared constants
│   └── types/                # TypeScript definitions
├── docs/                     # Documentation
├── plans/                    # Project plans & reports
├── docker-compose.yml        # Local infrastructure
└── package.json              # Root package.json
```

For complete folder structure and organization, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

---

## 🗄️ Database Access

### PostgreSQL

```bash
docker exec -it mtracking-postgres psql -U mtracking -d mtracking
```

### Redis

```bash
docker exec -it mtracking-redis redis-cli
```

### RabbitMQ Management

Open http://localhost:15672
- Username: `mtracking`
- Password: `mtracking_dev_password`

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Complete technical architecture and folder structure |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development workflow and contribution guidelines |
| [docs/prd.md](./docs/prd.md) | Product Requirements Document |
| [docs/system-architecture.md](./docs/system-architecture.md) | System architecture and design decisions |
| [docs/api-documentation.md](./docs/api-documentation.md) | API endpoints and specifications |
| [docs/code-standards.md](./docs/code-standards.md) | Coding standards and conventions |
| [docs/development-guide.md](./docs/development-guide.md) | Detailed development guide |
| [docs/deployment.md](./docs/deployment.md) | Deployment guide and procedures |
| [docs/troubleshooting.md](./docs/troubleshooting.md) | Common issues and solutions |
| [docs/testing.md](./docs/testing.md) | Testing strategies and guidelines |

---

## 👥 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development workflow
- Branch strategy
- Commit conventions
- Pull request process
- Testing requirements
- Code standards

**Quick Guidelines:**
- Use **kebab-case** for file names
- Follow **YAGNI, KISS, DRY** principles
- Maximum **200 lines per file**
- Write tests for all new features
- Commit format: `type(scope): description`

---

## 🐛 Troubleshooting

### Docker containers won't start

```bash
pnpm run docker:down
docker-compose down -v
pnpm run docker:up
```

### Port conflicts

Create a `docker-compose.override.yml` file (see `docker-compose.override.yml.example`).

### pnpm install fails

```bash
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

For more solutions, see [docs/troubleshooting.md](./docs/troubleshooting.md).

---

## 🔒 Security

- **Passwords**: bcrypt with cost factor 12
- **JWT**: 15-minute access tokens, 7-day refresh tokens
- **CORS**: Configured for frontend origin only
- **Rate Limiting**: Enabled on API Gateway
- **Helmet**: Security headers enabled

For security concerns, see [SECURITY.md](./SECURITY.md).

---

## 📄 License

_(To be determined)_

---

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: Create a GitHub issue
- **Architecture Questions**: See [docs/system-architecture.md](./docs/system-architecture.md)

---

**Built with ❤️ for better financial awareness**

*Last Updated: January 19, 2026*
