import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AuthExceptions } from '../../common/exceptions'
import { User } from '../entities/user.entity'
import { Role } from '../entities/role.entity'
import { EmailVerificationToken } from '../entities/email-verification-token.entity'
import { PasswordResetToken } from '../entities/password-reset-token.entity'
import { PasswordService } from './password.service'
import { EmailService } from './email.service'
import { RegisterDto } from '../dto/register.dto'
import { EMAIL_VERIFICATION_EXPIRY_MS } from '../constants'

/**
 * Registration Service
 * Handles user registration, email verification, and verification email resend
 * Extracted from AuthService following SRP
 */
@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name)

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(EmailVerificationToken)
    private verificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    private passwordService: PasswordService,
    private emailService: EmailService,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * Register new user with email/password
   * For OAuth-only users, sends password setup email
   */
  async register(
    dto: RegisterDto
  ): Promise<{ message: string; code?: string }> {
    this.logger.log(`Registration attempt for: ${dto.email}`)

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password'],
    })

    if (existingUser) {
      if (!existingUser.password) {
        this.logger.log(
          `OAuth user ${dto.email} - emitting password setup event`
        )
        this.eventEmitter.emit('auth.oauth_user_register_attempt', {
          userId: existingUser.id,
          email: dto.email,
        })

        // Generate password setup token
        const token = this.passwordService.generateToken()
        const tokenHash = this.passwordService.hashToken(token)

        await this.resetTokenRepository.save(
          this.resetTokenRepository.create({
            userId: existingUser.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            used: false,
          })
        )

        try {
          await this.emailService.sendPasswordSetupEmail(dto.email, token)
        } catch (error) {
          this.logger.error(
            `Failed to send password setup email: ${dto.email}`,
            error
          )
        }

        return {
          message: 'Password setup email sent. Please check your inbox.',
          code: 'PASSWORD_SETUP_EMAIL_SENT',
        }
      }

      this.logger.warn(`Registration failed: Email ${dto.email} already exists`)
      throw AuthExceptions.emailAlreadyRegistered()
    }

    // Hash password and create user
    const hashedPassword = await this.passwordService.hash(dto.password)
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      emailVerified: false,
    })
    await this.userRepository.save(user)
    this.logger.log(`User created: ${user.id}`)

    // Assign default role
    const userRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    })
    if (userRole) {
      user.roles = [userRole]
      await this.userRepository.save(user)
    }

    // Send verification email
    await this.sendVerificationEmail(user)

    this.eventEmitter.emit('auth.registered', {
      userId: user.id,
      email: user.email,
    })

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    }
  }

  /**
   * Verify user email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    this.logger.log('Email verification attempt')

    const tokenHash = this.passwordService.hashToken(token)
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: { tokenHash, used: false },
      relations: ['user'],
    })

    if (!verificationToken) {
      this.logger.warn('Email verification failed: Invalid token')
      throw AuthExceptions.invalidToken()
    }

    if (verificationToken.expiresAt < new Date()) {
      this.logger.warn('Email verification failed: Token expired')
      throw AuthExceptions.tokenExpired()
    }

    await this.userRepository.update(verificationToken.userId, {
      emailVerified: true,
    })
    await this.verificationTokenRepository.update(verificationToken.id, {
      used: true,
    })

    this.eventEmitter.emit('auth.email_verified', {
      userId: verificationToken.userId,
    })
    this.logger.log(`Email verified for user: ${verificationToken.userId}`)

    return { message: 'Email verified successfully' }
  }

  /**
   * Resend verification email with rate limiting
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    this.logger.log(`Resend verification request for: ${email}`)

    const genericResponse = {
      message:
        'If the email exists and is unverified, a new link has been sent.',
    }

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'emailVerified'],
    })

    if (!user || user.emailVerified) {
      return genericResponse
    }

    // Rate limit check - 1 minute cooldown
    const existingToken = await this.verificationTokenRepository.findOne({
      where: { userId: user.id, used: false },
      order: { createdAt: 'DESC' },
    })

    if (existingToken) {
      const TOKEN_COOLDOWN_MS = 60 * 1000
      const tokenAge = Date.now() - existingToken.createdAt.getTime()
      if (
        tokenAge < TOKEN_COOLDOWN_MS &&
        existingToken.expiresAt > new Date()
      ) {
        this.logger.log(`Resend verification throttled: ${email}`)
        return genericResponse
      }
    }

    // Invalidate old tokens
    await this.verificationTokenRepository.update(
      { userId: user.id, used: false },
      { used: true }
    )

    await this.sendVerificationEmail(user)
    return genericResponse
  }

  /**
   * Send verification email with new token
   */
  private async sendVerificationEmail(
    user: Pick<User, 'id' | 'email'>
  ): Promise<void> {
    const token = this.passwordService.generateToken()
    const tokenHash = this.passwordService.hashToken(token)

    await this.verificationTokenRepository.save(
      this.verificationTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
        used: false,
      })
    )
    this.logger.log(`Verification token created for user: ${user.id}`)

    try {
      await this.emailService.sendVerificationEmail(user.email, token)
    } catch (error) {
      this.logger.error(
        `Failed to send verification email for user: ${user.id}`,
        error
      )
    }
  }
}
