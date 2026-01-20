import * as crypto from 'crypto';

/**
 * Encryption utility for OAuth tokens using AES-256-GCM
 * Provides secure encryption/decryption of sensitive OAuth access/refresh tokens
 */
export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly KEY_LENGTH = 32; // 256 bits

  /**
   * Get encryption key from environment or generate default
   * In production, OAUTH_ENCRYPTION_KEY must be set
   */
  private static getEncryptionKey(): Buffer {
    const key = process.env.OAUTH_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('OAUTH_ENCRYPTION_KEY environment variable is required');
    }

    // Convert hex string to buffer
    if (key.length !== this.KEY_LENGTH * 2) {
      throw new Error(
        `OAUTH_ENCRYPTION_KEY must be ${this.KEY_LENGTH * 2} hex characters (${this.KEY_LENGTH} bytes)`,
      );
    }

    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt a string using AES-256-GCM
   * Returns: iv:authTag:encryptedData (all hex encoded)
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encrypted (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a string encrypted with encrypt()
   * Input format: iv:authTag:encryptedData (all hex encoded)
   */
  static decrypt(ciphertext: string): string {
    if (!ciphertext) {
      return '';
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format: missing components');
    }

    const key = this.getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate a random encryption key (for setup)
   * Returns hex string suitable for OAUTH_ENCRYPTION_KEY
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }
}
