'use client'

import { AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '@/features/auth/components/auth-card'
import { Button } from '@/components/ui/button'
import { useOAuthCallback } from '@/features/auth/hooks/use-oauth'
import { OAuthLoadingState } from '@/features/auth/components/oauth-loading-state'

/**
 * OAuth Callback Page
 * Handles OAuth provider redirect with PKCE verification
 * Uses humanized error messages for better UX
 */
export default function OAuthCallbackPage() {
  const router = useRouter()
  const { isProcessing, error, stage, provider } = useOAuthCallback()

  // Show error state with humanized message
  if (error) {
    return (
      <AuthCard title="Sign In Failed">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle
            className="h-12 w-12 text-destructive mb-4"
            aria-hidden="true"
          />
          <p
            className="text-sm text-muted-foreground mb-6 max-w-xs"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
            >
              Back to Login
            </Button>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </AuthCard>
    )
  }

  // Loading state with contextual messages
  if (isProcessing) {
    return (
      <AuthCard title="Signing In">
        <OAuthLoadingState
          provider={provider || 'unknown'}
          stage={stage === 'completing' ? 'completing' : 'connecting'}
        />
      </AuthCard>
    )
  }

  // Fallback (shouldn't reach here in normal flow)
  return (
    <AuthCard title="Processing">
      <OAuthLoadingState provider={provider || 'unknown'} stage="completing" />
    </AuthCard>
  )
}
