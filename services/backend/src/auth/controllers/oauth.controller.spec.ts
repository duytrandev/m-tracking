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
})
