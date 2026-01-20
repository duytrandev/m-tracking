import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { OAuthService } from '../services/oauth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * OAuth Controller
 * Handles OAuth redirect and callback endpoints for all providers
 */
@Controller('auth')
export class OAuthController {
  constructor(
    private oauthService: OAuthService,
    private configService: ConfigService,
  ) {}

  /**
   * Google OAuth - Redirect to Google login
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Query('redirect') redirect?: string) {
    // Guard redirects to Google OAuth
  }

  /**
   * Google OAuth - Callback handler
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.oauthService.handleOAuthCallback(
        req.user,
        req,
      );

      // Redirect to frontend with tokens
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      // Redirect to frontend with error
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  }

  /**
   * GitHub OAuth - Redirect to GitHub login
   */
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth(@Query('redirect') redirect?: string) {
    // Guard redirects to GitHub OAuth
  }

  /**
   * GitHub OAuth - Callback handler
   */
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.oauthService.handleOAuthCallback(
        req.user,
        req,
      );

      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  }

  /**
   * Facebook OAuth - Redirect to Facebook login
   */
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(@Query('redirect') redirect?: string) {
    // Guard redirects to Facebook OAuth
  }

  /**
   * Facebook OAuth - Callback handler
   */
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.oauthService.handleOAuthCallback(
        req.user,
        req,
      );

      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  }

  /**
   * Get linked OAuth accounts for current user
   */
  @Get('oauth/accounts')
  @UseGuards(JwtAuthGuard)
  async getLinkedAccounts(@CurrentUser('id') userId: string) {
    const accounts = await this.oauthService.getLinkedAccounts(userId);
    return {
      accounts: accounts.map((account) => ({
        id: account.id,
        provider: account.provider,
        email: account.providerEmail,
        linkedAt: account.createdAt,
      })),
    };
  }

  /**
   * Unlink OAuth account
   */
  @Delete('oauth/accounts/:provider')
  @UseGuards(JwtAuthGuard)
  async unlinkAccount(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: string,
  ) {
    await this.oauthService.unlinkOAuthAccount(userId, provider);
    return {
      message: `${provider} account unlinked successfully`,
    };
  }
}
