# Phase 3: JWT Session Management

**Duration:** Week 2
**Priority:** Critical
**Status:** ✅ Complete (2026-01-16)
**Summary:** [phase-03-implementation-summary.md](./phase-03-implementation-summary.md)
**Dependencies:** Phase 2 (Email/Password Auth)

---

## Overview

Implement hybrid JWT session management with RS256 signing, token rotation, Redis blacklisting, and multi-device session tracking.

---

## Context Links

- [JWT Auth Research](../../plans/reports/researcher-jwt-auth-260116-1409.md)
- [System Architecture - JWT Strategy](../../docs/system-architecture.md#adr-006-jwt-with-short-lived-access-tokens)

---

## Key Insights

- **Access Token**: 15 minutes, RS256, stateless validation
- **Refresh Token**: 7 days, rotation on use, Redis-backed
- **Storage**: Refresh in httpOnly cookie, access in response body
- **Blacklist**: Redis O(1) lookup for revoked tokens
- **Multi-Device**: Track sessions per device

---

## Architecture

### Token Structure

**Access Token Payload:**
```typescript
{
  sub: userId,
  email: user.email,
  roles: ['user'],
  sessionId: sessionId,
  iat: issuedAt,
  exp: expiresAt,
}
```

**Refresh Token Payload:**
```typescript
{
  sub: userId,
  sessionId: sessionId,
  tokenVersion: 1, // For rotation tracking
  iat: issuedAt,
  exp: expiresAt,
}
```

### RS256 Key Pair

Generate keys:
```bash
# Private key (keep secret!)
openssl genrsa -out private-key.pem 2048

# Public key (can be shared)
openssl rsa -in private-key.pem -pubout -out public-key.pem
```

Store in environment:
```bash
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
```

### Redis Schema

**Token Blacklist:**
```
Key: blacklist:access:{tokenId}
Value: userId
TTL: 15 minutes

Key: blacklist:refresh:{tokenHash}
Value: userId
TTL: 7 days
```

**Session Cache:**
```
Key: session:{userId}:{sessionId}
Value: JSON{userId, email, roles, deviceInfo, lastActive}
TTL: 15 minutes (auto-refresh on access)
```

---

## Implementation Steps

### Step 1: Install Dependencies & Generate Keys

```bash
cd services/backend
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt

# Generate RSA keys
openssl genrsa -out jwt-private-key.pem 2048
openssl rsa -in jwt-private-key.pem -pubout -out jwt-public-key.pem

# Add to .env (escape newlines as \n)
```

### Step 2: Create JWT Module Configuration

```typescript
// jwt.config.ts
import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  privateKey: fs.readFileSync('jwt-private-key.pem', 'utf8'),
  publicKey: fs.readFileSync('jwt-public-key.pem', 'utf8'),
  signOptions: {
    algorithm: 'RS256',
    expiresIn: '15m',
  },
});
```

### Step 3: Create Token Service

```typescript
// token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../shared/redis/redis.service';
import { User } from '../entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(user: User, sessionId: string): string {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map(r => r.name) || ['user'],
      sessionId,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
  }

  generateRefreshToken(userId: string, sessionId: string, tokenVersion: number): string {
    const payload = {
      sub: userId,
      sessionId,
      tokenVersion,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  async verifyAccessToken(token: string): Promise<any> {
    const decoded = this.jwtService.verify(token);

    // Check blacklist
    const blacklisted = await this.redisService.exists(`blacklist:access:${decoded.jti}`);
    if (blacklisted) {
      throw new Error('Token revoked');
    }

    return decoded;
  }

  async verifyRefreshToken(token: string): Promise<any> {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    // Check blacklist
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await this.redisService.exists(`blacklist:refresh:${tokenHash}`);

    if (blacklisted) {
      throw new Error('Token revoked');
    }

    return decoded;
  }

  async blacklistRefreshToken(token: string, userId: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redisService.set(
      `blacklist:refresh:${tokenHash}`,
      userId,
      7 * 24 * 60 * 60 // 7 days
    );
  }

  async blacklistAccessToken(tokenId: string, userId: string): Promise<void> {
    await this.redisService.set(
      `blacklist:access:${tokenId}`,
      userId,
      15 * 60 // 15 minutes
    );
  }
}
```

### Step 4: Create JWT Strategy

```typescript
// jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: fs.readFileSync('jwt-public-key.pem', 'utf8'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sessionId,
    };
  }
}
```

### Step 5: Create JWT Auth Guard

```typescript
// jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

### Step 6: Create Session Service

```typescript
// session.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}

  async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo: any,
    ipAddress: string,
  ): Promise<Session> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = this.sessionRepository.create({
      userId,
      refreshTokenHash: tokenHash,
      deviceInfo,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return this.sessionRepository.save(session);
  }

  async findSession(refreshToken: string): Promise<Session | null> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    return this.sessionRepository.findOne({
      where: { refreshTokenHash: tokenHash },
    });
  }

  async updateLastActive(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastActiveAt: new Date(),
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }
}
```

### Step 7: Update Auth Service for JWT

```typescript
// Add to auth.service.ts
async login(user: User, deviceInfo: any, ipAddress: string) {
  // Generate tokens
  const sessionId = crypto.randomUUID();
  const accessToken = this.tokenService.generateAccessToken(user, sessionId);
  const refreshToken = this.tokenService.generateRefreshToken(user.id, sessionId, 1);

  // Create session
  await this.sessionService.createSession(user.id, refreshToken, deviceInfo, ipAddress);

  return {
    accessToken,
    refreshToken, // Send in httpOnly cookie
    expiresIn: 900, // 15 minutes
  };
}

async refresh(refreshToken: string): Promise<any> {
  // Verify refresh token
  const decoded = await this.tokenService.verifyRefreshToken(refreshToken);

  // Find session
  const session = await this.sessionService.findSession(refreshToken);
  if (!session) {
    throw new UnauthorizedException('Invalid session');
  }

  // Get user
  const user = await this.userRepository.findOne({
    where: { id: decoded.sub },
    relations: ['roles'],
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  // Blacklist old refresh token
  await this.tokenService.blacklistRefreshToken(refreshToken, user.id);

  // Generate new tokens (rotation)
  const newSessionId = session.id;
  const newAccessToken = this.tokenService.generateAccessToken(user, newSessionId);
  const newRefreshToken = this.tokenService.generateRefreshToken(
    user.id,
    newSessionId,
    decoded.tokenVersion + 1,
  );

  // Update session
  await this.sessionService.createSession(user.id, newRefreshToken, session.deviceInfo, session.ipAddress);
  await this.sessionService.revokeSession(session.id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900,
  };
}

async logout(refreshToken: string, accessToken: string): Promise<void> {
  // Blacklist both tokens
  const accessDecoded = this.jwtService.decode(accessToken);
  await this.tokenService.blacklistAccessToken(accessDecoded.jti, accessDecoded.sub);
  await this.tokenService.blacklistRefreshToken(refreshToken, accessDecoded.sub);

  // Revoke session
  const session = await this.sessionService.findSession(refreshToken);
  if (session) {
    await this.sessionService.revokeSession(session.id);
  }
}
```

### Step 8: Update Auth Controller

```typescript
// Add to auth.controller.ts
@Post('login')
@HttpCode(HttpStatus.OK)
async login(
  @Body() dto: LoginDto,
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const user = await this.authService.validateUser(dto.email, dto.password);

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const deviceInfo = {
    userAgent: req.headers['user-agent'],
    platform: req.headers['sec-ch-ua-platform'],
  };
  const ipAddress = req.ip;

  const tokens = await this.authService.login(user, deviceInfo, ipAddress);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return {
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  };
}

@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token not found');
  }

  const tokens = await this.authService.refresh(refreshToken);

  // Set new refresh token
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  };
}

@Post('logout')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)
async logout(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = req.cookies.refreshToken;
  const accessToken = req.headers.authorization?.split(' ')[1];

  await this.authService.logout(refreshToken, accessToken);

  res.clearCookie('refreshToken');

  return { message: 'Logged out successfully' };
}
```

---

## Todo List

- [ ] Install JWT and Passport packages
- [ ] Generate RSA key pair (RS256)
- [ ] Add keys to environment variables
- [ ] Create JWT module configuration
- [ ] Implement TokenService (generate, verify, blacklist)
- [ ] Implement JwtStrategy with RS256
- [ ] Create JwtAuthGuard
- [ ] Implement SessionService (CRUD operations)
- [ ] Update AuthService.login() with JWT
- [ ] Implement AuthService.refresh()
- [ ] Implement AuthService.logout()
- [ ] Update AuthController with JWT endpoints
- [ ] Test login returns tokens
- [ ] Test refresh token rotation
- [ ] Test logout blacklists tokens
- [ ] Test expired token handling
- [ ] Write unit tests
- [ ] Write integration tests

---

## Success Criteria

- ✅ Login returns access + refresh tokens
- ✅ Access token expires in 15 minutes
- ✅ Refresh token expires in 7 days
- ✅ Token refresh rotates refresh token
- ✅ Old refresh tokens blacklisted
- ✅ Logout blacklists both tokens
- ✅ JwtAuthGuard protects routes
- ✅ RS256 signature validation works
- ✅ Multi-device sessions tracked
- ✅ All tests passing

---

## Next Steps

After completion:
1. Move to Phase 4: OAuth Social Login
2. Add rate limiting middleware
3. Implement CSRF protection
4. Add audit logging
