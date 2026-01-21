import { apiClient } from '@/lib/api-client'
import type {
  Transaction,
  Category,
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateCategoryDto,
  SpendingQueryDto,
  SpendingSummary,
} from '@/types/api/spending'

export const spendingApi = {
  // ==================== Transaction Endpoints ====================

  createTransaction: async (
    data: CreateTransactionDto
  ): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/transactions', data)
    return response.data
  },

  getAllTransactions: async (
    query: SpendingQueryDto
  ): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>('/transactions', {
      params: query,
    })
    return response.data
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`)
    return response.data
  },

  updateTransaction: async (
    id: string,
    data: UpdateTransactionDto
  ): Promise<Transaction> => {
    const response = await apiClient.put<Transaction>(
      `/transactions/${id}`,
      data
    )
    return response.data
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`)
  },

  getSpendingSummary: async (
    query: SpendingQueryDto
  ): Promise<SpendingSummary> => {
    const response = await apiClient.get<SpendingSummary>(
      '/transactions/summary',
      { params: query }
    )
    return response.data
  },

  // ==================== Category Endpoints ====================

  createCategory: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await apiClient.post<Category>(
      '/transactions/categories',
      data
    )
    return response.data
  },

  getAllCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/transactions/categories')
    return response.data
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(
      `/transactions/categories/${id}`
    )
    return response.data
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/categories/${id}`)
  },
}
