/**
 * Shared TypeScript Types
 * Type definitions shared across backend and frontend
 */

// Note: User types are now in interfaces/user.interface.ts
// Import from '@m-tracking/shared' directly

// Transaction types
export interface Transaction {
  id: string
  userId: string
  amount: number
  currency: string
  merchant: string
  category?: string
  date: Date
  description?: string
  type: 'income' | 'expense'
  createdAt: Date
  updatedAt: Date
}

// Budget types
export interface Budget {
  id: string
  userId: string
  category: string
  amount: number
  spent: number
  period: 'monthly' | 'weekly' | 'yearly'
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

// Bank Account types
export interface BankAccount {
  id: string
  userId: string
  provider: 'plaid' | 'tink' | 'momo'
  accountName: string
  accountNumber: string
  balance: number
  currency: string
  isActive: boolean
  lastSyncedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Note: API Response types are now in interfaces/api-response.interface.ts
// Import from '@m-tracking/shared' directly
