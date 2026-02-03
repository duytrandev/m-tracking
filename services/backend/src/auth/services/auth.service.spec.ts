import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AuthErrorCode } from '@m-tracking/shared'
import { AuthException } from '../../common/exceptions/auth.exception'
import { User } from '../entities/user.entity'
import type { RedisSessionData } from '../interfaces/session.interface'
import { CryptoService } from '../../shared/crypto/crypto.service'
import { AuthService } from './auth.service'
import { PasswordService } from './password.service'
import { SessionService } from './session.service'
import { SessionActivityService } from './session-activity.service'
import { AnomalyDetectionService } from './anomaly-detection.service'
import { TokenService } from './token.service'

describe('AuthService', () => {
  let service: AuthService
  let userRepository: Repository<User>
  let passwordService: PasswordService
  let tokenService: TokenService
  let sessionService: SessionService

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    emailVerified: true,
    avatar: '',
    phone: '',
    phoneVerified: false,
    twoFactorEnabled: false,
    twoFactorSecret: '',
    roles: [{ id: 'role-1', name: 'user' }],
    preferences: {
      theme: 'light',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
      notifications: { email: true, push: true, sms: false },
    },
    oauthAccounts: [],
    passwordResetTokens: [],
    emailVerificationTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            hashPassword: vi.fn().mockResolvedValue('hashedPassword'),
            verifyPassword: vi.fn().mockResolvedValue(true),
            hashToken: vi.fn().mockReturnValue('hashedToken'),
            generateSecureToken: vi.fn().mockReturnValue('secureToken'),
            needsMigration: vi.fn().mockReturnValue(false),
            isArgon2Hash: vi.fn().mockReturnValue(true),
            isBcryptHash: vi.fn().mockReturnValue(false),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: vi.fn(),
            compare: vi.fn(),
            generateToken: vi.fn(),
            hashToken: vi.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: vi.fn(),
            generateRefreshToken: vi.fn(),
            verifyRefreshToken: vi.fn(),
            blacklistAccessToken: vi.fn(),
            blacklistRefreshToken: vi.fn(),
            invalidateAllUserTokens: vi.fn(),
            isTokenInvalidated: vi.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: vi.fn(),
            updateRefreshToken: vi.fn(),
            findByRefreshToken: vi.fn(),
            revokeSession: vi.fn(),
            revokeAllUserSessions: vi.fn(),
          },
        },
        {
          provide: SessionActivityService,
          useValue: {
            recordLogin: vi.fn(),
            recordRefresh: vi.fn(),
            recordIpChange: vi.fn(),
            recordLogout: vi.fn(),
          },
        },
        {
          provide: AnomalyDetectionService,
          useValue: {
            checkForAnomalies: vi.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: vi.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    passwordService = module.get<PasswordService>(PasswordService)
    tokenService = module.get<TokenService>(TokenService)
    sessionService = module.get<SessionService>(SessionService)
  })

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)
      vi.spyOn(passwordService, 'compare').mockResolvedValue(true)

      const result = await service.validateUser('test@example.com', 'password')

      expect(result).toBeDefined()
      expect(result?.email).toBe(mockUser.email)
      expect(result).not.toHaveProperty('password')
    })

    it('should return null if user not found', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)

      const result = await service.validateUser(
        'notfound@example.com',
        'password'
      )

      expect(result).toBeNull()
    })

    it('should return null if password is invalid', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)
      vi.spyOn(passwordService, 'compare').mockResolvedValue(false)

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword'
      )

      expect(result).toBeNull()
    })

    it('should throw AuthException if email not verified', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false }
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(
        unverifiedUser as User
      )
      vi.spyOn(passwordService, 'compare').mockResolvedValue(true)

      await expect(
        service.validateUser('test@example.com', 'password')
      ).rejects.toThrow(AuthException)
      await expect(
        service.validateUser('test@example.com', 'password')
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: AuthErrorCode.EMAIL_NOT_VERIFIED,
        }),
      })
    })
  })

  describe('login', () => {
    it('should generate tokens and create session', async () => {
      const deviceInfo = { userAgent: 'Test Browser', platform: 'macOS' }
      const ipAddress = '127.0.0.1'
      const mockSession = { id: 'session-123', userId: mockUser.id }

      vi.spyOn(tokenService, 'generateRefreshToken').mockReturnValue(
        'refresh-token'
      )
      vi.spyOn(sessionService, 'createSession').mockResolvedValue(
        mockSession as Partial<RedisSessionData> as RedisSessionData
      )
      vi.spyOn(tokenService, 'generateAccessToken').mockReturnValue(
        'access-token'
      )
      vi.spyOn(sessionService, 'updateRefreshToken').mockResolvedValue(
        undefined
      )

      const result = await service.login(mockUser, deviceInfo, ipAddress)

      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
      expect(result.user.email).toBe(mockUser.email)
      expect(sessionService.createSession).toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const oldRefreshToken = 'old-refresh-token'
      const mockSession = {
        id: 'session-123',
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      }
      const decodedToken = {
        sub: 'user-123',
        sessionId: 'session-123',
        tokenVersion: 1,
      }

      vi.spyOn(tokenService, 'verifyRefreshToken').mockResolvedValue(
        decodedToken
      )
      vi.spyOn(sessionService, 'findByRefreshToken').mockResolvedValue(
        mockSession as Partial<RedisSessionData> as RedisSessionData
      )
      vi.spyOn(service, 'findById').mockResolvedValue(mockUser)
      vi.spyOn(tokenService, 'blacklistRefreshToken').mockResolvedValue(
        undefined
      )
      vi.spyOn(tokenService, 'generateAccessToken').mockReturnValue(
        'new-access-token'
      )
      vi.spyOn(tokenService, 'generateRefreshToken').mockReturnValue(
        'new-refresh-token'
      )
      vi.spyOn(sessionService, 'updateRefreshToken').mockResolvedValue(
        undefined
      )

      const result = await service.refresh(oldRefreshToken)

      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
      expect(tokenService.blacklistRefreshToken).toHaveBeenCalledWith(
        oldRefreshToken,
        'user-123'
      )
    })

    it('should throw AuthException if session expired', async () => {
      const expiredSession = {
        id: 'session-123',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }
      const decodedToken = {
        sub: 'user-123',
        sessionId: 'session-123',
        tokenVersion: 1,
      }

      vi.spyOn(tokenService, 'verifyRefreshToken').mockResolvedValue(
        decodedToken
      )
      vi.spyOn(sessionService, 'findByRefreshToken').mockResolvedValue(
        expiredSession as Partial<RedisSessionData> as RedisSessionData
      )
      vi.spyOn(sessionService, 'revokeSession').mockResolvedValue(undefined)

      await expect(service.refresh('refresh-token')).rejects.toThrow(
        AuthException
      )
      await expect(service.refresh('refresh-token')).rejects.toMatchObject({
        response: expect.objectContaining({
          code: AuthErrorCode.SESSION_EXPIRED,
        }),
      })
      expect(sessionService.revokeSession).toHaveBeenCalledWith('session-123')
    })
  })

  describe('logout', () => {
    it('should blacklist tokens and revoke only current session', async () => {
      const userId = 'user-123'
      const sessionId = 'session-456'
      const refreshToken = 'refresh-token'
      const accessToken = 'access-token'

      vi.spyOn(tokenService, 'blacklistRefreshToken').mockResolvedValue(
        undefined
      )
      vi.spyOn(tokenService, 'blacklistAccessToken').mockResolvedValue(
        undefined
      )
      vi.spyOn(sessionService, 'revokeSession').mockResolvedValue(undefined)

      await service.logout(userId, sessionId, refreshToken, accessToken)

      expect(tokenService.blacklistRefreshToken).toHaveBeenCalledWith(
        refreshToken,
        userId
      )
      expect(tokenService.blacklistAccessToken).toHaveBeenCalledWith(
        accessToken,
        userId
      )
      expect(sessionService.revokeSession).toHaveBeenCalledWith(sessionId)
    })

    it('should work without tokens provided', async () => {
      const userId = 'user-123'
      const sessionId = 'session-456'

      vi.spyOn(sessionService, 'revokeSession').mockResolvedValue(undefined)

      await service.logout(userId, sessionId)

      expect(sessionService.revokeSession).toHaveBeenCalledWith(sessionId)
    })
  })

  describe('logoutAllDevices', () => {
    it('should invalidate all tokens and revoke all sessions', async () => {
      const userId = 'user-123'

      vi.spyOn(tokenService, 'invalidateAllUserTokens').mockResolvedValue(
        undefined
      )
      vi.spyOn(sessionService, 'revokeAllUserSessions').mockResolvedValue(
        undefined
      )

      await service.logoutAllDevices(userId)

      expect(tokenService.invalidateAllUserTokens).toHaveBeenCalledWith(userId)
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(userId)
    })
  })

  describe('findById', () => {
    it('should return user by ID', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)

      const result = await service.findById('user-123')

      expect(result).toEqual(mockUser)
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['roles'],
      })
    })

    it('should return null if user not found', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)

      const result = await service.findById('invalid-id')

      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)

      const result = await service.findByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['roles'],
      })
    })
  })
})
