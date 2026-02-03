import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { AuthErrorCode } from '@m-tracking/shared'
import { AuthException } from '../../common/exceptions/auth.exception'
import { RedisService } from '../../shared/redis/redis.service'
import { CryptoService } from '../../shared/crypto/crypto.service'
import { TokenService } from './token.service'
import * as tokenConfig from '../constants/token-expiry.constants'
import * as fs from 'fs'

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

describe('TokenService', () => {
  let service: TokenService
  let jwtService: JwtService
  let redisService: RedisService
  let cryptoService: CryptoService

  const mockPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2Z3qX2BTLS4e8TA...mockKey
-----END RSA PRIVATE KEY-----`

  const mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...mockKey
-----END PUBLIC KEY-----`

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    roles: [{ name: 'user' }],
  }

  beforeEach(async () => {
    // Reset TOKEN_CONFIG for each test
    vi.spyOn(tokenConfig, 'TOKEN_CONFIG', 'get').mockReturnValue({
      CLOCK_SKEW_SECONDS: 5,
      REDIS_STRICT_MODE: true,
    })

    // Mock fs.readFileSync to return mock keys
    vi.mocked(fs.readFileSync).mockImplementation((path: unknown) => {
      if (String(path).includes('private')) return mockPrivateKey
      return mockPublicKey
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: vi.fn().mockReturnValue('mock-token'),
            verify: vi.fn(),
            decode: vi.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            isTokenBlacklisted: vi.fn().mockResolvedValue(false),
            blacklistToken: vi.fn().mockResolvedValue(undefined),
            setTokenInvalidationTime: vi.fn().mockResolvedValue(undefined),
            getTokenInvalidationTime: vi.fn().mockResolvedValue(null),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_PRIVATE_KEY_PATH: 'jwt-private-key.pem',
                JWT_PUBLIC_KEY_PATH: 'jwt-public-key.pem',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
              }
              return config[key] || defaultValue
            }),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            hashToken: vi.fn().mockReturnValue('hashed-token'),
          },
        },
      ],
    }).compile()

    service = module.get<TokenService>(TokenService)
    jwtService = module.get<JwtService>(JwtService)
    redisService = module.get<RedisService>(RedisService)
    cryptoService = module.get<CryptoService>(CryptoService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateAccessToken', () => {
    it('should generate access token with RS256', () => {
      const sessionId = 'session-123'
      const result = service.generateAccessToken(mockUser as never, sessionId)

      expect(result).toBe('mock-token')
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          roles: ['user'],
          sessionId,
        },
        expect.objectContaining({
          algorithm: 'RS256',
          expiresIn: '15m',
        })
      )
    })

    it('should default roles to ["user"] if not provided', () => {
      const userWithoutRoles = { ...mockUser, roles: undefined }
      service.generateAccessToken(userWithoutRoles as never, 'session-123')

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['user'] }),
        expect.anything()
      )
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate refresh token with HS256', () => {
      const result = service.generateRefreshToken('user-123', 'session-123', 1)

      expect(result).toBe('mock-token')
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-123', sessionId: 'session-123', tokenVersion: 1 },
        expect.objectContaining({
          algorithm: 'HS256',
          expiresIn: '7d',
        })
      )
    })
  })

  describe('verifyAccessToken', () => {
    const validPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      roles: ['user'],
      sessionId: 'session-123',
      iat: Math.floor(Date.now() / 1000),
    }

    it('should verify valid access token', async () => {
      vi.spyOn(jwtService, 'verify').mockReturnValue(validPayload)
      vi.spyOn(redisService, 'isTokenBlacklisted').mockResolvedValue(false)

      const result = await service.verifyAccessToken('valid-token')

      expect(result).toEqual(validPayload)
      expect(cryptoService.hashToken).toHaveBeenCalledWith('valid-token')
      expect(redisService.isTokenBlacklisted).toHaveBeenCalledWith(
        'hashed-token'
      )
    })

    it('should throw TOKEN_REVOKED if token is blacklisted', async () => {
      vi.spyOn(jwtService, 'verify').mockReturnValue(validPayload)
      vi.spyOn(redisService, 'isTokenBlacklisted').mockResolvedValue(true)

      await expect(
        service.verifyAccessToken('blacklisted-token')
      ).rejects.toThrow(AuthException)

      try {
        await service.verifyAccessToken('blacklisted-token')
      } catch (error) {
        const authError = error as AuthException
        const response = authError.getResponse() as { code: string }
        expect(response.code).toBe(AuthErrorCode.TOKEN_REVOKED)
      }
    })

    it('should throw SERVICE_UNAVAILABLE if Redis fails in strict mode', async () => {
      vi.spyOn(jwtService, 'verify').mockReturnValue(validPayload)
      vi.spyOn(redisService, 'isTokenBlacklisted').mockRejectedValue(
        new Error('Redis connection failed')
      )

      await expect(service.verifyAccessToken('token')).rejects.toThrow(
        AuthException
      )

      try {
        await service.verifyAccessToken('token')
      } catch (error) {
        const authError = error as AuthException
        const response = authError.getResponse() as { code: string }
        expect(response.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE)
      }
    })

    it('should allow token if Redis fails in non-strict mode', async () => {
      // Override TOKEN_CONFIG to non-strict mode
      vi.spyOn(tokenConfig, 'TOKEN_CONFIG', 'get').mockReturnValue({
        CLOCK_SKEW_SECONDS: 5,
        REDIS_STRICT_MODE: false,
      })

      vi.spyOn(jwtService, 'verify').mockReturnValue(validPayload)
      vi.spyOn(redisService, 'isTokenBlacklisted').mockRejectedValue(
        new Error('Redis connection failed')
      )
      vi.spyOn(redisService, 'getTokenInvalidationTime').mockResolvedValue(null)

      const result = await service.verifyAccessToken('token')
      expect(result).toEqual(validPayload)
    })

    it('should throw TOKEN_EXPIRED for expired tokens', async () => {
      const expiredError = new Error('jwt expired')
      expiredError.name = 'TokenExpiredError'
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw expiredError
      })

      await expect(service.verifyAccessToken('expired-token')).rejects.toThrow(
        AuthException
      )

      try {
        await service.verifyAccessToken('expired-token')
      } catch (error) {
        const authError = error as AuthException
        const response = authError.getResponse() as { code: string }
        expect(response.code).toBe(AuthErrorCode.TOKEN_EXPIRED)
      }
    })

    it('should throw INVALID_TOKEN for malformed tokens', async () => {
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('invalid token')
      })

      await expect(service.verifyAccessToken('malformed')).rejects.toThrow(
        AuthException
      )

      try {
        await service.verifyAccessToken('malformed')
      } catch (error) {
        const authError = error as AuthException
        const response = authError.getResponse() as { code: string }
        expect(response.code).toBe(AuthErrorCode.INVALID_TOKEN)
      }
    })

    it('should check token invalidation with clock skew', async () => {
      const issuedAt = Math.floor(Date.now() / 1000) - 100 // 100 seconds ago
      const payloadWithIat = { ...validPayload, iat: issuedAt }
      const invalidationTime = Date.now() - 50000 // 50 seconds ago (in ms)

      vi.spyOn(jwtService, 'verify').mockReturnValue(payloadWithIat)
      vi.spyOn(redisService, 'isTokenBlacklisted').mockResolvedValue(false)
      vi.spyOn(redisService, 'getTokenInvalidationTime').mockResolvedValue(
        invalidationTime
      )

      // Token issued 100s ago, invalidation 50s ago = token should be invalid
      // (issuedAt * 1000) = (now - 100s) should be < invalidationTime - 5s clock skew
      await expect(service.verifyAccessToken('token')).rejects.toThrow(
        AuthException
      )
    })
  })

  describe('verifyRefreshToken', () => {
    const validPayload = {
      sub: 'user-123',
      sessionId: 'session-123',
      tokenVersion: 1,
      iat: Math.floor(Date.now() / 1000),
    }

    it('should verify valid refresh token', async () => {
      vi.spyOn(jwtService, 'verify').mockReturnValue(validPayload)
      vi.spyOn(redisService, 'isTokenBlacklisted').mockResolvedValue(false)

      const result = await service.verifyRefreshToken('valid-refresh-token')

      expect(result).toEqual(validPayload)
      expect(jwtService.verify).toHaveBeenCalledWith(
        'valid-refresh-token',
        expect.objectContaining({ algorithms: ['HS256'] })
      )
    })

    it('should throw TOKEN_REVOKED if refresh token is blacklisted', async () => {
      vi.spyOn(jwtService, 'verify').mockReturnValue(validPayload)
      vi.spyOn(redisService, 'isTokenBlacklisted').mockResolvedValue(true)

      await expect(
        service.verifyRefreshToken('blacklisted-refresh')
      ).rejects.toThrow(AuthException)

      try {
        await service.verifyRefreshToken('blacklisted-refresh')
      } catch (error) {
        const authError = error as AuthException
        const response = authError.getResponse() as { code: string }
        expect(response.code).toBe(AuthErrorCode.TOKEN_REVOKED)
      }
    })

    it('should throw SERVICE_UNAVAILABLE if Redis fails in strict mode', async () => {
      vi.spyOn(jwtService, 'verify').mockReturnValue(validPayload)
      vi.spyOn(redisService, 'isTokenBlacklisted').mockRejectedValue(
        new Error('Redis down')
      )

      await expect(service.verifyRefreshToken('token')).rejects.toThrow(
        AuthException
      )

      try {
        await service.verifyRefreshToken('token')
      } catch (error) {
        const authError = error as AuthException
        const response = authError.getResponse() as { code: string }
        expect(response.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE)
      }
    })
  })

  describe('blacklistAccessToken', () => {
    it('should blacklist access token with 15 min TTL', async () => {
      await service.blacklistAccessToken('access-token', 'user-123')

      expect(cryptoService.hashToken).toHaveBeenCalledWith('access-token')
      expect(redisService.blacklistToken).toHaveBeenCalledWith(
        'hashed-token',
        'user-123',
        15 * 60 // 15 minutes
      )
    })
  })

  describe('blacklistRefreshToken', () => {
    it('should blacklist refresh token with 7 day TTL', async () => {
      await service.blacklistRefreshToken('refresh-token', 'user-123')

      expect(cryptoService.hashToken).toHaveBeenCalledWith('refresh-token')
      expect(redisService.blacklistToken).toHaveBeenCalledWith(
        'hashed-token',
        'user-123',
        7 * 24 * 60 * 60 // 7 days
      )
    })
  })

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const mockDecoded = { sub: 'user-123', email: 'test@example.com' }
      vi.spyOn(jwtService, 'decode').mockReturnValue(mockDecoded)

      const result = service.decodeToken('any-token')

      expect(result).toEqual(mockDecoded)
      expect(jwtService.decode).toHaveBeenCalledWith('any-token')
    })
  })

  describe('invalidateAllUserTokens', () => {
    it('should set token invalidation time in Redis', async () => {
      await service.invalidateAllUserTokens('user-123')

      expect(redisService.setTokenInvalidationTime).toHaveBeenCalledWith(
        'user-123'
      )
    })
  })

  describe('isTokenInvalidated', () => {
    it('should return false if no invalidation time exists', async () => {
      vi.spyOn(redisService, 'getTokenInvalidationTime').mockResolvedValue(null)

      const result = await service.isTokenInvalidated('user-123', 123456)

      expect(result).toBe(false)
    })

    it('should return true if token issued before invalidation (with clock skew)', async () => {
      const tokenIssuedAt = Math.floor(Date.now() / 1000) - 100 // 100 seconds ago
      const invalidationTime = Date.now() - 50000 // 50 seconds ago

      vi.spyOn(redisService, 'getTokenInvalidationTime').mockResolvedValue(
        invalidationTime
      )

      // tokenIssuedAt * 1000 = now - 100s
      // invalidationTime - CLOCK_SKEW = now - 50s - 5s = now - 55s
      // (now - 100s) < (now - 55s) => true, token is invalid
      const result = await service.isTokenInvalidated('user-123', tokenIssuedAt)

      expect(result).toBe(true)
    })

    it('should return false if token issued after invalidation (accounting for clock skew)', async () => {
      const tokenIssuedAt = Math.floor(Date.now() / 1000) - 10 // 10 seconds ago
      const invalidationTime = Date.now() - 60000 // 60 seconds ago

      vi.spyOn(redisService, 'getTokenInvalidationTime').mockResolvedValue(
        invalidationTime
      )

      // tokenIssuedAt * 1000 = now - 10s
      // invalidationTime - CLOCK_SKEW = now - 60s - 5s = now - 65s
      // (now - 10s) < (now - 65s) => false, token is valid
      const result = await service.isTokenInvalidated('user-123', tokenIssuedAt)

      expect(result).toBe(false)
    })

    it('should use configurable clock skew', async () => {
      // Test with different clock skew value
      vi.spyOn(tokenConfig, 'TOKEN_CONFIG', 'get').mockReturnValue({
        CLOCK_SKEW_SECONDS: 10, // 10 seconds instead of 5
        REDIS_STRICT_MODE: true,
      })

      const tokenIssuedAt = Math.floor(Date.now() / 1000) - 55 // 55 seconds ago
      const invalidationTime = Date.now() - 50000 // 50 seconds ago

      vi.spyOn(redisService, 'getTokenInvalidationTime').mockResolvedValue(
        invalidationTime
      )

      // With 10s clock skew:
      // tokenIssuedAt * 1000 = now - 55s
      // invalidationTime - 10s clock skew = now - 50s - 10s = now - 60s
      // (now - 55s) < (now - 60s) => false, token is valid (within clock skew)
      const result = await service.isTokenInvalidated('user-123', tokenIssuedAt)

      expect(result).toBe(false)
    })
  })
})
