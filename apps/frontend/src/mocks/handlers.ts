import { http, HttpResponse } from 'msw'
import {
  mockCategories,
  mockTransactions,
  mockSpendingSummary,
} from '@/features/spending/mock-data'
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateCategoryDto,
} from '@/types/api/spending'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const handlers = [
  // Auth Handlers
  http.post(`${API_URL}/auth/login`, async () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token-' + Date.now(),
      expiresIn: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    })
  }),

  http.post(`${API_URL}/auth/register`, async () => {
    return HttpResponse.json({
      message: 'Registration successful',
    })
  }),

  http.post(`${API_URL}/auth/logout`, async () => {
    return HttpResponse.json({
      message: 'Logged out successfully',
    })
  }),

  http.post(`${API_URL}/auth/refresh`, async () => {
    return HttpResponse.json({
      accessToken: 'mock-refreshed-token-' + Date.now(),
      expiresIn: 3600,
    })
  }),

  // User Handlers
  http.get(`${API_URL}/users/me`, async () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),

  // Spending Handlers
  http.get(`${API_URL}/transactions`, async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // For now, return all transactions regardless of period
    // In a real implementation, you might filter based on period
    return HttpResponse.json(mockTransactions)
  }),

  http.get(`${API_URL}/transactions/summary`, async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // For now, return the same summary regardless of period
    // In a real implementation, you might calculate based on period
    return HttpResponse.json(mockSpendingSummary)
  }),

  http.get(`${API_URL}/transactions/categories`, async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    return HttpResponse.json(mockCategories)
  }),

  http.post(`${API_URL}/transactions`, async ({ request }) => {
    const body = (await request.json()) as CreateTransactionDto

    // Create a mock transaction response
    const newTransaction = {
      id: 'mock-transaction-' + Date.now(),
      userId: 'mock-user-id',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return HttpResponse.json(newTransaction, { status: 201 })
  }),

  http.get(`${API_URL}/transactions/:id`, async ({ params }) => {
    const { id } = params
    const transaction = mockTransactions.find(t => t.id === id)

    if (!transaction) {
      return HttpResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(transaction)
  }),

  http.put(`${API_URL}/transactions/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as UpdateTransactionDto

    const transaction = mockTransactions.find(t => t.id === id)
    if (!transaction) {
      return HttpResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Return updated transaction
    const updatedTransaction = {
      ...transaction,
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return HttpResponse.json(updatedTransaction)
  }),

  http.delete(`${API_URL}/transactions/:id`, async ({ params }) => {
    const { id } = params
    const transaction = mockTransactions.find(t => t.id === id)

    if (!transaction) {
      return HttpResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ message: 'Transaction deleted successfully' })
  }),

  http.post(`${API_URL}/transactions/categories`, async ({ request }) => {
    const body = (await request.json()) as CreateCategoryDto

    // Create a mock category response
    const newCategory = {
      id: 'mock-category-' + Date.now(),
      userId: 'mock-user-id',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return HttpResponse.json(newCategory, { status: 201 })
  }),

  http.get(`${API_URL}/transactions/categories/:id`, async ({ params }) => {
    const { id } = params
    const category = mockCategories.find(c => c.id === id)

    if (!category) {
      return HttpResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(category)
  }),

  http.delete(`${API_URL}/transactions/categories/:id`, async ({ params }) => {
    const { id } = params
    const category = mockCategories.find(c => c.id === id)

    if (!category) {
      return HttpResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ message: 'Category deleted successfully' })
  }),
]
