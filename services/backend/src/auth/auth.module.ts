import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  User,
  Role,
  Permission,
  Session,
  OAuthAccount,
  PasswordResetToken,
  EmailVerificationToken,
} from './entities';
import { SharedModule } from '../shared/shared.module';
import { AuthController } from './controllers/auth.controller';
import { OAuthController } from './controllers/oauth.controller';
import {
  AuthService,
  PasswordService,
  EmailService,
  TokenService,
  SessionService,
} from './services';
import { OAuthService } from './services/oauth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import * as fs from 'fs';

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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        privateKey: fs.readFileSync('jwt-private-key.pem', 'utf8'),
        publicKey: fs.readFileSync('jwt-public-key.pem', 'utf8'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '15m',
        },
      }),
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
