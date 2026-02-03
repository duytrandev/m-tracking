/**
 * Redis Session Interfaces
 * Defines data structures for Redis-based session storage and activity monitoring
 */

/**
 * Session data stored in Redis hash
 * Redis key pattern: session:{sessionId}
 */
export interface RedisSessionData {
  id: string
  userId: string
  refreshTokenHash: string
  deviceInfo: { userAgent?: string; platform?: string }
  ipAddress: string
  createdAt: string
  lastActiveAt: string
  expiresAt: string
}

/**
 * Activity entry stored in Redis list
 * Redis key pattern: activity:{sessionId}
 */
export interface ActivityEntry {
  type: 'login' | 'refresh' | 'ip_change' | 'device_change' | 'logout'
  timestamp: string
  ip?: string
  oldIp?: string
  newIp?: string
  metadata?: Record<string, unknown>
}

/**
 * User activity summary stored in Redis hash
 * Redis key pattern: user:activity:{userId}
 */
export interface UserActivitySummary {
  lastLoginAt?: string
  lastIp?: string
  loginCount24h: number
  refreshCount24h: number
  suspiciousFlags: string[]
}

/**
 * Anomaly types for activity monitoring
 */
export enum AnomalyType {
  IP_CHANGE = 'ip_change',
  EXCESSIVE_LOGINS = 'excessive_logins',
  EXCESSIVE_REFRESHES = 'excessive_refreshes',
  DEVICE_CHANGE = 'device_change',
  CONCURRENT_SESSION_ABUSE = 'concurrent_session_abuse',
}

/**
 * Constants for session and activity configuration
 */
export const SESSION_CONFIG = {
  // Session TTL: 7 days in seconds
  SESSION_TTL: 7 * 24 * 60 * 60,
  // Activity log TTL: 7 days in seconds
  ACTIVITY_TTL: 7 * 24 * 60 * 60,
  // User activity summary TTL: 30 days in seconds
  USER_ACTIVITY_TTL: 30 * 24 * 60 * 60,
  // Max activity entries per session
  MAX_ACTIVITY_ENTRIES: 100,
  // Max concurrent sessions per user
  MAX_CONCURRENT_SESSIONS: 5,
  // Anomaly thresholds
  EXCESSIVE_LOGINS_THRESHOLD: 10, // per 24h
  EXCESSIVE_REFRESHES_THRESHOLD: 50, // per 1h
} as const

/**
 * Redis key patterns for session management
 */
export const REDIS_KEYS = {
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:sessions:${userId}`,
  activity: (sessionId: string) => `activity:${sessionId}`,
  userActivity: (userId: string) => `user:activity:${userId}`,
  /** Refresh token hash -> sessionId index for O(1) lookup */
  refreshTokenIndex: (tokenHash: string) => `refreshTokenIdx:${tokenHash}`,
} as const
