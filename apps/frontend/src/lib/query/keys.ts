/**
 * Centralized query key factory
 *
 * Ensures consistent cache keys across the application.
 * Follow the hierarchical pattern: domain -> operation -> parameters
 *
 * Usage examples:
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

  // Transactions domain
  transactions: {
    all: ['transactions'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.transactions.all, 'list', params] as const,
    detail: (id: string) =>
      [...queryKeys.transactions.all, 'detail', id] as const,
    summary: (period?: string) =>
      [...queryKeys.transactions.all, 'summary', period] as const,
  },

  // Accounts domain
  accounts: {
    all: ['accounts'] as const,
    list: () => [...queryKeys.accounts.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.accounts.all, 'detail', id] as const,
    balance: (id: string) =>
      [...queryKeys.accounts.all, 'balance', id] as const,
  },

  // Budgets domain
  budgets: {
    all: ['budgets'] as const,
    list: () => [...queryKeys.budgets.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.budgets.all, 'detail', id] as const,
    progress: (id: string) =>
      [...queryKeys.budgets.all, 'progress', id] as const,
  },

  // Spending domain
  spending: {
    all: ['spending'] as const,
    summary: (period?: string) =>
      [...queryKeys.spending.all, 'summary', period] as const,
    transactions: (period?: string) =>
      [...queryKeys.spending.all, 'transactions', period] as const,
  },

  // Categories domain
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.categories.all, 'detail', id] as const,
  },
} as const

// Type helper for query key inference
export type QueryKeys = typeof queryKeys
