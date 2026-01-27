import { describe, it, expect } from 'vitest'
import { LoggerUtil, ValidationUtil } from './index'

describe('LoggerUtil', () => {
  describe('sanitizeForLogging', () => {
    it('should redact sensitive fields', () => {
      const data = {
        name: 'John',
        password: 'secret123',
        email: 'john@example.com',
      }
      const sanitized = LoggerUtil.sanitizeForLogging(data) as Record<
        string,
        unknown
      >
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.name).toBe('John')
    })

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          token: 'secret-token',
        },
      }
      const sanitized = LoggerUtil.sanitizeForLogging(data) as Record<
        string,
        unknown
      >
      expect((sanitized.user as Record<string, unknown>).token).toBe(
        '[REDACTED]'
      )
    })
  })

  describe('maskEmail', () => {
    it('should mask email address', () => {
      const email = 'john@example.com'
      const masked = LoggerUtil.maskEmail(email)
      expect(masked).toContain('***')
      expect(masked).toContain('@example.com')
    })
  })
})

describe('ValidationUtil', () => {
  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(ValidationUtil.isValidEmail('test@example.com')).toBe(true)
    })

    it('should reject invalid email', () => {
      expect(ValidationUtil.isValidEmail('invalid-email')).toBe(false)
    })
  })

  describe('isValidPassword', () => {
    it('should validate strong password', () => {
      expect(ValidationUtil.isValidPassword('SecurePass123!@#')).toBe(true)
    })

    it('should reject weak password', () => {
      expect(ValidationUtil.isValidPassword('weak')).toBe(false)
    })
  })

  describe('isValidUUID', () => {
    it('should validate correct UUID', () => {
      expect(
        ValidationUtil.isValidUUID('550e8400-e29b-41d4-a716-446655440000')
      ).toBe(true)
    })

    it('should reject invalid UUID', () => {
      expect(ValidationUtil.isValidUUID('not-a-uuid')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate phone number', () => {
      expect(ValidationUtil.isValidPhone('+1234567890')).toBe(true)
    })

    it('should reject invalid phone', () => {
      expect(ValidationUtil.isValidPhone('123')).toBe(false)
    })
  })
})
