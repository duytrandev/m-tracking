import * as crypto from 'crypto'

/**
 * Generate cryptographically secure code verifier for PKCE
 * RFC 7636: 43-128 unreserved characters (base64url)
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generate S256 code challenge from verifier
 * RFC 7636: BASE64URL(SHA256(code_verifier))
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

/**
 * Verify code challenge using timing-safe comparison
 * Computes challenge from verifier and compares with stored challenge
 */
export function verifyCodeChallenge(
  verifier: string,
  challenge: string
): boolean {
  const computed = generateCodeChallenge(verifier)

  // Handle different lengths safely
  if (computed.length !== challenge.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(challenge))
}
