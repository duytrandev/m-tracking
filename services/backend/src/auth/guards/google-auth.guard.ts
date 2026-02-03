import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Google OAuth Auth Guard
 * Extends passport AuthGuard to force account selection on every login
 * This prevents auto-login with cached Google credentials
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override getAuthenticateOptions(_context: ExecutionContext) {
    return {
      // Force Google to always show account selection screen
      // Prevents auto-login with previously selected account
      prompt: 'select_account',
      // Request offline access to get refresh token
      accessType: 'offline',
    }
  }
}
