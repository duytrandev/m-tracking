# Frontend Configuration Guide

**Project:** M-Tracking Frontend (Next.js 16)
**Last Updated:** January 19, 2026
**Status:** Active - Production Ready

---

## Overview

Complete configuration guide for the M-Tracking frontend application built with Next.js 16, React 19, TypeScript 5.9, and TailwindCSS 4.

**Technology Stack:**

- **Framework:** Next.js 16.1 (App Router)
- **Runtime:** React 19.2
- **Language:** TypeScript 5.9.x
- **Styling:** TailwindCSS 4.1.18 + shadcn/ui
- **State Management:** TanStack Query 5.x + Zustand 5.0.x
- **Build System:** Nx 22.3.3 + pnpm 10.28.0

**Location:** `apps/frontend/`

---

## TypeScript Configuration

### Configuration Hierarchy

```
tsconfig.base.json (root)           # Shared strict configuration
└── apps/frontend/tsconfig.json     # Frontend-specific overrides
```

### Frontend tsconfig.json

**File:** `apps/frontend/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    // Target & Module
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",

    // Next.js Specific
    "allowJs": true,
    "noEmit": true,
    "plugins": [{ "name": "next" }],

    // Build Optimization
    "composite": true,
    "tsBuildInfoFile": "./.next/.tsbuildinfo",

    // Path Mappings
    "paths": {
      "@/*": ["./src/*"],
      "@m-tracking/common": ["../../libs/common/src/index.ts"],
      "@m-tracking/types": ["../../libs/types/src/index.ts"],
      "@m-tracking/constants": ["../../libs/constants/src/index.ts"],
      "@m-tracking/utils": ["../../libs/utils/src/index.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Inherited from tsconfig.base.json

**Strict Type Checking (100% coverage):**

- ✅ `strict: true` - All strict checks enabled
- ✅ `strictNullChecks: true` - Null/undefined safety
- ✅ `noImplicitAny: true` - No implicit any types
- ✅ `strictBindCallApply: true` - Strict function binding
- ✅ `noUnusedLocals: true` - Detect unused variables
- ✅ `noUnusedParameters: true` - Detect unused parameters
- ✅ `noImplicitReturns: true` - All code paths must return
- ✅ `noUncheckedIndexedAccess: true` - Array index safety

**Build Performance:**

- ✅ `incremental: true` - 50-80% faster rebuilds
- ✅ `skipLibCheck: true` - Skip type checking of declaration files

---

## Next.js Configuration

### next.config.ts

**File:** `apps/frontend/next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // TypeScript
  typescript: {
    ignoreBuildErrors: false, // Fail build on type errors
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false, // Fail build on lint errors
  },

  // Experimental Features
  experimental: {
    typedRoutes: true, // Type-safe routing
  },

  // Output
  output: 'standalone', // Optimized for Docker

  // Environment Variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ANALYTICS_URL: process.env.NEXT_PUBLIC_ANALYTICS_URL,
  },
}

export default nextConfig
```

### Key Configuration Decisions

**1. TypeScript Strict Mode ✅**

- **Why:** Catch bugs at compile time
- **Impact:** 100% type coverage, fewer runtime errors
- **Trade-off:** Slightly more verbose code

**2. App Router (vs Pages Router) ✅**

- **Why:** Modern React patterns, better performance
- **Impact:** Server Components by default, improved caching
- **Trade-off:** Learning curve for older patterns

**3. Standalone Output ✅**

- **Why:** Optimized for Docker deployment
- **Impact:** Smaller image size, faster cold starts
- **Trade-off:** None

---

## Package Configuration

### package.json

**File:** `apps/frontend/package.json`

```json
{
  "name": "@m-tracking/frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    // Core
    "next": "^16.1.2",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",

    // State Management
    "@tanstack/react-query": "^5.90.17",
    "zustand": "^5.0.10",

    // Forms
    "react-hook-form": "^7.71.1",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^3.25.76",

    // UI Components
    "@radix-ui/react-*": "latest",
    "lucide-react": "^0.468.0",

    // Utilities
    "axios": "^1.13.2",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    // TypeScript
    "typescript": "~5.9.3",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.5",

    // Testing
    "vitest": "^4.0.17",
    "@vitest/coverage-v8": "^4.0.17",
    "@playwright/test": "^1.57.0",
    "@testing-library/react": "^16.3.1",

    // Linting
    "eslint": "^9.39.1",
    "eslint-config-next": "^16.1.2",

    // Styling
    "tailwindcss": "^3.4.19",
    "postcss": "^8.5.6",
    "autoprefixer": "^10.4.23"
  }
}
```

---

## Nx Project Configuration

### project.json

**File:** `apps/frontend/project.json`

```json
{
  "name": "frontend",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "root": "apps/frontend",
  "sourceRoot": "apps/frontend/src",
  "prefix": "app",
  "tags": ["type:app", "scope:frontend"],
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm dev",
        "cwd": "apps/frontend"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm build",
        "cwd": "apps/frontend"
      },
      "outputs": ["{projectRoot}/.next"],
      "cache": true
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm test",
        "cwd": "apps/frontend"
      },
      "cache": true
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm lint",
        "cwd": "apps/frontend"
      },
      "cache": true
    }
  }
}
```

### Nx Tags Explained

**`type:app`** - Application (not a library)

- Can only depend on libraries (`type:lib`)
- Cannot be depended upon by other projects

**`scope:frontend`** - Frontend scope

- Can import from `scope:frontend` and `scope:shared` libraries
- Cannot import from `scope:backend` (enforced by ESLint)

---

## Build & Caching

### Nx Caching Configuration

**File:** `nx.json` (relevant sections)

```json
{
  "namedInputs": {
    "nextBuild": [
      "{projectRoot}/app/**/*",
      "{projectRoot}/src/**/*",
      "{projectRoot}/public/**/*",
      "{projectRoot}/package.json",
      "{projectRoot}/tsconfig.json",
      "{projectRoot}/next.config.ts",
      "{projectRoot}/tailwind.config.js",
      "{projectRoot}/postcss.config.js",
      "^production"
    ]
  },
  "targetDefaults": {
    "build": {
      "inputs": ["nextBuild"],
      "cache": true
    }
  }
}
```

### Cache Benefits

**Local Development:**

- Incremental builds: 30-60 seconds (vs 2-5 minutes full build)
- Type checking: <10 seconds (incremental)
- Hot Module Replacement: <1 second

**CI/CD (with Nx Cloud):**

- Cache hit: 85%+ (instant replay)
- Full build: 3-5 minutes (vs 15-20 minutes without cache)
- Affected tests only: 70-85% faster CI

---

## Project Structure

```
apps/frontend/
├── app/                      # Next.js App Router (routes)
│   ├── (auth)/              # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard route group
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── transactions/
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
│   ├── en/
│   └── vi/
│
├── next.config.ts           # Next.js config
├── tailwind.config.js       # Tailwind config
├── postcss.config.js        # PostCSS config
├── tsconfig.json            # TypeScript config
├── project.json             # Nx config
└── package.json             # Dependencies
```

---

## Path Aliases

### Import Patterns

```typescript
// ✅ CORRECT - Using @ alias for internal code
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/stores/auth-store'
import type { User } from '@/types/entities'

// ✅ CORRECT - Importing shared libraries
import { formatCurrency } from '@m-tracking/utils'
import { TRANSACTION_CATEGORIES } from '@m-tracking/constants'
import type { Transaction } from '@m-tracking/types'

// ❌ WRONG - Relative imports
import { Button } from '../../components/ui/button'
import type { User } from '../../../types/entities'
```

### Configured Aliases

```json
{
  "@/*": ["./src/*"],
  "@m-tracking/common": ["../../libs/common/src/index.ts"],
  "@m-tracking/types": ["../../libs/types/src/index.ts"],
  "@m-tracking/constants": ["../../libs/constants/src/index.ts"],
  "@m-tracking/utils": ["../../libs/utils/src/index.ts"]
}
```

---

## Environment Variables

### Required Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ANALYTICS_URL=http://localhost:5000
```

### Environment Files

- `.env` - Shared defaults (committed)
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production values (gitignored)
- `.env.example` - Template (committed)

---

## Development Commands

### Starting Frontend

```bash
# Start the frontend development server
pnpm nx run frontend:serve
```

### Local Development

```bash
# Start development server (port 3000)
pnpm dev:frontend

# Or with Nx
nx run frontend:dev

# Build for production
pnpm build:frontend
nx run frontend:build

# Start production server
pnpm start:frontend
```

### Type Checking

```bash
# Type check only (no emit)
cd apps/frontend
pnpm exec tsc --noEmit

# Or with Nx
nx run frontend:type-check
```

### Testing

```bash
# Unit tests (Vitest)
pnpm test
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e
pnpm test:e2e:ui       # Interactive mode
pnpm test:e2e:headed   # With browser
```

### Linting

```bash
# Lint
pnpm lint

# Lint with auto-fix
pnpm lint --fix
```

---

## Module Boundaries

### ESLint Enforcement

**Rule:** Frontend can only import from frontend or shared libraries

```json
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "depConstraints": [
        {
          "sourceTag": "scope:frontend",
          "onlyDependOnLibsWithTags": ["scope:frontend", "scope:shared"]
        }
      ]
    }
  ]
}
```

### What Frontend Can Import

✅ **Allowed:**

- `@m-tracking/common` (scope:shared)
- `@m-tracking/types` (scope:shared)
- `@m-tracking/constants` (scope:shared)
- `@m-tracking/utils` (scope:shared)

❌ **Not Allowed:**

- Backend code (scope:backend)
- Backend-specific utilities
- Server-side modules

---

## Performance Optimization

### Build Optimizations

1. **Incremental Builds** ✅
   - `composite: true` in tsconfig
   - `tsBuildInfoFile` for cache
   - 50-80% faster rebuilds

2. **Tree Shaking** ✅
   - Import only what you need
   - Shared libs have `sideEffects: false`
   - 20-30% smaller bundles

3. **Next.js Optimizations** ✅
   - Server Components by default
   - Automatic code splitting
   - Image optimization
   - Font optimization

### Runtime Optimizations

1. **Server Components**
   - Use Server Components by default
   - Client Components only for interactivity
   - Reduces client-side JavaScript

2. **TanStack Query**
   - Automatic request deduplication
   - Intelligent caching
   - Background refetching

3. **Lazy Loading**
   - Dynamic imports for heavy components
   - Route-based code splitting

---

## Common Issues & Solutions

### Issue: Type Errors After Config Update

**Symptom:** Strict mode catching new type errors

**Solution:**

```bash
# Clear Next.js cache
rm -rf apps/frontend/.next

# Clear TypeScript cache
rm -rf apps/frontend/tsconfig.tsbuildinfo

# Rebuild
pnpm install
nx run frontend:build
```

### Issue: Module Not Found

**Symptom:** Cannot resolve @/\* imports

**Solution:**

1. Verify `tsconfig.json` has correct path mappings
2. Restart TypeScript server in IDE
3. Clear `.next` cache

### Issue: Nx Cache Stale

**Symptom:** Builds using old code

**Solution:**

```bash
# Clear Nx cache
nx reset

# Rebuild
nx run frontend:build
```

---

## Related Documentation

- [Code Standards](./code-standards.md) - TypeScript and React conventions
- [Backend Configuration](./backend-configuration.md) - Backend setup
- [System Architecture](./system-architecture.md) - Overall architecture
- [Development Guide](./development-guide.md) - Development workflows
- [Configuration Changes](./configuration-changes-2026-01-19.md) - Recent updates

---

**Last Updated:** January 19, 2026
**Status:** ✅ Production Ready
