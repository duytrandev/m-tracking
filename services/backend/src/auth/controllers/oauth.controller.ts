import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
  Delete,
  Param,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { OAuthService, OAuthProfile } from '../services/oauth.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { CurrentUser } from '../decorators/current-user.decorator'

interface OAuthRequest {
  user: OAuthProfile
  headers: Record<string, string | string[] | undefined>
  ip?: string
  connection?: { remoteAddress?: string }
}

/**
 * OAuth Controller
 * Handles OAuth redirect and callback endpoints for all providers
 */
@Controller('auth')
export class OAuthController {
  constructor(
    private oauthService: OAuthService,
    private configService: ConfigService
  ) {}

  /**
   * Google OAuth - Redirect to Google login
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Query('redirect') _redirect?: string) {
    // Guard redirects to Google OAuth
  }

  /**
   * Google OAuth - Callback handler
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
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
      })

      // Redirect to frontend with only access token (refresh token in cookie)
      const redirectUrl = `${frontendUrl}/auth/oauth/callback?accessToken=${result.accessToken}`
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
      })

      const redirectUrl = `${frontendUrl}/auth/oauth/callback?accessToken=${result.accessToken}`
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
      })

      const redirectUrl = `${frontendUrl}/auth/oauth/callback?accessToken=${result.accessToken}`
      return res.redirect(redirectUrl)
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')
      const errorUrl = `${frontendUrl}/auth/oauth/callback?error=${encodeURIComponent((error as Error).message)}`
      return res.redirect(errorUrl)
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
