import { Injectable } from '@nestjs/common'
import {
  ActivityEntry,
  UserActivitySummary,
  SESSION_CONFIG,
  REDIS_KEYS,
} from '../interfaces/session.interface'
import { RedisService } from '../../shared/redis/redis.service'

/**
 * Session Activity Service
 * Logs and tracks session activity for monitoring and anomaly detection
 */
@Injectable()
export class SessionActivityService {
  constructor(private redisService: RedisService) {}

  /**
   * Record login activity
   */
  async recordLogin(
    sessionId: string,
    userId: string,
    ip: string,
    deviceInfo: object
  ): Promise<void> {
    const entry: ActivityEntry = {
      type: 'login',
      timestamp: new Date().toISOString(),
      ip,
      metadata: { deviceInfo },
    }

    await this.addActivityEntry(sessionId, entry)
    await this.updateUserActivity(userId, ip)
  }

  /**
   * Record token refresh activity
   */
  async recordRefresh(
    sessionId: string,
    userId: string,
    ip: string
  ): Promise<void> {
    const entry: ActivityEntry = {
      type: 'refresh',
      timestamp: new Date().toISOString(),
      ip,
    }

    await this.addActivityEntry(sessionId, entry)
    await this.incrementRefreshCount(userId)
  }

  /**
   * Record IP change activity
   */
  async recordIpChange(
    sessionId: string,
    oldIp: string,
    newIp: string
  ): Promise<void> {
    const entry: ActivityEntry = {
      type: 'ip_change',
      timestamp: new Date().toISOString(),
      oldIp,
      newIp,
    }

    await this.addActivityEntry(sessionId, entry)
  }

  /**
   * Record logout activity
   */
  async recordLogout(sessionId: string): Promise<void> {
    const entry: ActivityEntry = {
      type: 'logout',
      timestamp: new Date().toISOString(),
    }

    await this.addActivityEntry(sessionId, entry)
  }

  /**
   * Get session activity log
   */
  async getSessionActivity(
    sessionId: string,
    limit: number = SESSION_CONFIG.MAX_ACTIVITY_ENTRIES
  ): Promise<ActivityEntry[]> {
    const activityKey = REDIS_KEYS.activity(sessionId)
    const entries = await this.redisService.lRange(activityKey, 0, limit - 1)

    return entries.map(entry => JSON.parse(entry) as ActivityEntry)
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<UserActivitySummary> {
    const userActivityKey = REDIS_KEYS.userActivity(userId)
    const data = await this.redisService.hGetAll(userActivityKey)

    if (!data || Object.keys(data).length === 0) {
      return {
        loginCount24h: 0,
        refreshCount24h: 0,
        suspiciousFlags: [],
      }
    }

    return {
      lastLoginAt: data.lastLoginAt || undefined,
      lastIp: data.lastIp || undefined,
      loginCount24h: parseInt(data.loginCount24h || '0', 10),
      refreshCount24h: parseInt(data.refreshCount24h || '0', 10),
      suspiciousFlags: data.suspiciousFlags
        ? (JSON.parse(data.suspiciousFlags) as string[])
        : [],
    }
  }

  /**
   * Add suspicious flag to user activity
   */
  async addSuspiciousFlag(userId: string, flag: string): Promise<void> {
    const userActivityKey = REDIS_KEYS.userActivity(userId)
    const flagsData = await this.redisService.hGet(
      userActivityKey,
      'suspiciousFlags'
    )
    const flags: string[] = flagsData ? (JSON.parse(flagsData) as string[]) : []

    if (!flags.includes(flag)) {
      flags.push(flag)
      await this.redisService.hSet(
        userActivityKey,
        'suspiciousFlags',
        JSON.stringify(flags)
      )
    }
  }

  /**
   * Add activity entry to session log
   */
  private async addActivityEntry(
    sessionId: string,
    entry: ActivityEntry
  ): Promise<void> {
    const activityKey = REDIS_KEYS.activity(sessionId)

    await this.redisService.lPush(activityKey, JSON.stringify(entry))
    await this.redisService.lTrim(
      activityKey,
      0,
      SESSION_CONFIG.MAX_ACTIVITY_ENTRIES - 1
    )
    await this.redisService.expire(activityKey, SESSION_CONFIG.ACTIVITY_TTL)
  }

  /**
   * Update user activity on login
   */
  private async updateUserActivity(userId: string, ip: string): Promise<void> {
    const userActivityKey = REDIS_KEYS.userActivity(userId)

    await this.redisService.hSet(
      userActivityKey,
      'lastLoginAt',
      new Date().toISOString()
    )
    await this.redisService.hSet(userActivityKey, 'lastIp', ip)
    await this.incrementLoginCount(userId)
    await this.redisService.expire(
      userActivityKey,
      SESSION_CONFIG.USER_ACTIVITY_TTL
    )
  }

  /**
   * Increment login count for 24h window
   * Uses a separate key with 24h TTL
   */
  private async incrementLoginCount(userId: string): Promise<void> {
    const countKey = `user:login_count:${userId}`
    const count = await this.redisService.incr(countKey)

    // Set TTL only on first increment
    if (count === 1) {
      await this.redisService.expire(countKey, 24 * 60 * 60)
    }

    // Update the summary
    const userActivityKey = REDIS_KEYS.userActivity(userId)
    await this.redisService.hSet(
      userActivityKey,
      'loginCount24h',
      count.toString()
    )
  }

  /**
   * Increment refresh count for 1h window
   * Uses a separate key with 1h TTL
   */
  private async incrementRefreshCount(userId: string): Promise<void> {
    const countKey = `user:refresh_count:${userId}`
    const count = await this.redisService.incr(countKey)

    // Set TTL only on first increment
    if (count === 1) {
      await this.redisService.expire(countKey, 60 * 60)
    }

    // Update the summary
    const userActivityKey = REDIS_KEYS.userActivity(userId)
    await this.redisService.hSet(
      userActivityKey,
      'refreshCount24h',
      count.toString()
    )
  }

  /**
   * Get login count for 24h window
   */
  async getLoginCount24h(userId: string): Promise<number> {
    const countKey = `user:login_count:${userId}`
    const count = await this.redisService.get(countKey)
    return count ? parseInt(count, 10) : 0
  }

  /**
   * Get refresh count for 1h window
   */
  async getRefreshCount1h(userId: string): Promise<number> {
    const countKey = `user:refresh_count:${userId}`
    const count = await this.redisService.get(countKey)
    return count ? parseInt(count, 10) : 0
  }
}
