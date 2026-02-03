import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Query,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { OAuthService, OAuthProfile } from '../services/oauth.service'
import { CryptoService } from '../../shared/crypto/crypto.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { GoogleAuthGuard } from '../guards/google-auth.guard'
import { CurrentUser } from '../decorators/current-user.decorator'
import { Public } from '../decorators/public.decorator'
import { RedisService } from '../../shared/redis/redis.service'
import { OAuthExchangeDto } from '../dto'
import { AuthExceptions } from '../../common/exceptions'

interface OAuthRequest {
  user: OAuthProfile
  headers: Record<string, string | string[] | undefined>
  ip?: string
  connection?: { remoteAddress?: string }
}

/**
 * OAuth Controller
 * Handles OAuth redirect and callback endpoints for all providers
 * Uses authorization code pattern to avoid token exposure in URLs
 */
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name)

  constructor(
    private oauthService: OAuthService,
    private configService: ConfigService,
    private redisService: RedisService,
    private cryptoService: CryptoService
  ) {}

  /**
   * Generate cryptographically secure authorization code
   */
  private generateAuthCode(): string {
    return this.cryptoService.generateSecureToken()
  }

  /**
   * Google OAuth - Redirect to Google login
   * Uses GoogleAuthGuard to force account selection prompt
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Query('redirect') _redirect?: string) {
    // Guard redirects to Google OAuth with prompt=select_account
  }

  /**
   * Google OAuth - Callback handler
   * Uses authorization code pattern: stores token in Redis, redirects with code only
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    try {
      const result = await this.oauthService.handleOAuthCallback(req.user, req)
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')
      const isProd = this.configService.get<string>('NODE_ENV') === 'production'

      // Set refresh token in httpOnly cookie (same as email/password login)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      })

      // Generate authorization code and store access token in Redis
      // This prevents token exposure in URLs (browser history, logs, referrer)
      const authCode = this.generateAuthCode()
      await this.redisService.storeOAuthCode(authCode, {
        accessToken: result.accessToken,
        userId: result.user.id,
      })

      this.logger.log(`OAuth code generated for user: ${result.user.id}`)

      // Redirect to frontend with code only (not the actual token)
      const redirectUrl = `${frontendUrl}/auth/oauth/callback?code=${authCode}`
      return res.redirect(redirectUrl)
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')
      const errorUrl = `${frontendUrl}/auth/oauth/callback?error=${encodeURIComponent((error as Error).message)}`
      return res.redirect(errorUrl)
    }
  }

  /**
   * GitHub OAuth - Redirect to GitHub login
   */
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth(@Query('redirect') _redirect?: string) {
    // Guard redirects to GitHub OAuth
  }

  /**
   * GitHub OAuth - Callback handler
   * Uses authorization code pattern: stores token in Redis, redirects with code only
   */
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    try {
      const result = await this.oauthService.handleOAuthCallback(req.user, req)
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')
      const isProd = this.configService.get<string>('NODE_ENV') === 'production'

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      })

      // Generate authorization code and store access token in Redis
      const authCode = this.generateAuthCode()
      await this.redisService.storeOAuthCode(authCode, {
        accessToken: result.accessToken,
        userId: result.user.id,
      })

      this.logger.log(`OAuth code generated for user: ${result.user.id}`)

      const redirectUrl = `${frontendUrl}/auth/oauth/callback?code=${authCode}`
      return res.redirect(redirectUrl)
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')
      const errorUrl = `${frontendUrl}/auth/oauth/callback?error=${encodeURIComponent((error as Error).message)}`
      return res.redirect(errorUrl)
    }
  }

  /**
   * Facebook OAuth - Redirect to Facebook login
   */
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(@Query('redirect') _redirect?: string) {
    // Guard redirects to Facebook OAuth
  }

  /**
   * Facebook OAuth - Callback handler
   * Uses authorization code pattern: stores token in Redis, redirects with code only
   */
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    try {
      const result = await this.oauthService.handleOAuthCallback(req.user, req)
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')
      const isProd = this.configService.get<string>('NODE_ENV') === 'production'

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      })

      // Generate authorization code and store access token in Redis
      const authCode = this.generateAuthCode()
      await this.redisService.storeOAuthCode(authCode, {
        accessToken: result.accessToken,
        userId: result.user.id,
      })

      this.logger.log(`OAuth code generated for user: ${result.user.id}`)

      const redirectUrl = `${frontendUrl}/auth/oauth/callback?code=${authCode}`
      return res.redirect(redirectUrl)
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')
      const errorUrl = `${frontendUrl}/auth/oauth/callback?error=${encodeURIComponent((error as Error).message)}`
      return res.redirect(errorUrl)
    }
  }

  /**
   * Exchange OAuth authorization code for access token
   * POST /auth/oauth/exchange
   * Single-use code expires in 60 seconds
   */
  @Public()
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  async exchangeCode(@Body() dto: OAuthExchangeDto) {
    this.logger.log('OAuth code exchange attempt')

    // Consume the code (single-use, deleted after retrieval)
    const tokenData = await this.redisService.consumeOAuthCode(dto.code)

    if (!tokenData) {
      this.logger.warn('OAuth code exchange failed: Invalid or expired code')
      throw AuthExceptions.invalidToken()
    }

    this.logger.log(`OAuth code exchanged for user: ${tokenData.userId}`)

    return {
      accessToken: tokenData.accessToken,
      expiresIn: 900, // 15 minutes
    }
  }

  /**
   * Get linked OAuth accounts for current user
   */
  @Get('oauth/accounts')
  @UseGuards(JwtAuthGuard)
  async getLinkedAccounts(@CurrentUser('userId') userId: string) {
    const accounts = await this.oauthService.getLinkedAccounts(userId)
    return {
      accounts: accounts.map(account => ({
        id: account.id,
        provider: account.provider,
        email: account.providerEmail,
        linkedAt: account.createdAt,
      })),
    }
  }

  /**
   * Unlink OAuth account
   */
  @Delete('oauth/accounts/:provider')
  @UseGuards(JwtAuthGuard)
  async unlinkAccount(
    @CurrentUser('userId') userId: string,
    @Param('provider') provider: string
  ) {
    await this.oauthService.unlinkOAuthAccount(userId, provider)
    return {
      message: `${provider} account unlinked successfully`,
    }
  }
}
