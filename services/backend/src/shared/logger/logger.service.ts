import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as winston from 'winston'
import { DEFAULT_LOG_LEVEL } from './logger.constants'

/**
 * Logger Service
 * Implements NestJS LoggerService interface with Winston backend
 * Provides structured JSON logging for production and pretty console for development
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger
  private context?: string

  constructor(private readonly configService: ConfigService) {
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production'
    const level =
      this.configService.get<string>('LOG_LEVEL') ?? DEFAULT_LOG_LEVEL

    this.logger = winston.createLogger({
      level,
      format: isDev ? this.devFormat() : this.prodFormat(),
      transports: [new winston.transports.Console()],
    })
  }

  /**
   * Set context for all subsequent log calls
   */
  setContext(context: string): void {
    this.context = context
  }

  /**
   * Log info level message
   */
  log(message: string, context?: string): void {
    this.logger.info(message, { context: context || this.context })
  }

  /**
   * Log error level message with optional stack trace
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    })
  }

  /**
   * Log warning level message
   */
  warn(message: string, context?: string): void {
    this.logger.warn(message, { context: context || this.context })
  }

  /**
   * Log debug level message
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, { context: context || this.context })
  }

  /**
   * Log verbose level message
   */
  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context: context || this.context })
  }

  /**
   * Log with additional metadata
   */
  logWithMeta(
    level: string,
    message: string,
    meta: Record<string, unknown>
  ): void {
    this.logger.log(level, message, {
      ...meta,
      context: typeof meta.context === 'string' ? meta.context : this.context,
    })
  }

  /**
   * Development format: Pretty console output with colors
   */
  private devFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(info => this.formatDevMessage(info))
    )
  }

  /**
   * Format development log message with colors and structure
   */
  private formatDevMessage(info: winston.Logform.TransformableInfo): string {
    const { timestamp, level, message, context, trace, ...meta } = info

    const timestampStr = this.safeStringify(timestamp)
    const levelStr = this.safeStringify(level)
    const messageStr = this.safeStringify(message)
    const contextStr = this.formatContext(context)
    const metaStr = this.formatMeta(meta)
    const traceStr = this.formatTrace(trace)

    return `${timestampStr} ${levelStr} ${contextStr}${messageStr}${metaStr}${traceStr}`
  }

  /**
   * Safely convert value to string
   */
  private safeStringify(value: unknown): string {
    if (typeof value === 'string') return value
    if (value == null) return ''
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object') return JSON.stringify(value)
    // For primitives (number, boolean, symbol, bigint), String() is safe
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value)
    }
    // Fallback for symbol and other types
    return typeof value === 'symbol' ? value.toString() : ''
  }

  /**
   * Format context as [Context] or empty string
   */
  private formatContext(context: unknown): string {
    return context && typeof context === 'string' ? `[${context}] ` : ''
  }

  /**
   * Format metadata as JSON string
   */
  private formatMeta(meta: Record<string, unknown>): string {
    const metaKeys = Object.keys(meta).filter(
      key => !['timestamp', 'level', 'message'].includes(key)
    )
    return metaKeys.length ? ` ${JSON.stringify(meta)}` : ''
  }

  /**
   * Format stack trace with newline prefix
   */
  private formatTrace(trace: unknown): string {
    return trace && typeof trace === 'string' ? `\n${trace}` : ''
  }

  /**
   * Production format: Structured JSON output
   */
  private prodFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }
}
