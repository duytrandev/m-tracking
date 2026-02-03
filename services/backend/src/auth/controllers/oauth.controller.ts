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
import { verifyCodeChallenge } from '../utils/pkce.util'

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
   * Unified OAuth callback handler - DRY shared logic
   * Eliminates 270+ lines of duplicated code across providers
   */
  private async unifiedOAuthCallback(
    profile: OAuthProfile,
    req: OAuthRequest,
    res: Response,
    provider: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL')
    const isProd = this.configService.get<string>('NODE_ENV') === 'production'

    try {
      const result = await this.oauthService.handleOAuthCallback(profile, req)

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      })

      // Generate single-use auth code (token stored in Redis, not URL)
      const authCode = this.generateAuthCode()
      await this.redisService.storeOAuthCode(authCode, {
        accessToken: result.accessToken,
        userId: result.user.id,
      })

      this.logger.log(`OAuth ${provider} success for user: ${result.user.id}`)
      res.redirect(`${frontendUrl}/auth/oauth/callback?code=${authCode}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed'
      this.logger.error(`OAuth ${provider} failed: ${message}`)
      res.redirect(
        `${frontendUrl}/auth/oauth/callback?error=${encodeURIComponent(message)}`
      )
    }
  }

  /**
   * Store PKCE challenge if provided (before OAuth redirect)
   * Called by auth endpoints to persist state for callback verification
   */
  private async storePkceIfPresent(
    codeChallenge?: string,
    state?: string
  ): Promise<void> {
    if (codeChallenge && state) {
      await this.redisService.storeOAuthState(state, {
        challenge: codeChallenge,
      })
      this.logger.log('PKCE state stored for OAuth flow')
    }
  }

  // =========================================
  // Google OAuth
  // =========================================

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(
    @Query('code_challenge') codeChallenge?: string,
    @Query('state') state?: string
  ) {
    await this.storePkceIfPresent(codeChallenge, state)
    // Guard redirects to Google OAuth with prompt=select_account
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.unifiedOAuthCallback(req.user, req, res, 'google')
  }

  // =========================================
  // GitHub OAuth
  // =========================================

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth(
    @Query('code_challenge') codeChallenge?: string,
    @Query('state') state?: string
  ) {
    await this.storePkceIfPresent(codeChallenge, state)
    // Guard redirects to GitHub OAuth
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.unifiedOAuthCallback(req.user, req, res, 'github')
  }

  // =========================================
  // Facebook OAuth
  // =========================================

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(
    @Query('code_challenge') codeChallenge?: string,
    @Query('state') state?: string
  ) {
    await this.storePkceIfPresent(codeChallenge, state)
    // Guard redirects to Facebook OAuth
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    return this.unifiedOAuthCallback(req.user, req, res, 'facebook')
  }

  /**
   * Exchange OAuth authorization code for access token
   * POST /auth/oauth/exchange
   * Single-use code expires in 60 seconds
   * Supports optional PKCE verification (RFC 7636)
   */
  @Public()
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  async exchangeCode(@Body() dto: OAuthExchangeDto) {
    this.logger.log('OAuth code exchange attempt')

    // Verify PKCE if code_verifier and state provided
    if (dto.codeVerifier && dto.state) {
      const storedState = await this.redisService.getOAuthState(dto.state)
      if (!storedState) {
        this.logger.warn('OAuth PKCE failed: Invalid or expired state')
        throw AuthExceptions.invalidToken()
      }
      if (!verifyCodeChallenge(dto.codeVerifier, storedState.challenge)) {
        this.logger.warn('OAuth PKCE failed: Challenge verification failed')
        throw AuthExceptions.invalidToken()
      }
      this.logger.log('PKCE verification successful')
    }

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
