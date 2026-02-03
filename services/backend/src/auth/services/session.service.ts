import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import {
  RedisSessionData,
  SESSION_CONFIG,
  REDIS_KEYS,
} from '../interfaces/session.interface'
import { RedisService } from '../../shared/redis/redis.service'
import { CryptoService } from '../../shared/crypto/crypto.service'

/**
 * Session Service - Redis Implementation
 * Manages user sessions using Redis for storage
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)

  constructor(
    private redisService: RedisService,
    private cryptoService: CryptoService
  ) {}

  /**
   * Sanitize device info to prevent XSS and enforce length limits
   */
  private sanitizeDeviceInfo(
    deviceInfo:
      | string
      | Record<string, string | string[] | number | boolean | null | undefined>
  ): { userAgent?: string; platform?: string } {
    const MAX_USER_AGENT_LENGTH = 512
    const MAX_PLATFORM_LENGTH = 64

    const deviceInfoObj =
      typeof deviceInfo === 'string' ? { userAgent: deviceInfo } : deviceInfo

    const sanitize = (
      value: string | string[] | number | boolean | null | undefined,
      maxLength: number
    ): string | undefined => {
      if (value === null || value === undefined) return undefined
      if (Array.isArray(value)) {
        return value[0]
          ? String(value[0]).slice(0, maxLength).replace(/[<>]/g, '')
          : undefined
      }
      if (typeof value === 'object') return undefined
      const str = String(value).slice(0, maxLength).replace(/[<>]/g, '')
      return str || undefined
    }

    return {
      userAgent: sanitize(deviceInfoObj.userAgent, MAX_USER_AGENT_LENGTH),
      platform: sanitize(deviceInfoObj.platform, MAX_PLATFORM_LENGTH),
    }
  }

  /**
   * Create new session in Redis
   */
  async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo:
      | string
      | Record<string, string | string[] | number | boolean | null | undefined>,
    ipAddress: string
  ): Promise<RedisSessionData> {
    const sessionId = uuidv4()
    const tokenHash = this.cryptoService.hashToken(refreshToken)
    const sanitizedDeviceInfo = this.sanitizeDeviceInfo(deviceInfo)
    const now = new Date().toISOString()
    const expiresAt = new Date(
      Date.now() + SESSION_CONFIG.SESSION_TTL * 1000
    ).toISOString()

    const sessionData: RedisSessionData = {
      id: sessionId,
      userId,
      refreshTokenHash: tokenHash,
      deviceInfo: sanitizedDeviceInfo,
      ipAddress,
      createdAt: now,
      lastActiveAt: now,
      expiresAt,
    }

    // Store session as Redis hash
    const sessionKey = REDIS_KEYS.session(sessionId)
    await this.redisService.hSetAll(
      sessionKey,
      this.serializeSession(sessionData),
      SESSION_CONFIG.SESSION_TTL
    )

    // Add session to user's session set
    const userSessionsKey = REDIS_KEYS.userSessions(userId)
    await this.redisService.sAdd(userSessionsKey, sessionId)

    this.logger.log(
      `Session created for user: ${userId}, session: ${sessionId}`
    )

    return sessionData
  }

  /**
   * Find session by refresh token
   * Scans user sessions to find matching token hash
   */
  async findByRefreshToken(
    refreshToken: string
  ): Promise<RedisSessionData | null> {
    const tokenHash = this.cryptoService.hashToken(refreshToken)

    // Get all session keys (this is not ideal for large scale, but acceptable for max 5 sessions per user)
    const sessionKeys = await this.redisService.keys('session:*')

    for (const key of sessionKeys) {
      const storedHash = await this.redisService.hGet(key, 'refreshTokenHash')
      if (storedHash === tokenHash) {
        const session = await this.getSessionFromKey(key)
        if (session && new Date(session.expiresAt) > new Date()) {
          return session
        }
      }
    }

    return null
  }

  /**
   * Find session by ID
   */
  async findById(sessionId: string): Promise<RedisSessionData | null> {
    const sessionKey = REDIS_KEYS.session(sessionId)
    return this.getSessionFromKey(sessionKey)
  }

  /**
   * Update session last active timestamp
   */
  async updateLastActive(sessionId: string): Promise<void> {
    const sessionKey = REDIS_KEYS.session(sessionId)
    const exists = await this.redisService.exists(sessionKey)

    if (exists) {
      await this.redisService.hSet(
        sessionKey,
        'lastActiveAt',
        new Date().toISOString()
      )
      this.logger.log(`Session last active updated: ${sessionId}`)
    }
  }

  /**
   * Update session refresh token and extend TTL
   */
  async updateRefreshToken(
    sessionId: string,
    newRefreshToken: string
  ): Promise<void> {
    const sessionKey = REDIS_KEYS.session(sessionId)
    const exists = await this.redisService.exists(sessionKey)

    if (exists) {
      const tokenHash = this.cryptoService.hashToken(newRefreshToken)
      const now = new Date().toISOString()
      const newExpiresAt = new Date(
        Date.now() + SESSION_CONFIG.SESSION_TTL * 1000
      ).toISOString()

      await this.redisService.hSet(sessionKey, 'refreshTokenHash', tokenHash)
      await this.redisService.hSet(sessionKey, 'lastActiveAt', now)
      await this.redisService.hSet(sessionKey, 'expiresAt', newExpiresAt)
      await this.redisService.expire(sessionKey, SESSION_CONFIG.SESSION_TTL)

      this.logger.log(`Session refresh token updated: ${sessionId}`)
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const sessionKey = REDIS_KEYS.session(sessionId)
    const activityKey = REDIS_KEYS.activity(sessionId)

    // Get userId before deleting
    const userId = await this.redisService.hGet(sessionKey, 'userId')

    // Delete session hash
    await this.redisService.del(sessionKey)

    // Delete activity log
    await this.redisService.del(activityKey)

    // Remove from user's session set
    if (userId) {
      const userSessionsKey = REDIS_KEYS.userSessions(userId)
      await this.redisService.sRem(userSessionsKey, sessionId)
    }

    this.logger.log(`Session revoked: ${sessionId}`)
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = REDIS_KEYS.userSessions(userId)
    const sessionIds = await this.redisService.sMembers(userSessionsKey)

    // Delete each session and its activity log
    for (const sessionId of sessionIds) {
      await this.redisService.del(REDIS_KEYS.session(sessionId))
      await this.redisService.del(REDIS_KEYS.activity(sessionId))
    }

    // Delete the user sessions set
    await this.redisService.del(userSessionsKey)

    this.logger.log(
      `All sessions revoked for user: ${userId}, count: ${sessionIds.length}`
    )
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<RedisSessionData[]> {
    const userSessionsKey = REDIS_KEYS.userSessions(userId)
    const sessionIds = await this.redisService.sMembers(userSessionsKey)

    const sessions: RedisSessionData[] = []
    for (const sessionId of sessionIds) {
      const session = await this.findById(sessionId)
      if (session && new Date(session.expiresAt) > new Date()) {
        sessions.push(session)
      } else if (session) {
        // Clean up expired session
        await this.revokeSession(sessionId)
      }
    }

    // Sort by lastActiveAt descending
    sessions.sort(
      (a, b) =>
        new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    )

    return sessions
  }

  /**
   * Get active session count for a user
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    const userSessionsKey = REDIS_KEYS.userSessions(userId)
    return this.redisService.sCard(userSessionsKey)
  }

  /**
   * Get session IP address
   */
  async getSessionIp(sessionId: string): Promise<string | undefined> {
    const sessionKey = REDIS_KEYS.session(sessionId)
    return this.redisService.hGet(sessionKey, 'ipAddress')
  }

  /**
   * Update session IP address
   */
  async updateSessionIp(sessionId: string, newIp: string): Promise<void> {
    const sessionKey = REDIS_KEYS.session(sessionId)
    await this.redisService.hSet(sessionKey, 'ipAddress', newIp)
  }

  /**
   * Serialize session data to Redis hash format
   */
  private serializeSession(session: RedisSessionData): Record<string, string> {
    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      deviceInfo: JSON.stringify(session.deviceInfo),
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
    }
  }

  /**
   * Deserialize session data from Redis hash format
   */
  private deserializeSession(
    data: Record<string, string>
  ): RedisSessionData | null {
    if (!data || !data.id) return null

    return {
      id: data.id,
      userId: data.userId || '',
      refreshTokenHash: data.refreshTokenHash || '',
      deviceInfo: data.deviceInfo
        ? (JSON.parse(data.deviceInfo) as {
            userAgent?: string
            platform?: string
          })
        : {},
      ipAddress: data.ipAddress || '',
      createdAt: data.createdAt || '',
      lastActiveAt: data.lastActiveAt || '',
      expiresAt: data.expiresAt || '',
    }
  }

  /**
   * Get session from Redis key
   */
  private async getSessionFromKey(
    key: string
  ): Promise<RedisSessionData | null> {
    const data = await this.redisService.hGetAll(key)
    return this.deserializeSession(data)
  }
}
