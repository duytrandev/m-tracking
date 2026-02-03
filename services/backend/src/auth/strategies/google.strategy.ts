import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20'
import { ConfigService } from '@nestjs/config'
import {
  mapOAuthProfile,
  toPassportProfile,
} from '../utils/oauth-profile-mapper.util'

/**
 * Google OAuth 2.1 Strategy with PKCE support
 * Handles Google authentication and returns user profile data
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      // OAuth 2.1 features
      state: true,
      pkce: true,
      passReqToCallback: false,
      // Force Google to always show account selection screen
      // This ensures users must explicitly select their account after logout
      prompt: 'select_account',
    })
  }

  /**
   * Validate callback after Google authenticates user
   * Returns sanitized user profile for OAuthService
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): void {
    const passportProfile = toPassportProfile(profile)
    const user = mapOAuthProfile(accessToken, refreshToken, passportProfile, {
      provider: 'google',
      extractEmailVerified: p => p.emails?.[0]?.verified ?? false,
      extractName: p => p.displayName ?? '',
    })

    done(null, user)
  }
}
