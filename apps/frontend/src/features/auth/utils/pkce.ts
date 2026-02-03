/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth flows
 * RFC 7636 implementation using Web Crypto API
 */

const VERIFIER_STORAGE_KEY = 'pkce_verifier'
const STATE_STORAGE_KEY = 'pkce_state'

/**
 * Base64URL encode a Uint8Array
 * Replaces + with -, / with _, and removes = padding
 */
function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Generate cryptographically secure code verifier
 * RFC 7636: 43-128 unreserved characters
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/**
 * Generate random state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(24)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/**
 * Generate S256 code challenge from verifier
 * RFC 7636: BASE64URL(SHA256(code_verifier))
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

/**
 * Store PKCE verifier and state in sessionStorage
 * Uses sessionStorage for single-tab security
 */
export function storePkceData(verifier: string, state: string): void {
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier)
  sessionStorage.setItem(STATE_STORAGE_KEY, state)
}

/**
 * Retrieve and clear PKCE data from sessionStorage
 * Single-use: data is deleted after retrieval
 */
export function getAndClearPkceData(): {
  verifier: string | null
  state: string | null
} {
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY)
  const state = sessionStorage.getItem(STATE_STORAGE_KEY)

  // Clear immediately for single-use
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY)
  sessionStorage.removeItem(STATE_STORAGE_KEY)

  return { verifier, state }
}

/**
 * Check if browser supports Web Crypto API
 * Required for PKCE code challenge generation
 */
export function isPkceSupported(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  )
}
