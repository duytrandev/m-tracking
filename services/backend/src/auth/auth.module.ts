import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ThrottlerModule } from '@nestjs/throttler'
import {
  User,
  Role,
  Permission,
  Session,
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
} from './services'
import { OAuthService } from './services/oauth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { GoogleStrategy } from './strategies/google.strategy'
import { GitHubStrategy } from './strategies/github.strategy'
import { FacebookStrategy } from './strategies/facebook.strategy'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
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
      Session,
      OAuthAccount,
      PasswordResetToken,
      EmailVerificationToken,
    ]),
    ConfigModule,
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
    AuthService,
    PasswordService,
    EmailService,
    TokenService,
    SessionService,
    OAuthService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    FacebookStrategy,
    JwtAuthGuard,
  ],
  exports: [
    TypeOrmModule,
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    OAuthService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
