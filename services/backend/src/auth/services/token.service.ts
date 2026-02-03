import { Injectable, Logger } from '@nestjs/common'
import { AuthException, AuthExceptions } from '../../common/exceptions'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../../shared/redis/redis.service'
import { CryptoService } from '../../shared/crypto/crypto.service'
import { User } from '../entities/user.entity'
import { TOKEN_CONFIG } from '../constants/token-expiry.constants'
import * as fs from 'fs'

export interface TokenPayload {
  sub: string
  email: string
  roles: string[]
  sessionId: string
}

export interface RefreshTokenPayload {
  sub: string
  sessionId: string
  tokenVersion: number
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name)
  private readonly privateKey: string
  private readonly publicKey: string

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
    private cryptoService: CryptoService
  ) {
    // Load RSA keys from configurable paths
    const privateKeyPath = this.configService.get<string>(
      'JWT_PRIVATE_KEY_PATH',
      'jwt-private-key.pem'
    )
    const publicKeyPath = this.configService.get<string>(
      'JWT_PUBLIC_KEY_PATH',
      'jwt-public-key.pem'
    )

    try {
      this.privateKey = fs.readFileSync(privateKeyPath, 'utf8')
      this.publicKey = fs.readFileSync(publicKeyPath, 'utf8')
      this.logger.log('JWT keys loaded successfully')
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === 'ENOENT') {
        throw new Error(
          `JWT key file not found: ${err.path}. ` +
            'Generate keys with: openssl genrsa -out jwt-private-key.pem 2048 && ' +
            'openssl rsa -in jwt-private-key.pem -pubout -out jwt-public-key.pem'
        )
      }
      throw new Error(`Failed to read JWT key files: ${err.message}`)
    }
  }

  /**
   * Generate access token (15 minutes, RS256)
   */
  generateAccessToken(user: User, sessionId: string): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map(r => r.name) || ['user'],
      sessionId,
    }

    const token = this.jwtService.sign(payload, {
      algorithm: 'RS256',
      privateKey: this.privateKey,
      expiresIn: '15m',
    })

    this.logger.log(`Access token generated for user: ${user.id}`)
    return token
  }

  /**
   * Generate refresh token (7 days, HS256 with secret)
   */
  generateRefreshToken(
    userId: string,
    sessionId: string,
    tokenVersion: number
  ): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      sessionId,
      tokenVersion,
    }

    const secret = this.configService.get<string>('JWT_REFRESH_SECRET')
    const token = this.jwtService.sign(payload, {
      secret,
      algorithm: 'HS256',
      expiresIn: '7d',
    })

    this.logger.log(`Refresh token generated for user: ${userId}`)
    return token
  }

  /**
   * Verify access token (RS256 with public key)
   * Strict mode (production): fails if Redis unavailable - prevents blacklist bypass
   * Graceful mode (dev): logs warning but allows token - for local development
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = this.jwtService.verify<TokenPayload & { iat?: number }>(
        token,
        {
          publicKey: this.publicKey,
          algorithms: ['RS256'],
        }
      )

      // Check if token is blacklisted with strict Redis enforcement
      const tokenHash = this.cryptoService.hashToken(token)
      try {
        const isBlacklisted =
          await this.redisService.isTokenBlacklisted(tokenHash)
        if (isBlacklisted) {
          this.logger.warn('Access token is blacklisted')
          throw AuthExceptions.tokenRevoked()
        }
      } catch (error) {
        // Re-throw token revoked errors
        if (this.isTokenRevokedException(error)) throw error

        // Redis unavailable - apply strict mode policy
        if (TOKEN_CONFIG.REDIS_STRICT_MODE) {
          this.logger.error(
            `Redis unavailable - rejecting token (strict mode): ${(error as Error).message}`
          )
          throw AuthExceptions.serviceUnavailable()
        }
        // Graceful mode (dev only): log warning but allow
        this.logger.warn(
          `Redis unavailable - allowing token (dev mode): ${(error as Error).message}`
        )
      }

      // Check if all user tokens have been invalidated (logout from all devices)
      if (decoded.iat) {
        const isInvalidated = await this.isTokenInvalidated(
          decoded.sub,
          decoded.iat
        )
        if (isInvalidated) {
          this.logger.warn(`Token invalidated for user: ${decoded.sub}`)
          throw AuthExceptions.tokenRevoked()
        }
      }

      return decoded
    } catch (error) {
      // Re-throw known auth exceptions
      if (this.isTokenRevokedException(error)) throw error
      if (this.isServiceUnavailableException(error)) throw error

      // Handle JWT library errors
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw AuthExceptions.tokenExpired()
      }

      this.logger.error(
        `Access token verification failed: ${(error as Error).message}`
      )
      throw AuthExceptions.invalidToken()
    }
  }

  /**
   * Verify refresh token (HS256 with secret)
   * Strict mode (production): fails if Redis unavailable - prevents blacklist bypass
   * Graceful mode (dev): logs warning but allows token - for local development
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET')
      const decoded = this.jwtService.verify<
        RefreshTokenPayload & { iat?: number }
      >(token, {
        secret,
        algorithms: ['HS256'],
      })

      // Check if token is blacklisted with strict Redis enforcement
      const tokenHash = this.cryptoService.hashToken(token)
      try {
        const isBlacklisted =
          await this.redisService.isTokenBlacklisted(tokenHash)
        if (isBlacklisted) {
          this.logger.warn('Refresh token is blacklisted')
          throw AuthExceptions.tokenRevoked()
        }
      } catch (error) {
        // Re-throw token revoked errors
        if (this.isTokenRevokedException(error)) throw error

        // Redis unavailable - apply strict mode policy
        if (TOKEN_CONFIG.REDIS_STRICT_MODE) {
          this.logger.error(
            `Redis unavailable - rejecting refresh token (strict mode): ${(error as Error).message}`
          )
          throw AuthExceptions.serviceUnavailable()
        }
        // Graceful mode (dev only): log warning but allow
        this.logger.warn(
          `Redis unavailable - allowing refresh token (dev mode): ${(error as Error).message}`
        )
      }

      // Check if all user tokens have been invalidated (logout from all devices)
      if (decoded.iat) {
        const isInvalidated = await this.isTokenInvalidated(
          decoded.sub,
          decoded.iat
        )
        if (isInvalidated) {
          this.logger.warn(`Refresh token invalidated for user: ${decoded.sub}`)
          throw AuthExceptions.tokenRevoked()
        }
      }

      return decoded
    } catch (error) {
      // Re-throw known auth exceptions
      if (this.isTokenRevokedException(error)) throw error
      if (this.isServiceUnavailableException(error)) throw error

      // Handle JWT library errors
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw AuthExceptions.tokenExpired()
      }

      this.logger.error(
        `Refresh token verification failed: ${(error as Error).message}`
      )
      throw AuthExceptions.invalidToken()
    }
  }

  /**
   * Blacklist access token in Redis (15 minutes TTL)
   */
  async blacklistAccessToken(token: string, userId: string): Promise<void> {
    const tokenHash = this.cryptoService.hashToken(token)
    await this.redisService.blacklistToken(tokenHash, userId, 15 * 60) // 15 minutes
    this.logger.log(`Access token blacklisted for user: ${userId}`)
  }

  /**
   * Blacklist refresh token in Redis (7 days TTL)
   */
  async blacklistRefreshToken(token: string, userId: string): Promise<void> {
    const tokenHash = this.cryptoService.hashToken(token)
    await this.redisService.blacklistToken(tokenHash, userId, 7 * 24 * 60 * 60) // 7 days
    this.logger.log(`Refresh token blacklisted for user: ${userId}`)
  }

  /**
   * Decode token without verification (for extracting payload)
   */
  decodeToken(token: string): Record<string, unknown> | null {
    return this.jwtService.decode(token)
  }

  /**
   * Invalidate all tokens for a user by setting invalidation timestamp
   * Any token issued before this timestamp will be rejected
   */
  async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.redisService.setTokenInvalidationTime(userId)
    this.logger.log(`All tokens invalidated for user: ${userId}`)
  }

  /**
   * Check if token was issued before user's token invalidation time
   * Uses configurable clock skew buffer for distributed system timing (default: 5s)
   */
  async isTokenInvalidated(
    userId: string,
    tokenIssuedAt: number
  ): Promise<boolean> {
    const invalidationTime =
      await this.redisService.getTokenInvalidationTime(userId)
    if (!invalidationTime) return false
    // Token is invalid if issued before invalidation time
    // tokenIssuedAt is in seconds (JWT iat), invalidationTime is in milliseconds
    // Clock skew buffer for multi-region deployments (5s default)
    const CLOCK_SKEW_MS = TOKEN_CONFIG.CLOCK_SKEW_SECONDS * 1000
    return tokenIssuedAt * 1000 < invalidationTime - CLOCK_SKEW_MS
  }

  /**
   * Check if error is a token revoked exception
   * Eliminates fragile type coercion patterns
   */
  private isTokenRevokedException(error: unknown): boolean {
    if (error instanceof AuthException) {
      const response = error.getResponse()
      return (
        typeof response === 'object' &&
        response !== null &&
        'code' in response &&
        (response.code === 'TOKEN_REVOKED' || response.code === 'TOKEN_EXPIRED')
      )
    }
    return false
  }

  /**
   * Check if error is a service unavailable exception
   */
  private isServiceUnavailableException(error: unknown): boolean {
    if (error instanceof AuthException) {
      const response = error.getResponse()
      return (
        typeof response === 'object' &&
        response !== null &&
        'code' in response &&
        response.code === 'SERVICE_UNAVAILABLE'
      )
    }
    return false
  }
}
