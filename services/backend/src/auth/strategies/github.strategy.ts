import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

/**
 * GitHub OAuth Strategy
 * Handles GitHub authentication and returns user profile data
 */
@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
      state: true,
    });
  }

  /**
   * Validate callback after GitHub authenticates user
   * Returns sanitized user profile for OAuthService
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;

    // GitHub primary email
    const primaryEmail = emails?.find((e: any) => e.primary)?.value || emails?.[0]?.value;

    const user = {
      provider: 'github',
      providerId: id,
      email: primaryEmail,
      emailVerified: emails?.find((e: any) => e.primary)?.verified || false,
      name: displayName || username,
      avatar: photos?.[0]?.value || null,
      accessToken,
      refreshToken: refreshToken || null,
    };

    done(null, user);
  }
}
