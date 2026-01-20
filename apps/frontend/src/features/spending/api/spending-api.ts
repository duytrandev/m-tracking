import axios from 'axios'
import type {
  Transaction,
  Category,
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateCategoryDto,
  SpendingQueryDto,
  SpendingSummary,
} from '@/types/api/spending'
import {
  mockCategories,
  mockTransactions,
  mockSpendingSummary,
} from '../mock-data'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const spendingApi = {
  // ==================== Transaction Endpoints ====================

  async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
    const response = await api.post('/transactions', data)
    return response.data
  },

  async getAllTransactions(query: SpendingQueryDto): Promise<Transaction[]> {
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      return mockTransactions
    }
    const response = await api.get('/transactions', { params: query })
    return response.data
  },

  async getTransaction(id: string): Promise<Transaction> {
    const response = await api.get(`/transactions/${id}`)
    return response.data
  },

  async updateTransaction(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const response = await api.put(`/transactions/${id}`, data)
    return response.data
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`)
  },

  async getSpendingSummary(query: SpendingQueryDto): Promise<SpendingSummary> {
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      return mockSpendingSummary
    }
    const response = await api.get('/transactions/summary', { params: query })
    return response.data
  },

  // ==================== Category Endpoints ====================

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await api.post('/transactions/categories', data)
    return response.data
  },

  async getAllCategories(): Promise<Category[]> {
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      return mockCategories
    }
    const response = await api.get('/transactions/categories')
    return response.data
  },

  async getCategory(id: string): Promise<Category> {
    const response = await api.get(`/transactions/categories/${id}`)
    return response.data
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/transactions/categories/${id}`)
  },
}
