/**
 * Token Service
 * Manages access token storage, timing, and refresh scheduling
 *
 * Security: Access token stored in memory only (not localStorage)
 * to mitigate XSS attacks. Refresh token handled via httpOnly cookies.
 */

type TokenRefreshCallback = () => Promise<string | null>

class TokenService {
  private accessToken: string | null = null
  private tokenExpiresAt: number | null = null
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null
  private refreshCallback: TokenRefreshCallback | null = null

  // Buffer time before actual expiration to refresh (60 seconds)
  private readonly REFRESH_BUFFER_MS = 60 * 1000

  /**
   * Set the access token and schedule refresh
   * @param token - The JWT access token
   * @param expiresInSeconds - Token lifetime in seconds (e.g., 900 for 15 minutes)
   */
  setToken(token: string, expiresInSeconds: number): void {
    this.accessToken = token
    this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000
    this.scheduleRefresh(expiresInSeconds)
  }

  /**
   * Get the current access token
   * @returns The access token or null if not set
   */
  getToken(): string | null {
    return this.accessToken
  }

  /**
   * Check if token is expired or about to expire
   * @returns True if token is expired or will expire within buffer time
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true
    return Date.now() >= this.tokenExpiresAt - this.REFRESH_BUFFER_MS
  }

  /**
   * Check if we have a potentially valid token
   * (doesn't verify signature, just checks existence and expiry)
   * @returns True if token exists and hasn't expired yet
   */
  hasValidToken(): boolean {
    if (!this.accessToken) return false
    if (!this.tokenExpiresAt) return false
    return Date.now() < this.tokenExpiresAt
  }

  /**
   * Clear token and cancel scheduled refresh
   * Called on logout or auth failure
   */
  clearToken(): void {
    this.accessToken = null
    this.tokenExpiresAt = null
    this.cancelScheduledRefresh()
  }

  /**
   * Set callback for token refresh
   * This callback will be invoked automatically before token expiration
   * @param callback - Async function that refreshes token and returns new token
   */
  setRefreshCallback(callback: TokenRefreshCallback): void {
    this.refreshCallback = callback
  }

  /**
   * Schedule automatic token refresh
   * Refreshes token 60 seconds before expiration
   * @param expiresInSeconds - Token lifetime in seconds
   */
  private scheduleRefresh(expiresInSeconds: number): void {
    this.cancelScheduledRefresh()

    // Refresh 60 seconds before expiration
    const refreshIn = (expiresInSeconds * 1000) - this.REFRESH_BUFFER_MS

    if (refreshIn > 0) {
      this.refreshTimeoutId = setTimeout(async () => {
        if (this.refreshCallback) {
          try {
            const newToken = await this.refreshCallback()
            if (!newToken) {
              console.warn('[TokenService] Refresh returned null')
            }
          } catch (error) {
            console.error('[TokenService] Scheduled refresh failed:', error)
          }
        }
      }, refreshIn)
    }
  }

  /**
   * Cancel any scheduled refresh
   * Called when clearing token or setting new token
   */
  private cancelScheduledRefresh(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId)
      this.refreshTimeoutId = null
    }
  }
}

// Singleton instance
export const tokenService = new TokenService()
