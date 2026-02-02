import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { AuthExceptions } from '../../common/exceptions'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { Public } from '../decorators/public.decorator'
import { CurrentUser } from '../decorators/current-user.decorator'

interface JwtPayload {
  userId: string
  email: string
}

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register new user
   * POST /auth/register
   * Rate limit: 5 requests per minute
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  /**
   * Verify email with token
   * POST /auth/verify-email
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token)
  }

  /**
   * Login with email and password
   * POST /auth/login
   * Returns access token + sets refresh token in httpOnly cookie
   * Rate limit: 5 requests per minute to prevent brute force
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.authService.validateUser(
      dto.identifier,
      dto.password
    )

    if (!user) {
      throw AuthExceptions.invalidCredentials()
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'] || 'unknown',
    }
    const ipAddress = req.ip || 'unknown'

    const tokens = await this.authService.login(user, deviceInfo, ipAddress)

    // Set refresh token in httpOnly cookie
    // If rememberMe is true, extend the cookie expiration to 30 days, otherwise use 7 days
    const cookieMaxAge = dto.rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 7 * 24 * 60 * 60 * 1000 // 7 days

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: cookieMaxAge,
    })

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      user: tokens.user,
    }
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   * Reads refresh token from cookie, returns new access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = (req.cookies as Record<string, string> | undefined)
      ?.refreshToken

    if (!refreshToken) {
      throw AuthExceptions.refreshTokenMissing()
    }

    const tokens = await this.authService.refresh(refreshToken)

    // Set new refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    }
  }

  /**
   * Logout
   * POST /auth/logout
   * Blacklists tokens and revokes session
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = (req.cookies as Record<string, string> | undefined)
      ?.refreshToken
    const accessToken = req.headers.authorization?.split(' ')[1]

    await this.authService.logout(user.userId, refreshToken, accessToken)

    res.clearCookie('refreshToken')

    return { message: 'Logged out successfully' }
  }

  /**
   * Get current user profile
   * GET /auth/me
   * Returns hasPassword flag to detect OAuth-only users
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('userId') userId: string) {
    const user = await this.authService.findById(userId)
    if (!user) {
      throw AuthExceptions.userNotFound()
    }

    // Check password status separately (password not included in default select)
    const hasPassword = await this.authService.userHasPassword(userId)

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      hasPassword,
    }
  }

  /**
   * Request password reset
   * POST /auth/forgot-password
   * Rate limit: 3 requests per minute to prevent email enumeration
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email)
  }

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password)
  }

  /**
   * Request password setup for OAuth users
   * POST /auth/add-password/request
   * Rate limit: 3 requests per minute
   */
  @Post('add-password/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestAddPassword(
    @CurrentUser('userId') userId: string,
    @Req() req: Request
  ) {
    const ipAddress = req.ip || 'unknown'
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'] as string | undefined,
    }
    return this.authService.requestPasswordSetup(userId, ipAddress, deviceInfo)
  }
}
