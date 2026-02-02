import { useCallback, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '../store/auth-store'
import { authApi } from '../api/auth-api'
import { setAuthToken } from '@/lib/api-client'
import type { OAuthProvider } from '@/types/api/auth'

// OAuth endpoints are at /api/v1/auth/* (with global prefix)
const API_BASE_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
    : process.env.API_URL || 'http://localhost:4000/api/v1'

interface UseOAuthReturn {
  initiateOAuth: (provider: OAuthProvider) => void
  isLoading: boolean
}

/**
 * Hook to initiate OAuth flow
 */
export function useOAuth(): UseOAuthReturn {
  const [isLoading, setIsLoading] = useState(false)

  const initiateOAuth = useCallback((provider: OAuthProvider) => {
    setIsLoading(true)

    // Store current URL for redirect after auth
    const returnUrl = window.location.pathname
    sessionStorage.setItem('oauth_return_url', returnUrl)

    // Redirect to backend OAuth endpoint
    const oauthUrl = `${API_BASE_URL}/auth/${provider}`
    window.location.href = oauthUrl
  }, [])

  return {
    initiateOAuth,
    isLoading,
  }
}

interface UseOAuthCallbackReturn {
  isProcessing: boolean
  error: string | null
}

/**
 * Hook to handle OAuth callback
 * Backend sends: ?accessToken=xxx&refreshToken=xxx or ?error=xxx
 */
export function useOAuthCallback(): UseOAuthCallbackReturn {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useAuthStore()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Process callback on mount
  useEffect(() => {
    const processCallback = async (): Promise<void> => {
      // Backend sends accessToken (camelCase), not access_token
      const accessToken = searchParams.get('accessToken')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        setIsProcessing(false)
        return
      }

      if (!accessToken) {
        setError('No authentication token received. Please try again.')
        setIsProcessing(false)
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
        setIsProcessing(false)
      }
    }

    void processCallback()
  }, [searchParams, router, login])

  return {
    isProcessing,
    error,
  }
}
