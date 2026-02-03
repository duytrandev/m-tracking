import { Injectable, Logger } from '@nestjs/common'
import { AuthExceptions } from '../../common/exceptions'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { OAuthAccount } from '../entities/oauth-account.entity'
import { Role } from '../entities/role.entity'
import { TokenService } from './token.service'
import { SessionService } from './session.service'
import { SessionActivityService } from './session-activity.service'
import { EncryptionUtil } from '../utils/encryption.util'

export interface OAuthProfile {
  provider: string
  providerId: string
  email: string
  emailVerified: boolean
  name: string
  avatar: string | null
  accessToken: string
  refreshToken: string | null
}

export interface OAuthLoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    avatar: string | null
  }
}

export interface OAuthRequest {
  headers: Record<string, string | string[] | undefined>
  ip?: string
  connection?: { remoteAddress?: string }
}

/**
 * OAuth Service
 * Handles OAuth account linking, user creation, and authentication
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name)

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OAuthAccount)
    private oauthAccountRepository: Repository<OAuthAccount>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private sessionActivityService: SessionActivityService
  ) {}

  /**
   * Handle OAuth callback - link or create account
   * @param profile OAuth profile from provider
   * @param req Request object with IP and user agent
   */
  async handleOAuthCallback(
    profile: OAuthProfile,
    req: OAuthRequest
  ): Promise<OAuthLoginResponse> {
    this.logger.log(
      `OAuth callback: ${profile.provider} - ${profile.email} (ID: ${profile.providerId})`
    )

    // Check if OAuth account already linked
    let oauthAccount = await this.oauthAccountRepository.findOne({
      where: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
      relations: ['user'],
    })

    let user: User

    if (oauthAccount) {
      // Existing OAuth account - update tokens
      user = oauthAccount.user
      await this.updateOAuthTokens(oauthAccount, profile)
      this.logger.log(`Existing OAuth account found for user: ${user.id}`)
    } else {
      // New OAuth account - link or create user
      user = await this.linkOrCreateUser(profile)
      oauthAccount = await this.createOAuthAccount(user.id, profile)
      this.logger.log(`New OAuth account created for user: ${user.id}`)
    }

    // Create session first
    const session = await this.sessionService.createSession(
      user.id,
      '', // Temporary, will update with refresh token
      String(req.headers['user-agent'] || 'Unknown'),
      req.ip || req.connection?.remoteAddress || 'Unknown'
    )

    // Generate JWT tokens
    const accessToken = this.tokenService.generateAccessToken(user, session.id)
    const refreshToken = this.tokenService.generateRefreshToken(
      user.id,
      session.id,
      1
    )

    // Update session with refresh token
    await this.sessionService.updateRefreshToken(session.id, refreshToken)

    // Record login activity
    const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown'
    await this.sessionActivityService.recordLogin(
      session.id,
      user.id,
      ipAddress,
      { userAgent: String(req.headers['user-agent'] || 'Unknown') }
    )

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    }
  }

  /**
   * Link OAuth account to existing user or create new user
   */
  private async linkOrCreateUser(profile: OAuthProfile): Promise<User> {
    // Try to find existing user by email (auto-link if verified)
    if (profile.email && profile.emailVerified) {
      const existingUser = await this.userRepository.findOne({
        where: { email: profile.email },
        relations: ['roles'], // Load roles for token generation
      })

      if (existingUser) {
        // SECURITY: Only auto-link if existing user has verified email
        // This prevents account takeover via unverified email squatting
        if (!existingUser.emailVerified) {
          this.logger.warn(
            `OAuth auto-link blocked: existing user ${existingUser.id} has unverified email`
          )
          throw AuthExceptions.oauthUnverifiedEmailConflict()
        }

        this.logger.log(
          `Auto-linking OAuth account to existing user: ${existingUser.id}`
        )

        // Update avatar if not set
        if (!existingUser.avatar && profile.avatar) {
          existingUser.avatar = profile.avatar
          await this.userRepository.save(existingUser)
        }

        return existingUser
      }
    }

    // Create new user
    return await this.createUserFromOAuth(profile)
  }

  /**
   * Create new user from OAuth profile
   */
  private async createUserFromOAuth(profile: OAuthProfile): Promise<User> {
    // Validate email is present and non-empty
    if (!profile.email || profile.email.trim() === '') {
      throw AuthExceptions.oauthEmailRequired()
    }

    // Normalize email
    const normalizedEmail = profile.email.toLowerCase().trim()

    // Get default user role
    let userRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    })

    if (!userRole) {
      this.logger.warn('User role not found, creating default role')
      userRole = this.roleRepository.create({
        name: 'user',
        description: 'Standard user role',
        permissions: [],
      })
      await this.roleRepository.save(userRole)
    }

    const user = new User()
    user.email = normalizedEmail
    user.name = profile.name
    user.avatar = profile.avatar || ''
    user.emailVerified = profile.emailVerified
    user.password = '' // OAuth users don't have passwords
    user.roles = [userRole]

    const savedUser = await this.userRepository.save(user)
    this.logger.log(`Created new user from OAuth: ${savedUser.id}`)
    return savedUser
  }

  /**
   * Create OAuth account record
   */
  private async createOAuthAccount(
    userId: string,
    profile: OAuthProfile
  ): Promise<OAuthAccount> {
    // Check if OAuth account already exists for this provider
    const existing = await this.oauthAccountRepository.findOne({
      where: {
        userId,
        provider: profile.provider,
      },
    })

    if (existing) {
      throw AuthExceptions.oauthAlreadyLinked(profile.provider)
    }

    const oauthAccount = new OAuthAccount()
    oauthAccount.userId = userId
    oauthAccount.provider = profile.provider
    oauthAccount.providerId = profile.providerId
    oauthAccount.providerEmail = profile.email
    oauthAccount.accessToken = EncryptionUtil.encrypt(profile.accessToken)
    oauthAccount.refreshToken = profile.refreshToken
      ? EncryptionUtil.encrypt(profile.refreshToken)
      : ''

    return await this.oauthAccountRepository.save(oauthAccount)
  }

  /**
   * Update OAuth tokens for existing account
   */
  private async updateOAuthTokens(
    oauthAccount: OAuthAccount,
    profile: OAuthProfile
  ): Promise<void> {
    oauthAccount.accessToken = EncryptionUtil.encrypt(profile.accessToken)
    if (profile.refreshToken) {
      oauthAccount.refreshToken = EncryptionUtil.encrypt(profile.refreshToken)
    }
    oauthAccount.providerEmail = profile.email
    await this.oauthAccountRepository.save(oauthAccount)
  }

  /**
   * Unlink OAuth account from user
   * Uses transaction with pessimistic lock to prevent race condition
   * where concurrent unlink requests could delete last auth method
   */
  async unlinkOAuthAccount(userId: string, provider: string): Promise<void> {
    await this.userRepository.manager.transaction(
      async transactionalEntityManager => {
        // Lock user row for update to prevent concurrent unlink race
        const user = await transactionalEntityManager.findOne(User, {
          where: { id: userId },
          relations: ['oauthAccounts'],
          lock: { mode: 'pessimistic_write' },
        })

        if (!user) {
          throw AuthExceptions.userNotFound()
        }

        const oauthAccount = user.oauthAccounts.find(
          acc => acc.provider === provider
        )

        if (!oauthAccount) {
          throw AuthExceptions.oauthAccountNotFound()
        }

        // Check if user has password (empty string means no password)
        const hasPassword = user.password && user.password.length > 0

        if (!hasPassword && user.oauthAccounts.length === 1) {
          throw AuthExceptions.oauthUnlinkBlocked()
        }

        await transactionalEntityManager.remove(oauthAccount)
        this.logger.log(`Unlinked ${provider} account for user: ${userId}`)
      }
    )
  }

  /**
   * Get linked OAuth accounts for user
   */
  async getLinkedAccounts(userId: string): Promise<OAuthAccount[]> {
    return await this.oauthAccountRepository.find({
      where: { userId },
      select: ['id', 'provider', 'providerEmail', 'createdAt', 'updatedAt'],
    })
  }
}
