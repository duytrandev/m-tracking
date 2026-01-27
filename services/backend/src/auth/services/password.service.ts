import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

@Injectable()
export class PasswordService {
  private readonly SALT_ROUNDS = 10

  /**
   * Hash password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  /**
   * Compare plain text password with hash
   * @param password Plain text password
   * @param hash Hashed password from database
   * @returns True if passwords match
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Generate random token (64 character hex string)
   * @returns Random token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Hash token using SHA-256
   * @param token Plain text token
   * @returns Hashed token
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
