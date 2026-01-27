import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  isValidEmail,
  generateId,
  sleep,
} from './index'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency with default USD', () => {
      const result = formatCurrency(1000)
      expect(result).toContain('1,000')
    })

    it('should format currency with custom currency code', () => {
      const result = formatCurrency(1000, 'EUR')
      expect(result).toContain('1,000')
    })
  })

  describe('formatDate', () => {
    it('should format date in short format', () => {
      const date = new Date('2026-01-23')
      const result = formatDate(date, 'short')
      expect(result).toBeDefined()
    })

    it('should format date in long format', () => {
      const date = new Date('2026-01-23')
      const result = formatDate(date, 'long')
      expect(result).toBeDefined()
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
    })

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(100)
    })
  })
})
