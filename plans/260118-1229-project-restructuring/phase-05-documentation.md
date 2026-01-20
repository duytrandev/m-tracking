# Phase 5: Documentation Updates

## Context Links
- [Project Structure Review](/docs/project-structure-review.md#3-medium-priority-improvements)
- [Code Standards](/docs/code-standards.md)
- [Architecture Overview](/docs/architecture-overview.md)

## Overview

| Item | Value |
|------|-------|
| Priority | P3 - Medium |
| Status | Pending |
| Effort | 3 hours |
| Dependencies | Phases 1-4 |

Update project documentation to reflect restructuring changes. Add component stratification guide, API route strategy, server/client component guidelines, and update architecture docs.

## Key Insights

1. **Existing docs** are well-structured but missing frontend patterns
2. **Code standards** need updates for new store/query patterns
3. **Architecture overview** needs state management section
4. **Missing guides**: Component tiers, API routes, Server/Client components

## Requirements

### Functional
- F1: Document component stratification (3 tiers)
- F2: Document API route organization strategy
- F3: Create server/client component guidelines
- F4: Update architecture documentation
- F5: Update code standards with new patterns

### Non-Functional
- NF1: Keep docs concise and actionable
- NF2: Include code examples
- NF3: Cross-reference related docs

## Architecture

### Documentation Structure
```
docs/
├── frontend-architecture/
│   ├── index.md                    # Existing
│   ├── component-stratification.md # NEW
│   ├── api-routes.md               # NEW
│   └── server-client-components.md # NEW
├── code-standards.md               # UPDATE
├── architecture-overview.md        # UPDATE
└── system-architecture.md          # UPDATE (minor)
```

## Related Code Files

### Files to Create
- `docs/frontend-architecture/component-stratification.md`
- `docs/frontend-architecture/api-routes.md`
- `docs/frontend-architecture/server-client-components.md`

### Files to Update
- `docs/code-standards.md`
- `docs/architecture-overview.md`

## Implementation Steps

### Step 1: Create Component Stratification Guide (45 min)

Create `docs/frontend-architecture/component-stratification.md`:

```markdown
# Component Stratification Guide

**Version:** 1.0
**Last Updated:** 2026-01-18

## Overview

M-Tracking uses a 3-tier component organization strategy to maintain clear boundaries between UI primitives, shared components, and feature-specific components.

## Tier Structure

### Tier 1: UI Components (`components/ui/`)

**Purpose:** Primitive, reusable components with no business logic.

**Characteristics:**
- Zero domain knowledge
- Highly reusable across projects
- Styled but not themed
- Based on Radix UI primitives

**Examples:**
- Button, Input, Label, Checkbox
- Card, Dialog, Dropdown
- Toast, Loading Spinner

**Import Pattern:**
```typescript
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
```

### Tier 2: Shared Components (`components/`)

**Purpose:** Domain-agnostic composites used across multiple features.

**Characteristics:**
- Combine multiple UI primitives
- May have layout logic
- No feature-specific business logic
- Can be themed

**Examples:**
- Navbar, Sidebar, Footer
- Breadcrumb, Pagination
- AuthLayout, DashboardLayout

**Import Pattern:**
```typescript
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
```

### Tier 3: Feature Components (`features/*/components/`)

**Purpose:** Feature-specific components with business logic.

**Characteristics:**
- Contain business logic
- Use domain-specific hooks
- Colocated with feature
- May connect to stores/queries

**Examples:**
- LoginForm, RegisterForm (auth feature)
- TransactionList, TransactionForm (transactions feature)
- BudgetProgress, BudgetCard (budgets feature)

**Import Pattern:**
```typescript
import { LoginForm } from '@/features/auth/components/login-form'
import { TransactionList } from '@/features/transactions/components/transaction-list'
```

## Decision Tree

```
Is this a basic UI element (button, input, card)?
├── YES → Tier 1 (components/ui/)
└── NO → Is it used across multiple features?
         ├── YES → Does it have business logic?
         │         ├── YES → Consider splitting UI from logic
         │         └── NO → Tier 2 (components/)
         └── NO → Tier 3 (features/*/components/)
```

## File Naming

```
components/
├── ui/
│   ├── button.tsx           # Primitives: lowercase
│   └── card.tsx
├── layout/
│   └── dashboard-layout.tsx # Layouts: kebab-case
└── auth/
    └── protected-route.tsx  # Shared auth: kebab-case

features/
└── auth/
    └── components/
        └── login-form.tsx   # Feature components: kebab-case
```

## Anti-Patterns

**DON'T:**
- Put feature-specific components in `components/ui/`
- Import from `features/` in `components/`
- Create "god components" that do everything
- Duplicate components across features

**DO:**
- Start in Tier 3, promote to Tier 2 when reused
- Keep Tier 1 components purely presentational
- Use composition over inheritance
```

### Step 2: Create API Routes Strategy Guide (30 min)

Create `docs/frontend-architecture/api-routes.md`:

```markdown
# API Routes Strategy

**Version:** 1.0
**Last Updated:** 2026-01-18

## Overview

M-Tracking uses feature-scoped API routes for BFF (Backend for Frontend) patterns, with the primary API being the NestJS backend.

## Strategy: Feature-Scoped API Routes

**Pattern:** `app/[feature]/api/[endpoint]/route.ts`

### When to Use Next.js API Routes

1. **BFF transformations** - Aggregate/transform backend responses
2. **Server actions** - Form submissions with server-side validation
3. **Webhooks** - Receive third-party callbacks
4. **Proxy** - Rate limiting, auth header injection

### When NOT to Use

1. **CRUD operations** - Use NestJS backend directly
2. **Complex business logic** - Backend services
3. **Database operations** - Backend handles persistence

## File Structure

```
app/
├── api/                      # Global API routes
│   └── health/
│       └── route.ts         # Health check
├── auth/
│   └── api/                 # Auth-scoped routes (rarely needed)
│       └── session/
│           └── route.ts
├── dashboard/
│   └── api/                 # Dashboard BFF routes
│       └── stats/
│           └── route.ts     # Aggregate stats from multiple endpoints
└── settings/
    └── api/
        └── preferences/
            └── route.ts     # User preference sync
```

## Example: BFF Aggregation

```typescript
// app/dashboard/api/stats/route.ts
import { NextResponse } from 'next/server'
import { apiClient } from '@/lib/api-client'

export async function GET() {
  try {
    // Parallel fetch from multiple endpoints
    const [transactions, budgets, accounts] = await Promise.all([
      apiClient.get('/transactions/summary'),
      apiClient.get('/budgets/progress'),
      apiClient.get('/accounts/balances'),
    ])

    // Transform and aggregate
    return NextResponse.json({
      totalBalance: accounts.total,
      monthlySpending: transactions.thisMonth,
      budgetStatus: budgets.map(b => ({
        name: b.name,
        percentage: (b.spent / b.limit) * 100,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
```

## Primary API Communication

For most operations, communicate directly with NestJS backend:

```typescript
// lib/api-client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

// features/transactions/api/transaction-api.ts
export const transactionApi = {
  list: (params) => apiClient.get('/transactions', { params }),
  create: (data) => apiClient.post('/transactions', data),
  update: (id, data) => apiClient.patch(`/transactions/${id}`, data),
  delete: (id) => apiClient.delete(`/transactions/${id}`),
}
```
```

### Step 3: Create Server/Client Component Guidelines (45 min)

Create `docs/frontend-architecture/server-client-components.md`:

```markdown
# Server vs Client Components

**Version:** 1.0
**Last Updated:** 2026-01-18

## Overview

Next.js 16 App Router uses React Server Components (RSC) by default. This guide helps decide when to use `'use client'`.

## Default: Server Components

All components in `app/` directory are Server Components by default.

**Benefits:**
- Smaller bundle size
- Direct database/API access
- Better SEO
- No client-side JavaScript

## Decision Tree

```
Does the component need:
├── useState, useEffect, useContext?
│   └── YES → 'use client'
├── Browser APIs (window, localStorage)?
│   └── YES → 'use client'
├── Event handlers (onClick, onChange)?
│   └── YES → 'use client'
├── Third-party client libraries?
│   └── YES → 'use client'
└── None of the above?
    └── Keep as Server Component
```

## Patterns

### Pattern 1: Data Fetching (Server)

```typescript
// app/dashboard/page.tsx (Server Component)
import { apiClient } from '@/lib/api-client'
import { DashboardStats } from './_components/dashboard-stats'

export default async function DashboardPage() {
  const stats = await apiClient.get('/dashboard/stats')

  return (
    <div>
      <h1>Dashboard</h1>
      <DashboardStats data={stats} />
    </div>
  )
}
```

### Pattern 2: Interactive UI (Client)

```typescript
// app/dashboard/_components/dashboard-stats.tsx
'use client'

import { useState } from 'react'

interface DashboardStatsProps {
  data: DashboardData
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('month')

  return (
    <div>
      <button onClick={() => setPeriod('week')}>Week</button>
      <button onClick={() => setPeriod('month')}>Month</button>
      <StatsChart data={data[period]} />
    </div>
  )
}
```

### Pattern 3: Composition (Mixing)

```typescript
// app/settings/page.tsx (Server Component)
import { SettingsForm } from './_components/settings-form'
import { getUser } from '@/lib/auth'

export default async function SettingsPage() {
  const user = await getUser()

  return (
    <div>
      <h1>Settings</h1>
      {/* Client component receives server data as props */}
      <SettingsForm initialData={user.settings} />
    </div>
  )
}
```

### Pattern 4: Provider Boundary

```typescript
// app/providers.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query'

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

## Anti-Patterns

**DON'T:**

```typescript
// ❌ Making entire layout client-side
'use client'
export default function Layout({ children }) {
  return <div>{children}</div>
}
```

```typescript
// ❌ Using 'use client' for simple display
'use client'
export function UserAvatar({ url }) {
  return <img src={url} />
}
```

**DO:**

```typescript
// ✅ Only the interactive part is client
export function UserCard({ user }) {
  return (
    <div>
      <img src={user.avatar} />
      <span>{user.name}</span>
      <UserActions userId={user.id} /> {/* This is 'use client' */}
    </div>
  )
}
```

## Component Placement

```
app/
├── page.tsx              # Server (data fetching)
├── layout.tsx            # Server (structure)
├── loading.tsx           # Server (suspense UI)
├── error.tsx             # Client (error boundary)
├── _components/          # Private components
│   ├── data-display.tsx  # Server (receives props)
│   └── interactive.tsx   # Client (has state)
```

## Performance Tips

1. **Push 'use client' down** - Keep it on leaf components
2. **Pass serializable props** - No functions/classes from server to client
3. **Use Suspense boundaries** - Stream server content
4. **Avoid large client bundles** - Split interactive parts
```

### Step 4: Update Code Standards (30 min)

Add to `docs/code-standards.md` after TypeScript Guidelines section:

```markdown
## State Management

### Zustand Stores

**Global stores in `lib/store/`:**
```typescript
// lib/store/ui-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ui-storage' }
  )
)
```

**Feature stores in `features/*/store/`:**
```typescript
// features/auth/store/auth-store.ts
export const useAuthStore = create<AuthState>()(...)
```

### TanStack Query

**Query key factory in `lib/query/keys.ts`:**
```typescript
export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    list: (params) => [...queryKeys.transactions.all, 'list', params] as const,
    detail: (id) => [...queryKeys.transactions.all, 'detail', id] as const,
  },
}
```

**Usage in hooks:**
```typescript
import { queryKeys } from '@/lib/query'

const { data } = useQuery({
  queryKey: queryKeys.transactions.list({ page: 1 }),
  queryFn: () => transactionApi.list({ page: 1 }),
})
```
```

### Step 5: Update Architecture Overview (30 min)

Add to `docs/architecture-overview.md`:

```markdown
## Frontend State Management

### Store Organization

```
lib/store/          # Global stores
├── ui-store.ts     # Theme, sidebar, modals
└── index.ts        # Barrel export

features/*/store/   # Feature-specific stores
└── auth-store.ts   # Auth state
```

### Data Fetching

```
lib/query/          # TanStack Query setup
├── client.ts       # QueryClient configuration
├── keys.ts         # Query key factory
└── hooks/          # Shared hooks
```

### State Types

| Type | Location | Persistence | Example |
|------|----------|-------------|---------|
| UI State | lib/store/ | localStorage | Theme, sidebar |
| Auth State | features/auth/store/ | sessionStorage | User, tokens |
| Server State | TanStack Query | In-memory cache | API data |
```

## Todo List

- [ ] Create `docs/frontend-architecture/component-stratification.md`
- [ ] Create `docs/frontend-architecture/api-routes.md`
- [ ] Create `docs/frontend-architecture/server-client-components.md`
- [ ] Update `docs/code-standards.md` with state management section
- [ ] Update `docs/architecture-overview.md` with frontend state section
- [ ] Review and cross-reference all docs
- [ ] Verify all code examples are accurate

## Success Criteria

1. Component stratification documented with examples
2. API routes strategy documented
3. Server/Client component guidelines with decision tree
4. Code standards updated with new patterns
5. Architecture overview includes state management
6. All docs cross-referenced

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Docs become outdated | Include version and last-updated |
| Examples don't match code | Verify against actual implementation |
| Too verbose | Keep concise, link to detailed guides |

## Security Considerations

- No sensitive information in documentation
- API route examples don't expose internals
- Auth patterns follow security best practices

## Next Steps

After completion:
1. Restructuring complete
2. Review with team
3. Create PR for all changes
4. Update development roadmap status
