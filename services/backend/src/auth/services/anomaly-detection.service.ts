import { Injectable, Logger } from '@nestjs/common'
import { AnomalyType, SESSION_CONFIG } from '../interfaces/session.interface'
import { SessionService } from './session.service'
import { SessionActivityService } from './session-activity.service'

/**
 * Anomaly Detection Service
 * Detects suspicious activity patterns and logs warnings
 */
@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name)

  constructor(
    private sessionService: SessionService,
    private sessionActivityService: SessionActivityService
  ) {}

  /**
   * Check for anomalies during session activity
   * Called on refresh token requests
   */
  async checkForAnomalies(
    userId: string,
    sessionId: string,
    request: { ip: string }
  ): Promise<void> {
    await Promise.all([
      this.checkIpChange(sessionId, request.ip, userId),
      this.checkExcessiveActivity(userId),
      this.checkConcurrentSessions(userId),
    ])
  }

  /**
   * Check if IP has changed since last request
   * Logs WARN level for monitoring tools
   */
  private async checkIpChange(
    sessionId: string,
    newIp: string,
    userId: string
  ): Promise<void> {
    const currentIp = await this.sessionService.getSessionIp(sessionId)

    if (currentIp && currentIp !== newIp) {
      this.logger.warn(
        `[ANOMALY:${AnomalyType.IP_CHANGE}] ` +
          `userId=${userId} sessionId=${sessionId} ` +
          `oldIp=${currentIp} newIp=${newIp}`
      )

      // Record the IP change
      await this.sessionActivityService.recordIpChange(
        sessionId,
        currentIp,
        newIp
      )

      // Update session with new IP
      await this.sessionService.updateSessionIp(sessionId, newIp)

      // Add flag to user activity
      await this.sessionActivityService.addSuspiciousFlag(
        userId,
        `${AnomalyType.IP_CHANGE}:${new Date().toISOString()}`
      )
    }
  }

  /**
   * Check for excessive login or refresh activity
   * Flags users who exceed thresholds
   */
  private async checkExcessiveActivity(userId: string): Promise<void> {
    const [loginCount, refreshCount] = await Promise.all([
      this.sessionActivityService.getLoginCount24h(userId),
      this.sessionActivityService.getRefreshCount1h(userId),
    ])

    // Check excessive logins (>10 in 24h)
    if (loginCount > SESSION_CONFIG.EXCESSIVE_LOGINS_THRESHOLD) {
      this.logger.warn(
        `[ANOMALY:${AnomalyType.EXCESSIVE_LOGINS}] ` +
          `userId=${userId} loginCount24h=${loginCount} ` +
          `threshold=${SESSION_CONFIG.EXCESSIVE_LOGINS_THRESHOLD}`
      )

      await this.sessionActivityService.addSuspiciousFlag(
        userId,
        `${AnomalyType.EXCESSIVE_LOGINS}:${new Date().toISOString()}`
      )
    }

    // Check excessive refreshes (>50 in 1h)
    if (refreshCount > SESSION_CONFIG.EXCESSIVE_REFRESHES_THRESHOLD) {
      this.logger.warn(
        `[ANOMALY:${AnomalyType.EXCESSIVE_REFRESHES}] ` +
          `userId=${userId} refreshCount1h=${refreshCount} ` +
          `threshold=${SESSION_CONFIG.EXCESSIVE_REFRESHES_THRESHOLD}`
      )

      await this.sessionActivityService.addSuspiciousFlag(
        userId,
        `${AnomalyType.EXCESSIVE_REFRESHES}:${new Date().toISOString()}`
      )
    }
  }

  /**
   * Check for too many concurrent sessions
   * Flags when user exceeds session limit
   */
  private async checkConcurrentSessions(userId: string): Promise<void> {
    const sessionCount = await this.sessionService.getActiveSessionCount(userId)

    if (sessionCount > SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
      this.logger.warn(
        `[ANOMALY:${AnomalyType.CONCURRENT_SESSION_ABUSE}] ` +
          `userId=${userId} sessionCount=${sessionCount} ` +
          `maxAllowed=${SESSION_CONFIG.MAX_CONCURRENT_SESSIONS}`
      )

      await this.sessionActivityService.addSuspiciousFlag(
        userId,
        `${AnomalyType.CONCURRENT_SESSION_ABUSE}:${new Date().toISOString()}`
      )
    }
  }
}
