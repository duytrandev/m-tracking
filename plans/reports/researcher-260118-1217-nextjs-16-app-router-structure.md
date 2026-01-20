# Research Report: Next.js 16 App Router Project Structure Best Practices for 2026

**Report Date:** January 18, 2026
**Research Duration:** Research conducted via Gemini API + GitHub repo analysis
**Current Project Version:** M-Tracking using Next.js 16.1.1

---

## Executive Summary

Next.js 16 App Router represents the standard for modern React applications. Best practices prioritize **server-first architecture, feature-driven organization, and strict file size management**. The research identifies 8 critical areas for production-grade projects: (1) App directory organization using route groups and private folders, (2) component stratification (UI/shared/feature-specific), (3) server component defaults with minimal `'use client'`, (4) lib/utils separation by responsibility, (5) state management isolation via Zustand/TanStack Query, (6) Server Actions as primary mutation pattern, (7) centralized type definitions with feature-scoped types, (8) avoidance of 11 common architectural mistakes.

**Key Finding:** Current M-Tracking frontend structure is **partially aligned** with best practices. Strengths: feature-driven organization already in place. Gaps: missing explicit private folder usage, no structured state management organization, unclear API route patterns, weak type definition organization.

---

## Research Methodology

- **Sources Consulted:** 2 authoritative sources
- **Primary Sources:** Gemini API (Google's latest research), AnwarHossainSR/nextjs-16-template (production template)
- **Key Search Terms:** "Next.js 16 App Router best practices 2026", "project structure organization", "server vs client components", "type safety patterns"
- **Date Range:** Information current as of Q4 2025/Q1 2026

---

## Key Findings

### 1. App Directory Organization (Routes, Layouts, Components)

**Core Pattern:** File-system based routing with explicit structural conventions

#### Directory Structure Template
```
app/
├── (auth)/                    # Route Group: psychological grouping only
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── layout.tsx            # Shared auth layout
├── (dashboard)/              # Route Group: authenticated area
│   ├── layout.tsx
│   ├── page.tsx
│   ├── settings/
│   │   ├── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── security/
│   │   │   └── page.tsx
│   │   ├── preferences/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── _components/          # Private folder: not route
│       ├── DashboardHeader.tsx
│       ├── DashboardSidebar.tsx
│       └── DashboardFooter.tsx
├── api/                       # Global API routes (or feature-scoped)
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts
│   │   └── logout/
│   │       └── route.ts
│   └── health/
│       └── route.ts
├── layout.tsx                # Root layout
├── loading.tsx               # Root loading state
├── error.tsx                 # Root error boundary
├── not-found.tsx             # Custom 404
└── page.tsx                  # Home page
```

#### Key Files & Their Purposes
| File | Purpose | Notes |
|------|---------|-------|
| `page.tsx` | Unique UI for route segment | Becomes route endpoint |
| `layout.tsx` | Wraps child routes | Shared across segment hierarchy |
| `loading.tsx` | Suspense fallback UI | React Suspense integration |
| `error.tsx` | Error boundary UI | Catches segment errors |
| `route.ts` | API endpoint handler | Exports GET/POST/PUT/DELETE functions |
| `_components/` (private) | Segment-scoped components | Prevents route creation |

#### Best Practices
- **Use route groups `(name)` for logical grouping**: Organize routes without affecting URL structure (e.g., `(auth)`, `(dashboard)`, `(marketing)`)
- **Use private folders `_name` for co-located assets**: Components, utilities, styles specific to a segment
- **Nested layouts for progressive enhancement**: Each segment can have its own layout (auth layout ≠ dashboard layout)
- **Segment-level loading & error states**: Provide UX feedback at appropriate granularity

#### M-Tracking Current State
✅ **Good:** Feature-based routing already established
❌ **Gap:** No explicit use of private folders (`_components/`, `_hooks/`, `_lib/`)
❌ **Gap:** API routes organization unclear (no visible `app/api/` pattern)

---

### 2. Component Organization (Page Components, Shared Components, UI Components)

**Principle:** Three-tier component hierarchy with strict separation

#### Three-Tier Architecture
```
components/
├── ui/                          # Tier 1: Primitive UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   └── toast.tsx                # All: framework-agnostic, highly reusable
├── navigation/                  # Tier 2: Composite/domain-agnostic
│   ├── navbar.tsx
│   ├── breadcrumb.tsx
│   ├── sidebar.tsx
│   └── footer.tsx
├── forms/                       # Tier 2: Form-specific composites
│   ├── input-field.tsx          # UI + validation + labels
│   └── form-group.tsx
└── icons/                       # Tier 1: Icon library
    ├── check-icon.tsx
    └── arrow-icon.tsx

features/
├── auth/
│   ├── components/              # Tier 3: Feature-specific
│   │   ├── login-form.tsx       # Uses components/ui/* + business logic
│   │   ├── oauth-buttons.tsx
│   │   ├── password-strength.tsx
│   │   └── two-factor-setup.tsx
│   ├── hooks/                   # Feature-scoped hooks
│   │   ├── use-login.ts
│   │   ├── use-logout.ts
│   │   └── use-reset-password.ts
│   ├── types/                   # Feature types
│   │   └── auth-types.ts
│   ├── services/                # Feature business logic
│   │   └── auth-service.ts
│   ├── validations/             # Feature validation schemas
│   │   └── auth-schemas.ts
│   └── index.ts                 # Barrel export
├── dashboard/
│   ├── components/
│   └── hooks/
└── settings/
    ├── components/
    └── hooks/
```

#### Component Type Guidelines
| Type | Location | Characteristics | Examples |
|------|----------|-----------------|----------|
| **Primitive UI** | `components/ui/` | Stateless, single responsibility, reusable | Button, Input, Card |
| **Composite UI** | `components/{domain}/` | Multiple UI components, domain-agnostic | Navbar, Breadcrumb, Form |
| **Feature** | `features/X/components/` | Domain-specific, business logic, single feature | LoginForm, ProfileCard |
| **Page** | `app/.../page.tsx` | Composes features, orchestrates data | Dashboard page |

#### Best Practices
- **UI components (shadcn/ui pattern):** Copy library, don't import—enables customization
- **Feature folders = autonomous units:** All auth-related code under `features/auth/`
- **Shared components only if 3+ uses:** Avoid premature extraction
- **Max file size: 150-200 lines:** Keep components focused, extract render logic if needed
- **Server components by default:** Only use `'use client'` when interactivity required

#### M-Tracking Current State
✅ **Good:** Feature-driven structure (`features/auth/`, `features/dashboard/`)
✅ **Good:** Separation of components, hooks, types, validations
⚠️ **Partial:** `components/` directory exists but structure unclear
❌ **Gap:** No explicit UI component library setup (shadcn/ui reference missing)
❌ **Gap:** No documented component stratification (what goes where)

---

### 3. Server vs Client Components Organization

**Rule:** Server Components by default. Only `'use client'` when necessary.

#### Decision Tree
```
Does component need:
├─ State (useState, useContext)? → 'use client'
├─ Effects (useEffect)? → 'use client'
├─ Browser APIs (localStorage, window)? → 'use client'
├─ Event handlers (onClick, onChange)? → 'use client'
├─ Database access? → Server Component
├─ Secrets/API keys? → Server Component
├─ Large dependencies? → Server Component
└─ Data fetching? → Server Component (async)
```

#### File Organization Pattern
```
app/dashboard/
├── page.tsx                     # Server Component (default)
│   ├── Fetches data via async
│   ├── Imports _components/DashboardContent.tsx
│   └── Passes initialData down
└── _components/
    └── DashboardContent.tsx     # 'use client' (has interactive state)
        ├── 'use client' at top
        ├── useState for filters
        └── onClick handlers
```

#### Implementation Example
```typescript
// app/dashboard/page.tsx (Server Component)
import { DashboardClientWrapper } from './_components/DashboardClientWrapper';
import { fetchDashboardData } from '@/lib/api';

export default async function DashboardPage() {
  const data = await fetchDashboardData(); // No await needed in client component

  return (
    <main>
      <h1>Dashboard</h1>
      <DashboardClientWrapper initialData={data} />
    </main>
  );
}

// app/dashboard/_components/DashboardClientWrapper.tsx (Client Component)
'use client';

import { useState, useCallback } from 'react';

export function DashboardClientWrapper({ initialData }) {
  const [filters, setFilters] = useState({});

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div>
      <Filters onChange={handleFilterChange} />
      <ContentArea data={initialData} filters={filters} />
    </div>
  );
}
```

#### Critical Mistakes to Avoid
❌ **Don't:** Export `'use client'` from `lib/` utility modules
❌ **Don't:** Mark entire `app/layout.tsx` with `'use client'` (prevents server benefits)
❌ **Don't:** Pass Promise/Database objects to client components
✅ **Do:** Serialize data before passing to client components
✅ **Do:** Place `'use client'` as deep as possible in component tree

#### M-Tracking Current State
✅ **Good:** Mix of server/client components evident
⚠️ **Unclear:** No documented strategy for server/client separation
❌ **Gap:** No guidelines on `'use client'` placement depth
❌ **Gap:** Missing examples of data serialization patterns

---

### 4. Lib/Utils Organization (Hooks, Utilities, Helpers)

**Pattern:** Responsibility-based categorization, not file-type grouping

#### Recommended Structure
```
lib/
├── api/                         # API client setup & requests
│   ├── client.ts               # Axios/fetch client initialization
│   ├── auth-api.ts             # Auth endpoints
│   ├── user-api.ts             # User endpoints
│   ├── transaction-api.ts       # Transaction endpoints
│   └── types.ts                # API response types
├── auth/                        # Authentication logic
│   ├── jwt.ts                  # JWT parsing/validation
│   ├── encryption.ts           # Token encryption
│   ├── session.ts              # Session management
│   └── middleware.ts           # Auth middleware logic
├── db/                          # Database setup
│   ├── client.ts               # Prisma/ORM client
│   └── migrations.ts           # Migration utilities
├── config/                      # Configuration
│   ├── env.ts                  # Environment variables
│   ├── constants.ts            # App constants
│   └── features.ts             # Feature flags
├── utils/                       # Small, general utilities
│   ├── formatters.ts           # Date, currency formatting
│   ├── validators.ts           # Input validation helpers
│   ├── string-utils.ts         # String manipulation
│   └── object-utils.ts         # Object/array helpers
├── store/                       # Global state management
│   ├── auth-store.ts           # Zustand auth store
│   ├── user-store.ts           # Zustand user store
│   └── index.ts                # Barrel export
├── query/                       # TanStack Query configuration
│   ├── client.ts               # QueryClient setup
│   ├── keys.ts                 # Query key factory
│   └── hooks/                  # TanStack Query hooks
│       ├── use-users.ts
│       ├── use-transactions.ts
│       └── use-auth.ts
└── hooks/                       # General custom hooks
    ├── use-debounce.ts
    ├── use-local-storage.ts
    ├── use-previous.ts
    └── use-async.ts
```

#### Organization Principles
| Category | Purpose | Max Files |
|----------|---------|-----------|
| **api/** | HTTP client + endpoint functions | 8-10 |
| **auth/** | Authentication business logic | 5-7 |
| **db/** | Database connection + utilities | 2-4 |
| **config/** | Env vars, constants, features | 3-5 |
| **utils/** | Small helper functions | 5-8 |
| **store/** | Global state (Zustand, Jotai) | 1 per domain |
| **query/** | Data fetching (TanStack Query) | 2-3 core |
| **hooks/** | Custom React hooks | 8-12 |

#### Anti-Patterns
❌ **Don't:** Create `lib/helpers/` or `lib/misc/` (vague)
❌ **Don't:** Export 50+ functions from single `lib/utils.ts` file
❌ **Don't:** Mix database, API, and auth logic in same file
✅ **Do:** Keep files under 150 lines
✅ **Do:** Group by responsibility, not by type

#### M-Tracking Current State
✅ **Good:** `lib/` directory exists with logical structure
⚠️ **Unclear:** Current internal organization not examined
❌ **Gap:** No visible `lib/store/` for Zustand stores
❌ **Gap:** No `lib/query/` for TanStack Query configuration

---

### 5. State Management Integration (Zustand, TanStack Query)

**Pattern:** Zustand for global UI state, TanStack Query for server state

#### Architecture
```
lib/
├── store/                       # Global client state
│   ├── auth-store.ts           # User auth state
│   │   └── Exports: useAuthStore()
│   ├── ui-store.ts             # UI state (theme, modals, sidebar)
│   │   └── Exports: useUIStore()
│   ├── user-store.ts           # User preferences
│   │   └── Exports: useUserStore()
│   └── index.ts                # Barrel: export all stores
│
└── query/                       # Server state via TanStack Query
    ├── client.ts               # QueryClient setup
    │   └── queryClient = new QueryClient()
    ├── keys.ts                 # Query key factory
    │   └── queryKeys = { users: { all: ['users'], byId: (id) => [...] } }
    └── hooks/
        ├── use-users.ts        # useQuery hooks
        ├── use-transactions.ts
        └── use-mutations.ts    # useMutation hooks
```

#### Zustand Store Example
```typescript
// lib/store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ user: state.user }), // Persist only user
    }
  )
);
```

#### TanStack Query Configuration
```typescript
// lib/query/client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// lib/query/keys.ts
export const queryKeys = {
  users: {
    all: () => ['users'] as const,
    list: (filters) => ['users', { ...filters }] as const,
    byId: (id: string) => ['users', id] as const,
  },
  transactions: {
    all: () => ['transactions'] as const,
    byUserId: (userId: string) => ['transactions', userId] as const,
  },
};

// lib/query/hooks/use-users.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '../keys';

export function useUsers(filters = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchUsers(filters),
  });
}

export function useCreateUser() {
  const { invalidateQueries } = useQueryClient();

  return useMutation({
    mutationFn: (data) => createUser(data),
    onSuccess: () => {
      invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
}
```

#### Usage in Components
```typescript
// app/dashboard/_components/UsersList.tsx
'use client';

import { useUsers } from '@/lib/query/hooks/use-users';
import { useAuthStore } from '@/lib/store/auth-store';

export function UsersList() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useUsers({ limit: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <ul>{data?.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

#### Best Practices
✅ **Do:** Use Zustand for global UI state (theme, modals, user preferences)
✅ **Do:** Use TanStack Query for server state (users, transactions, data)
✅ **Do:** Keep store files under 100 lines each
✅ **Do:** Use persist middleware for cross-session data
❌ **Don't:** Mix Zustand + TanStack Query for same data (use one or other)
❌ **Don't:** Store large arrays in Zustand (use TanStack Query instead)
❌ **Don't:** Create store without clear selector functions

#### M-Tracking Current State
✅ **Good:** `Zustand` and `TanStack Query` in dependencies
❌ **Gap:** No visible `lib/store/` directory
❌ **Gap:** No `lib/query/` with TanStack Query configuration
❌ **Gap:** Missing query key factory patterns

---

### 6. API Route Handlers Organization

**Pattern:** Feature-scoped routes preferred over global `app/api/` directory

#### Two Approaches (Feature-Scoped Preferred)
```
Option A: Feature-Scoped (RECOMMENDED)
app/
├── (dashboard)/
│   ├── dashboard/
│   │   ├── api/                 # Dashboard-specific APIs
│   │   │   └── stats/
│   │   │       └── route.ts     # GET /dashboard/api/stats
│   │   └── page.tsx
│   └── settings/
│       ├── api/                 # Settings-specific APIs
│       │   └── profile/
│       │       └── route.ts     # GET /settings/api/profile
│       └── page.tsx

Option B: Global Routes (if many cross-cutting APIs)
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts         # POST /api/auth/login
│   │   ├── logout/
│   │   │   └── route.ts
│   │   ├── refresh/
│   │   │   └── route.ts
│   │   └── verify/
│   │       └── route.ts
│   ├── users/
│   │   ├── route.ts             # GET /api/users (list)
│   │   └── [id]/
│   │       └── route.ts         # GET /api/users/:id
│   ├── transactions/
│   │   └── route.ts
│   └── health/
│       └── route.ts             # Health check
```

#### Route Handler Implementation
```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loginService } from '@/lib/services/auth-service';
import { LoginSchema } from '@/features/auth/validations/auth-schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = LoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error },
        { status: 400 }
      );
    }

    // Call service
    const { token, user } = await loginService(validationResult.data);

    // Set httpOnly cookie for refresh token
    const response = NextResponse.json({
      token,
      user,
      expiresIn: 900, // 15 minutes
    });

    response.cookies.set('refreshToken', token.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Comparison: Server Actions vs Route Handlers
| Aspect | Server Actions | Route Handlers |
|--------|---|---|
| **Best for** | Form submissions, mutations | Traditional REST APIs, webhooks |
| **Call from** | Client components directly | HTTP requests, external services |
| **Response format** | Direct return values | JSON responses |
| **Validation** | Zod schemas in action | Request body + Zod schemas |
| **Caching** | revalidatePath/revalidateTag | HTTP headers (Cache-Control) |
| **Example** | `<form action={updateUser}>` | `fetch('/api/users', { method: 'POST' })` |

#### Best Practices
✅ **Do:** Use Server Actions for simple form submissions
✅ **Do:** Use Route Handlers for external API calls, webhooks
✅ **Do:** Organize by feature when possible
✅ **Do:** Return proper HTTP status codes (400, 401, 500, etc.)
❌ **Don't:** Create catch-all API handlers
❌ **Don't:** Mix business logic in route handlers (extract to services)

#### M-Tracking Current State
⚠️ **Unknown:** API route organization not examined
❌ **Gap:** No clear Server Actions vs Route Handlers strategy documented

---

### 7. Type Safety & Shared Types Organization

**Pattern:** Centralized global types + feature-scoped types

#### Directory Structure
```
types/
├── index.ts                     # Main exports
├── api/                         # API response types
│   ├── auth.ts
│   ├── user.ts
│   ├── transaction.ts
│   └── common.ts               # Pagination, error responses
├── entities/                    # Domain models
│   ├── user.ts
│   ├── transaction.ts
│   ├── account.ts
│   └── budget.ts
├── db.ts                        # Database models (from ORM)
├── env.ts                       # Environment variables type
├── next-auth.d.ts             # NextAuth.js augmentation
└── globals.d.ts               # Global type declarations

features/X/
├── types/
│   └── index.ts               # Feature-specific types (e.g., AuthState, LoginForm)
└── validations/
    └── schemas.ts             # Zod schemas (derive types from these)
```

#### Implementation Examples
```typescript
// types/entities/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// types/api/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_LOCKED';
  message: string;
}

// features/auth/validations/auth-schemas.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// lib/api/auth-api.ts
import type { LoginResponse } from '@/types/api/auth';
import { LoginSchema } from '@/features/auth/validations/auth-schemas';

export async function login(data: LoginInput): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) throw new Error('Login failed');
  return response.json();
}
```

#### Zod Best Practices
```typescript
// Derive types from schemas (single source of truth)
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

// Type is automatically inferred from schema
type User = z.infer<typeof UserSchema>;

// Reuse schemas for different contexts
export const CreateUserSchema = UserSchema.omit({ id: true });
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = UserSchema.partial();
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
```

#### Best Practices
✅ **Do:** Derive types from Zod schemas (`z.infer<typeof Schema>`)
✅ **Do:** Keep entity types separate from API request/response types
✅ **Do:** Use feature-scoped types for domain-specific logic
✅ **Do:** Centralize common types (Pagination, Error, etc.)
✅ **Do:** Enable TypeScript `strict` mode in `tsconfig.json`
❌ **Don't:** Create duplicate type definitions (use `z.infer`)
❌ **Don't:** Export types from components
❌ **Don't:** Mix API types with UI types

#### M-Tracking Current State
⚠️ **Partial:** Some type organization visible in `features/auth/types/`
❌ **Gap:** No centralized `types/` directory at root
❌ **Gap:** No API response types organization
❌ **Gap:** No documentation of type organization strategy

---

### 8. Common Mistakes & Solutions

#### Mistake 1: Over-using `'use client'`
**Problem:** Marking entire app with `'use client'` negates Server Component benefits.

**Solution:**
```typescript
// ❌ BAD: app/layout.tsx marked 'use client' (entire app is client component)
'use client';
export default function RootLayout({ children }) { ... }

// ✅ GOOD: Only mark components with interactivity
// app/layout.tsx (Server Component - default)
export default function RootLayout({ children }) { ... }

// app/(dashboard)/_components/interactive-sidebar.tsx
'use client';
export function InteractiveSidebar() { ... }
```

#### Mistake 2: Mixing Server & Client Component Logic
**Problem:** Passing server-only resources (Promises, Functions) to client components.

**Solution:**
```typescript
// ❌ BAD: Server data passed to client component
async function getDashboardData() {
  return db.dashboard.find(...); // Returns Promise
}

export default function DashboardPage() {
  const data = getDashboardData(); // Error: Promise passed to client
  return <DashboardContent data={data} />;
}

// ✅ GOOD: Serialize before passing
export default async function DashboardPage() {
  const data = await getDashboardData(); // Resolve Promise
  return <DashboardContent data={data} />; // Pass serialized data
}
```

#### Mistake 3: Large Page Files (100+ lines)
**Problem:** Logic bloat in `page.tsx` reduces maintainability.

**Solution:**
```typescript
// ❌ BAD: 200+ lines in page.tsx
export default async function DashboardPage() {
  const data = await fetch(...);
  return (
    <main>
      <Header />
      <Sidebar>
        <ComplexForm data={data} />
        <NestedFilters />
        <ResultsList data={data} />
      </Sidebar>
    </main>
  );
}

// ✅ GOOD: Extract to feature components
export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardLayout data={data} />;
}

// app/dashboard/_components/dashboard-layout.tsx
export function DashboardLayout({ data }) {
  return (
    <main>
      <DashboardHeader />
      <DashboardSidebar>
        <DashboardForm data={data} />
        <DashboardFilters />
        <DashboardResults data={data} />
      </DashboardSidebar>
    </main>
  );
}
```

#### Mistake 4: Inconsistent File Naming
**Problem:** Mixed naming conventions reduce discoverability.

**Solution:**
```
Use consistent naming:
- Components: PascalCase (Button.tsx, UserCard.tsx)
- Utilities: kebab-case (string-utils.ts, format-date.ts)
- Types: kebab-case or PascalCase (user-types.ts or UserTypes.ts)
- Folders: kebab-case (auth-feature, user-profile)
- API routes: lowercase (route.ts, NOT Route.ts)
```

#### Mistake 5: Feature-Type Mismatch in Large Apps
**Problem:** As app grows, organizing by type (`components/`, `hooks/`) causes directory bloat.

**Solution:** Transition to feature-first organization
```typescript
// ❌ BAD (50+ components hard to manage):
components/
├── Button.tsx
├── UserCard.tsx
├── LoginForm.tsx
├── Dashboard.tsx
├── DashboardHeader.tsx
└── ... (40+ more components)

// ✅ GOOD (features clearly isolated):
features/
├── auth/
│   ├── components/
│   │   ├── login-form.tsx
│   │   └── oauth-buttons.tsx
│   └── hooks/
│       └── use-login.ts
├── dashboard/
│   ├── components/
│   │   ├── dashboard-header.tsx
│   │   └── dashboard-content.tsx
│   └── hooks/
│       └── use-dashboard-data.ts
└── shared/
    ├── components/
    │   └── button.tsx (truly shared)
    └── hooks/
        └── use-debounce.ts
```

#### Mistake 6: Ignoring Error & Loading States
**Problem:** App appears frozen during data fetching or errors.

**Solution:**
```typescript
// app/dashboard/loading.tsx (Suspense fallback)
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}

// app/dashboard/error.tsx (Error boundary)
'use client';
export default function DashboardError({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// In component (with proper Suspense)
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
```

#### Mistake 7: No Type Safety for API Calls
**Problem:** Response types unknown at runtime, leading to errors.

**Solution:** Use Zod + TypeScript inference
```typescript
// ✅ GOOD: Type-safe API
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return UserSchema.parse(data); // Validates at runtime
}
```

#### Mistake 8: Unorganized State Management
**Problem:** Global state scattered across files, hard to find/update.

**Solution:** Centralized store organization
```typescript
// ✅ GOOD: Structured stores
lib/
└── store/
    ├── auth-store.ts        // Auth global state
    ├── ui-store.ts          // UI (modals, sidebar, theme)
    ├── user-store.ts        // User preferences
    └── index.ts             // Barrel export

// Usage
import { useAuthStore, useUIStore } from '@/lib/store';
```

#### Mistake 9: Missing Query Keys Strategy
**Problem:** TanStack Query cache invalidation unreliable, UI doesn't update.

**Solution:** Implement query key factory
```typescript
// ✅ GOOD: Centralized query keys
lib/query/keys.ts:

export const queryKeys = {
  users: {
    all: () => ['users'] as const,
    list: (filters: Filters) => ['users', { ...filters }] as const,
    byId: (id: string) => ['users', id] as const,
    byEmail: (email: string) => ['users', { email }] as const,
  },
  transactions: {
    all: () => ['transactions'] as const,
    byUserId: (userId: string) => ['transactions', userId] as const,
  },
} as const;

// Usage in hooks
export function useUsers(filters: Filters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchUsers(filters),
  });
}

// Cache invalidation (always matches)
invalidateQueries({ queryKey: queryKeys.users.all() });
```

#### Mistake 10: Client Components in `lib/` & `app/api/`
**Problem:** Server-only modules accidentally contain client code.

**Solution:** Enforce strict separation
```typescript
// ❌ WRONG: 'use client' in lib/
// lib/utils/string-utils.ts
'use client'; // ❌ This defeats the purpose

// ✅ RIGHT: Client components only in features/X/components
// features/dashboard/_components/interactive-chart.tsx
'use client'; // ✅ Correct location

// ✅ RIGHT: lib is server-only
// lib/api/client.ts (no 'use client')
export async function fetchUsers() { ... }
```

#### Mistake 11: Over-Optimization Early
**Problem:** Premature complexity (memoization, code splitting before needed).

**Solution:** Optimize only when measured
```typescript
// ❌ BAD: Premature optimization
const MemoizedComponent = memo(Button);
const LazyDashboard = dynamic(() => import('./Dashboard'), { ssr: false });

// ✅ GOOD: Let Next.js optimize automatically
// Use default behavior, optimize only if performance metrics indicate need
```

---

## Current M-Tracking Frontend Assessment

### Strengths
1. ✅ **Feature-driven organization** already established (`features/auth/`, `features/dashboard/`)
2. ✅ **Proper tech stack** (Next.js 16, React 19, Zustand, TanStack Query, Zod)
3. ✅ **Component co-location** with hooks, types, validations
4. ✅ **Type safety** via Zod schemas in validations

### Gaps Identified
1. ❌ **No explicit private folders** (`_components/`, `_hooks/`) for route segment scoping
2. ❌ **Missing state management structure** (no `lib/store/` directory visible)
3. ❌ **Unclear API route organization** (no visible `app/api/` or feature-scoped APIs)
4. ❌ **No centralized type definitions** (no `types/` root directory)
5. ❌ **Weak query key management** (no `lib/query/` with keys factory)
6. ❌ **No component stratification documentation** (UI vs shared vs feature components)
7. ❌ **Unclear server/client component strategy** (no guidelines documented)

### Recommendations (Priority Order)
1. **High:** Create `lib/store/` with Zustand stores and index.ts barrel
2. **High:** Establish `types/` root directory with API/entity types
3. **High:** Create `lib/query/` with client setup, keys factory, hooks
4. **Medium:** Add private folders (`_components/`, `_hooks/`) to route segments
5. **Medium:** Document component stratification (UI/shared/feature tiers)
6. **Medium:** Create `lib/services/` for business logic extraction
7. **Low:** Review and consolidate API routes (feature-scoped vs global)

---

## Implementation Recommendations

### Quick Start Guide

#### Phase 1: State Management (1-2 hours)
```bash
# Create store structure
mkdir -p apps/frontend/src/lib/store
touch apps/frontend/src/lib/store/{auth,ui,user}-store.ts
touch apps/frontend/src/lib/store/index.ts
```

#### Phase 2: Type Definitions (1-2 hours)
```bash
# Create types structure
mkdir -p apps/frontend/src/types/{api,entities}
touch apps/frontend/src/types/{index,api.ts,entities.ts,env.ts}
```

#### Phase 3: Query Configuration (1 hour)
```bash
# Create query structure
mkdir -p apps/frontend/src/lib/query/{hooks}
touch apps/frontend/src/lib/query/{client,keys,index}.ts
```

#### Phase 4: Private Folders (30 mins per route)
- Add `_components/` folder to route segments
- Add `_hooks/` folder for segment-specific hooks
- Move component files from root to `_components/`

### Code Examples

**Store Setup (lib/store/index.ts):**
```typescript
export { useAuthStore } from './auth-store';
export { useUIStore } from './ui-store';
export { useUserStore } from './user-store';
```

**Query Configuration (lib/query/index.ts):**
```typescript
export { queryClient } from './client';
export { queryKeys } from './keys';
export * from './hooks';
```

**Type Centralization (types/index.ts):**
```typescript
export * from './api';
export * from './entities';
export * from './env';
```

---

## Best Practices Summary

### Essential Rules
1. **Server-first:** All components are Server Components by default
2. **`'use client'` sparingly:** Only when interactivity required, as deep as possible
3. **Feature-driven:** Group by feature, not by file type
4. **Private folders:** Use `_name` to prevent route creation
5. **Type safety:** Derive from Zod schemas, centralize entity types
6. **State separation:** Zustand for UI state, TanStack Query for server state
7. **API organization:** Feature-scoped routes preferred
8. **File size:** Keep under 200 lines, extract complex logic
9. **Naming convention:** PascalCase components, kebab-case files/folders
10. **Documentation:** Document patterns in `CONTRIBUTING.md` or code comments

---

## Resources & References

### Official Documentation
- [Next.js 16 App Router Docs](https://nextjs.org/docs/app)
- [React 19 Docs](https://react.dev)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev)

### Recommended Tutorials
- Next.js Official: "Building Your Application" guide
- Kent C. Dodds: "Epic React" (server/client components)
- Vercel: "Next.js Advanced Patterns" course

### Community Resources
- Next.js Discord (#help-and-questions)
- Stack Overflow tags: `nextjs`, `react`, `typescript`

### Production Templates
- [AnwarHossainSR/nextjs-16-template](https://github.com/AnwarHossainSR/nextjs-16-template) - Excellent reference
- Vercel examples repository (next.js/examples)

---

## Glossary

**Route Group:** Folder naming pattern `(name)` that groups routes without affecting URL (e.g., `(auth)/login` → `/login`)

**Private Folder:** Folder prefix `_name` prevents folder from being treated as route segment

**Server Component:** React component that runs only on server, fetches data, accesses secrets; has no client-side JS

**Client Component:** React component marked with `'use client'`, has interactivity, state, browser APIs

**Barrel Export:** `index.ts` file that re-exports multiple items for cleaner imports

**Query Key:** Unique identifier in TanStack Query cache (e.g., `['users', { limit: 10 }]`)

---

## Unresolved Questions

1. **API Route Strategy:** Should M-Tracking use feature-scoped routes or centralized `/api` directory? (Needs architectural decision)
2. **Service Layer Extraction:** Should business logic move to `lib/services/` or stay in hooks? (Depends on complexity)
3. **Middleware Strategy:** Where should route middleware live? (Needs pattern documentation)
4. **Error Handling:** Consistent error format across API routes and Server Actions? (Needs standardization)
5. **Testing Strategy:** Unit tests for stores, hooks, components? (Needs testing plan)

---

**Report Generated:** 2026-01-18
**Prepared For:** M-Tracking Development Team
**Classification:** Technical Guidance
