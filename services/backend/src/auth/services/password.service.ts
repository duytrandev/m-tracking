import { Injectable } from '@nestjs/common'
import { CryptoService } from '../../shared/crypto/crypto.service'

/**
 * Password Service
 * Delegates all cryptographic operations to CryptoService
 * Maintained for backward compatibility with existing code
 */
@Injectable()
export class PasswordService {
  constructor(private cryptoService: CryptoService) {}

  /**
   * Hash password using Argon2id (via CryptoService)
   * @param password Plain text password
   * @returns Hashed password
   */
  async hash(password: string): Promise<string> {
    return this.cryptoService.hashPassword(password)
  }

  /**
   * Compare plain text password with hash
   * Supports both Argon2 and legacy bcrypt
   * @param password Plain text password
   * @param hash Hashed password from database
   * @returns True if passwords match
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return this.cryptoService.verifyPassword(hash, password)
  }

  /**
   * Generate random token (64 character hex string)
   * @returns Random token
   */
  generateToken(): string {
    return this.cryptoService.generateSecureToken()
  }

  /**
   * Hash token using SHA-256
   * @param token Plain text token
   * @returns Hashed token
   */
  hashToken(token: string): string {
    return this.cryptoService.hashToken(token)
  }
}
