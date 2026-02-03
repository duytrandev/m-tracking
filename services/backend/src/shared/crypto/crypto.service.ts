import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

/**
 * Centralized cryptographic operations service
 *
 * Provides:
 * - Password hashing with Argon2id (2025 recommended standard)
 * - Backward compatibility with bcrypt (auto-migration on login)
 * - Token hashing with SHA-256
 * - Secure random token generation
 */
@Injectable()
export class CryptoService {
  /**
   * Argon2id parameters (OWASP 2025 recommendations)
   * - memoryCost: 64 MB (65536 KiB)
   * - timeCost: 3 iterations
   * - parallelism: 4 threads
   */
  private readonly ARGON2_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  }

  /**
   * Hash password using Argon2id
   * @param password Plain text password
   * @returns Argon2id hash string
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, this.ARGON2_OPTIONS)
  }

  /**
   * Verify password against hash
   * Supports both Argon2 and legacy bcrypt hashes for migration
   * @param hash Stored password hash (Argon2 or bcrypt)
   * @param password Plain text password to verify
   * @returns True if password matches
   */
  async verifyPassword(hash: string, password: string): Promise<boolean> {
    if (this.isArgon2Hash(hash)) {
      return argon2.verify(hash, password)
    }
    // Fallback to bcrypt for legacy hashes
    return bcrypt.compare(password, hash)
  }

  /**
   * Hash token using SHA-256
   * Used for refresh tokens, verification tokens, reset tokens
   * @param token Plain text token
   * @returns SHA-256 hex digest (64 characters)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Generate cryptographically secure random token
   * @param bytes Number of random bytes (default: 32 = 64 hex chars)
   * @returns Hex-encoded random string
   */
  generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex')
  }

  /**
   * Check if hash is Argon2 format
   * Used to detect if password needs migration from bcrypt
   * @param hash Password hash to check
   * @returns True if hash is Argon2 format
   */
  isArgon2Hash(hash: string): boolean {
    return hash.startsWith('$argon2')
  }

  /**
   * Check if hash is bcrypt format (legacy)
   * @param hash Password hash to check
   * @returns True if hash is bcrypt format
   */
  isBcryptHash(hash: string): boolean {
    return hash.startsWith('$2a$') || hash.startsWith('$2b$')
  }

  /**
   * Check if password hash needs migration to Argon2id
   * Returns true for bcrypt hashes that should be upgraded
   * @param hash Current password hash
   * @returns True if migration recommended
   */
  needsMigration(hash: string): boolean {
    return this.isBcryptHash(hash)
  }
}
