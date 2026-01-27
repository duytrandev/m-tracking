import { useCallback, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '../store/auth-store'
import { authApi } from '../api/auth-api'
import { setAuthToken } from '@/lib/api-client'
import type { OAuthProvider } from '@/types/api/auth'

const API_BASE_URL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    : process.env.API_URL || 'http://localhost:4000'

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
      const accessToken = searchParams.get('access_token')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        setError(errorDescription || 'OAuth authentication failed')
        setIsProcessing(false)
        return
      }

      if (!accessToken) {
        setError('No access token received')
        setIsProcessing(false)
        return
      }

      try {
        // Store the access token (with default expiration)
        setAuthToken(accessToken, 900) // 15 minutes default

        // Fetch user profile
        const user = await authApi.getCurrentUser()
        login(user)

        // Get stored return URL or default to dashboard
        const returnUrl =
          sessionStorage.getItem('oauth_return_url') || '/dashboard'
        sessionStorage.removeItem('oauth_return_url')

        router.replace(returnUrl)
      } catch {
        setError('Failed to complete authentication')
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
