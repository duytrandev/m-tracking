export class LoggerUtil {
  static sanitizeForLogging(data: any): any {
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

    const sanitized = { ...data }

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

    const localPart = parts[0]!
    const domain = parts[1]!

    const maskedLocal =
      localPart.length > 2
        ? `${localPart[0]}***${localPart[localPart.length - 1]}`
        : '***'
    return `${maskedLocal}@${domain}`
  }
}
