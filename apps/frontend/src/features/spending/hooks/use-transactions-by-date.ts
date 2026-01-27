import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { spendingApi } from '../api/spending-api'
import { TimePeriod } from '@/types/api/spending'
import type { Transaction, SpendingQueryDto } from '@/types/api/spending'

/**
 * Hook parameters interface
 */
interface UseTransactionsByDateRangeParams {
  startDate: Date | null
  endDate: Date | null
  enabled?: boolean
}

/**
 * Hook return interface
 */
interface UseTransactionsByDateRangeReturn {
  transactions: Transaction[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Custom hook for fetching transactions by date range
 * Uses TanStack Query for caching and state management
 */
export function useTransactionsByDateRange({
  startDate,
  endDate,
  enabled = true,
}: UseTransactionsByDateRangeParams): UseTransactionsByDateRangeReturn {
  // Format dates for API and query key (yyyy-MM-dd)
  const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : null
  const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : null

  // Build query params for API
  const query: SpendingQueryDto = {
    period: TimePeriod.CUSTOM,
    ...(formattedStartDate && { startDate: formattedStartDate }),
    ...(formattedEndDate && { endDate: formattedEndDate }),
  }

  // Query with date-specific cache key
  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Transaction[], Error>({
    queryKey: [
      'transactions',
      'date-range',
      formattedStartDate,
      formattedEndDate,
    ],
    queryFn: () => spendingApi.getAllTransactions(query),
    enabled: enabled && (!!startDate || !!endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    transactions,
    isLoading,
    isError,
    error: error ?? null,
    refetch: () => {
      void refetch()
    },
  }
}

/**
 * Helper to get default date range (last 30 days)
 */
export function getDefaultDateRange(): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return { start, end }
}
