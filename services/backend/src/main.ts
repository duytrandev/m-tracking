/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import cookieParser from 'cookie-parser'
// import * as Sentry from '@sentry/node'

// Global filters, interceptors, pipes
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  TransformInterceptor,
} from './common'

// Sentry configuration
import { initializeSentry } from './shared/sentry/sentry.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Initialize Sentry FIRST (before any other middleware)
  initializeSentry(configService)

  // Sentry request handler (MUST be first middleware)
  // app.use(Sentry.Handlers.requestHandler())

  // Sentry tracing middleware
  // app.use(Sentry.Handlers.tracingHandler())

  // Cookie parser middleware
  app.use(cookieParser())

  // Global exception filter - Catch all exceptions
  app.useGlobalFilters(new HttpExceptionFilter())

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(), // Log all requests
    new TransformInterceptor() // Wrap responses
  )

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // Sentry error handler (MUST be before exception filter)
  // app.use(Sentry.Handlers.errorHandler())

  // CORS - Use config service
  app.enableCors({
    origin:
      configService.get<string>('app.corsOrigin') || 'http://localhost:3000',
    credentials: true,
  })

  // Global prefix - Use config service
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1'
  app.setGlobalPrefix(apiPrefix)

  const port = configService.get<number>('app.port') || 4000
  await app.listen(port)

  console.log(`🚀 Backend service running on http://localhost:${port}`)
  console.log(`📚 API available at http://localhost:${port}/${apiPrefix}`)
  console.log(`🌍 Environment: ${configService.get<string>('app.nodeEnv')}`)
}

void bootstrap()
