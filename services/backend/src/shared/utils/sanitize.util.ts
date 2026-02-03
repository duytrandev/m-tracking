/**
 * XSS Sanitization Utilities
 * Provides comprehensive protection against XSS attacks in user-controlled input
 */

/**
 * HTML entity mapping for XSS prevention
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '/': '&#x2F;',
}

/**
 * Sanitize a value for safe storage
 * - Converts to string and truncates to max length
 * - Escapes HTML entities (prevents XSS)
 * - Removes javascript: protocol
 * - Removes event handler patterns
 *
 * @param value - Value to sanitize (any type)
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string or undefined if invalid
 */
export function sanitizeForStorage(
  value: unknown,
  maxLength: number
): string | undefined {
  if (value === null || value === undefined) return undefined
  if (Array.isArray(value)) value = value[0]
  if (typeof value === 'object') return undefined

  // At this point, value is a primitive (string, number, boolean, bigint, symbol)
  const primitive = value as string | number | boolean | bigint | symbol
  const str = String(primitive)
    .slice(0, maxLength)
    .replace(/[&<>"'`/]/g, char => HTML_ENTITIES[char] || char)
    // Remove potential JS protocol (case insensitive)
    .replace(/javascript:/gi, '')
    // Remove event handlers (onclick=, onerror=, etc.)
    .replace(/on\w+\s*=/gi, '')

  return str || undefined
}

/**
 * Device info limits
 */
const MAX_USER_AGENT = 512
const MAX_PLATFORM = 64

/**
 * Sanitize device info object for safe storage
 * Used for session device tracking
 *
 * @param deviceInfo - Raw device info (string or object)
 * @returns Sanitized device info with userAgent and platform
 */
export function sanitizeDeviceInfo(
  deviceInfo: string | Record<string, unknown>
): { userAgent?: string; platform?: string } {
  const obj =
    typeof deviceInfo === 'string' ? { userAgent: deviceInfo } : deviceInfo

  return {
    userAgent: sanitizeForStorage(obj.userAgent, MAX_USER_AGENT),
    platform: sanitizeForStorage(obj.platform, MAX_PLATFORM),
  }
}
