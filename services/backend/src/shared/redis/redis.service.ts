import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, RedisClientType } from 'redis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client!: RedisClientType

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
      },
      password: this.configService.get('REDIS_PASSWORD'),
    })

    this.client.on('error', err => {
      this.logger.error('Redis Client Error', err)
    })

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected')
    })

    await this.client.connect()
  }

  async onModuleDestroy() {
    await this.client.quit()
    this.logger.log('Redis Client Disconnected')
  }

  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value)
    } else {
      await this.client.set(key, value)
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1
  }

  /**
   * Set key with expiration timestamp
   */
  async expireAt(key: string, timestamp: number): Promise<boolean> {
    const result = await this.client.expireAt(key, timestamp)
    return result === 1
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key)
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key)
  }

  /**
   * Set hash field
   */
  async hSet(key: string, field: string, value: string): Promise<void> {
    await this.client.hSet(key, field, value)
  }

  /**
   * Get hash field
   */
  async hGet(key: string, field: string): Promise<string | undefined> {
    const result = await this.client.hGet(key, field)
    return result ?? undefined
  }

  /**
   * Get all hash fields
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hGetAll(key)
  }

  /**
   * Delete hash field
   */
  async hDel(key: string, field: string): Promise<number> {
    return this.client.hDel(key, field)
  }

  /**
   * Set all hash fields from object with optional TTL
   */
  async hSetAll(
    key: string,
    obj: Record<string, string>,
    ttl?: number
  ): Promise<void> {
    if (Object.keys(obj).length === 0) return
    await this.client.hSet(key, obj)
    if (ttl) {
      await this.client.expire(key, ttl)
    }
  }

  /**
   * Add member to set
   */
  async sAdd(key: string, member: string): Promise<number> {
    return this.client.sAdd(key, member)
  }

  /**
   * Remove member from set
   */
  async sRem(key: string, member: string): Promise<number> {
    return this.client.sRem(key, member)
  }

  /**
   * Get all members of set
   */
  async sMembers(key: string): Promise<string[]> {
    return this.client.sMembers(key)
  }

  /**
   * Get set cardinality (size)
   */
  async sCard(key: string): Promise<number> {
    return this.client.sCard(key)
  }

  /**
   * Push value to list (left push)
   */
  async lPush(key: string, value: string): Promise<number> {
    return this.client.lPush(key, value)
  }

  /**
   * Get range of list elements
   */
  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lRange(key, start, stop)
  }

  /**
   * Trim list to specified range
   */
  async lTrim(key: string, start: number, stop: number): Promise<string> {
    return this.client.lTrim(key, start, stop)
  }

  /**
   * Set TTL on existing key (in seconds)
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const result = await this.client.expire(key, ttl)
    return Boolean(result)
  }

  /**
   * Get keys by pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern)
  }

  /**
   * Blacklist a refresh token
   */
  async blacklistToken(
    tokenHash: string,
    userId: string,
    ttl: number
  ): Promise<void> {
    const key = `blacklist:refresh:${tokenHash}`
    await this.set(key, userId, ttl)
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(tokenHash: string): Promise<boolean> {
    const key = `blacklist:refresh:${tokenHash}`
    return this.exists(key)
  }

  /**
   * Rate limiting: increment attempt counter
   * Uses Lua script for atomicity to prevent race condition where
   * process crashes between INCR and EXPIRE, leaving orphan keys
   */
  private readonly rateLimitScript = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return count
  `

  async incrementRateLimit(
    endpoint: string,
    identifier: string,
    ttl: number
  ): Promise<number> {
    const key = `ratelimit:${endpoint}:${identifier}`

    // Atomic increment with TTL using Lua script
    const count = (await this.client.eval(this.rateLimitScript, {
      keys: [key],
      arguments: [ttl.toString()],
    })) as number

    return count
  }

  /**
   * Rate limiting: get attempt count
   */
  async getRateLimitCount(
    endpoint: string,
    identifier: string
  ): Promise<number> {
    const key = `ratelimit:${endpoint}:${identifier}`
    const value = await this.get(key)
    return value ? parseInt(value, 10) : 0
  }

  /**
   * Cache session data
   */
  async cacheSession<T = unknown>(
    userId: string,
    sessionId: string,
    data: T,
    ttl: number
  ): Promise<void> {
    const key = `session:${userId}:${sessionId}`
    await this.set(key, JSON.stringify(data), ttl)
  }

  /**
   * Get cached session
   */
  async getCachedSession<T = unknown>(
    userId: string,
    sessionId: string
  ): Promise<T | null> {
    const key = `session:${userId}:${sessionId}`
    const data = await this.get(key)
    return data ? (JSON.parse(data) as T) : null
  }

  /**
   * Delete cached session
   */
  async deleteCachedSession(userId: string, sessionId: string): Promise<void> {
    const key = `session:${userId}:${sessionId}`
    await this.del(key)
  }

  /**
   * Set token invalidation timestamp for a user
   * All tokens issued before this timestamp will be considered invalid
   * TTL set to 7 days (max refresh token lifetime)
   */
  async setTokenInvalidationTime(userId: string): Promise<void> {
    const key = `token:invalidated:${userId}`
    const timestamp = Date.now().toString()
    await this.set(key, timestamp, 7 * 24 * 60 * 60) // 7 days TTL
  }

  /**
   * Get token invalidation timestamp for a user
   * Returns null if no invalidation has occurred
   */
  async getTokenInvalidationTime(userId: string): Promise<number | null> {
    const key = `token:invalidated:${userId}`
    const value = await this.get(key)
    return value ? parseInt(value, 10) : null
  }

  // =========================================
  // Refresh Token Index (O(1) Session Lookup)
  // =========================================

  /**
   * Set refresh token index for O(1) session lookup
   * Maps token hash -> sessionId
   * @param tokenHash SHA-256 hash of refresh token
   * @param sessionId Session ID to map to
   * @param ttlSeconds TTL matching session expiry
   */
  async setRefreshTokenIndex(
    tokenHash: string,
    sessionId: string,
    ttlSeconds: number
  ): Promise<void> {
    const key = `refreshTokenIdx:${tokenHash}`
    await this.client.setEx(key, ttlSeconds, sessionId)
  }

  /**
   * Get session ID by refresh token hash
   * @param tokenHash SHA-256 hash of refresh token
   * @returns Session ID or null if not found
   */
  async getRefreshTokenIndex(tokenHash: string): Promise<string | null> {
    const key = `refreshTokenIdx:${tokenHash}`
    return this.client.get(key)
  }

  /**
   * Delete refresh token index
   * Call when revoking session or rotating token
   * @param tokenHash SHA-256 hash of refresh token
   */
  async deleteRefreshTokenIndex(tokenHash: string): Promise<void> {
    const key = `refreshTokenIdx:${tokenHash}`
    await this.client.del(key)
  }

  /**
   * Store OAuth authorization code with tokens
   * Single-use code that expires in 60 seconds
   * @param code Random authorization code
   * @param data Token data to store
   */
  async storeOAuthCode(
    code: string,
    data: { accessToken: string; userId: string }
  ): Promise<void> {
    const key = `oauth:code:${code}`
    await this.set(key, JSON.stringify(data), 60) // 60 seconds TTL
  }

  /**
   * Retrieve and delete OAuth authorization code (single-use)
   * Returns null if code doesn't exist or already used
   * @param code Authorization code to exchange
   */
  async consumeOAuthCode(
    code: string
  ): Promise<{ accessToken: string; userId: string } | null> {
    const key = `oauth:code:${code}`
    const data = await this.get(key)
    if (!data) return null

    // Delete immediately to ensure single-use
    await this.del(key)
    return JSON.parse(data) as { accessToken: string; userId: string }
  }
}
