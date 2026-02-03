import type { OAuthProfile } from '../services/oauth.service'

/**
 * Minimal profile interface matching passport Profile structure
 * Used to avoid direct passport dependency
 */
export interface PassportProfile {
  id: string
  displayName?: string
  emails?: Array<{ value: string; verified?: boolean }>
  photos?: Array<{ value: string }>
  name?: {
    givenName?: string
    familyName?: string
  }
  username?: string
}

/**
 * Convert any passport profile to PassportProfile type safely
 */
export function toPassportProfile(profile: {
  id: string
  displayName?: string
  emails?: Array<{ value: string; verified?: boolean }>
  photos?: Array<{ value: string }>
  name?: { givenName?: string; familyName?: string }
  username?: string
}): PassportProfile {
  return {
    id: profile.id,
    displayName: profile.displayName,
    emails: profile.emails,
    photos: profile.photos,
    name: profile.name,
    username: profile.username,
  }
}

/**
 * OAuth profile mapping configuration
 * Allows provider-specific customization while sharing common logic
 */
export interface OAuthProfileMappingConfig {
  provider: string
  extractEmailVerified: (profile: PassportProfile) => boolean
  extractName: (profile: PassportProfile) => string
}

/**
 * Map OAuth provider profile to standardized OAuthProfile
 * Eliminates duplicate profile mapping logic across OAuth strategies
 *
 * @param accessToken OAuth access token
 * @param refreshToken OAuth refresh token (optional)
 * @param profile Provider profile data
 * @param config Provider-specific mapping configuration
 * @returns Standardized OAuthProfile
 */
export function mapOAuthProfile(
  accessToken: string,
  refreshToken: string | null,
  profile: PassportProfile,
  config: OAuthProfileMappingConfig
): OAuthProfile {
  const { id, emails, photos } = profile

  return {
    provider: config.provider,
    providerId: id,
    email: emails?.[0]?.value || '',
    emailVerified: config.extractEmailVerified(profile),
    name: config.extractName(profile),
    avatar: photos?.[0]?.value || null,
    accessToken,
    refreshToken: refreshToken || null,
  }
}
