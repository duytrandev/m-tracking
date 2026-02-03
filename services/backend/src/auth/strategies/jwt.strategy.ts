import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import { TokenPayload } from '../services/token.service'
import { RedisService } from '../../shared/redis/redis.service'
import { AuthExceptions } from '../../common/exceptions'

interface JwtPayloadWithIat extends TokenPayload {
  iat?: number
}

// Clock skew buffer for distributed systems (matches token.service.ts)
const CLOCK_SKEW_MS = 2000

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService
  ) {
    const publicKeyPath = configService.get<string>(
      'JWT_PUBLIC_KEY_PATH',
      'jwt-public-key.pem'
    )

    let publicKey: string
    try {
      publicKey = fs.readFileSync(publicKeyPath, 'utf8')
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === 'ENOENT') {
        throw new Error(
          `JWT public key not found at ${publicKeyPath}. ` +
            'Generate keys with: openssl genrsa -out jwt-private-key.pem 2048 && ' +
            'openssl rsa -in jwt-private-key.pem -pubout -out jwt-public-key.pem'
        )
      }
      throw new Error(`Failed to read JWT public key: ${err.message}`)
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    })
  }

  /**
   * Validate JWT payload and return user context
   * Also checks if user has logged out (token invalidation)
   */
  async validate(payload: JwtPayloadWithIat) {
    if (!payload.sub || !payload.email) {
      throw AuthExceptions.invalidToken()
    }

    // Check if all user tokens have been invalidated (logout from all devices)
    // This is the critical check that ensures tokens are rejected after logout
    if (payload.iat) {
      const invalidationTime = await this.redisService.getTokenInvalidationTime(
        payload.sub
      )
      if (invalidationTime) {
        // Token is invalid if issued before invalidation time
        // iat is in seconds (JWT standard), invalidationTime is in milliseconds
        // Add clock skew buffer for distributed systems consistency
        if (payload.iat * 1000 < invalidationTime - CLOCK_SKEW_MS) {
          throw AuthExceptions.tokenRevoked()
        }
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles || ['user'],
      sessionId: payload.sessionId,
    }
  }
}
