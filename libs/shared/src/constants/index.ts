/**
 * Shared Constants
 */

// Transaction categories
export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Income',
  'Other',
] as const

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]

// Currencies
export const SUPPORTED_CURRENCIES = ['USD', 'VND', 'EUR', 'GBP'] as const

export type Currency = (typeof SUPPORTED_CURRENCIES)[number]

// Transaction types
export const TRANSACTION_TYPES = ['income', 'expense'] as const

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

// Budget periods
export const BUDGET_PERIODS = ['weekly', 'monthly', 'yearly'] as const

export type BudgetPeriod = (typeof BUDGET_PERIODS)[number]

// Bank providers
export const BANK_PROVIDERS = ['plaid', 'tink', 'momo'] as const

export type BankProvider = (typeof BANK_PROVIDERS)[number]

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    UPDATE: '/transactions/:id',
    DELETE: '/transactions/:id',
  },
  BUDGETS: {
    LIST: '/budgets',
    CREATE: '/budgets',
    UPDATE: '/budgets/:id',
    DELETE: '/budgets/:id',
  },
  BANKING: {
    LIST: '/banking/accounts',
    CONNECT: '/banking/connect',
    SYNC: '/banking/sync',
  },
} as const

// Error codes
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

// Regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  PHONE: /^\+?[1-9]\d{9,14}$/,
} as const
