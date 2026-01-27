/**
 * Logger Constants
 * Defines log levels and context keys for structured logging
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export const LOG_CONTEXT_KEY = 'context'
export const REQUEST_ID_KEY = 'requestId'

/**
 * Default log format for different environments
 */
export const DEFAULT_LOG_LEVEL = 'info'
export const DEFAULT_LOG_FORMAT = 'json'
