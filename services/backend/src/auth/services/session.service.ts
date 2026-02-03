import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { v4 as uuidv4 } from 'uuid'
import {
  RedisSessionData,
  SESSION_CONFIG,
  REDIS_KEYS,
} from '../interfaces/session.interface'
import { RedisService } from '../../shared/redis/redis.service'
import { CryptoService } from '../../shared/crypto/crypto.service'
import { sanitizeDeviceInfo } from '../../shared/utils/sanitize.util'

/**
 * Session Service - Redis Implementation
 * Manages user sessions using Redis for storage
 *
 * Features:
 * - O(1) session lookup via refresh token index
 * - XSS-safe device info storage
 * - Configurable session limits with event notification
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)

  constructor(
    private redisService: RedisService,
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * Create new session in Redis
   * - Stores session hash
   * - Creates refresh token index for O(1) lookup
   * - Adds to user's session set
   * - Enforces session limit
   */
  async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo: string | Record<string, unknown>,
    ipAddress: string
  ): Promise<RedisSessionData> {
    const sessionId = uuidv4()
    const tokenHash = this.cryptoService.hashToken(refreshToken)
    const sanitizedDeviceInfo = sanitizeDeviceInfo(deviceInfo)
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

    // Add to user's session set
    const userSessionsKey = REDIS_KEYS.userSessions(userId)
    await this.redisService.sAdd(userSessionsKey, sessionId)

    // Create refresh token index for O(1) lookup
    await this.redisService.setRefreshTokenIndex(
      tokenHash,
      sessionId,
      SESSION_CONFIG.SESSION_TTL
    )

    // Enforce session limit (revokes oldest if over limit)
    await this.enforceSessionLimit(userId, sessionData)

    this.logger.log(`Session created: ${sessionId} for user: ${userId}`)
    return sessionData
  }

  /**
   * Find session by refresh token - O(1) lookup via index
   * No longer scans all sessions (was O(n) DoS vector)
   */
  async findByRefreshToken(
    refreshToken: string
  ): Promise<RedisSessionData | null> {
    const tokenHash = this.cryptoService.hashToken(refreshToken)

    // O(1) lookup via index
    const sessionId = await this.redisService.getRefreshTokenIndex(tokenHash)
    if (!sessionId) {
      return null
    }

    const session = await this.findById(sessionId)
    if (!session) {
      // Orphaned index - clean up
      await this.redisService.deleteRefreshTokenIndex(tokenHash)
      return null
    }

    // Defense in depth: verify token hash matches
    if (session.refreshTokenHash !== tokenHash) {
      this.logger.warn(`Token hash mismatch for session: ${sessionId}`)
      return null
    }

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      await this.revokeSession(sessionId)
      return null
    }

    return session
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
   * Maintains token index: deletes old, creates new
   */
  async updateRefreshToken(
    sessionId: string,
    newRefreshToken: string
  ): Promise<void> {
    const session = await this.findById(sessionId)
    if (!session) return

    // Delete old token index
    await this.redisService.deleteRefreshTokenIndex(session.refreshTokenHash)

    // Create new token index
    const newTokenHash = this.cryptoService.hashToken(newRefreshToken)
    await this.redisService.setRefreshTokenIndex(
      newTokenHash,
      sessionId,
      SESSION_CONFIG.SESSION_TTL
    )

    // Update session hash
    const sessionKey = REDIS_KEYS.session(sessionId)
    const now = new Date().toISOString()
    const newExpiresAt = new Date(
      Date.now() + SESSION_CONFIG.SESSION_TTL * 1000
    ).toISOString()

    await this.redisService.hSet(sessionKey, 'refreshTokenHash', newTokenHash)
    await this.redisService.hSet(sessionKey, 'lastActiveAt', now)
    await this.redisService.hSet(sessionKey, 'expiresAt', newExpiresAt)
    await this.redisService.expire(sessionKey, SESSION_CONFIG.SESSION_TTL)

    this.logger.log(`Session refresh token rotated: ${sessionId}`)
  }

  /**
   * Revoke specific session
   * Cleans up: token index, session hash, activity log, user session set
   */
  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.findById(sessionId)

    if (session) {
      // Delete token index
      await this.redisService.deleteRefreshTokenIndex(session.refreshTokenHash)
      // Remove from user's session set
      await this.redisService.sRem(
        REDIS_KEYS.userSessions(session.userId),
        sessionId
      )
    }

    // Delete session hash and activity log
    await this.redisService.del(REDIS_KEYS.session(sessionId))
    await this.redisService.del(REDIS_KEYS.activity(sessionId))

    this.logger.log(`Session revoked: ${sessionId}`)
  }

  /**
   * Revoke all sessions for a user
   * Also cleans up all token indexes
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId)

    // Delete each session with token index cleanup
    for (const session of sessions) {
      await this.redisService.deleteRefreshTokenIndex(session.refreshTokenHash)
      await this.redisService.del(REDIS_KEYS.session(session.id))
      await this.redisService.del(REDIS_KEYS.activity(session.id))
    }

    // Delete the user sessions set
    await this.redisService.del(REDIS_KEYS.userSessions(userId))

    this.logger.log(
      `All sessions revoked for user: ${userId}, count: ${sessions.length}`
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
   * Enforce session limit per user
   * Revokes oldest sessions when over limit, emits events for notification
   *
   * @param userId - User ID
   * @param newSession - Newly created session (excluded from revocation)
   */
  private async enforceSessionLimit(
    userId: string,
    newSession: RedisSessionData
  ): Promise<void> {
    const maxSessions = this.configService.get<number>('AUTH_MAX_SESSIONS', 5)
    const sessions = await this.getUserSessions(userId)

    if (sessions.length <= maxSessions) return

    // Sort by lastActiveAt ascending (oldest first)
    sessions.sort(
      (a, b) =>
        new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime()
    )

    // Calculate how many to revoke (exclude the new session)
    const toRevoke = sessions
      .filter(s => s.id !== newSession.id)
      .slice(0, sessions.length - maxSessions)

    for (const session of toRevoke) {
      // Emit event for notification (handled by listener)
      this.eventEmitter.emit('session.revoked_by_limit', {
        userId,
        revokedSessionId: session.id,
        deviceInfo: session.deviceInfo,
        reason: 'SESSION_LIMIT_EXCEEDED',
        newDeviceInfo: newSession.deviceInfo,
      })

      await this.revokeSession(session.id)
      this.logger.log(`Session limit enforced - revoked: ${session.id}`)
    }
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
