import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

/**
 * Session revoked by limit event payload
 */
export interface SessionRevokedByLimitEvent {
  userId: string
  revokedSessionId: string
  deviceInfo: { userAgent?: string; platform?: string }
  reason: 'SESSION_LIMIT_EXCEEDED'
  newDeviceInfo: { userAgent?: string; platform?: string }
}

/**
 * Session Events Listener
 * Handles session-related events for notifications and logging
 */
@Injectable()
export class SessionEventsListener {
  private readonly logger = new Logger(SessionEventsListener.name)

  /**
   * Handle session revoked due to session limit
   * Can be extended to:
   * - Send email notification (if user preference)
   * - Store notification in Redis for next-visit display
   * - Log for security audit
   */
  @OnEvent('session.revoked_by_limit')
  handleSessionRevokedByLimit(event: SessionRevokedByLimitEvent): void {
    this.logger.log(
      `Session ${event.revokedSessionId} revoked for user ${event.userId} - ` +
        `reason: ${event.reason}, new device: ${event.newDeviceInfo.platform || 'unknown'}`
    )

    // Future enhancements:
    // 1. Queue notification for email service
    // 2. Store in user notifications for next-visit display
    // 3. Add to security audit log
  }
}
