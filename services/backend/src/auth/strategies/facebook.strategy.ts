import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, Profile } from 'passport-facebook'
import { ConfigService } from '@nestjs/config'
import { OAuthProfile } from '../services/oauth.service'
import {
  mapOAuthProfile,
  toPassportProfile,
} from '../utils/oauth-profile-mapper.util'

type DoneCallback = (error: Error | null, user?: OAuthProfile | false) => void

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
      // Force Facebook to always show login screen
      // This ensures users must explicitly authenticate after logout
      authType: 'reauthenticate',
    })
  }

  /**
   * Validate callback after Facebook authenticates user
   * Returns sanitized user profile for OAuthService
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: DoneCallback
  ): void {
    const passportProfile = toPassportProfile(profile)
    const user = mapOAuthProfile(accessToken, refreshToken, passportProfile, {
      provider: 'facebook',
      extractEmailVerified: () => false, // Facebook doesn't provide verification status
      extractName: p => {
        const firstName = p.name?.givenName || ''
        const lastName = p.name?.familyName || ''
        return `${firstName} ${lastName}`.trim()
      },
    })

    done(null, user)
  }
}
