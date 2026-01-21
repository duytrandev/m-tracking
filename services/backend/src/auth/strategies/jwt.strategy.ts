import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { TokenPayload } from '../services/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY_PATH', 'jwt-public-key.pem');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  /**
   * Validate JWT payload and return user context
   */
  async validate(payload: TokenPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles || ['user'],
      sessionId: payload.sessionId,
    };
  }
}
