import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  describe('hash', () => {
    it('should hash password using bcrypt', async () => {
      const password = 'SecurePassword123';

      const hashed = await service.hash(password);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(0);
      expect(hashed).not.toBe(password);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SecurePassword123';

      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should use bcrypt with salt rounds', async () => {
      const password = 'TestPassword123';

      const hashed = await service.hash(password);

      expect(hashed).toMatch(/^\$2[aby]\$/);
    });

    it('should handle empty password', async () => {
      const hashed = await service.hash('');

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
    });

    it('should handle very long password', async () => {
      const longPassword = 'x'.repeat(200);

      const hashed = await service.hash(longPassword);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
    });

    it('should handle special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';

      const hashed = await service.hash(password);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
    });

    it('should be deterministic with compare method', async () => {
      const password = 'TestPassword123';

      const hash = await service.hash(password);
      const isMatch = await service.compare(password, hash);

      expect(isMatch).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const password = 'SecurePassword123';
      const hash = await service.hash(password);

      const result = await service.compare(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'SecurePassword123';
      const hash = await service.hash(password);

      const result = await service.compare('WrongPassword123', hash);

      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'SecurePassword123';
      const hash = await service.hash(password);

      const result = await service.compare('securepassword123', hash);

      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const hash = await service.hash('');

      const result = await service.compare('', hash);

      expect(result).toBe(true);
    });

    it('should handle comparison gracefully with invalid hash', async () => {
      const password = 'TestPassword';
      const invalidHash = '$2b$10$invalid-format';

      const result = await service.compare(password, invalidHash);

      expect(typeof result).toBe('boolean');
    });

    it('should handle comparison with whitespace differences', async () => {
      const password = 'TestPassword123';
      const hash = await service.hash(password);

      const result1 = await service.compare('TestPassword123 ', hash);
      const result2 = await service.compare(' TestPassword123', hash);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should handle multiple failed attempts', async () => {
      const correctPassword = 'CorrectPassword123';
      const hash = await service.hash(correctPassword);

      const result1 = await service.compare('WrongPassword1', hash);
      const result2 = await service.compare('WrongPassword2', hash);
      const result3 = await service.compare(correctPassword, hash);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('should generate a random token', () => {
      const token = service.generateToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate 64 character hex string', () => {
      const token = service.generateToken();

      expect(token.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should generate different tokens each time', () => {
      const token1 = service.generateToken();
      const token2 = service.generateToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate cryptographically random tokens', () => {
      const tokens = new Set();

      for (let i = 0; i < 100; i++) {
        tokens.add(service.generateToken());
      }

      expect(tokens.size).toBe(100);
    });

    it('should generate valid hex characters only', () => {
      for (let i = 0; i < 10; i++) {
        const token = service.generateToken();
        expect(/^[a-f0-9]+$/.test(token)).toBe(true);
      }
    });

    it('should always generate 32 bytes as hex', () => {
      const token = service.generateToken();

      expect(token.length).toBe(64);
    });
  });

  describe('hashToken', () => {
    it('should hash token using SHA-256', () => {
      const token = 'some-verification-token';

      const hash = service.hashToken(token);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64);
    });

    it('should generate 64 character hex hash', () => {
      const token = 'test-token-123';

      const hash = service.hashToken(token);

      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('should be deterministic', () => {
      const token = 'constant-token';

      const hash1 = service.hashToken(token);
      const hash2 = service.hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = service.hashToken('token-1');
      const hash2 = service.hashToken('token-2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = service.hashToken('');

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('should handle special characters', () => {
      const token = 'token-with-!@#$%^&*()-=_+[]{}|;:,.<>?';

      const hash = service.hashToken(token);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('should be consistent with generated tokens', () => {
      const token = service.generateToken();
      const hash = service.hashToken(token);

      const rehash = service.hashToken(token);

      expect(hash).toBe(rehash);
    });

    it('should be case sensitive', () => {
      const token = 'TestToken';

      const hash1 = service.hashToken(token);
      const hash2 = service.hashToken('testtoken');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce valid SHA256 hashes', () => {
      const testCases = [
        { token: 'abc', expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' },
      ];

      testCases.forEach(({ token, expected }) => {
        const hash = service.hashToken(token);
        expect(hash).toBe(expected);
      });
    });

    it('should handle very long tokens', () => {
      const longToken = 'x'.repeat(10000);

      const hash = service.hashToken(longToken);

      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('should handle tokens with unicode characters', () => {
      const token = 'token-with-unicode-🔐-✓';

      const hash = service.hashToken(token);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete password reset flow', async () => {
      const userPassword = 'OriginalPassword123';
      const resetToken = service.generateToken();
      const tokenHash = service.hashToken(resetToken);

      const passwordHash = await service.hash(userPassword);

      const newPassword = 'NewPassword456';
      const newPasswordHash = await service.hash(newPassword);

      const oldPasswordValid = await service.compare(userPassword, passwordHash);
      const newPasswordValid = await service.compare(newPassword, newPasswordHash);

      expect(oldPasswordValid).toBe(true);
      expect(newPasswordValid).toBe(true);
      expect(tokenHash).toBeDefined();
      expect(tokenHash.length).toBe(64);
    });

    it('should support email verification flow', async () => {
      const verificationToken = service.generateToken();
      const tokenHash = service.hashToken(verificationToken);

      expect(verificationToken.length).toBe(64);
      expect(tokenHash.length).toBe(64);
      expect(verificationToken).not.toBe(tokenHash);
    });

    it('should handle multiple token generations without collision', () => {
      const tokens = new Set();
      const hashes = new Set();

      for (let i = 0; i < 1000; i++) {
        const token = service.generateToken();
        const hash = service.hashToken(token);

        tokens.add(token);
        hashes.add(hash);
      }

      expect(tokens.size).toBe(1000);
      expect(hashes.size).toBe(1000);
    });
  });
});
