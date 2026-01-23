import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { spendingApi } from '../api/spending-api'
import { TimePeriod } from '@/types/api/spending'
import { queryKeys } from '@/lib/query'
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateCategoryDto,
  SpendingQueryDto,
} from '@/types/api/spending'

export function useSpendingData(period: TimePeriod = TimePeriod.MONTH) {
  const queryClient = useQueryClient()

  const query: SpendingQueryDto = { period }

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.spending.summary(period),
    queryFn: () => spendingApi.getSpendingSummary(query),
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: queryKeys.spending.transactions(period),
    queryFn: () => spendingApi.getAllTransactions(query),
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => spendingApi.getAllCategories(),
  })

  const createTransaction = useMutation({
    mutationFn: (data: CreateTransactionDto) => spendingApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spending.all })
    },
  })

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) =>
      spendingApi.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spending.all })
    },
  })

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => spendingApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spending.all })
    },
  })

  const createCategory = useMutation({
    mutationFn: (data: CreateCategoryDto) => spendingApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })

  const deleteCategory = useMutation({
    mutationFn: (id: string) => spendingApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.spending.all })
    },
  })

  return {
    summary,
    transactions,
    categories,
    isLoading: summaryLoading || transactionsLoading || categoriesLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
    deleteCategory,
  }
}
