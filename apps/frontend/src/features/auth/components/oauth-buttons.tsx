import * as React from 'react'
import { OAuthButton } from './oauth-button'
import { useOAuth } from '../hooks/use-oauth'
import type { OAuthProvider } from '@/types/api/auth'

interface OAuthButtonsProps {
  providers?: OAuthProvider[]
  disabled?: boolean
}

export function OAuthButtons({
  providers = ['google'], // Only Google implemented for now
  disabled = false,
}: OAuthButtonsProps): React.ReactElement {
  const { initiateOAuth, isLoading } = useOAuth()

  // Check feature flags
  const enableOAuth = process.env.NEXT_PUBLIC_ENABLE_OAUTH !== 'false'

  if (!enableOAuth) {
    return <></>
  }

  // Use responsive grid: 1 col for single provider, 2 cols for multiple
  const gridCols = providers.length === 1 ? 'grid-cols-1' : 'grid-cols-2'

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {providers.map(provider => (
        <OAuthButton
          key={provider}
          provider={provider}
          onClick={() => initiateOAuth(provider)}
          isLoading={isLoading}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
