'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { AuthCard } from '@/features/auth/components/auth-card'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { setAuthToken } from '@/lib/api-client'
import { authApi } from '@/features/auth/api/auth-api'
import { Button } from '@/components/ui/button'

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async (): Promise<void> => {
      const accessToken = searchParams.get('accessToken')
      // Note: refreshToken is stored server-side via HTTP-only cookie by backend
      const errorParam = searchParams.get('error')

      // Handle error from OAuth provider
      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        return
      }

      // No tokens received
      if (!accessToken) {
        setError('No authentication token received. Please try again.')
        return
      }

      try {
        // Store the access token (15 minutes default expiry)
        setAuthToken(accessToken, 900)

        // Fetch user profile to complete login
        const user = await authApi.getCurrentUser()
        login(user)

        // Get stored return URL or default to dashboard
        const returnUrl =
          sessionStorage.getItem('oauth_return_url') || '/dashboard'
        sessionStorage.removeItem('oauth_return_url')

        router.replace(returnUrl)
      } catch {
        setError('Failed to complete authentication. Please try again.')
      }
    }

    void processCallback()
  }, [searchParams, router, login])

  // Show error state
  if (error) {
    return (
      <AuthCard title="Authentication Failed">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/auth/login')} variant="outline">
            Back to Login
          </Button>
        </div>
      </AuthCard>
    )
  }

  // Loading state
  return (
    <AuthCard title="Processing...">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Please wait while we complete your sign in...
        </p>
      </div>
    </AuthCard>
  )
}
