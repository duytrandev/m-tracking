import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

/**
 * Facebook OAuth Strategy
 * Handles Facebook authentication and returns user profile data
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID'),
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      enableProof: true,
      state: true,
    });
  }

  /**
   * Validate callback after Facebook authenticates user
   * Returns sanitized user profile for OAuthService
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { id, emails, name, photos } = profile;

    const user = {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value || null,
      emailVerified: false, // Facebook doesn't provide verification status
      name: `${name.givenName} ${name.familyName}`.trim(),
      avatar: photos?.[0]?.value || null,
      accessToken,
      refreshToken: refreshToken || null,
    };

    done(null, user);
  }
}
