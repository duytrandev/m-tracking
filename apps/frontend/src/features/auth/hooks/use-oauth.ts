import { useCallback, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '../store/auth-store'
import { authApi } from '../api/auth-api'
import type { OAuthProvider } from '@/types/api/auth'
import {
  generateCodeVerifier,
  generateState,
  generateCodeChallenge,
  storePkceData,
  getAndClearPkceData,
  isPkceSupported,
} from '../utils/pkce'

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
 * Hook to initiate OAuth flow with PKCE support
 * PKCE (RFC 7636) prevents authorization code interception attacks
 */
export function useOAuth(): UseOAuthReturn {
  const [isLoading, setIsLoading] = useState(false)

  const initiateOAuth = useCallback(
    async (provider: OAuthProvider) => {
      // Prevent double-clicks
      if (isLoading) return

      setIsLoading(true)

      // Store current URL for redirect after auth
      const returnUrl = window.location.pathname
      sessionStorage.setItem('oauth_return_url', returnUrl)
      sessionStorage.setItem('oauth_pending', 'true')

      // Build OAuth URL with optional PKCE parameters
      let oauthUrl = `${API_BASE_URL}/auth/${provider}`

      // Add PKCE if browser supports Web Crypto API
      if (isPkceSupported()) {
        try {
          const verifier = generateCodeVerifier()
          const state = generateState()
          const challenge = await generateCodeChallenge(verifier)

          // Store PKCE data for callback verification
          storePkceData(verifier, state)

          // Add PKCE params to OAuth URL
          const params = new URLSearchParams({
            code_challenge: challenge,
            code_challenge_method: 'S256',
            state: state,
          })
          oauthUrl = `${oauthUrl}?${params.toString()}`
        } catch {
          // Fall back to non-PKCE flow if crypto fails
          // Silently degrade - PKCE is optional for OAuth security
        }
      }

      // Small delay to show loading state before redirect
      setTimeout(() => {
        window.location.href = oauthUrl
      }, 150)
    },
    [isLoading]
  )

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
 * Hook to handle OAuth callback with PKCE support
 * Backend sends: ?code=xxx or ?error=xxx
 * Code is exchanged for access token via POST endpoint (more secure)
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
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        setIsProcessing(false)
        return
      }

      if (!code) {
        setError('No authorization code received. Please try again.')
        setIsProcessing(false)
        return
      }

      try {
        // Retrieve and clear PKCE data (single-use)
        const pkceData = getAndClearPkceData()

        // Exchange code for access token with optional PKCE verification
        if (pkceData.verifier && pkceData.state) {
          await authApi.exchangeOAuthCode(code, {
            codeVerifier: pkceData.verifier,
            state: pkceData.state,
          })
        } else {
          // Non-PKCE fallback
          await authApi.exchangeOAuthCode(code)
        }

        // Fetch user profile to complete login
        const user = await authApi.getCurrentUser()
        login(user)

        // Get stored return URL or default to dashboard
        const returnUrl =
          sessionStorage.getItem('oauth_return_url') || '/dashboard'
        sessionStorage.removeItem('oauth_return_url')
        sessionStorage.removeItem('oauth_pending')

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
