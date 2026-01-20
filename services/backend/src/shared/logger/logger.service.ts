import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { DEFAULT_LOG_LEVEL } from './logger.constants';

/**
 * Logger Service
 * Implements NestJS LoggerService interface with Winston backend
 * Provides structured JSON logging for production and pretty console for development
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private readonly configService: ConfigService) {
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    const level = this.configService.get('LOG_LEVEL', DEFAULT_LOG_LEVEL);

    this.logger = winston.createLogger({
      level,
      format: isDev ? this.devFormat() : this.prodFormat(),
      transports: [new winston.transports.Console()],
    });
  }

  /**
   * Set context for all subsequent log calls
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log info level message
   */
  log(message: string, context?: string): void {
    this.logger.info(message, { context: context || this.context });
  }

  /**
   * Log error level message with optional stack trace
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  /**
   * Log warning level message
   */
  warn(message: string, context?: string): void {
    this.logger.warn(message, { context: context || this.context });
  }

  /**
   * Log debug level message
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, { context: context || this.context });
  }

  /**
   * Log verbose level message
   */
  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context: context || this.context });
  }

  /**
   * Log with additional metadata
   */
  logWithMeta(level: string, message: string, meta: Record<string, any>): void {
    this.logger.log(level, message, {
      ...meta,
      context: meta.context || this.context,
    });
  }

  /**
   * Development format: Pretty console output with colors
   */
  private devFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
        const ctx = context ? `[${context}]` : '';
        const metaKeys = Object.keys(meta).filter(
          (key) => !['timestamp', 'level', 'message'].includes(key),
        );
        const metaStr = metaKeys.length ? ` ${JSON.stringify(meta)}` : '';
        const traceStr = trace ? `\n${trace}` : '';
        return `${timestamp} ${level} ${ctx} ${message}${metaStr}${traceStr}`;
      }),
    );
  }

  /**
   * Production format: Structured JSON output
   */
  private prodFormat(): winston.Logform.Format {
    return winston.format.combine(winston.format.timestamp(), winston.format.json());
  }
}
