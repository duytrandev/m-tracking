import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, Profile } from 'passport-facebook'
import { ConfigService } from '@nestjs/config'
import { OAuthProfile } from '../services/oauth.service'

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
    const { id, emails, name, photos } = profile

    const firstName = name?.givenName || ''
    const lastName = name?.familyName || ''
    const user: OAuthProfile = {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value || '',
      emailVerified: false, // Facebook doesn't provide verification status
      name: `${firstName} ${lastName}`.trim(),
      avatar: photos?.[0]?.value || null,
      accessToken,
      refreshToken: refreshToken || null,
    }

    done(null, user)
  }
}
