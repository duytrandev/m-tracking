/**
 * Shared Utility Functions
 */

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format date
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: format === 'short' ? 'short' : 'long',
  }).format(d)
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class LoggerUtil {
  static sanitizeForLogging(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
    ]

    const sanitized = { ...(data as Record<string, unknown>) }

    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = LoggerUtil.sanitizeForLogging(sanitized[key])
      }
    }

    return sanitized
  }

  static maskEmail(email: string): string {
    const parts = email.split('@')
    if (parts.length !== 2) return email

    const [localPart = '', domain = ''] = parts

    const maskedLocal =
      localPart.length > 2
        ? `${localPart[0]}***${localPart[localPart.length - 1]}`
        : '***'
    return `${maskedLocal}@${domain}`
  }
}

import { REGEX_PATTERNS } from '../constants/index'

export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    return REGEX_PATTERNS.EMAIL.test(email)
  }

  static isValidPassword(password: string): boolean {
    return REGEX_PATTERNS.PASSWORD.test(password)
  }

  static isValidUUID(uuid: string): boolean {
    return REGEX_PATTERNS.UUID.test(uuid)
  }

  static isValidPhone(phone: string): boolean {
    return REGEX_PATTERNS.PHONE.test(phone)
  }
}
