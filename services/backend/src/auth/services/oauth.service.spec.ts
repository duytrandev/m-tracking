import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { OAuthService, OAuthProfile } from './oauth.service'
import { User } from '../entities/user.entity'
import { OAuthAccount } from '../entities/oauth-account.entity'
import { Role } from '../entities/role.entity'
import { TokenService } from './token.service'
import { SessionService } from './session.service'

describe('OAuthService', () => {
  let service: OAuthService
  let userRepository: Repository<User>
  let oauthAccountRepository: Repository<OAuthAccount>
  let roleRepository: Repository<Role>

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'avatar.jpg',
    emailVerified: true,
    password: '',
    roles: [{ id: 'role-1', name: 'user' }],
  } as User

  const mockRole = {
    id: 'role-1',
    name: 'user',
    description: 'Standard user',
    permissions: [],
    createdAt: new Date(),
    users: [],
  } as Role

  const mockOAuthProfile: OAuthProfile = {
    provider: 'google',
    providerId: 'google-123',
    email: 'test@example.com',
    emailVerified: true,
    name: 'Test User',
    avatar: 'avatar.jpg',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }

  const mockRequest = {
    headers: { 'user-agent': 'Test Browser' },
    ip: '127.0.0.1',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: vi.fn(),
            save: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(OAuthAccount),
          useValue: {
            findOne: vi.fn(),
            find: vi.fn(),
            save: vi.fn(),
            remove: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: vi.fn(),
            save: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: vi.fn().mockReturnValue('access-token'),
            generateRefreshToken: vi.fn().mockReturnValue('refresh-token'),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: vi.fn().mockResolvedValue({ id: 'session-123' }),
            updateRefreshToken: vi.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<OAuthService>(OAuthService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    oauthAccountRepository = module.get<Repository<OAuthAccount>>(
      getRepositoryToken(OAuthAccount)
    )
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role))

    // Setup environment variable
    process.env.OAUTH_ENCRYPTION_KEY = '0'.repeat(64) // 32 bytes in hex
  })

  describe('handleOAuthCallback', () => {
    it('should login existing OAuth user', async () => {
      const mockOAuthAccount = {
        id: 'oauth-123',
        userId: mockUser.id,
        provider: 'google',
        providerId: 'google-123',
        user: mockUser,
      } as OAuthAccount

      vi.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(
        mockOAuthAccount
      )
      vi.spyOn(oauthAccountRepository, 'save').mockResolvedValue(
        mockOAuthAccount
      )

      const result = await service.handleOAuthCallback(
        mockOAuthProfile,
        mockRequest
      )

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.id).toBe(mockUser.id)
    })

    it('should create new user for new OAuth account', async () => {
      vi.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(null)
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(null)
      vi.spyOn(roleRepository, 'findOne').mockResolvedValue(mockRole)
      vi.spyOn(userRepository, 'save').mockResolvedValue(mockUser)
      vi.spyOn(oauthAccountRepository, 'save').mockResolvedValue(
        {} as OAuthAccount
      )

      const result = await service.handleOAuthCallback(
        mockOAuthProfile,
        mockRequest
      )

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(userRepository.save).toHaveBeenCalled()
      expect(oauthAccountRepository.save).toHaveBeenCalled()
    })

    it('should auto-link OAuth to existing user by verified email', async () => {
      vi.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(null)
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser)
      vi.spyOn(oauthAccountRepository, 'save').mockResolvedValue(
        {} as OAuthAccount
      )

      const result = await service.handleOAuthCallback(
        mockOAuthProfile,
        mockRequest
      )

      expect(result.user.id).toBe(mockUser.id)
      expect(oauthAccountRepository.save).toHaveBeenCalled()
    })
  })

  describe('unlinkOAuthAccount', () => {
    it('should unlink OAuth account', async () => {
      const mockOAuthAccount = {
        id: 'oauth-123',
        userId: mockUser.id,
        provider: 'google',
      } as OAuthAccount

      const userWithMultipleAccounts = {
        ...mockUser,
        password: 'hashed-password',
        oauthAccounts: [mockOAuthAccount, {} as OAuthAccount],
      } as User

      vi.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(
        mockOAuthAccount
      )
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(
        userWithMultipleAccounts
      )
      vi.spyOn(oauthAccountRepository, 'remove').mockResolvedValue(
        mockOAuthAccount
      )

      await service.unlinkOAuthAccount(mockUser.id, 'google')

      expect(oauthAccountRepository.remove).toHaveBeenCalledWith(
        mockOAuthAccount
      )
    })

    it('should throw error when unlinking last auth method', async () => {
      const mockOAuthAccount = {
        id: 'oauth-123',
        userId: mockUser.id,
        provider: 'google',
      } as OAuthAccount

      const userWithSingleAccount = {
        ...mockUser,
        password: '',
        oauthAccounts: [mockOAuthAccount],
      } as User

      vi.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(
        mockOAuthAccount
      )
      vi.spyOn(userRepository, 'findOne').mockResolvedValue(
        userWithSingleAccount
      )

      await expect(
        service.unlinkOAuthAccount(mockUser.id, 'google')
      ).rejects.toThrow(ConflictException)
    })

    it('should throw error when OAuth account not found', async () => {
      vi.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(null)

      await expect(
        service.unlinkOAuthAccount(mockUser.id, 'google')
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('getLinkedAccounts', () => {
    it('should return linked OAuth accounts', async () => {
      const mockAccounts = [
        {
          id: 'oauth-1',
          provider: 'google',
          providerEmail: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'oauth-2',
          provider: 'github',
          providerEmail: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as OAuthAccount[]

      vi.spyOn(oauthAccountRepository, 'find').mockResolvedValue(mockAccounts)

      const result = await service.getLinkedAccounts(mockUser.id)

      expect(result).toHaveLength(2)
      expect(result[0].provider).toBe('google')
      expect(result[1].provider).toBe('github')
    })
  })
})
