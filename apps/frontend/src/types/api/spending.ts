export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

export enum TimePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export interface Transaction {
  id: string
  userId: string
  categoryId: string
  amount: number
  type: TransactionType
  description: string
  date: string
  currency: string
  notes?: string
  createdAt: string
  updatedAt: string
  category: Category
}

export interface Category {
  id: string
  userId: string
  name: string
  color: string
  icon: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionDto {
  categoryId: string
  amount: number
  type: TransactionType
  description: string
  date: string
  currency: string
  notes?: string
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>

export interface CreateCategoryDto {
  name: string
  color: string
  icon: string
  description?: string
}

export interface SpendingQueryDto {
  period: TimePeriod
  startDate?: string
  endDate?: string
}

export interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  total: number
  count: number
  percentage: number
}

export interface DailyTrend {
  date: string
  expense: number
  income: number
  net: number
}

export interface SpendingSummary {
  period: TimePeriod
  startDate: string
  endDate: string
  totalExpense: number
  totalIncome: number
  netBalance: number
  transactionCount: number
  averageExpense: number
  categoryBreakdown: CategoryBreakdown[]
  dailyTrend: DailyTrend[]
}
