# M-Tracking Frontend

**Version:** 1.0.0
**Last Updated:** January 19, 2026
**Status:** ✅ Production Ready with TypeScript Strict Mode

Modern frontend application for M-Tracking, built with [Next.js 16](https://nextjs.org), [React 19](https://react.dev), and TypeScript 5.9 (strict mode).

---

## Tech Stack

- **Framework:** Next.js 16.1 (App Router)
- **Runtime:** React 19.2
- **Language:** TypeScript 5.9.x (strict mode enabled)
- **Styling:** TailwindCSS 4.1.18 + shadcn/ui
- **State Management:**
  - **Server State:** TanStack Query 5.x (data fetching, caching)
  - **Client State:** Zustand 5.0.x (UI state)
- **Forms:** React Hook Form 7.71.x + Zod 3.25.x
- **Testing:**
  - **Unit:** Vitest 4.x
  - **E2E:** Playwright 1.57.x
- **Build System:** Nx 22.3.3 + pnpm 10.28.0

---

## Getting Started

### Prerequisites

- **Node.js:** >= 20.10.0
- **pnpm:** >= 10.28.0
- **Docker:** (optional) For local infrastructure

### Quick Start

```bash
# From monorepo root
pnpm install

# Start frontend only
pnpm dev:frontend

# Or start all services
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment Setup

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ANALYTICS_URL=http://localhost:5000
NEXT_PUBLIC_API_MOCKING=disabled  # Set to 'enabled' for MSW
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
// ✅ Import from src/ using @ alias
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/stores/auth-store'
import type { User } from '@/types/entities'

// ✅ Import shared monorepo libraries
import { formatCurrency } from '@m-tracking/utils'
import { TRANSACTION_CATEGORIES } from '@m-tracking/constants'
```

### Nx Integration

**Project Tags:**
- `type:app` - Frontend application
- `scope:frontend` - Can only import shared libraries

**Module Boundaries Enforced:**
- ✅ Can import: `@m-tracking/common`, `@m-tracking/types`, `@m-tracking/utils`, `@m-tracking/constants`
- ❌ Cannot import: Backend code (`scope:backend`)

---

## Development

### Commands

```bash
# Development server (port 3000)
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
pnpm test:coverage

# E2E tests
pnpm test:e2e
pnpm test:e2e:ui       # Interactive mode
pnpm test:e2e:headed   # With browser
```

### Nx Commands

```bash
# Run from monorepo root
nx run frontend:dev
nx run frontend:build
nx run frontend:test
nx run frontend:lint

# View dependency graph
nx graph

# Clear cache
nx reset
```

---

## Project Structure

```
apps/frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard routes group
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
│
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── features/        # Feature-specific components
│   │   └── shared/          # Shared components
│   │
│   ├── lib/                 # Frontend utilities
│   │   ├── api/             # API client functions
│   │   ├── stores/          # Zustand stores
│   │   └── utils/           # Helper functions
│   │
│   └── types/               # TypeScript types (centralized)
│       ├── api/             # API types
│       └── entities/        # Domain entities
│
├── public/                  # Static assets
├── locales/                 # i18n translations
├── next.config.ts           # Next.js config
├── tailwind.config.js       # Tailwind config
├── tsconfig.json            # TypeScript config
├── project.json             # Nx config
└── package.json             # Dependencies
```

---

## Key Patterns

### Server Components First

```tsx
// ✅ Default: Server Component
export default async function Page() {
  const data = await fetch('...')
  return <div>{data}</div>
}

// ⚡ Only when needed: Client Component
'use client'
export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### State Management

```typescript
// Server state (API data)
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['transactions'],
  queryFn: fetchTransactions,
})

// Client state (UI state)
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
```

### Form Handling

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const form = useForm({
  resolver: zodResolver(schema),
})
```

---

## Performance

### Build Optimization

- **Incremental Builds:** 50-80% faster (TypeScript composite: true)
- **Nx Caching:** 85%+ cache hit rate (instant rebuilds)
- **Tree Shaking:** 20-30% smaller bundles (sideEffects: false)

### Runtime Optimization

- **Server Components:** Reduced client-side JavaScript
- **Automatic Code Splitting:** Route-based
- **Image Optimization:** Next.js Image component
- **Font Optimization:** Next.js Font component

---

## Testing

### Unit Tests (Vitest)

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Interactive UI mode
pnpm test:e2e:ui

# Headed mode (with browser)
pnpm test:e2e:headed
```

### API Mocking (MSW)

```bash
# Enable in .env.local
NEXT_PUBLIC_API_MOCKING=enabled
```

Mock handlers are defined in `src/mocks/handlers.ts`.

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

- **[Frontend Configuration](../../docs/frontend-configuration.md)** - Detailed configuration guide
- **[Code Standards](../../docs/code-standards.md)** - Coding conventions
- **[Development Guide](../../docs/development-guide.md)** - Development workflows
- **[System Architecture](../../docs/system-architecture.md)** - Overall architecture
- **[Configuration Changes](../../docs/configuration-changes-2026-01-19.md)** - Recent updates

---

## Troubleshooting

### Type Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear TypeScript cache
rm -rf tsconfig.tsbuildinfo

# Reinstall
pnpm install
```

### Module Not Found

```bash
# Restart TypeScript server in IDE
# CMD+Shift+P > "TypeScript: Restart TS Server"

# Verify tsconfig.json has correct paths
cat tsconfig.json | grep paths
```

### Nx Cache Issues

```bash
# Clear Nx cache
nx reset

# Rebuild
nx run frontend:build
```

---

**Port:** 3000
**API Endpoint:** http://localhost:4000
**Status:** ✅ Production Ready
