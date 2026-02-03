import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AuthExceptions } from '../../common/exceptions'
import { User } from '../entities/user.entity'
import { PasswordResetToken } from '../entities/password-reset-token.entity'
import { PasswordService } from './password.service'
import { EmailService } from './email.service'
import {
  PASSWORD_RESET_EXPIRY_MS,
  PASSWORD_SETUP_EXPIRY_MS,
} from '../constants'

/**
 * Password Management Service
 * Handles password reset, forgot password, and OAuth password setup flows
 * Extracted from AuthService following SRP
 */
@Injectable()
export class PasswordManagementService {
  private readonly logger = new Logger(PasswordManagementService.name)

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    private passwordService: PasswordService,
    private emailService: EmailService,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * Request password reset - sends reset email
   * Uses generic response to prevent email enumeration
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    this.logger.log(`Password reset request for: ${email}`)

    const genericResponse = {
      message: 'If the email exists, a reset link has been sent.',
    }
    const user = await this.userRepository.findOne({ where: { email } })

    if (!user) {
      this.logger.log(
        `Password reset requested for non-existent email: ${email}`
      )
      return genericResponse
    }

    await this.sendResetEmail(user, PASSWORD_RESET_EXPIRY_MS, false)
    this.eventEmitter.emit('auth.password_reset_requested', {
      userId: user.id,
      email,
    })

    return genericResponse
  }

  /**
   * Reset password using token from email
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    this.logger.log('Password reset attempt')

    const tokenHash = this.passwordService.hashToken(token)
    const resetToken = await this.resetTokenRepository.findOne({
      where: { tokenHash, used: false },
    })

    if (!resetToken) {
      this.logger.warn('Password reset failed: Invalid token')
      throw AuthExceptions.invalidToken()
    }

    if (resetToken.expiresAt < new Date()) {
      this.logger.warn('Password reset failed: Token expired')
      throw AuthExceptions.tokenExpired()
    }

    const hashedPassword = await this.passwordService.hash(newPassword)
    await this.userRepository.update(resetToken.userId, {
      password: hashedPassword,
    })
    await this.resetTokenRepository.update(resetToken.id, { used: true })

    this.eventEmitter.emit('auth.password_reset_completed', {
      userId: resetToken.userId,
    })
    this.logger.log(`Password reset successful for user: ${resetToken.userId}`)

    return { message: 'Password reset successfully' }
  }

  /**
   * Request password setup for OAuth-only users
   * Uses pessimistic lock to prevent race conditions
   */
  async requestPasswordSetup(
    userId: string,
    ipAddress?: string,
    deviceInfo?: Record<string, string | undefined>
  ): Promise<{ message: string; code: string }> {
    this.logger.log(
      `Password setup request: userId=${userId}, ip=${ipAddress || 'unknown'}`
    )

    // Use pessimistic read lock to prevent race conditions
    const user = await this.userRepository
      .createQueryBuilder('user')
      .setLock('pessimistic_read')
      .where('user.id = :userId', { userId })
      .select(['user.id', 'user.email', 'user.password'])
      .getOne()

    if (!user) {
      this.logger.warn(
        `Password setup failed: User not found - userId=${userId}`
      )
      throw AuthExceptions.userNotFound()
    }

    if (user.password) {
      this.logger.warn(
        `Password setup failed: Password already set - userId=${userId}`
      )
      throw AuthExceptions.passwordAlreadySet()
    }

    // Rate limit - 5 minute cooldown
    const existingToken = await this.resetTokenRepository.findOne({
      where: { userId: user.id, used: false },
      order: { createdAt: 'DESC' },
    })

    if (existingToken) {
      const TOKEN_COOLDOWN_MS = 5 * 60 * 1000
      const tokenAge = Date.now() - existingToken.createdAt.getTime()
      if (
        tokenAge < TOKEN_COOLDOWN_MS &&
        existingToken.expiresAt > new Date()
      ) {
        this.logger.log(`Password setup throttled: userId=${userId}`)
        return {
          message: 'Password setup email sent. Check your inbox.',
          code: 'PASSWORD_SETUP_EMAIL_SENT',
        }
      }
    }

    await this.sendResetEmail(user, PASSWORD_SETUP_EXPIRY_MS, true)
    this.eventEmitter.emit('auth.password_setup_requested', {
      userId,
      ip: ipAddress,
      userAgent: deviceInfo?.userAgent,
    })

    this.logger.log(`Password setup email sent: userId=${userId}`)

    return {
      message: 'Password setup email sent. Check your inbox.',
      code: 'PASSWORD_SETUP_EMAIL_SENT',
    }
  }

  /**
   * Check if user has password set
   */
  async userHasPassword(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    })
    return !!user?.password
  }

  /**
   * Send reset/setup email with token
   */
  private async sendResetEmail(
    user: Pick<User, 'id' | 'email'>,
    expiryMs: number,
    isSetup: boolean
  ): Promise<void> {
    const token = this.passwordService.generateToken()
    const tokenHash = this.passwordService.hashToken(token)

    await this.resetTokenRepository.save(
      this.resetTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + expiryMs),
        used: false,
      })
    )
    this.logger.log(`Reset token created for user: ${user.id}`)

    try {
      if (isSetup) {
        await this.emailService.sendPasswordSetupEmail(user.email, token)
      } else {
        await this.emailService.sendPasswordResetEmail(user.email, token)
      }
    } catch (error) {
      this.logger.error(
        `Failed to send reset email for user: ${user.id}`,
        error
      )
    }
  }
}
