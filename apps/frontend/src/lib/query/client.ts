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
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on 401/403/404 errors
          if (error instanceof Error && 'response' in error) {
            const status = (error as { response?: { status?: number } })
              .response?.status
            if (status && [401, 403, 404].includes(status)) {
              return false
            }
          }
          // Retry up to 3 times for other errors
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

/**
 * Get QueryClient instance
 * - Server: always creates new client (prevents data leaks between requests)
 * - Browser: reuses singleton (maintains cache across navigations)
 */
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
