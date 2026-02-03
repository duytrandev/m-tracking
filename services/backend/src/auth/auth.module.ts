import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ThrottlerModule } from '@nestjs/throttler'
import { EventEmitterModule } from '@nestjs/event-emitter'
import {
  User,
  Role,
  Permission,
  OAuthAccount,
  PasswordResetToken,
  EmailVerificationToken,
} from './entities'
import { SharedModule } from '../shared/shared.module'
import { AuthController } from './controllers/auth.controller'
import { OAuthController } from './controllers/oauth.controller'
import {
  AuthService,
  PasswordService,
  EmailService,
  TokenService,
  SessionService,
  SessionActivityService,
  AnomalyDetectionService,
  RegistrationService,
  PasswordManagementService,
} from './services'
import { OAuthService } from './services/oauth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { GoogleStrategy } from './strategies/google.strategy'
import { GitHubStrategy } from './strategies/github.strategy'
import { FacebookStrategy } from './strategies/facebook.strategy'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { SessionEventsListener } from './listeners/session-events.listener'
import { AuthAuditListener } from './listeners/auth-audit.listener'
import * as fs from 'fs'

/**
 * Auth Module
 * Handles user authentication, registration, JWT token management, and OAuth
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      OAuthAccount,
      PasswordResetToken,
      EmailVerificationToken,
    ]),
    ConfigModule,
    EventEmitterModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute time window
        limit: 10, // 10 requests per minute for auth endpoints
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const privateKeyPath = configService.get<string>(
          'JWT_PRIVATE_KEY_PATH',
          'jwt-private-key.pem'
        )
        const publicKeyPath = configService.get<string>(
          'JWT_PUBLIC_KEY_PATH',
          'jwt-public-key.pem'
        )

        return {
          privateKey: fs.readFileSync(privateKeyPath, 'utf8'),
          publicKey: fs.readFileSync(publicKeyPath, 'utf8'),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: '15m',
          },
        }
      },
    }),
    SharedModule,
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    // Core auth services
    AuthService,
    RegistrationService,
    PasswordManagementService,
    // Infrastructure services
    PasswordService,
    EmailService,
    TokenService,
    SessionService,
    SessionActivityService,
    AnomalyDetectionService,
    OAuthService,
    // Strategies
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    FacebookStrategy,
    // Guards
    JwtAuthGuard,
    GoogleAuthGuard,
    // Event listeners
    SessionEventsListener,
    AuthAuditListener,
  ],
  exports: [
    TypeOrmModule,
    AuthService,
    RegistrationService,
    PasswordManagementService,
    PasswordService,
    TokenService,
    SessionService,
    OAuthService,
    JwtAuthGuard,
    GoogleAuthGuard,
  ],
})
export class AuthModule {}
