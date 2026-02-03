import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import * as Sentry from '@sentry/node'

/**
 * Global HTTP exception filter
 *
 * Catches all exceptions and formats them into a consistent error response.
 * Logs errors for debugging and monitoring.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    interface HttpExceptionResponse {
      message: string
      error?: string
      code?: string
      retryAfter?: number
    }

    const getErrorMessage = (msg: string | object): string => {
      if (typeof msg === 'string') return msg
      if (msg && typeof msg === 'object' && 'message' in msg) {
        return String((msg as HttpExceptionResponse).message)
      }
      return 'An error occurred'
    }

    const getErrorType = (msg: string | object): string | undefined => {
      if (typeof msg === 'object' && msg && 'error' in msg) {
        return String((msg as HttpExceptionResponse).error)
      }
      return undefined
    }

    const getErrorCode = (msg: string | object): string | undefined => {
      if (typeof msg === 'object' && msg && 'code' in msg) {
        return String((msg as HttpExceptionResponse).code)
      }
      return undefined
    }

    const getRetryAfter = (msg: string | object): number | undefined => {
      if (typeof msg === 'object' && msg && 'retryAfter' in msg) {
        return (msg as HttpExceptionResponse).retryAfter
      }
      return undefined
    }

    const retryAfter = getRetryAfter(message)
    const errorResponse = {
      statusCode: status,
      message: getErrorMessage(message),
      error: getErrorType(message),
      code: getErrorCode(message),
      ...(retryAfter !== undefined && { retryAfter }),
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    // Log error - only include stack trace in non-production environments
    const code = getErrorCode(message)
    const isAuthFailure = status === 401 || status === 403

    if (isAuthFailure) {
      // Auth failures get warn level with security context
      this.logger.warn(
        `Auth failure: ${code || 'UNKNOWN'} - ${request.method} ${request.url}`
      )
    } else {
      // Other errors get standard error logging
      const stack =
        process.env.NODE_ENV === 'production'
          ? undefined
          : exception instanceof Error
            ? exception.stack
            : undefined

      this.logger.error(`${request.method} ${request.url} ${status}`, stack)
    }

    // Capture 5xx errors (server errors) in Sentry
    if (status >= 500) {
      Sentry.captureException(exception, {
        contexts: {
          http: {
            method: request.method,
            url: request.url,
            status_code: status,
            user_agent: request.headers['user-agent'],
          },
        },
        tags: {
          http_method: request.method,
          http_status: String(status),
        },
      })
    }

    response.status(status).json(errorResponse)
  }
}
