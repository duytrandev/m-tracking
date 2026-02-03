import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AuthExceptions } from '../../common/exceptions'
import { User } from '../entities/user.entity'
import { CryptoService } from '../../shared/crypto/crypto.service'
import { PasswordService } from './password.service'
import { TokenService } from './token.service'
import { SessionService } from './session.service'
import { SessionActivityService } from './session-activity.service'
import { AnomalyDetectionService } from './anomaly-detection.service'

/**
 * Auth Service (Slimmed Down)
 * Handles core authentication: login, logout, refresh, user validation
 * Registration and password management delegated to specialized services
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private cryptoService: CryptoService,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private sessionActivityService: SessionActivityService,
    private anomalyDetectionService: AnomalyDetectionService,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * Validate user credentials for login
   */
  async validateUser(
    identifier: string,
    password: string
  ): Promise<User | null> {
    this.logger.log(`Login attempt for: ${identifier}`)

    const isEmail = identifier.includes('@')
    const user = await this.userRepository.findOne({
      where: isEmail
        ? { email: identifier }
        : [{ email: identifier }, { username: identifier }],
      select: [
        'id',
        'email',
        'username',
        'password',
        'name',
        'emailVerified',
        'avatar',
      ],
      relations: ['roles'],
    })

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${identifier}`)
      return null
    }

    if (!user.password) {
      this.logger.warn(
        `Login failed: OAuth user without password - ${identifier}`
      )
      throw AuthExceptions.passwordNotSet()
    }

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.password
    )
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${identifier}`)
      return null
    }

    // Auto-migrate bcrypt to Argon2id
    if (this.cryptoService.needsMigration(user.password)) {
      this.logger.log(
        `Migrating password hash to Argon2id for user: ${user.id}`
      )
      const newHash = await this.cryptoService.hashPassword(password)
      await this.userRepository.update(user.id, { password: newHash })
    }

    if (!user.emailVerified) {
      this.logger.warn(`Login failed: Email not verified - ${identifier}`)
      throw AuthExceptions.emailNotVerified()
    }

    this.logger.log(`Login successful for user: ${user.id}`)
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  /**
   * Login user and generate JWT tokens
   */
  async login(
    user: User,
    deviceInfo: Record<
      string,
      string | string[] | number | boolean | null | undefined
    >,
    ipAddress: string
  ) {
    this.logger.log(`Generating tokens for user: ${user.id}`)

    const refreshToken = this.tokenService.generateRefreshToken(user.id, '', 1)
    const session = await this.sessionService.createSession(
      user.id,
      refreshToken,
      deviceInfo,
      ipAddress
    )

    const finalAccessToken = this.tokenService.generateAccessToken(
      user,
      session.id
    )
    const finalRefreshToken = this.tokenService.generateRefreshToken(
      user.id,
      session.id,
      1
    )

    await this.sessionService.updateRefreshToken(session.id, finalRefreshToken)
    await this.sessionActivityService.recordLogin(
      session.id,
      user.id,
      ipAddress,
      deviceInfo
    )

    this.eventEmitter.emit('auth.login', {
      userId: user.id,
      sessionId: session.id,
      ip: ipAddress,
    })

    return {
      accessToken: finalAccessToken,
      refreshToken: finalRefreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        roles: user.roles?.map(r => r.name) || ['user'],
      },
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshToken: string, ipAddress?: string) {
    this.logger.log('Token refresh attempt')

    const decoded = await this.tokenService.verifyRefreshToken(refreshToken)
    const session = await this.sessionService.findByRefreshToken(refreshToken)

    if (!session) {
      this.logger.warn('Refresh failed: Session not found')
      throw AuthExceptions.sessionInvalid()
    }

    if (new Date(session.expiresAt) < new Date()) {
      this.logger.warn('Refresh failed: Session expired')
      await this.sessionService.revokeSession(session.id)
      throw AuthExceptions.sessionExpired()
    }

    const user = await this.findById(decoded.sub)
    if (!user) {
      this.logger.warn('Refresh failed: User not found')
      throw AuthExceptions.userNotFound()
    }

    await this.tokenService.blacklistRefreshToken(refreshToken, user.id)

    const newAccessToken = this.tokenService.generateAccessToken(
      user,
      session.id
    )
    const newRefreshToken = this.tokenService.generateRefreshToken(
      user.id,
      session.id,
      decoded.tokenVersion + 1
    )

    await this.sessionService.updateRefreshToken(session.id, newRefreshToken)

    if (ipAddress) {
      await this.anomalyDetectionService.checkForAnomalies(
        user.id,
        session.id,
        {
          ip: ipAddress,
        }
      )
      await this.sessionActivityService.recordRefresh(
        session.id,
        user.id,
        ipAddress
      )
    }

    this.eventEmitter.emit('auth.refresh', {
      userId: user.id,
      sessionId: session.id,
      ip: ipAddress,
    })

    this.logger.log(`Tokens refreshed for user: ${user.id}`)

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    }
  }

  /**
   * Logout user from current session only
   */
  async logout(
    userId: string,
    sessionId: string,
    refreshToken?: string,
    accessToken?: string
  ): Promise<void> {
    this.logger.log(`Logout attempt for user: ${userId}, session: ${sessionId}`)

    if (refreshToken) {
      await this.tokenService.blacklistRefreshToken(refreshToken, userId)
    }
    if (accessToken) {
      await this.tokenService.blacklistAccessToken(accessToken, userId)
    }

    await this.sessionService.revokeSession(sessionId)
    this.eventEmitter.emit('auth.logout', { userId, sessionId })

    this.logger.log(
      `Logout successful - session ${sessionId} revoked for user: ${userId}`
    )
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId: string): Promise<void> {
    this.logger.log(`Logout all devices for user: ${userId}`)

    await this.tokenService.invalidateAllUserTokens(userId)
    await this.sessionService.revokeAllUserSessions(userId)
    this.eventEmitter.emit('auth.logout_all', { userId })

    this.logger.log(`All devices logged out for user: ${userId}`)
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: ['roles'] })
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    })
  }
}
