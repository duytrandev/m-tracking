import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20'
import { ConfigService } from '@nestjs/config'

interface OAuthUserProfile {
  provider: string
  providerId: string
  email: string
  emailVerified: boolean
  name: string
  avatar: string | null
  accessToken: string
  refreshToken: string | null
}

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
    const { id, emails, displayName, photos } = profile

    const email = emails?.[0]?.value ?? ''
    const emailVerified = emails?.[0]?.verified ?? false
    const avatarUrl = photos?.[0]?.value ?? null

    const user: OAuthUserProfile = {
      provider: 'google',
      providerId: id,
      email,
      emailVerified,
      name: displayName ?? '',
      avatar: avatarUrl,
      accessToken,
      refreshToken: refreshToken ?? null,
    }

    done(null, user)
  }
}
