import { describe, it, expect } from 'vitest'
import {
  REGEX_PATTERNS,
  TRANSACTION_CATEGORIES,
  SUPPORTED_CURRENCIES,
} from './index'

describe('Constants', () => {
  describe('REGEX_PATTERNS', () => {
    it('should validate email pattern', () => {
      expect(REGEX_PATTERNS.EMAIL.test('valid@email.com')).toBe(true)
      expect(REGEX_PATTERNS.EMAIL.test('invalid-email')).toBe(false)
    })

    it('should validate UUID pattern', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000'
      expect(REGEX_PATTERNS.UUID.test(validUUID)).toBe(true)
      expect(REGEX_PATTERNS.UUID.test('not-a-uuid')).toBe(false)
    })

    it('should validate phone pattern', () => {
      expect(REGEX_PATTERNS.PHONE.test('+1234567890')).toBe(true)
      expect(REGEX_PATTERNS.PHONE.test('+12')).toBe(false)
    })
  })

  describe('TRANSACTION_CATEGORIES', () => {
    it('should have required categories', () => {
      expect(TRANSACTION_CATEGORIES).toContain('Food & Dining')
      expect(TRANSACTION_CATEGORIES).toContain('Shopping')
      expect(TRANSACTION_CATEGORIES.length).toBeGreaterThan(0)
    })
  })

  describe('SUPPORTED_CURRENCIES', () => {
    it('should have required currencies', () => {
      expect(SUPPORTED_CURRENCIES).toContain('USD')
      expect(SUPPORTED_CURRENCIES).toContain('VND')
    })
  })
})
