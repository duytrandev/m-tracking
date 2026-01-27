/**
 * Queue Constants
 * Defines queue names, default options, and configuration for BullMQ
 */

/**
 * Queue names for different background job types
 */
export enum QueueName {
  BANK_SYNC = 'bank-sync',
  NOTIFICATIONS = 'notifications',
  REPORTS = 'reports',
  ANALYTICS = 'analytics',
}

/**
 * Default job options with retry and cleanup configuration
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000, // 1s, 2s, 4s
  },
  removeOnComplete: {
    count: 100, // Keep last 100 completed jobs
    age: 24 * 3600, // Keep for 24 hours
  },
  removeOnFail: {
    count: 500, // Keep last 500 failed jobs for debugging
  },
}

/**
 * Connection identifier for queue Redis instance
 */
export const QUEUE_CONNECTION_NAME = 'queue'
