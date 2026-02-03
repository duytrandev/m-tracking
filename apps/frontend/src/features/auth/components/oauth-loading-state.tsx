'use client'

import { Loader2 } from 'lucide-react'
import { getProviderDisplayName } from '../utils/error-humanizer'

type OAuthStage = 'connecting' | 'completing'

interface OAuthLoadingStateProps {
  provider: string
  stage: OAuthStage
}

/**
 * Loading state component for OAuth flows
 * Shows contextual messages during redirect and code exchange
 */
export function OAuthLoadingState({ provider, stage }: OAuthLoadingStateProps) {
  const providerName = getProviderDisplayName(provider)

  const messages: Record<OAuthStage, { primary: string; secondary?: string }> =
    {
      connecting: {
        primary: `Connecting to ${providerName}...`,
        secondary: `You'll be redirected to ${providerName} to sign in`,
      },
      completing: {
        primary: 'Completing sign in...',
        secondary: 'Please wait while we verify your account',
      },
    }

  const { primary, secondary } = messages[stage]

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[200px] gap-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="h-8 w-8 animate-spin text-primary"
        aria-hidden="true"
      />
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">{primary}</p>
        {secondary && (
          <p className="text-xs text-muted-foreground">{secondary}</p>
        )}
      </div>
    </div>
  )
}
