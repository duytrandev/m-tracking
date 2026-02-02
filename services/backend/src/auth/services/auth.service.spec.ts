import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository, UpdateResult } from 'typeorm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthErrorCode } from '@m-tracking/shared'
import { AuthException } from '../../common/exceptions/auth.exception'
import { RegisterDto } from '../dto/register.dto'
import { EmailVerificationToken } from '../entities/email-verification-token.entity'
import { PasswordResetToken } from '../entities/password-reset-token.entity'
import { Role } from '../entities/role.entity'
import { Session } from '../entities/session.entity'
import { User } from '../entities/user.entity'
import { AuthService } from './auth.service'
import { EmailService } from './email.service'
import { PasswordService } from './password.service'
import { SessionService } from './session.service'
import { TokenService } from './token.service'

describe('AuthService', () => {
  let service: AuthService
  let userRepository: Repository<User>
  let roleRepository: Repository<Role>
  let verificationTokenRepository: Repository<EmailVerificationToken>
  let resetTokenRepository: Repository<PasswordResetToken>
  let passwordService: PasswordService
  let emailService: EmailService
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
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
    sessions: [],
    oauthAccounts: [],
    passwordResetTokens: [],
    emailVerificationTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User

  const mockRole = {
    id: 'role-1',
    name: 'user',
  } as Role

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
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(EmailVerificationToken),
          useValue: {
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: {
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
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
          provide: EmailService,
          useValue: {
            sendVerificationEmail: vi.fn(),
            sendPasswordResetEmail: vi.fn(),
            sendPasswordSetupEmail: vi.fn(),
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
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role))
    verificationTokenRepository = module.get<
      Repository<EmailVerificationToken>
    >(getRepositoryToken(EmailVerificationToken))
    resetTokenRepository = module.get<Repository<PasswordResetToken>>(
      getRepositoryToken(PasswordResetToken)
    )
    passwordService = module.get<PasswordService>(PasswordService)
    emailService = module.get<EmailService>(EmailService)
    tokenService = module.get<TokenService>(TokenService)
    sessionService = module.get<SessionService>(SessionService)
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123',
        name: 'New User',
      }

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)
      vi.spyOn(passwordService, 'hash').mockResolvedValue('hashedPassword')
      vi.spyOn(userRepository, 'create').mockReturnValue(mockUser)
      vi.spyOn(userRepository, 'save').mockResolvedValue(mockUser)
      vi.spyOn(roleRepository, 'findOne').mockResolvedValue(mockRole)
      vi.spyOn(passwordService, 'generateToken').mockReturnValue(
        'verification-token'
      )
      vi.spyOn(passwordService, 'hashToken').mockReturnValue('hashed-token')
      vi.spyOn(verificationTokenRepository, 'create').mockReturnValue(
        {} as EmailVerificationToken
      )
      vi.spyOn(verificationTokenRepository, 'save').mockResolvedValue(
        {} as EmailVerificationToken
      )
      vi.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(
        undefined
      )

      const result = await service.register(dto)

      expect(result.message).toContain('Registration successful')
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      })
      expect(passwordService.hash).toHaveBeenCalledWith(dto.password)
      expect(emailService.sendVerificationEmail).toHaveBeenCalled()
    })

    it('should throw AuthException if email already exists', async () => {
      const dto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password',
        name: 'User',
      }

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)

      await expect(service.register(dto)).rejects.toThrow(AuthException)
      await expect(service.register(dto)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: AuthErrorCode.EMAIL_ALREADY_REGISTERED,
        }),
      })
    })
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
        mockSession as Partial<Session> as Session
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
        expiresAt: new Date(Date.now() + 1000000),
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
        mockSession as Partial<Session> as Session
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
        expiresAt: new Date(Date.now() - 1000),
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
        expiredSession as Partial<Session> as Session
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
    it('should blacklist tokens and revoke session', async () => {
      const userId = 'user-123'
      const refreshToken = 'refresh-token'
      const accessToken = 'access-token'

      vi.spyOn(tokenService, 'invalidateAllUserTokens').mockResolvedValue(
        undefined
      )
      vi.spyOn(sessionService, 'revokeAllUserSessions').mockResolvedValue(
        undefined
      )

      await service.logout(userId, refreshToken, accessToken)

      expect(tokenService.invalidateAllUserTokens).toHaveBeenCalledWith(userId)
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(userId)
    })
  })

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const token = 'verification-token'
      const tokenHash = 'hashed-token'
      const mockVerificationToken = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash,
        expiresAt: new Date(Date.now() + 1000000),
        used: false,
      }

      vi.spyOn(passwordService, 'hashToken').mockReturnValue(tokenHash)
      vi.spyOn(verificationTokenRepository, 'findOne').mockResolvedValue(
        mockVerificationToken as Partial<EmailVerificationToken> as EmailVerificationToken
      )
      vi.spyOn(userRepository, 'update').mockResolvedValue({} as UpdateResult)
      vi.spyOn(verificationTokenRepository, 'update').mockResolvedValue(
        {} as UpdateResult
      )

      const result = await service.verifyEmail(token)

      expect(result.message).toContain('Email verified successfully')
      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        emailVerified: true,
      })
    })

    it('should throw AuthException for invalid token', async () => {
      vi.spyOn(passwordService, 'hashToken').mockReturnValue('hash')
      vi.spyOn(verificationTokenRepository, 'findOne').mockResolvedValue(null)

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        AuthException
      )
      await expect(service.verifyEmail('invalid-token')).rejects.toMatchObject({
        response: expect.objectContaining({
          code: AuthErrorCode.INVALID_TOKEN,
        }),
      })
    })
  })

  describe('forgotPassword', () => {
    it('should create reset token and send email', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)
      vi.spyOn(passwordService, 'generateToken').mockReturnValue('reset-token')
      vi.spyOn(passwordService, 'hashToken').mockReturnValue('hashed-token')
      vi.spyOn(resetTokenRepository, 'create').mockReturnValue(
        {} as unknown as PasswordResetToken
      )
      vi.spyOn(resetTokenRepository, 'save').mockResolvedValue(
        {} as unknown as PasswordResetToken
      )
      vi.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(
        undefined
      )

      const result = await service.forgotPassword('test@example.com')

      expect(result.message).toContain('reset link has been sent')
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled()
    })

    it('should return generic message for non-existent email', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)

      const result = await service.forgotPassword('notfound@example.com')

      expect(result.message).toContain('reset link has been sent')
    })
  })

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'reset-token'
      const newPassword = 'NewSecurePassword123'
      const mockResetToken = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 1000000),
        used: false,
      }

      vi.spyOn(passwordService, 'hashToken').mockReturnValue('hashed-token')
      vi.spyOn(resetTokenRepository, 'findOne').mockResolvedValue(
        mockResetToken as Partial<PasswordResetToken> as PasswordResetToken
      )
      vi.spyOn(passwordService, 'hash').mockResolvedValue('new-hashed-password')
      vi.spyOn(userRepository, 'update').mockResolvedValue({} as UpdateResult)
      vi.spyOn(resetTokenRepository, 'update').mockResolvedValue(
        {} as UpdateResult
      )

      const result = await service.resetPassword(token, newPassword)

      expect(result.message).toContain('Password reset successfully')
      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        password: 'new-hashed-password',
      })
    })

    it('should throw AuthException for invalid token', async () => {
      vi.spyOn(passwordService, 'hashToken').mockReturnValue('hash')
      vi.spyOn(resetTokenRepository, 'findOne').mockResolvedValue(null)

      await expect(
        service.resetPassword('invalid-token', 'newpass')
      ).rejects.toThrow(AuthException)
      await expect(
        service.resetPassword('invalid-token', 'newpass')
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: AuthErrorCode.INVALID_TOKEN,
        }),
      })
    })
  })

  describe('requestPasswordSetup', () => {
    it('should send setup email for OAuth user without password', async () => {
      const userId = 'oauth-user-id'
      const oauthUser = {
        id: userId,
        email: 'oauth@example.com',
        password: '', // OAuth user has no password
      }

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(
        oauthUser as Partial<User> as User
      )
      vi.spyOn(passwordService, 'generateToken').mockReturnValue('setup-token')
      vi.spyOn(passwordService, 'hashToken').mockReturnValue('hashed-token')
      vi.spyOn(resetTokenRepository, 'create').mockReturnValue(
        {} as PasswordResetToken
      )
      vi.spyOn(resetTokenRepository, 'save').mockResolvedValue(
        {} as PasswordResetToken
      )
      vi.spyOn(emailService, 'sendPasswordSetupEmail').mockResolvedValue(
        undefined
      )

      const result = await service.requestPasswordSetup(userId)

      expect(result.code).toBe('PASSWORD_SETUP_EMAIL_SENT')
      expect(result.message).toContain('Password setup email sent')
      expect(emailService.sendPasswordSetupEmail).toHaveBeenCalledWith(
        'oauth@example.com',
        'setup-token'
      )
    })

    it('should throw AuthException if user already has password', async () => {
      const userId = 'user-with-password'
      const userWithPassword = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedPassword', // User already has password
      }

      vi.spyOn(userRepository, 'findOne').mockResolvedValue(
        userWithPassword as Partial<User> as User
      )

      await expect(service.requestPasswordSetup(userId)).rejects.toThrow(
        AuthException
      )
      await expect(service.requestPasswordSetup(userId)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: AuthErrorCode.PASSWORD_ALREADY_SET,
        }),
      })
    })

    it('should throw AuthException if user not found', async () => {
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)

      await expect(service.requestPasswordSetup('invalid-id')).rejects.toThrow(
        AuthException
      )
      await expect(
        service.requestPasswordSetup('invalid-id')
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: AuthErrorCode.USER_NOT_FOUND,
        }),
      })
    })
  })
})
