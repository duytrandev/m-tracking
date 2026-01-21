# Development Guide

**Version:** 1.1
**Last Updated:** 2026-01-20
**Status:** Active - Updated with Motion Library Setup

---

## Overview

Complete guide for developers working on M-Tracking. Covers setup, workflows, agents, and troubleshooting.

**Quick Links:**
- [Code Standards](./code-standards.md) - Coding conventions
- [System Architecture](./system-architecture.md) - Technical architecture
- [API Documentation](./api-documentation.md) - API reference
- [Testing](./testing.md) - Testing strategy
- [Troubleshooting](./troubleshooting.md) - Common issues

---

## Getting Started

### Prerequisites

- **Node.js:** >= 20.10.0
- **pnpm:** >= 8.0.0
- **Docker:** Latest version
- **PostgreSQL:** 15+ or Supabase account

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd m-tracking

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. (Phase 0) Setup Docker secrets for local development
cp .env.docker.example .env.docker
# Contains POSTGRES_PASSWORD, REDIS_PASSWORD, etc.
# Never commit .env.docker to git

# 5. Start Docker services
pnpm nx run docker:up

# 6. Run migrations
pnpm nx run --filter @m-tracking/backend migration:run

# 7. Start development servers
pnpm dev
```

### Starting Services

```bash
# Start all services
pnpm run dev

# Start individual services
pnpm run dev:frontend    # Next.js (port 3000)
pnpm nx run frontend:serve
pnpm run dev:backend     # NestJS (port 4000)
pnpm run dev:analytics   # FastAPI (port 5000)
```

### Development URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Analytics:** http://localhost:5000
- **Database:** localhost:5432

### Sentry Setup (Optional but Recommended)

Sentry provides error tracking and performance monitoring in development.

```bash
# 1. Sign up at https://sentry.io (free tier available)
# 2. Create organization: m-tracking
# 3. Create 2 projects:
#    - m-tracking-frontend (Next.js)
#    - m-tracking-backend (Node.js)

# 4. Add DSNs to .env
NEXT_PUBLIC_SENTRY_DSN=https://[key]@o0.ingest.sentry.io/[id]
SENTRY_DSN=https://[key]@o0.ingest.sentry.io/[id]
NEXT_PUBLIC_APP_ENV=development

# 5. Restart dev servers to activate Sentry
pnpm dev
# Should see: ✅ Sentry initialized
```

**See:** [Sentry Monitoring Guide](./monitoring-sentry.md) for complete setup.

---

## Project Structure

```
m-tracking/
├── apps/
│   └── frontend/          # Next.js 16 App Router
│       ├── app/           # Routes (Next.js App Router)
│       └── src/           # Source code
│           ├── components/  # Shared UI components
│           ├── features/    # Feature modules
│           ├── lib/         # Core libraries
│           └── types/       # Centralized type definitions ⭐
│
├── services/
│   ├── backend/           # NestJS API
│   │   └── src/
│   │       ├── auth/      # Authentication module
│   │       ├── common/    # Common utilities ⭐
│   │       ├── config/    # Configuration modules ⭐
│   │       ├── events/    # Event system ⭐
│   │       └── database/  # Database module ⭐
│   └── analytics/         # Python analytics service
│
└── libs/
    ├── config/            # Shared configs ⭐
    │   ├── eslint-config/
    │   ├── typescript-config/
    │   └── prettier-config/
    ├── common/            # Shared utilities
    ├── types/             # Shared types
    └── constants/         # Shared constants
```

⭐ = Recently restructured (Phase 1 complete)

---

## Development Workflows

### Frontend Development

**Start development server:**
```bash
pnpm dev:frontend
```

**Type checking:**
```bash
cd apps/frontend
pnpm exec tsc --noEmit
```

**Build:**
```bash
pnpm build:frontend
```

**Key Patterns:**
- **Types:** Import from `@/types/api/*` or `@/types/entities/*` (never from feature types!)
- **State:** Use TanStack Query for server state, Zustand for UI state
- **Components:** Feature-based organization in `src/features/`
- **Routing:** File-based routing in `app/` directory
- **Animations:** Motion library with LazyMotion for optimal bundle size

### Motion Library Setup

**Animation library for smooth 60fps animations with minimal bundle impact.**

**Already installed:** Motion v12.27.1 (4.6KB gzipped)

**Using Motion in components:**

```tsx
import { motion } from "motion/react";

// Form entrance animation
export function LoginForm() {
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Form content */}
    </motion.form>
  );
}

// Button with hover/tap animation
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Submit
</motion.button>
```

**MotionProvider setup (already configured in root layout):**

```tsx
import { LazyMotion, domAnimation } from "motion/react";

export function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
```

**Accessibility - Always respect prefers-reduced-motion:**

```tsx
// Use useReducedMotion hook
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function Component() {
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 400;

  return (
    <motion.div transition={{ duration }}>
      Content
    </motion.div>
  );
}
```

**See:** [Design Guidelines](./design-guidelines.md) for complete animation patterns

### Backend Development

**Start development server:**
```bash
pnpm dev:backend
```

**Type checking:**
```bash
cd services/backend
pnpm exec tsc --noEmit
```

**Build:**
```bash
pnpm build:backend
```

**Key Patterns:**
- **Modules:** Feature-based modules with clear boundaries
- **Config:** Use `@nestjs/config` with `registerAs` pattern
- **Events:** Use EventEmitter for domain events
- **Database:** TypeORM with centralized configuration

---

## Working with AI Agents

This project uses BMAD-METHOD for AI-assisted development through OpenCode and Claude.

### Available Agents

| Agent | When to Use | Activation |
|-------|-------------|------------|
| **Full Stack Developer (dev)** | Code implementation, debugging | "As dev, ..." |
| **Architect** | System design, architecture | "As architect, ..." |
| **UX Expert** | UI/UX design, prototypes | "As ux-expert, ..." |
| **Product Manager (pm)** | PRDs, roadmap, strategy | "As pm, ..." |
| **Product Owner (po)** | Backlog, stories, sprint | "As po, ..." |
| **Scrum Master (sm)** | Agile process, retrospectives | "As sm, ..." |
| **QA** | Test architecture, quality | "As qa, ..." |
| **Business Analyst** | Market research, discovery | "As analyst, ..." |

### Using Agents

**With OpenCode:**
```bash
opencode  # Will read AGENTS.md automatically
```

**With Claude Code:**
- Reference roles naturally in conversation
- Claude will use subagents for specialized tasks

**Agent Commands:**
```bash
# List available agents
npx bmad-method list:agents

# Validate configuration
npx bmad-method validate

# Reinstall BMAD core
npx bmad-method install -f -i opencode
```

---

## Common Tasks

### Add a New Feature

1. **Plan:** Use planner agent or create plan manually
2. **Frontend:**
   - Create feature directory in `src/features/feature-name/`
   - Add components, hooks, API calls
   - Import types from `@/types/`
3. **Backend:**
   - Create module in `src/feature-name/`
   - Add controllers, services, DTOs
4. **Test:** Write unit and integration tests
5. **Document:** Update relevant docs

### Add a New API Type

**IMPORTANT:** Always add types to centralized location!

```typescript
// ✅ CORRECT: Add to centralized types
// File: apps/frontend/src/types/api/feature-name.ts
export interface FeatureRequest {
  // ... type definition
}

// Then import:
import type { FeatureRequest } from '@/types/api/feature-name'

// ❌ WRONG: Don't create feature-specific types
// File: apps/frontend/src/features/feature-name/types/  ← NEVER DO THIS!
```

See [Code Standards - Type Import Standards](./code-standards.md#type-import-standards-updated-2026-01-18) for details.

### Run Tests

```bash
# Frontend tests
cd apps/frontend
pnpm test                    # Unit tests
pnpm test:coverage          # With coverage
pnpm test:e2e              # End-to-end tests

# Backend tests
cd services/backend
pnpm test                    # Unit tests
pnpm test:e2e              # End-to-end tests
pnpm test:cov              # With coverage
```

### Database Migrations

```bash
# Create migration
cd services/backend
pnpm migration:create MigrationName

# Run migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert
```

### Linting & Formatting

```bash
# Lint all
pnpm lint

# Format all
pnpm format

# Fix linting issues
pnpm lint --fix
```

---

## Git Workflow

### Branch Naming

```
feature/short-description
bugfix/short-description
hotfix/short-description
refactor/short-description
```

### Commit Messages

Follow Conventional Commits:

```
type(scope): description

feat(auth): add 2FA support
fix(api): resolve token refresh issue
docs(readme): update setup instructions
refactor(types): consolidate duplicate definitions
test(auth): add login flow tests
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance
- `perf:` Performance improvement

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes following code standards
3. Run tests and linting
4. Create PR with clear description
5. Request review
6. Address feedback
7. Merge when approved

---

## Development Tools

### Recommended VS Code Extensions

- **ESLint:** Code linting
- **Prettier:** Code formatting
- **TypeScript:** Enhanced TypeScript support
- **Tailwind CSS IntelliSense:** Tailwind autocomplete
- **GitLens:** Git integration
- **REST Client:** API testing

### Browser DevTools

- **React DevTools:** Component inspection
- **Redux DevTools:** State debugging (if using Redux)
- **Axe DevTools:** Accessibility testing

---

## Troubleshooting

### Common Issues

**1. Port already in use:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

**2. TypeScript errors after update:**
```bash
# Clean and reinstall
rm -rf node_modules .next dist
pnpm install
```

**3. Database connection issues:**
```bash
# Restart Docker
pnpm docker:down
pnpm docker:up
```

**4. Import errors:**
- Ensure types are imported from `@/types/` (not feature-specific types)
- Check `tsconfig.json` path mappings
- Restart TypeScript server in VS Code

For more issues, see [Troubleshooting Guide](./troubleshooting.md).

---

## Performance Optimization

### Frontend

- Use React Server Components where possible
- Implement code splitting with dynamic imports
- Optimize images with Next.js `<Image>`
- Monitor bundle size with `@next/bundle-analyzer`

### Backend

- Use database indexes for frequently queried fields
- Implement caching with Redis
- Use pagination for large datasets
- Monitor with APM tools

---

## Security Best Practices

1. **Never commit secrets:** Use `.env` files (gitignored)
2. **Validate all inputs:** Use DTOs and Zod schemas
3. **Sanitize outputs:** Prevent XSS attacks
4. **Use HTTPS:** In production
5. **Implement rate limiting:** Prevent abuse
6. **Keep dependencies updated:** Regular security audits

See [Security Guide](../SECURITY.md) for details.

---

## Resources

### Internal Documentation
- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)
- [API Documentation](./api-documentation.md)
- [Testing Strategy](./testing.md)
- [Deployment Guide](./deployment.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [TanStack Query](https://tanstack.com/query)

---

## Getting Help

1. **Check Documentation:** Start with this guide and related docs
2. **Search Issues:** Check GitHub issues for similar problems
3. **Ask the Team:** Use team communication channels
4. **Use AI Agents:** Leverage BMAD agents for guidance
5. **Create Issue:** If problem persists, create detailed issue

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code review process
- Style guide
- Testing requirements
- Documentation standards

---

**Last Updated:** 2026-01-18
**Maintained By:** Development Team
**Questions?** Create an issue or ask in team chat
