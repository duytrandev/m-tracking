import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth 2.1 Strategy with PKCE support
 * Handles Google authentication and returns user profile data
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      // OAuth 2.1 features
      state: true,
      pkce: true,
      passReqToCallback: false,
    });
  }

  /**
   * Validate callback after Google authenticates user
   * Returns sanitized user profile for OAuthService
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const user = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      emailVerified: emails[0].verified,
      name: displayName,
      avatar: photos[0]?.value || null,
      accessToken,
      refreshToken: refreshToken || null,
    };

    done(null, user);
  }
}
