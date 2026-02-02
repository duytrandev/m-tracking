import { Injectable, Logger } from '@nestjs/common'
import { AuthExceptions } from '../../common/exceptions'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../../shared/redis/redis.service'
import { User } from '../entities/user.entity'
import * as crypto from 'crypto'
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
    private configService: ConfigService
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

    this.privateKey = fs.readFileSync(privateKeyPath, 'utf8')
    this.publicKey = fs.readFileSync(publicKeyPath, 'utf8')

    this.logger.log('JWT keys loaded successfully')
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

      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.isTokenBlacklisted(
        this.hashToken(token)
      )

      if (isBlacklisted) {
        this.logger.warn('Access token is blacklisted')
        throw AuthExceptions.tokenRevoked()
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
      if (
        (error as { name?: string }).name === 'TokenRevokedException' ||
        (error as { message?: string }).message?.includes('revoked')
      ) {
        throw error
      }
      this.logger.error(
        `Access token verification failed: ${(error as Error).message}`
      )
      throw AuthExceptions.invalidToken()
    }
  }

  /**
   * Verify refresh token (HS256 with secret)
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

      // Check if token is blacklisted
      const tokenHash = this.hashToken(token)
      const isBlacklisted =
        await this.redisService.isTokenBlacklisted(tokenHash)

      if (isBlacklisted) {
        this.logger.warn('Refresh token is blacklisted')
        throw AuthExceptions.tokenRevoked()
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
      if (
        (error as { name?: string }).name === 'TokenRevokedException' ||
        (error as { message?: string }).message?.includes('revoked')
      ) {
        throw error
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
    const tokenHash = this.hashToken(token)
    await this.redisService.blacklistToken(tokenHash, userId, 15 * 60) // 15 minutes
    this.logger.log(`Access token blacklisted for user: ${userId}`)
  }

  /**
   * Blacklist refresh token in Redis (7 days TTL)
   */
  async blacklistRefreshToken(token: string, userId: string): Promise<void> {
    const tokenHash = this.hashToken(token)
    await this.redisService.blacklistToken(tokenHash, userId, 7 * 24 * 60 * 60) // 7 days
    this.logger.log(`Refresh token blacklisted for user: ${userId}`)
  }

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
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
   * Includes 2-second clock skew buffer for distributed system timing
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
    // Add 2-second clock skew buffer for distributed systems
    const CLOCK_SKEW_MS = 2000
    return tokenIssuedAt * 1000 < invalidationTime - CLOCK_SKEW_MS
  }
}
