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
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

// Currencies
export const SUPPORTED_CURRENCIES = ['USD', 'VND', 'EUR', 'GBP'] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

// Transaction types
export const TRANSACTION_TYPES = ['income', 'expense'] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// Budget periods
export const BUDGET_PERIODS = ['weekly', 'monthly', 'yearly'] as const;

export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

// Bank providers
export const BANK_PROVIDERS = ['plaid', 'tink', 'momo'] as const;

export type BankProvider = (typeof BANK_PROVIDERS)[number];

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
} as const;
