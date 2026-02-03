import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, Profile } from 'passport-github2'
import { ConfigService } from '@nestjs/config'
import { OAuthProfile } from '../services/oauth.service'
import {
  mapOAuthProfile,
  toPassportProfile,
} from '../utils/oauth-profile-mapper.util'

interface GitHubEmail {
  value: string
  primary: boolean
  verified: boolean
}

type DoneCallback = (error: Error | null, user?: OAuthProfile | false) => void

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
      // Note: GitHub OAuth doesn't support prompt=select_account like Google
      // Users will need to manually log out of GitHub or use a different browser
      // to switch accounts after logout
    })
  }

  /**
   * Validate callback after GitHub authenticates user
   * Returns sanitized user profile for OAuthService
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: DoneCallback
  ): void {
    const passportProfile = toPassportProfile({
      ...profile,
      username: profile.username,
    })
    const user = mapOAuthProfile(accessToken, refreshToken, passportProfile, {
      provider: 'github',
      extractEmailVerified: p => {
        const typedEmails = p.emails as GitHubEmail[] | undefined
        return typedEmails?.find(e => e.primary)?.verified || false
      },
      extractName: p => p.displayName || p.username || '',
    })

    done(null, user)
  }
}
