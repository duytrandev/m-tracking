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
   */
  async incrementRateLimit(
    endpoint: string,
    identifier: string,
    ttl: number
  ): Promise<number> {
    const key = `ratelimit:${endpoint}:${identifier}`
    const count = await this.incr(key)

    // Set TTL only on first increment
    if (count === 1) {
      await this.client.expire(key, ttl)
    }

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
}
