import { describe, it, expect } from 'vitest'
import type { Transaction, Budget } from './index'
import type { User } from '../interfaces/user.interface'

describe('Types', () => {
  describe('User type', () => {
    it('should allow creating a user object', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'John Doe',
        emailVerified: false,
        twoFactorEnabled: false,
        roles: [],
        timezone: 'UTC',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(user.email).toBe('test@example.com')
    })
  })

  describe('Transaction type', () => {
    it('should allow creating a transaction object', () => {
      const transaction: Transaction = {
        id: '1',
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        merchant: 'Store',
        date: new Date(),
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(transaction.type).toBe('expense')
    })
  })

  describe('Budget type', () => {
    it('should allow creating a budget object', () => {
      const budget: Budget = {
        id: '1',
        userId: 'user-1',
        category: 'Food & Dining',
        amount: 500,
        spent: 150,
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(budget.period).toBe('monthly')
    })
  })
})
