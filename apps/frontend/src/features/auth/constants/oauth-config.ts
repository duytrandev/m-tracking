/**
 * OAuth provider configurations for UI rendering
 * Contains provider-specific styling and labels
 */

import type { OAuthProvider } from '@/types/api/auth'

export interface OAuthConfig {
  provider: OAuthProvider
  label: string
  icon: string
  bgColor: string
  textColor: string
  hoverBgColor: string
}

export const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig> = {
  google: {
    provider: 'google',
    label: 'Google',
    icon: 'google',
    bgColor: 'bg-white',
    textColor: 'text-gray-900',
    hoverBgColor: 'hover:bg-gray-50',
  },
  github: {
    provider: 'github',
    label: 'GitHub',
    icon: 'github',
    bgColor: 'bg-[#24292e]',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-[#2f363d]',
  },
  facebook: {
    provider: 'facebook',
    label: 'Facebook',
    icon: 'facebook',
    bgColor: 'bg-[#1877f2]',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-[#166fe5]',
  },
  apple: {
    provider: 'apple',
    label: 'Apple',
    icon: 'apple',
    bgColor: 'bg-black',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-gray-900',
  },
}
