import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

/**
 * Auth Audit Listener
 * Centralizes logging for all auth events
 * Can be extended to persist to audit table
 */
@Injectable()
export class AuthAuditListener {
  private readonly logger = new Logger(AuthAuditListener.name)

  @OnEvent('auth.login')
  handleLogin(event: { userId: string; sessionId: string; ip: string }) {
    this.logger.log(
      `[AUDIT] LOGIN: user=${event.userId} session=${event.sessionId} ip=${event.ip}`
    )
  }

  @OnEvent('auth.logout')
  handleLogout(event: { userId: string; sessionId: string }) {
    this.logger.log(
      `[AUDIT] LOGOUT: user=${event.userId} session=${event.sessionId}`
    )
  }

  @OnEvent('auth.logout_all')
  handleLogoutAll(event: { userId: string }) {
    this.logger.log(`[AUDIT] LOGOUT_ALL: user=${event.userId}`)
  }

  @OnEvent('auth.refresh')
  handleRefresh(event: { userId: string; sessionId: string; ip?: string }) {
    this.logger.log(
      `[AUDIT] REFRESH: user=${event.userId} session=${event.sessionId} ip=${event.ip || 'unknown'}`
    )
  }

  @OnEvent('auth.registered')
  handleRegistration(event: { userId: string; email: string }) {
    this.logger.log(
      `[AUDIT] REGISTERED: user=${event.userId} email=${event.email}`
    )
  }

  @OnEvent('auth.email_verified')
  handleEmailVerified(event: { userId: string }) {
    this.logger.log(`[AUDIT] EMAIL_VERIFIED: user=${event.userId}`)
  }

  @OnEvent('auth.password_reset_requested')
  handlePasswordResetRequested(event: { userId: string; email: string }) {
    this.logger.log(
      `[AUDIT] PASSWORD_RESET_REQUESTED: user=${event.userId} email=${event.email}`
    )
  }

  @OnEvent('auth.password_reset_completed')
  handlePasswordResetCompleted(event: { userId: string }) {
    this.logger.log(`[AUDIT] PASSWORD_RESET_COMPLETED: user=${event.userId}`)
  }

  @OnEvent('auth.password_setup_requested')
  handlePasswordSetupRequested(event: {
    userId: string
    ip?: string
    userAgent?: string
  }) {
    this.logger.log(
      `[AUDIT] PASSWORD_SETUP_REQUESTED: user=${event.userId} ip=${event.ip || 'unknown'}`
    )
  }

  @OnEvent('auth.oauth_user_register_attempt')
  handleOAuthUserRegisterAttempt(event: { userId: string; email: string }) {
    this.logger.log(
      `[AUDIT] OAUTH_USER_REGISTER_ATTEMPT: user=${event.userId} email=${event.email}`
    )
  }
}
