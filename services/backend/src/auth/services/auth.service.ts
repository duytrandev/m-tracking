import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { EmailVerificationToken } from '../entities/email-verification-token.entity'
import { PasswordResetToken } from '../entities/password-reset-token.entity'
import { Role } from '../entities/role.entity'
import { RegisterDto } from '../dto/register.dto'
import { PasswordService } from './password.service'
import { EmailService } from './email.service'
import { TokenService } from './token.service'
import { SessionService } from './session.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(EmailVerificationToken)
    private verificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    private passwordService: PasswordService,
    private emailService: EmailService,
    private tokenService: TokenService,
    private sessionService: SessionService
  ) {}

  /**
   * Register new user with email/password
   * @param dto Registration data
   * @returns Success message
   */
  async register(dto: RegisterDto): Promise<{ message: string }> {
    this.logger.log(`Registration attempt for email: ${dto.email}`)

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    })

    if (existingUser) {
      this.logger.warn(`Registration failed: Email ${dto.email} already exists`)
      throw new ConflictException('Email already registered')
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(dto.password)

    // Create user
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      emailVerified: false,
    })

    await this.userRepository.save(user)
    this.logger.log(`User created: ${user.id}`)

    // Assign default 'user' role
    const userRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    })

    if (userRole) {
      user.roles = [userRole]
      await this.userRepository.save(user)
      this.logger.log(`Default role assigned to user: ${user.id}`)
    }

    // Generate verification token
    const token = this.passwordService.generateToken()
    const tokenHash = this.passwordService.hashToken(token)

    const verificationToken = this.verificationTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      used: false,
    })

    await this.verificationTokenRepository.save(verificationToken)
    this.logger.log(`Verification token created for user: ${user.id}`)

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, token)
    } catch (error) {
      this.logger.error(
        `Failed to send verification email for user: ${user.id}`,
        error
      )
      // Don't throw error - user is created, they can request new verification email
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    }
  }

  /**
   * Verify user email with token
   * @param token Verification token from email
   * @returns Success message
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
      throw new NotFoundException('Invalid or expired verification token')
    }

    if (verificationToken.expiresAt < new Date()) {
      this.logger.warn('Email verification failed: Token expired')
      throw new UnauthorizedException('Verification token expired')
    }

    // Mark user as verified
    await this.userRepository.update(verificationToken.userId, {
      emailVerified: true,
    })

    // Mark token as used
    await this.verificationTokenRepository.update(verificationToken.id, {
      used: true,
    })

    this.logger.log(`Email verified for user: ${verificationToken.userId}`)

    return { message: 'Email verified successfully' }
  }

  /**
   * Validate user credentials for login
   * @param email User email
   * @param password User password
   * @returns User if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    this.logger.log(`Login attempt for email: ${email}`)

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'emailVerified', 'avatar'],
      relations: ['roles'],
    })

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${email}`)
      return null
    }

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.password
    )

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${email}`)
      return null
    }

    if (!user.emailVerified) {
      this.logger.warn(`Login failed: Email not verified - ${email}`)
      throw new UnauthorizedException('Please verify your email first')
    }

    this.logger.log(`Login successful for user: ${user.id}`)

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user

    return userWithoutPassword as User
  }

  /**
   * Request password reset
   * @param email User email
   * @returns Success message
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    this.logger.log(`Password reset request for email: ${email}`)

    const user = await this.userRepository.findOne({ where: { email } })

    if (!user) {
      // Don't reveal if email exists (security best practice)
      this.logger.log(
        `Password reset requested for non-existent email: ${email}`
      )
      return { message: 'If the email exists, a reset link has been sent.' }
    }

    // Generate reset token
    const token = this.passwordService.generateToken()
    const tokenHash = this.passwordService.hashToken(token)

    const resetToken = this.resetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      used: false,
    })

    await this.resetTokenRepository.save(resetToken)
    this.logger.log(`Password reset token created for user: ${user.id}`)

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, token)
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email for user: ${user.id}`,
        error
      )
      // Don't throw error - generic message for security
    }

    return { message: 'If the email exists, a reset link has been sent.' }
  }

  /**
   * Reset password with token
   * @param token Reset token from email
   * @param newPassword New password
   * @returns Success message
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
      throw new NotFoundException('Invalid or expired reset token')
    }

    if (resetToken.expiresAt < new Date()) {
      this.logger.warn('Password reset failed: Token expired')
      throw new UnauthorizedException('Reset token expired')
    }

    // Hash new password
    const hashedPassword = await this.passwordService.hash(newPassword)

    // Update user password
    await this.userRepository.update(resetToken.userId, {
      password: hashedPassword,
    })

    // Mark token as used
    await this.resetTokenRepository.update(resetToken.id, {
      used: true,
    })

    this.logger.log(`Password reset successful for user: ${resetToken.userId}`)

    return { message: 'Password reset successfully' }
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns User
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    })
  }

  /**
   * Get user by email
   * @param email User email
   * @returns User
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    })
  }

  /**
   * Login user and generate JWT tokens
   */
  async login(
    user: User,
    deviceInfo: Record<string, string | string[] | number | boolean | null | undefined>,
    ipAddress: string
  ) {
    this.logger.log(`Generating tokens for user: ${user.id}`)

    // Generate access and refresh tokens
    const refreshToken = this.tokenService.generateRefreshToken(user.id, '', 1)

    // Create session with refresh token
    const session = await this.sessionService.createSession(
      user.id,
      refreshToken,
      deviceInfo,
      ipAddress
    )

    // Regenerate tokens with actual session ID
    const finalAccessToken = this.tokenService.generateAccessToken(
      user,
      session.id
    )
    const finalRefreshToken = this.tokenService.generateRefreshToken(
      user.id,
      session.id,
      1
    )

    // Update session with final refresh token
    await this.sessionService.updateRefreshToken(session.id, finalRefreshToken)

    return {
      accessToken: finalAccessToken,
      refreshToken: finalRefreshToken,
      expiresIn: 900, // 15 minutes in seconds
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
  async refresh(refreshToken: string) {
    this.logger.log('Token refresh attempt')

    // Verify refresh token
    const decoded = await this.tokenService.verifyRefreshToken(refreshToken)

    // Find session
    const session = await this.sessionService.findByRefreshToken(refreshToken)
    if (!session) {
      this.logger.warn('Refresh failed: Session not found')
      throw new UnauthorizedException('Invalid session')
    }

    // Check session expiration
    if (session.expiresAt < new Date()) {
      this.logger.warn('Refresh failed: Session expired')
      await this.sessionService.revokeSession(session.id)
      throw new UnauthorizedException('Session expired')
    }

    // Get user
    const user = await this.findById(decoded.sub)
    if (!user) {
      this.logger.warn('Refresh failed: User not found')
      throw new UnauthorizedException('User not found')
    }

    // Blacklist old refresh token
    await this.tokenService.blacklistRefreshToken(refreshToken, user.id)

    // Generate new tokens (rotation)
    const newAccessToken = this.tokenService.generateAccessToken(
      user,
      session.id
    )
    const newRefreshToken = this.tokenService.generateRefreshToken(
      user.id,
      session.id,
      decoded.tokenVersion + 1
    )

    // Update session with new refresh token
    await this.sessionService.updateRefreshToken(session.id, newRefreshToken)

    this.logger.log(`Tokens refreshed for user: ${user.id}`)

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    }
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(
    userId: string,
    refreshToken?: string,
    accessToken?: string
  ): Promise<void> {
    this.logger.log(`Logout attempt for user: ${userId}`)

    // Blacklist access token if provided
    if (accessToken) {
      await this.tokenService.blacklistAccessToken(accessToken, userId)
    }

    // Blacklist refresh token and revoke session if provided
    if (refreshToken) {
      await this.tokenService.blacklistRefreshToken(refreshToken, userId)

      const session = await this.sessionService.findByRefreshToken(refreshToken)
      if (session) {
        await this.sessionService.revokeSession(session.id)
      }
    }

    this.logger.log(`Logout successful for user: ${userId}`)
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(userId: string): Promise<void> {
    this.logger.log(`Logout all devices for user: ${userId}`)

    // Revoke all sessions
    await this.sessionService.revokeAllUserSessions(userId)

    this.logger.log(`All devices logged out for user: ${userId}`)
  }
}
