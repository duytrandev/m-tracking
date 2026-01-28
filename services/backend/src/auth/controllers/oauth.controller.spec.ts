import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { OAuthService } from '../services/oauth.service'
import { OAuthController } from './oauth.controller'

// Mock Response interface implementation for testing
const createMockResponse = (): Response => {
  const mockResponse = {
    redirect: vi.fn(),
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

      const mockResponse = createMockResponse()

      await controller.googleCallback(mockRequest, mockResponse)

      expect(oauthService.handleOAuthCallback).toHaveBeenCalledWith(
        mockRequest.user,
        mockRequest
      )
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/callback')
      )
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('accessToken=access-token')
      )
    })

    it('should redirect to error page on failure', async () => {
      mockOAuthService.handleOAuthCallback.mockRejectedValue(
        new Error('OAuth failed')
      )

      const mockResponse = createMockResponse()

      await controller.googleCallback(mockRequest, mockResponse)

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/error')
      )
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('message=OAuth%20failed')
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

      const mockResponse = createMockResponse()

      await controller.githubCallback(mockRequest, mockResponse)

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/callback')
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

      const mockResponse = createMockResponse()

      await controller.facebookCallback(mockRequest, mockResponse)

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/auth/callback')
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
