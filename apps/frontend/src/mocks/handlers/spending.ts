/**
 * Spending/Transactions API Mock Handlers
 *
 * This module provides comprehensive mock handlers for all spending and transaction-related API endpoints.
 * Handlers are organized by functionality and include proper request matching, error scenarios,
 * and realistic response data.
 */

import { http, HttpResponse } from 'msw'
import { mockCategories, mockTransactions } from '@/features/spending/mock-data'
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateCategoryDto,
  SpendingQueryDto,
} from '@/types/api/spending'
import { TransactionType, TimePeriod } from '@/types/api/spending'

// API base URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// In-memory data stores for realistic CRUD operations
const transactions = [...mockTransactions]
const categories = [...mockCategories]

/**
 * Simulate network delay for realistic testing
 */
const delay = (ms: number = 300) =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Validate request body and return error response if invalid
 */
const validateRequestBody = async <T>(request: Request): Promise<T | null> => {
  try {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return null
    }
    return (await request.json()) as T
  } catch {
    return null
  }
}

/**
 * Parse query parameters from URL
 */
const parseQueryParams = (url: URL): Record<string, string> => {
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * Filter transactions based on query parameters
 */
const filterTransactions = (query: SpendingQueryDto) => {
  let filtered = [...transactions]

  // Filter by period
  const now = new Date()
  let startDate: Date

  switch (query.period) {
    case TimePeriod.DAY:
      startDate = new Date(now.setHours(0, 0, 0, 0))
      break
    case TimePeriod.WEEK:
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case TimePeriod.MONTH:
      startDate = new Date(now.setMonth(now.getMonth() - 1))
      break
    case TimePeriod.YEAR:
      startDate = new Date(now.setFullYear(now.getFullYear() - 1))
      break
    case TimePeriod.CUSTOM:
      startDate = query.startDate
        ? new Date(query.startDate)
        : new Date(now.setMonth(now.getMonth() - 1))
      break
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1))
  }

  filtered = filtered.filter(t => new Date(t.date) >= startDate)

  // Filter by end date if specified
  if (query.endDate) {
    const endDate = new Date(query.endDate)
    filtered = filtered.filter(t => new Date(t.date) <= endDate)
  }

  return filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export const spendingHandlers = [
  // ==================== TRANSACTION ENDPOINTS ====================

  /**
   * GET /transactions
   * Retrieves all transactions with optional filtering
   */
  http.get(`${API_URL}/transactions`, async ({ request }) => {
    await delay(400) // Simulate network latency

    const url = new URL(request.url)
    const params = parseQueryParams(url)

    // Parse query parameters
    const query: SpendingQueryDto = {
      period: (params.period as TimePeriod) || TimePeriod.MONTH,
      startDate: params.startDate,
      endDate: params.endDate,
    }

    const filteredTransactions = filterTransactions(query)

    return HttpResponse.json(filteredTransactions)
  }),

  /**
   * GET /transactions/:id
   * Retrieves a specific transaction by ID
   */
  http.get(`${API_URL}/transactions/:id`, async ({ params }) => {
    await delay(200)

    const { id } = params
    const transaction = transactions.find(t => t.id === id)

    if (!transaction) {
      return HttpResponse.json(
        {
          message: 'Transaction not found',
          statusCode: 404,
          error: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    return HttpResponse.json(transaction)
  }),

  /**
   * POST /transactions
   * Creates a new transaction
   */
  http.post(`${API_URL}/transactions`, async ({ request }) => {
    await delay(500)

    const body = await validateRequestBody<CreateTransactionDto>(request)

    if (!body) {
      return HttpResponse.json(
        {
          message: 'Invalid request body',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Validation
    if (
      !body.categoryId ||
      !body.amount ||
      !body.type ||
      !body.description ||
      !body.date
    ) {
      return HttpResponse.json(
        {
          message:
            'Missing required fields: categoryId, amount, type, description, date',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    if (body.amount <= 0) {
      return HttpResponse.json(
        {
          message: 'Amount must be greater than 0',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Verify category exists
    const category = categories.find(c => c.id === body.categoryId)
    if (!category) {
      return HttpResponse.json(
        { message: 'Category not found', statusCode: 404, error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Create new transaction
    const newTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: 'mock-user-id',
      ...body,
      currency: body.currency || 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category,
    }

    transactions.push(newTransaction)

    return HttpResponse.json(newTransaction, { status: 201 })
  }),

  /**
   * PUT /transactions/:id
   * Updates an existing transaction
   */
  http.put(`${API_URL}/transactions/:id`, async ({ params, request }) => {
    await delay(400)

    const { id } = params
    const body = await validateRequestBody<UpdateTransactionDto>(request)

    const transactionIndex = transactions.findIndex(t => t.id === id)

    if (transactionIndex === -1) {
      return HttpResponse.json(
        {
          message: 'Transaction not found',
          statusCode: 404,
          error: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    const existingTransaction = transactions[transactionIndex]!

    // If body is null, return existing transaction
    if (!body) {
      return HttpResponse.json(existingTransaction)
    }

    // If category is being updated, verify it exists
    if (body.categoryId) {
      const category = categories.find(c => c.id === body.categoryId)
      if (!category) {
        return HttpResponse.json(
          {
            message: 'Category not found',
            statusCode: 404,
            error: 'NOT_FOUND',
          },
          { status: 404 }
        )
      }
    }

    // Update transaction
    const updatedTransaction = {
      ...existingTransaction,
      ...body,
      id: existingTransaction.id,
      userId: existingTransaction.userId,
      createdAt: existingTransaction.createdAt,
      updatedAt: new Date().toISOString(),
      // Ensure category is included if it was provided
      category: body.categoryId
        ? categories.find(c => c.id === body.categoryId)!
        : existingTransaction.category,
      categoryId: body.categoryId ?? existingTransaction.categoryId,
      amount: body.amount ?? existingTransaction.amount,
      type: body.type ?? existingTransaction.type,
      description: body.description ?? existingTransaction.description,
      date: body.date ?? existingTransaction.date,
      currency: body.currency ?? existingTransaction.currency,
      notes: body.notes ?? existingTransaction.notes,
    }

    transactions[transactionIndex] = updatedTransaction as any

    return HttpResponse.json(updatedTransaction)
  }),

  /**
   * DELETE /transactions/:id
   * Deletes a transaction
   */
  http.delete(`${API_URL}/transactions/:id`, async ({ params }) => {
    await delay(300)

    const { id } = params
    const transactionIndex = transactions.findIndex(t => t.id === id)

    if (transactionIndex === -1) {
      return HttpResponse.json(
        {
          message: 'Transaction not found',
          statusCode: 404,
          error: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Remove transaction
    transactions.splice(transactionIndex, 1)

    return HttpResponse.json({ message: 'Transaction deleted successfully' })
  }),

  // ==================== SPENDING SUMMARY ENDPOINTS ====================

  /**
   * GET /transactions/summary
   * Retrieves spending summary with analytics
   */
  http.get(`${API_URL}/transactions/summary`, async ({ request }) => {
    await delay(500) // Longer delay for analytics calculation

    const url = new URL(request.url)
    const params = parseQueryParams(url)

    // Parse query parameters
    const query: SpendingQueryDto = {
      period: (params.period as TimePeriod) || TimePeriod.MONTH,
      startDate: params.startDate,
      endDate: params.endDate,
    }

    const filteredTransactions = filterTransactions(query)

    // Calculate summary
    const totalExpense = filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0)

    const totalIncome = filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0)

    const expenseTransactions = filteredTransactions.filter(
      t => t.type === TransactionType.EXPENSE
    )
    const averageExpense =
      expenseTransactions.length > 0
        ? totalExpense / expenseTransactions.length
        : 0

    // Calculate category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>()
    expenseTransactions.forEach(transaction => {
      const existing = categoryMap.get(transaction.categoryId)
      if (existing) {
        existing.total += transaction.amount
        existing.count += 1
      } else {
        categoryMap.set(transaction.categoryId, {
          total: transaction.amount,
          count: 1,
        })
      }
    })

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([categoryId, data]) => {
        const category = categories.find(c => c.id === categoryId) || {
          id: categoryId,
          name: 'Unknown',
          color: '#94A3B8',
          icon: 'help-circle',
        }
        return {
          categoryId,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon,
          total: data.total,
          count: data.count,
          percentage: 0, // Will be calculated below
        }
      })
      .sort((a, b) => b.total - a.total)

    // Calculate percentages
    const totalBreakdown = categoryBreakdown.reduce(
      (sum, item) => sum + item.total,
      0
    )
    categoryBreakdown.forEach(item => {
      item.percentage =
        totalBreakdown > 0 ? (item.total / totalBreakdown) * 100 : 0
    })

    // Generate daily trend
    const dailyTrend = []
    let days = 30

    switch (query.period) {
      case TimePeriod.DAY:
        days = 1
        break
      case TimePeriod.WEEK:
        days = 7
        break
      case TimePeriod.MONTH:
        days = 30
        break
      case TimePeriod.YEAR:
        days = 365
        break
      case TimePeriod.CUSTOM:
        if (query.startDate && query.endDate) {
          const start = new Date(query.startDate)
          const end = new Date(query.endDate)
          days = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          )
        }
        break
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayTransactions = filteredTransactions.filter(
        t => t.date === dateStr
      )

      const expense = dayTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0)

      const income = dayTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0)

      dailyTrend.push({
        date: dateStr,
        expense,
        income,
        net: income - expense,
      })
    }

    const summary = {
      period: query.period,
      startDate: dailyTrend[0]?.date,
      endDate: dailyTrend[dailyTrend.length - 1]?.date,
      totalExpense,
      totalIncome,
      netBalance: totalIncome - totalExpense,
      transactionCount: filteredTransactions.length,
      averageExpense,
      categoryBreakdown,
      dailyTrend,
    }

    return HttpResponse.json(summary)
  }),

  // ==================== CATEGORY ENDPOINTS ====================

  /**
   * GET /transactions/categories
   * Retrieves all categories
   */
  http.get(`${API_URL}/transactions/categories`, async () => {
    await delay(300)

    return HttpResponse.json(categories)
  }),

  /**
   * GET /transactions/categories/:id
   * Retrieves a specific category by ID
   */
  http.get(`${API_URL}/transactions/categories/:id`, async ({ params }) => {
    await delay(200)

    const { id } = params
    const category = categories.find(c => c.id === id)

    if (!category) {
      return HttpResponse.json(
        { message: 'Category not found', statusCode: 404, error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return HttpResponse.json(category)
  }),

  /**
   * POST /transactions/categories
   * Creates a new category
   */
  http.post(`${API_URL}/transactions/categories`, async ({ request }) => {
    await delay(400)

    const body = await validateRequestBody<CreateCategoryDto>(request)

    if (!body) {
      return HttpResponse.json(
        {
          message: 'Invalid request body',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Validation
    if (!body.name || !body.color || !body.icon) {
      return HttpResponse.json(
        {
          message: 'Missing required fields: name, color, icon',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Check for duplicate name
    if (
      categories.some(c => c.name.toLowerCase() === body.name.toLowerCase())
    ) {
      return HttpResponse.json(
        {
          message: 'A category with this name already exists',
          statusCode: 409,
          error: 'CONFLICT',
        },
        { status: 409 }
      )
    }

    // Create new category
    const newCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: 'mock-user-id',
      name: body.name,
      color: body.color,
      icon: body.icon,
      description: body.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    categories.push(newCategory)

    return HttpResponse.json(newCategory, { status: 201 })
  }),

  /**
   * PUT /transactions/categories/:id
   * Updates an existing category
   */
  http.put(
    `${API_URL}/transactions/categories/:id`,
    async ({ params, request }) => {
      await delay(400)

      const { id } = params
      const body =
        await validateRequestBody<Partial<CreateCategoryDto>>(request)

      const categoryIndex = categories.findIndex(c => c.id === id)

      if (categoryIndex === -1) {
        return HttpResponse.json(
          {
            message: 'Category not found',
            statusCode: 404,
            error: 'NOT_FOUND',
          },
          { status: 404 }
        )
      }

      const existingCategory = categories[categoryIndex]!

      // If body is null, return existing category
      if (!body) {
        return HttpResponse.json(existingCategory)
      }

      // Check for duplicate name if name is being changed
      if (
        body.name &&
        body.name.toLowerCase() !== existingCategory.name.toLowerCase()
      ) {
        if (
          categories.some(
            c =>
              c.name.toLowerCase() === body.name!.toLowerCase() && c.id !== id
          )
        ) {
          return HttpResponse.json(
            {
              message: 'A category with this name already exists',
              statusCode: 409,
              error: 'CONFLICT',
            },
            { status: 409 }
          )
        }
      }

      // Update category
      const updatedCategory = {
        ...existingCategory,
        ...body,
        id: existingCategory.id,
        userId: existingCategory.userId,
        createdAt: existingCategory.createdAt,
        updatedAt: new Date().toISOString(),
        name: body.name ?? existingCategory.name,
        color: body.color ?? existingCategory.color,
        icon: body.icon ?? existingCategory.icon,
        description: body.description ?? existingCategory.description,
      }

      categories[categoryIndex] = updatedCategory as any

      return HttpResponse.json(updatedCategory)
    }
  ),

  /**
   * DELETE /transactions/categories/:id
   * Deletes a category
   */
  http.delete(`${API_URL}/transactions/categories/:id`, async ({ params }) => {
    await delay(300)

    const { id } = params
    const categoryIndex = categories.findIndex(c => c.id === id)

    if (categoryIndex === -1) {
      return HttpResponse.json(
        { message: 'Category not found', statusCode: 404, error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if category is being used by transactions
    const transactionsWithCategory = transactions.filter(
      t => t.categoryId === id
    )
    if (transactionsWithCategory.length > 0) {
      return HttpResponse.json(
        {
          message: 'Cannot delete category that is being used by transactions',
          statusCode: 409,
          error: 'CONFLICT',
        },
        { status: 409 }
      )
    }

    // Remove category
    categories.splice(categoryIndex, 1)

    return HttpResponse.json({ message: 'Category deleted successfully' })
  }),
]
