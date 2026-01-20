# Phase 1: Frontend State Management Structure

## Context Links
- [Project Structure Review](/docs/project-structure-review.md#priority-1-frontend-state-management-structure)
- [Frontend Package](/apps/frontend/package.json)

## Overview

| Item | Value |
|------|-------|
| Priority | P1 - Critical |
| Status | Pending |
| Effort | 4 hours |
| Dependencies | None |

Organize frontend state management with proper `lib/store/` and `lib/query/` structure. Current state: auth store exists in `features/auth/store/`, query client exists in `lib/`. Need centralized organization.

## Key Insights

1. **Existing auth-store.ts** is well-structured with Zustand persist middleware
2. **Query client** already configured in `lib/query-client.ts`
3. **Missing**: Centralized store index, UI store, query key factory
4. **Pattern**: Feature stores colocated, global stores in `lib/store/`

## Requirements

### Functional
- F1: Create `lib/store/` with barrel exports
- F2: Create global UI store for theme, modals, sidebar
- F3: Create `lib/query/` with key factory and hooks directory
- F4: Add private `_components/` folders to app routes

### Non-Functional
- NF1: Files under 200 lines
- NF2: TypeScript strict mode compliance
- NF3: No breaking changes to existing auth flow

## Architecture

### Store Organization
```
apps/frontend/src/
├── lib/
│   ├── store/
│   │   ├── index.ts           # Barrel export (global stores only)
│   │   └── ui-store.ts        # Theme, modals, sidebar state
│   ├── query/
│   │   ├── index.ts           # Barrel export
│   │   ├── client.ts          # QueryClient config (move from query-client.ts)
│   │   ├── keys.ts            # Query key factory
│   │   └── hooks/             # Shared query hooks (future)
│   │       └── index.ts
│   └── api-client.ts          # Existing - no change
├── features/
│   └── auth/
│       └── store/
│           └── auth-store.ts  # Keep here (feature-specific)
```

### Query Key Factory Pattern
```typescript
// lib/query/keys.ts
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    sessions: () => [...queryKeys.auth.all, 'sessions'] as const,
  },
  profile: {
    all: ['profile'] as const,
    detail: () => [...queryKeys.profile.all, 'detail'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters?: TransactionFilters) =>
      [...queryKeys.transactions.all, 'list', filters] as const,
    detail: (id: string) =>
      [...queryKeys.transactions.all, 'detail', id] as const,
  },
} as const
```

## Related Code Files

### Files to Create
- `apps/frontend/src/lib/store/index.ts`
- `apps/frontend/src/lib/store/ui-store.ts`
- `apps/frontend/src/lib/query/index.ts`
- `apps/frontend/src/lib/query/keys.ts`
- `apps/frontend/src/lib/query/hooks/index.ts`
- `apps/frontend/app/auth/_components/.gitkeep`
- `apps/frontend/app/dashboard/_components/.gitkeep`
- `apps/frontend/app/settings/_components/.gitkeep`

### Files to Modify
- `apps/frontend/src/lib/query-client.ts` -> Move to `lib/query/client.ts`
- `apps/frontend/app/providers.tsx` - Update import path

### Files to Delete
- `apps/frontend/src/lib/query-client.ts` (after migration)

## Implementation Steps

### Step 1: Create lib/store structure (30 min)

1.1 Create `lib/store/ui-store.ts`:
```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type SidebarState = 'expanded' | 'collapsed'

export interface UIState {
  theme: Theme
  sidebarState: SidebarState
  isMobileMenuOpen: boolean

  // Actions
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarState: (state: SidebarState) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarState: 'expanded',
      isMobileMenuOpen: false,

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () => set((state) => ({
        sidebarState: state.sidebarState === 'expanded' ? 'collapsed' : 'expanded'
      })),

      setSidebarState: (sidebarState) => set({ sidebarState }),

      setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarState: state.sidebarState,
      }),
    }
  )
)

// Selector hooks
export const useTheme = (): Theme => useUIStore((s) => s.theme)
export const useSidebarState = (): SidebarState => useUIStore((s) => s.sidebarState)
```

1.2 Create `lib/store/index.ts`:
```typescript
// Global stores - UI state shared across app
export { useUIStore, useTheme, useSidebarState } from './ui-store'
export type { UIState, Theme, SidebarState } from './ui-store'

// Note: Feature-specific stores remain in their feature directories
// Example: useAuthStore stays in features/auth/store/auth-store.ts
```

### Step 2: Create lib/query structure (45 min)

2.1 Create `lib/query/keys.ts`:
```typescript
/**
 * Centralized query key factory
 * Ensures consistent cache keys across the application
 *
 * Usage:
 *   useQuery({ queryKey: queryKeys.auth.user() })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
 */
export const queryKeys = {
  // Auth domain
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    sessions: () => [...queryKeys.auth.all, 'sessions'] as const,
  },

  // Profile domain
  profile: {
    all: ['profile'] as const,
    detail: () => [...queryKeys.profile.all, 'detail'] as const,
    preferences: () => [...queryKeys.profile.all, 'preferences'] as const,
  },

  // Transactions domain (future)
  transactions: {
    all: ['transactions'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.transactions.all, 'list', params] as const,
    detail: (id: string) =>
      [...queryKeys.transactions.all, 'detail', id] as const,
    summary: (period?: string) =>
      [...queryKeys.transactions.all, 'summary', period] as const,
  },

  // Accounts domain (future)
  accounts: {
    all: ['accounts'] as const,
    list: () => [...queryKeys.accounts.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.accounts.all, 'detail', id] as const,
    balance: (id: string) =>
      [...queryKeys.accounts.all, 'balance', id] as const,
  },

  // Budgets domain (future)
  budgets: {
    all: ['budgets'] as const,
    list: () => [...queryKeys.budgets.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.budgets.all, 'detail', id] as const,
    progress: (id: string) =>
      [...queryKeys.budgets.all, 'progress', id] as const,
  },
} as const

// Type helper for query key inference
export type QueryKeys = typeof queryKeys
```

2.2 Move and update `lib/query/client.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query client configuration
 * Provides caching, background refetching, and retry logic
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: (failureCount, error) => {
          if (error instanceof Error && 'response' in error) {
            const status = (error as { response?: { status?: number } }).response?.status
            if (status && [401, 403, 404].includes(status)) {
              return false
            }
          }
          return failureCount < 3
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Singleton for client-side usage
let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create new client
    return createQueryClient()
  }
  // Browser: reuse singleton
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient()
  }
  return browserQueryClient
}
```

2.3 Create `lib/query/hooks/index.ts`:
```typescript
// Shared query hooks will be added here as features grow
// Example: useInfiniteList, usePaginatedQuery, etc.
export {}
```

2.4 Create `lib/query/index.ts`:
```typescript
// Query client
export { createQueryClient, getQueryClient } from './client'

// Query keys
export { queryKeys } from './keys'
export type { QueryKeys } from './keys'

// Hooks (future)
// export * from './hooks'
```

### Step 3: Create private folders in app routes (15 min)

3.1 Create private component folders:
```bash
mkdir -p apps/frontend/app/auth/_components
mkdir -p apps/frontend/app/auth/_hooks
mkdir -p apps/frontend/app/dashboard/_components
mkdir -p apps/frontend/app/dashboard/_hooks
mkdir -p apps/frontend/app/settings/_components
mkdir -p apps/frontend/app/settings/_hooks

# Add .gitkeep files
touch apps/frontend/app/auth/_components/.gitkeep
touch apps/frontend/app/auth/_hooks/.gitkeep
touch apps/frontend/app/dashboard/_components/.gitkeep
touch apps/frontend/app/dashboard/_hooks/.gitkeep
touch apps/frontend/app/settings/_components/.gitkeep
touch apps/frontend/app/settings/_hooks/.gitkeep
```

### Step 4: Update imports and providers (30 min)

4.1 Update `app/providers.tsx`:
```typescript
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/lib/query'  // Updated import

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

4.2 Delete old file:
```bash
rm apps/frontend/src/lib/query-client.ts
```

### Step 5: Verify and test (30 min)

5.1 Run type check:
```bash
cd apps/frontend && pnpm run lint
```

5.2 Run build:
```bash
pnpm run build:frontend
```

5.3 Manual test:
- Start dev server
- Verify auth flow works
- Verify query devtools visible

## Todo List

- [ ] Create `lib/store/ui-store.ts`
- [ ] Create `lib/store/index.ts`
- [ ] Create `lib/query/keys.ts`
- [ ] Create `lib/query/client.ts` (move from query-client.ts)
- [ ] Create `lib/query/hooks/index.ts`
- [ ] Create `lib/query/index.ts`
- [ ] Create private folders (`_components/`, `_hooks/`) in app routes
- [ ] Update `app/providers.tsx` imports
- [ ] Delete old `lib/query-client.ts`
- [ ] Run lint check
- [ ] Run build
- [ ] Manual smoke test

## Success Criteria

1. `lib/store/` contains global UI store with theme, sidebar state
2. `lib/query/` contains client config, key factory, hooks directory
3. Private folders exist in auth, dashboard, settings routes
4. All imports updated, no broken references
5. Build passes without errors
6. Auth flow still works

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Import path breaks | Search/replace all usages before deletion |
| Provider initialization | Test SSR and client-side rendering |
| Store hydration issues | Test persistence after page reload |

## Security Considerations

- UI store only persists non-sensitive data (theme, sidebar state)
- Auth store already handles sensitive data properly
- No changes to auth token handling

## Next Steps

After completion:
1. Proceed to Phase 2: Type Definitions
2. Migrate feature hooks to use query key factory
3. Add more stores as features grow (notifications, etc.)
