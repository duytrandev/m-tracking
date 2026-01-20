import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { spendingApi } from '../api/spending-api'
import { TimePeriod } from '@/types/api/spending'
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
    queryKey: ['spending-summary', period],
    queryFn: () => spendingApi.getSpendingSummary(query),
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', period],
    queryFn: () => spendingApi.getAllTransactions(query),
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => spendingApi.getAllCategories(),
  })

  const createTransaction = useMutation({
    mutationFn: (data: CreateTransactionDto) => spendingApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending-summary'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) =>
      spendingApi.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending-summary'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => spendingApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending-summary'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const createCategory = useMutation({
    mutationFn: (data: CreateCategoryDto) => spendingApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const deleteCategory = useMutation({
    mutationFn: (id: string) => spendingApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['spending-summary'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
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
