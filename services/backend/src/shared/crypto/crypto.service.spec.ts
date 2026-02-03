import { describe, it, expect, beforeEach } from 'vitest'
import { CryptoService } from './crypto.service'
import * as bcrypt from 'bcrypt'

describe('CryptoService', () => {
  let service: CryptoService

  beforeEach(() => {
    service = new CryptoService()
  })

  describe('hashPassword', () => {
    it('should hash password with Argon2id', async () => {
      const password = 'testPassword123!'
      const hash = await service.hashPassword(password)

      expect(hash).toMatch(/^\$argon2id\$/)
      expect(hash).not.toBe(password)
    })

    it('should produce different hashes for same password', async () => {
      const password = 'testPassword123!'
      const hash1 = await service.hashPassword(password)
      const hash2 = await service.hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty password', async () => {
      const hash = await service.hashPassword('')

      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$argon2id\$/)
    })

    it('should handle very long password', async () => {
      const longPassword = 'x'.repeat(200)
      const hash = await service.hashPassword(longPassword)

      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$argon2id\$/)
    })

    it('should handle special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?'
      const hash = await service.hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$argon2id\$/)
    })

    it('should handle unicode characters', async () => {
      const password = 'Пароль密码🔐'
      const hash = await service.hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$argon2id\$/)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct Argon2 password', async () => {
      const password = 'testPassword123!'
      const hash = await service.hashPassword(password)

      const isValid = await service.verifyPassword(hash, password)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const hash = await service.hashPassword('correctPassword')

      const isValid = await service.verifyPassword(hash, 'wrongPassword')
      expect(isValid).toBe(false)
    })

    it('should verify legacy bcrypt hash', async () => {
      const password = 'legacyPassword'
      // Generate actual bcrypt hash
      const bcryptHash = await bcrypt.hash(password, 10)

      const isValid = await service.verifyPassword(bcryptHash, password)
      expect(isValid).toBe(true)
    })

    it('should reject wrong password against bcrypt hash', async () => {
      const bcryptHash = await bcrypt.hash('correctPassword', 10)

      const isValid = await service.verifyPassword(bcryptHash, 'wrongPassword')
      expect(isValid).toBe(false)
    })

    it('should be case sensitive', async () => {
      const password = 'TestPassword'
      const hash = await service.hashPassword(password)

      const isValid = await service.verifyPassword(hash, 'testpassword')
      expect(isValid).toBe(false)
    })
  })

  describe('hashToken', () => {
    it('should produce consistent SHA-256 hash', () => {
      const token = 'test-token-123'
      const hash1 = service.hashToken(token)
      const hash2 = service.hashToken(token)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 hex
    })

    it('should produce different hashes for different tokens', () => {
      const hash1 = service.hashToken('token-1')
      const hash2 = service.hashToken('token-2')

      expect(hash1).not.toBe(hash2)
    })

    it('should produce valid hex string', () => {
      const hash = service.hashToken('any-token')

      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should handle empty string', () => {
      const hash = service.hashToken('')

      expect(hash).toBeDefined()
      expect(hash).toHaveLength(64)
    })

    it('should produce known SHA-256 hash for known input', () => {
      // SHA-256('abc') = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
      const hash = service.hashToken('abc')
      expect(hash).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      )
    })
  })

  describe('generateSecureToken', () => {
    it('should generate 64-char hex by default', () => {
      const token = service.generateSecureToken()
      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[0-9a-f]+$/)
    })

    it('should generate custom length token', () => {
      const token = service.generateSecureToken(16)
      expect(token).toHaveLength(32) // 16 bytes = 32 hex chars
    })

    it('should generate unique tokens', () => {
      const tokens = new Set()
      for (let i = 0; i < 100; i++) {
        tokens.add(service.generateSecureToken())
      }
      expect(tokens.size).toBe(100)
    })

    it('should generate cryptographically random tokens', () => {
      const token1 = service.generateSecureToken()
      const token2 = service.generateSecureToken()

      expect(token1).not.toBe(token2)
    })
  })

  describe('isArgon2Hash', () => {
    it('should identify Argon2id hash', () => {
      const argonHash = '$argon2id$v=19$m=65536,t=3,p=4$somedata'
      expect(service.isArgon2Hash(argonHash)).toBe(true)
    })

    it('should identify Argon2i hash', () => {
      const argonHash = '$argon2i$v=19$m=65536,t=3,p=4$somedata'
      expect(service.isArgon2Hash(argonHash)).toBe(true)
    })

    it('should identify Argon2d hash', () => {
      const argonHash = '$argon2d$v=19$m=65536,t=3,p=4$somedata'
      expect(service.isArgon2Hash(argonHash)).toBe(true)
    })

    it('should reject bcrypt hash', () => {
      const bcryptHash = '$2b$10$somedata'
      expect(service.isArgon2Hash(bcryptHash)).toBe(false)
    })

    it('should reject plain text', () => {
      expect(service.isArgon2Hash('plaintext')).toBe(false)
    })
  })

  describe('isBcryptHash', () => {
    it('should identify $2a$ bcrypt hash', () => {
      const bcryptHash = '$2a$10$somedata'
      expect(service.isBcryptHash(bcryptHash)).toBe(true)
    })

    it('should identify $2b$ bcrypt hash', () => {
      const bcryptHash = '$2b$10$somedata'
      expect(service.isBcryptHash(bcryptHash)).toBe(true)
    })

    it('should reject argon2 hash', () => {
      const argonHash = '$argon2id$v=19$m=65536,t=3,p=4$somedata'
      expect(service.isBcryptHash(argonHash)).toBe(false)
    })

    it('should reject plain text', () => {
      expect(service.isBcryptHash('plaintext')).toBe(false)
    })
  })

  describe('needsMigration', () => {
    it('should return true for bcrypt hash', () => {
      const bcryptHash = '$2b$10$somedata'
      expect(service.needsMigration(bcryptHash)).toBe(true)
    })

    it('should return false for argon2 hash', () => {
      const argonHash = '$argon2id$v=19$m=65536,t=3,p=4$somedata'
      expect(service.needsMigration(argonHash)).toBe(false)
    })

    it('should return false for plain text', () => {
      expect(service.needsMigration('plaintext')).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('should support complete password migration flow', async () => {
      // Simulate legacy bcrypt password
      const password = 'userPassword123'
      const legacyHash = await bcrypt.hash(password, 10)

      // Verify legacy hash works
      expect(service.needsMigration(legacyHash)).toBe(true)
      const isValidLegacy = await service.verifyPassword(legacyHash, password)
      expect(isValidLegacy).toBe(true)

      // Migrate to Argon2
      const newHash = await service.hashPassword(password)
      expect(service.needsMigration(newHash)).toBe(false)
      expect(service.isArgon2Hash(newHash)).toBe(true)

      // Verify new hash works
      const isValidNew = await service.verifyPassword(newHash, password)
      expect(isValidNew).toBe(true)
    })

    it('should support token verification flow', () => {
      const token = service.generateSecureToken()
      const storedHash = service.hashToken(token)

      // Simulate verification
      const receivedToken = token
      const receivedHash = service.hashToken(receivedToken)

      expect(receivedHash).toBe(storedHash)
    })
  })
})
