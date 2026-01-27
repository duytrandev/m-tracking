import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, Profile } from 'passport-github2'
import { ConfigService } from '@nestjs/config'
import { OAuthProfile } from '../services/oauth.service'

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
    const { id, username, displayName, emails, photos } = profile
    const typedEmails = emails as GitHubEmail[] | undefined

    // GitHub primary email
    const primaryEmail =
      typedEmails?.find(e => e.primary)?.value || typedEmails?.[0]?.value || ''

    const user: OAuthProfile = {
      provider: 'github',
      providerId: id,
      email: primaryEmail,
      emailVerified: typedEmails?.find(e => e.primary)?.verified || false,
      name: displayName || username || '',
      avatar: photos?.[0]?.value || null,
      accessToken,
      refreshToken: refreshToken || null,
    }

    done(null, user)
  }
}
