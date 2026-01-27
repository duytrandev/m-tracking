import * as crypto from 'crypto'

/**
 * Hash utilities for token fingerprinting and data integrity
 * Provides cryptographic hashing functions using Node.js crypto
 */

/**
 * Generate SHA-256 hash of a string
 * Returns hex-encoded hash
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

/**
 * Generate token fingerprint for blacklisting
 * Uses first 16 chars of SHA-256 hash (64 bits)
 * Sufficient for blacklist collision resistance
 */
export function tokenFingerprint(token: string): string {
  return sha256(token).substring(0, 16)
}

/**
 * Generate secure random hex string
 * @param bytes - Number of random bytes (default: 32)
 * @returns Hex-encoded random string
 */
export function randomHex(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Generate secure random base64url string
 * Base64url is URL-safe (no +, /, =)
 * @param bytes - Number of random bytes (default: 32)
 * @returns Base64url-encoded random string
 */
export function randomBase64Url(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

/**
 * Generate secure random alphanumeric string
 * @param length - Length of output string (default: 16)
 * @returns Random alphanumeric string
 */
export function randomAlphanumeric(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    const byte = bytes[i]
    if (byte !== undefined) {
      result += chars[byte % chars.length]
    }
  }
  return result
}

/**
 * Hash password-like data with SHA-256
 * Note: For actual passwords, use bcrypt instead
 * This is for non-password secrets that need deterministic hashing
 */
export function hashSecret(secret: string): string {
  return sha256(secret)
}
