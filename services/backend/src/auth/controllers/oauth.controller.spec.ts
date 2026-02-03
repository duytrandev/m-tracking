import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { OAuthService } from '../services/oauth.service'
import { CryptoService } from '../../shared/crypto/crypto.service'
import { RedisService } from '../../shared/redis/redis.service'
import { OAuthController } from './oauth.controller'

// Mock Response interface implementation for testing
const createMockResponse = (): Response => {
  const mockResponse = {
    redirect: vi.fn(),
    cookie: vi.fn(),
  } as unknown as Response

  return mockResponse
}

describe('OAuthController', () => {
  let controller: OAuthController
  let oauthService: OAuthService

  const mockOAuthService = {
    handleOAuthCallback: vi.fn(),
    unlinkOAuthAccount: vi.fn(),
    getLinkedAccounts: vi.fn(),
  }

  const mockConfigService = {
    get: vi.fn().mockReturnValue('http://localhost:3000'),
  }

  const mockRedisService = {
    storeOAuthCode: vi.fn(),
    consumeOAuthCode: vi.fn(),
    storeOAuthState: vi.fn(),
    getOAuthState: vi.fn(),
  }

  const mockCryptoService = {
    generateSecureToken: vi.fn().mockReturnValue('secure-auth-code'),
    hashToken: vi.fn().mockReturnValue('hashed-token'),
  }

  const mockRequest = {
    user: {
      provider: 'google',
      providerId: 'google-123',
      email: 'test@example.com',
      emailVerified: true,
      name: 'Test User',
      avatar: 'avatar.jpg',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    },
    headers: { 'user-agent': 'Test Browser' },
    ip: '127.0.0.1',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [
        {
          provide: OAuthService,
          useValue: mockOAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile()

    controller = module.get<OAuthController>(OAuthController)
    oauthService = module.get<OAuthService>(OAuthService)
  })

  describe('googleCallback', () => {
    it('should redirect to frontend with tokens on success', async () => {
      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          avatar: 'avatar.jpg',
        },
      }

      mockOAuthService.handleOAuthCallback.mockResolvedValue(mockResult)
      mockRedisService.storeOAuthCode.mockResolvedValue(undefined)

      const mockResponse = createMockResponse()

      await controller.googleCallback(mockRequest, mockResponse)

      expect(oauthService.handleOAuthCallback).toHaveBeenCalledWith(
        mockRequest.user,
        mockRequest
      )
      // Verify refresh token is set as httpOnly cookie
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({ httpOnly: true })
      )
      // Verify authorization code is stored in Redis
      expect(mockRedisService.storeOAuthCode).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          accessToken: 'access-token',
          userId: 'user-123',
        })
      )
      // Verify redirect URL contains code (not the actual token)
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/oauth/callback')
      )
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('code=')
      )
      expect(mockResponse.redirect).not.toHaveBeenCalledWith(
        expect.stringContaining('accessToken=')
      )
    })

    it('should redirect to error page on failure', async () => {
      mockOAuthService.handleOAuthCallback.mockRejectedValue(
        new Error('OAuth failed')
      )

      const mockResponse = createMockResponse()

      await controller.googleCallback(mockRequest, mockResponse)

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/oauth/callback')
      )
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=OAuth%20failed')
      )
    })
  })

  describe('githubCallback', () => {
    it('should redirect to frontend with tokens on success', async () => {
      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          avatar: null,
        },
      }

      mockOAuthService.handleOAuthCallback.mockResolvedValue(mockResult)
      mockRedisService.storeOAuthCode.mockResolvedValue(undefined)

      const mockResponse = createMockResponse()

      await controller.githubCallback(mockRequest, mockResponse)

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({ httpOnly: true })
      )
      expect(mockRedisService.storeOAuthCode).toHaveBeenCalled()
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/oauth/callback')
      )
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('code=')
      )
    })
  })

  describe('facebookCallback', () => {
    it('should redirect to frontend with tokens on success', async () => {
      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          avatar: null,
        },
      }

      mockOAuthService.handleOAuthCallback.mockResolvedValue(mockResult)
      mockRedisService.storeOAuthCode.mockResolvedValue(undefined)

      const mockResponse = createMockResponse()

      await controller.facebookCallback(mockRequest, mockResponse)

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({ httpOnly: true })
      )
      expect(mockRedisService.storeOAuthCode).toHaveBeenCalled()
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/oauth/callback')
      )
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('code=')
      )
    })
  })

  describe('getLinkedAccounts', () => {
    it('should return linked OAuth accounts', async () => {
      const mockAccounts = [
        {
          id: 'oauth-1',
          provider: 'google',
          email: 'test@example.com',
          linkedAt: new Date(),
        },
        {
          id: 'oauth-2',
          provider: 'github',
          email: 'test@example.com',
          linkedAt: new Date(),
        },
      ]

      mockOAuthService.getLinkedAccounts.mockResolvedValue(
        mockAccounts.map(a => ({
          ...a,
          providerEmail: a.email,
          createdAt: a.linkedAt,
        }))
      )

      const result = await controller.getLinkedAccounts('user-123')

      expect(result.accounts).toHaveLength(2)
      expect(result.accounts[0]!.provider).toBe('google')
    })
  })

  describe('unlinkAccount', () => {
    it('should unlink OAuth account', async () => {
      mockOAuthService.unlinkOAuthAccount.mockResolvedValue(undefined)

      const result = await controller.unlinkAccount('user-123', 'google')

      expect(oauthService.unlinkOAuthAccount).toHaveBeenCalledWith(
        'user-123',
        'google'
      )
      expect(result.message).toContain('unlinked successfully')
    })
  })

  describe('PKCE Flow', () => {
    describe('googleAuth with PKCE', () => {
      it('should store PKCE state when challenge and state provided', async () => {
        mockRedisService.storeOAuthState.mockResolvedValue(undefined)

        await controller.googleAuth('test-challenge', 'test-state')

        expect(mockRedisService.storeOAuthState).toHaveBeenCalledWith(
          'test-state',
          { challenge: 'test-challenge' }
        )
      })

      it('should not store state when PKCE params missing', async () => {
        // Clear mock from previous test
        mockRedisService.storeOAuthState.mockClear()

        await controller.googleAuth(undefined, undefined)

        expect(mockRedisService.storeOAuthState).not.toHaveBeenCalled()
      })
    })

    describe('exchangeCode with PKCE', () => {
      it('should exchange code without PKCE verification', async () => {
        mockRedisService.consumeOAuthCode.mockResolvedValue({
          accessToken: 'access-token',
          userId: 'user-123',
        })

        const result = await controller.exchangeCode({
          code: 'valid-auth-code-1234567890123456789012345',
        })

        expect(mockRedisService.consumeOAuthCode).toHaveBeenCalledWith(
          'valid-auth-code-1234567890123456789012345'
        )
        expect(result.accessToken).toBe('access-token')
        expect(result.expiresIn).toBe(900)
      })

      it('should verify PKCE when codeVerifier and state provided', async () => {
        // Generate a valid verifier/challenge pair for testing
        const testVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
        const testChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'

        mockRedisService.getOAuthState.mockResolvedValue({
          challenge: testChallenge,
        })
        mockRedisService.consumeOAuthCode.mockResolvedValue({
          accessToken: 'access-token',
          userId: 'user-123',
        })

        const result = await controller.exchangeCode({
          code: 'valid-auth-code-1234567890123456789012345',
          codeVerifier: testVerifier,
          state: 'test-state-12345678901234567890',
        })

        expect(mockRedisService.getOAuthState).toHaveBeenCalledWith(
          'test-state-12345678901234567890'
        )
        expect(result.accessToken).toBe('access-token')
      })

      it('should reject when PKCE state not found', async () => {
        mockRedisService.getOAuthState.mockResolvedValue(null)

        await expect(
          controller.exchangeCode({
            code: 'valid-auth-code-1234567890123456789012345',
            codeVerifier: 'test-verifier-that-is-at-least-43-characters-long',
            state: 'test-state-12345678901234567890',
          })
        ).rejects.toThrow()
      })

      it('should reject when PKCE challenge verification fails', async () => {
        mockRedisService.getOAuthState.mockResolvedValue({
          challenge: 'wrong-challenge-value-for-testing-purposes',
        })

        await expect(
          controller.exchangeCode({
            code: 'valid-auth-code-1234567890123456789012345',
            codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
            state: 'test-state-12345678901234567890',
          })
        ).rejects.toThrow()
      })

      it('should reject when auth code is invalid', async () => {
        mockRedisService.consumeOAuthCode.mockResolvedValue(null)

        await expect(
          controller.exchangeCode({
            code: 'invalid-auth-code-123456789012345678901',
          })
        ).rejects.toThrow()
      })
    })
  })
})
