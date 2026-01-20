# JWT Authentication & Hybrid Session Management Research Report

**Report Date:** January 16, 2026
**Research Scope:** Comprehensive JWT auth with session management, token rotation, and Redis blacklisting
**Status:** COMPLETED
**Prepared for:** M-Tracking Backend Implementation

---

## Executive Summary

Modern JWT authentication requires hybrid approach combining stateless access tokens with stateful session management via Redis. Key 2026 recommendations prioritize:
- **Token Strategy:** 15-min access tokens (stateless) + 7-day refresh tokens (stateful, rotated)
- **Storage:** httpOnly cookies for refresh tokens, in-memory/sessionStorage for access tokens
- **Revocation:** Redis blacklisting with TTL matching token expiration
- **Algorithms:** RS256/ECDSA over HS256 for multi-service environments
- **CSRF/XSS:** Dual token pattern + SameSite cookies + Content Security Policy

Project already specifies optimal approach in security docs (15-min access, 7-day refresh, Redis sessions).

---

## 1. JWT Token Strategy & Architecture

### 1.1 Token Lifecycle Pattern

**Optimal 2026 Approach: Dual-Token with Refresh Rotation**

```
User Login
  ├─ Generate Access Token (15 min)
  ├─ Generate Refresh Token (7 days, rotated)
  └─ Store Refresh Token Hash in DB/Redis

Subsequent Requests
  ├─ Use Access Token (no DB lookup needed)
  └─ Validate signature only

Token Expiry
  ├─ Access Token expires → Prompt re-auth
  └─ Refresh Token expires → Full login required

Token Refresh
  ├─ Submit refresh token
  ├─ Validate against Redis blacklist
  ├─ Issue new token pair
  └─ Add old refresh token to blacklist
```

**Why This Pattern:**
- Access tokens remain stateless (no DB lookup per request)
- Refresh tokens enable token rotation/revocation
- Short-lived access tokens limit XSS damage window
- Redis blacklist enables instant revocation without DB overhead

### 1.2 Token Configuration Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Access Token TTL** | 15 minutes | Balances security (short window) vs UX (not too frequent refresh) |
| **Refresh Token TTL** | 7 days | Allows reasonable session length, triggers re-auth before password expire |
| **Refresh Token Rotation** | Yes | Prevents token reuse attacks; invalidates compromised tokens |
| **Blacklist TTL** | Match token TTL | Redis entries auto-expire, no cleanup overhead |
| **Algorithm** | RS256 (recommended) or HS256 (acceptable) | Asymmetric for multi-service, symmetric for monolith |
| **Signature** | Mandatory (reject `"alg":"none"`) | Prevents tampering and algorithm substitution attacks |

### 1.3 Algorithm Selection (2026 Consensus)

**Recommended Hierarchy:**
1. **ECDSA (ES256/ES512)** - Fastest, smallest keys, FIPS 140-3 approved
2. **RS256** - Industry standard, supported everywhere
3. **HS256** - Only for monoliths with single shared secret

**Why NOT HS256 for Multi-Service:**
- Requires all services to share secret (scaling issue)
- Secret rotation becomes complex coordination problem
- One service compromise exposes all services
- Violates principle of least privilege

**For M-Tracking (Monolith + Analytics):**
- Use **RS256** for future-proofing (can add services later)
- Keep private key in auth service only
- Distribute public key to all consumers

---

## 2. Token Storage & Transmission Security

### 2.1 Storage Comparison Matrix

| Aspect | localStorage | sessionStorage | httpOnly Cookie | In-Memory |
|--------|--------------|----------------|-----------------|-----------|
| **XSS Vulnerable** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **CSRF Vulnerable** | ❌ No | ❌ No | ✅ Yes (mitigated) | N/A |
| **Persistent** | ✅ Yes | ❌ No (tab close) | ✅ Yes | ❌ No (refresh lost) |
| **Auto-sent** | ❌ No | ❌ No | ✅ Yes | N/A |
| **Best For** | Avoid for auth | Short-lived tokens | Refresh tokens | Access tokens |

### 2.2 Hybrid Approach (RECOMMENDED - 2026 Best Practice)

**Three-Tier Token Storage Strategy:**

```
┌─────────────────────────────────────┐
│ Refresh Token                       │
│ Storage: httpOnly + Secure Cookie   │
│ Sent: Automatically on each request │
│ Readable by: Server only            │
│ TTL: 7 days                         │
└─────────────────────────────────────┘
         ↓ (on login/refresh)
┌─────────────────────────────────────┐
│ Access Token                        │
│ Storage: In-Memory/sessionStorage   │
│ Sent: Authorization header          │
│ Readable by: JavaScript (no danger) │
│ TTL: 15 minutes                     │
└─────────────────────────────────────┘
         ↓ (attach to request)
┌─────────────────────────────────────┐
│ Request Header                      │
│ Authorization: Bearer {access_token}│
│ Cookie: {refresh_token}             │
└─────────────────────────────────────┘
```

**Why This Works:**
- Refresh token in httpOnly cookie: immune to XSS (JS can't steal), auto-sent for validation
- Access token in memory: if XSS occurs, only temp token exposed (15 min damage window)
- Separate channels: cookie vs header prevents CSRF exploitation
- Zero token loss on page refresh: cookie persists, new access token from refresh endpoint

### 2.3 Cookie Configuration (Security Hardening)

**Critical Flags for httpOnly Refresh Token Cookie:**

```javascript
response.cookie('refreshToken', token, {
  httpOnly: true,        // ← Mandatory: Blocks JavaScript access
  secure: true,          // ← HTTPS only (production)
  sameSite: 'strict',    // ← CSRF protection (reject cross-site)
  maxAge: 7 * 24 * 60 * 60 * 1000,  // ← 7 days
  path: '/',             // ← Sent on all routes
  domain: undefined,     // ← Current domain only
});
```

**What Each Flag Does:**
- `httpOnly`: Prevents `document.cookie` access (stops XSS token theft)
- `secure`: Cookie only sent over HTTPS (prevents MITM)
- `sameSite=strict`: Cookie not sent on cross-site requests (CSRF defense)
- `maxAge`: Auto-delete after TTL

---

## 3. CSRF Protection Strategy

### 3.1 Hybrid CSRF Defense (2026 Approach)

**Layer 1: SameSite Cookie Attribute** (Primary, automatic)
- Browser automatically blocks cross-site cookie sending
- `SameSite=strict`: Rejects even same-site navigation
- No additional code needed

**Layer 2: Custom Header Requirement** (Secondary)
- XSS can't set custom headers across origins
- Even if token stolen, request origin enforcement required
- Implementation: Require `X-Request-ID` or validate `Origin` header

**Layer 3: CSRF Token in JWT** (Tertiary, advanced)
- Random fingerprint generated at login
- SHA-256(fingerprint) stored in token
- Server sends fingerprint as cookie
- Client must echo fingerprint in header
- Defeats CSRF even if SameSite bypassed

### 3.2 Implementation Recommendation for M-Tracking

**Minimum Viable Security:**
```typescript
// Layer 1: SameSite + Secure + HttpOnly (automatic)
response.cookie('refreshToken', token, {
  sameSite: 'strict',
  secure: true,
  httpOnly: true,
});

// Layer 2: Validate origin on sensitive operations
if (req.headers.origin !== allowedOrigin) {
  throw new ForbiddenException('Invalid origin');
}
```

**Enhanced (if needed):**
```typescript
// Add CSRF token to JWT during login
const csrfFingerprint = generateRandomUUID();
const csrfHash = hashSHA256(csrfFingerprint);

const token = this.jwtService.sign({
  sub: user.id,
  csrfHash,  // ← Include hash in token
  // ... other claims
});

// Send fingerprint separately
response.cookie('csrfFingerprint', csrfFingerprint, {
  httpOnly: true,
  sameSite: 'strict',
  secure: true,
});

// Client extracts from response, includes in header on next request
```

---

## 4. XSS Mitigation Strategies

### 4.1 Content Security Policy (CSP)

**Critical: CSP is foundational to all XSS defense**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';  // Inline scripts only with nonce
  style-src 'self' 'nonce-{random}';
  object-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

**Why This Matters:**
- Even strict CSP can't prevent all XSS
- If XSS occurs, CSP limits attacker's capability
- Combined with httpOnly cookies, damage is limited to 15-min access token in memory

### 4.2 Defensive Code Patterns

```typescript
// ❌ VULNERABLE: Direct DOM manipulation
document.getElementById('user').innerHTML = userInput;

// ✅ SAFE: React/Angular automatically escapes
<div>{userInput}</div>

// ❌ VULNERABLE: Eval/Function constructor
eval(userInput);
new Function(userInput)();

// ✅ SAFE: Sanitize any user-controlled content
import DOMPurify from 'dompurify';
const safeHTML = DOMPurify.sanitize(userInput);
```

### 4.3 XSS Impact Mitigation (When XSS Still Occurs)

**With Proper Token Storage:**
1. XSS attacker steals access token from memory
2. Token is valid for only 15 minutes
3. Can make requests as user within that window
4. **Refresh token stays safe** (httpOnly, JS can't access)
5. After 15 min, new access token can't be obtained
6. Session effectively ends

**Damage Scope:**
- Read access: User's own data (acceptable worst-case)
- Write access: Limited to 15-min window
- No token reuse: Refresh token never compromised
- Revocation available: Force logout, invalidate all tokens

---

## 5. Redis-Based Token Revocation & Blacklisting

### 5.1 Blacklist Architecture

**Why Redis for Blacklisting:**

| Aspect | Database | Redis |
|--------|----------|-------|
| Lookup Speed | 10-50ms | <1ms |
| Scaling | Requires indexes | Built-in |
| TTL Management | Manual cleanup | Automatic expiry |
| Complexity | Complex queries | Simple key ops |
| Cost | Query per request | In-memory only |

### 5.2 Implementation Pattern

```typescript
// Redis key structure
const BLACKLIST_KEY = `blacklist:${token_hash}`;
const REFRESH_TOKENS_KEY = `refresh_tokens:${user_id}`;
const SESSION_KEYS = `sessions:${user_id}:*`;

// On logout: add token to blacklist
async revokeToken(tokenHash: string, ttl: number): Promise<void> {
  await this.redis.setex(
    BLACKLIST_KEY,
    ttl,  // TTL matches token expiration
    'revoked'
  );
}

// On token validation: check blacklist
async isTokenBlacklisted(tokenHash: string): Promise<boolean> {
  const exists = await this.redis.exists(BLACKLIST_KEY);
  return exists === 1;
}

// On refresh: rotate token
async rotateRefreshToken(
  oldTokenHash: string,
  newToken: string,
  ttl: number
): Promise<void> {
  // Add old token to blacklist
  await this.redis.setex(oldTokenHash, ttl, 'rotated');

  // Store new token with user mapping
  await this.redis.setex(
    `${REFRESH_TOKENS_KEY}:${hashToken(newToken)}`,
    ttl,
    JSON.stringify({
      issuedAt: new Date(),
      userAgent: req.get('user-agent'),
    })
  );
}
```

### 5.3 Session Management via Redis

```typescript
// Store active sessions
const SESSION_KEY = `session:${sessionId}`;
const USER_SESSIONS = `user:${userId}:sessions`;

async createSession(userId: string): Promise<SessionData> {
  const sessionId = generateUUID();
  const sessionData = {
    userId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
    device: parseUserAgent(req.get('user-agent')),
  };

  // Store session with 7-day TTL
  await this.redis.setex(
    SESSION_KEY,
    7 * 24 * 60 * 60,
    JSON.stringify(sessionData)
  );

  // Track sessions per user (for multi-device management)
  await this.redis.sadd(USER_SESSIONS, sessionId);

  return sessionData;
}

// Multi-device session termination
async terminateAllSessions(userId: string): Promise<void> {
  const sessions = await this.redis.smembers(`user:${userId}:sessions`);
  for (const sessionId of sessions) {
    await this.redis.del(`session:${sessionId}`);
  }
  await this.redis.del(`user:${userId}:sessions`);
}
```

### 5.4 Redis Key Expiration Strategy

**Key Pattern & TTL Management:**

```
User Sessions:
  session:{sessionId}                    → TTL: 7 days (access TTL)
  user:{userId}:sessions                 → TTL: Never (manually managed)
  user:{userId}:session:metadata         → TTL: 7 days

Token Revocation:
  blacklist:{tokenHash}                  → TTL: 15 min (access token TTL)
  revoked_refresh:{tokenHash}            → TTL: 7 days (refresh token TTL)

Refresh Tokens:
  refresh:{userId}:{tokenHash}           → TTL: 7 days

Activity Tracking:
  activity:{userId}:{sessionId}          → TTL: 1 day (recent activity)
```

**Benefits:**
- No manual cleanup needed (Redis handles TTL)
- Memory footprint bounded by TTL
- Fast lookups for revocation checks
- Scales to 1M concurrent sessions

---

## 6. NestJS Implementation Patterns

### 6.1 JWT Module Configuration

```typescript
// auth.module.ts
@Module({
  imports: [
    JwtModule.register({
      secret: configService.get('JWT_SECRET'),
      signOptions: {
        expiresIn: '15m',
        algorithm: 'RS256',  // Use asymmetric for multi-service
        issuer: 'm-tracking-api',
      },
    }),
    PassportModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    TokenBlacklistService,
  ],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
```

### 6.2 JWT Strategy with Token Validation

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly blacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,  // Reject expired tokens
      secretOrKey: this.configService.get('JWT_PUBLIC_KEY'),
      algorithms: ['RS256'],     // Specify expected algorithm
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // Check if token is blacklisted
    const isBlacklisted = await this.blacklistService.isBlacklisted(
      payload.tokenId
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Verify user still exists and is active
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
```

### 6.3 JWT Auth Guard with Middleware Integration

```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();

    // Additional validation
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    // Rate limiting check
    const rateLimitKey = `ratelimit:${user.id}`;
    const attempts = await this.redis.incr(rateLimitKey);
    if (attempts === 1) {
      await this.redis.expire(rateLimitKey, 60); // 1-minute window
    }
    if (attempts > 100) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }

    // Update last activity
    await this.redis.setex(
      `activity:${user.id}`,
      24 * 60 * 60,  // 24 hours
      JSON.stringify({
        lastLogin: new Date(),
        ip: request.ip,
        userAgent: request.get('user-agent'),
      })
    );

    return true;
  }
}
```

### 6.4 Refresh Token Flow

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async login(user: User, response: Response): Promise<void> {
    const tokens = this.generateTokens(user);

    // Store refresh token hash in Redis with session
    const refreshTokenHash = hashToken(tokens.refreshToken);
    await this.redis.setex(
      `refresh:${user.id}:${refreshTokenHash}`,
      7 * 24 * 60 * 60,  // 7 days
      JSON.stringify({
        issuedAt: new Date(),
        userAgent: request.get('user-agent'),
        ipAddress: request.ip,
      })
    );

    // Set refresh token in httpOnly cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send access token in response body (for in-memory storage)
    response.json({
      accessToken: tokens.accessToken,
      expiresIn: 15 * 60,  // seconds
    });
  }

  async refresh(refreshToken: string, request: Request): Promise<void> {
    // Validate refresh token
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    // Check if in blacklist (rotated or revoked)
    const tokenHash = hashToken(refreshToken);
    const isBlacklisted = await this.redis.exists(
      `blacklist:refresh:${tokenHash}`
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Get user
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not active');
    }

    // Generate new tokens
    const newTokens = this.generateTokens(user);

    // Rotate: blacklist old refresh token
    await this.redis.setex(
      `blacklist:refresh:${tokenHash}`,
      7 * 24 * 60 * 60,
      'rotated'
    );

    // Store new refresh token
    const newTokenHash = hashToken(newTokens.refreshToken);
    await this.redis.setex(
      `refresh:${user.id}:${newTokenHash}`,
      7 * 24 * 60 * 60,
      JSON.stringify({
        issuedAt: new Date(),
        rotatedFrom: tokenHash,
        userAgent: request.get('user-agent'),
      })
    );

    // Update cookie with new token
    response.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.json({
      accessToken: newTokens.accessToken,
      expiresIn: 15 * 60,
    });
  }

  private generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const tokenId = generateUUID(); // For revocation tracking

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        tokenId,  // For blacklist lookup
      },
      {
        expiresIn: '15m',
        algorithm: 'RS256',
      }
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        tokenId,  // Link to access token pair
        type: 'refresh',
      },
      {
        expiresIn: '7d',
        algorithm: 'RS256',
      }
    );

    return { accessToken, refreshToken };
  }

  async logout(user: User, request: Request): Promise<void> {
    // Extract token from request
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (token) {
      const decoded = this.jwtService.decode(token);

      // Add to blacklist
      await this.redis.setex(
        `blacklist:${decoded.tokenId}`,
        15 * 60,  // 15 minutes
        'revoked'
      );
    }

    // Revoke all refresh tokens for user
    const sessions = await this.redis.keys(`refresh:${user.id}:*`);
    for (const session of sessions) {
      await this.redis.del(session);
    }

    // Clear cookie
    response.clearCookie('refreshToken');
  }
}
```

### 6.5 Decorator for Custom Claims

```typescript
// @authenticated.decorator.ts
export const Authenticated = () => UseGuards(JwtAuthGuard);

// @current-user.decorator.ts
export const CurrentUser = () =>
  createParamDecorator((_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  })();

// Usage
@Controller('profile')
export class ProfileController {
  @Get()
  @Authenticated()
  getProfile(@CurrentUser() user: User): Promise<UserProfile> {
    return this.profileService.getProfile(user.id);
  }
}
```

---

## 7. Token Blacklisting Advanced Patterns

### 7.1 Efficient Blacklist Lookup

**Option 1: Hash-based Lookup (Recommended)**
```typescript
// Store: blacklist:{SHA256(token)} → 'revoked'
// Lookup: O(1) Redis key lookup
async isRevoked(token: string): Promise<boolean> {
  const hash = hashSHA256(token);
  return await this.redis.exists(`blacklist:${hash}`) === 1;
}
```

**Option 2: Set-based (For small user base)**
```typescript
// Store: user:{userId}:revoked_tokens → [hash1, hash2, hash3]
// Lookup: O(1) set membership
async isRevoked(userId: string, token: string): Promise<boolean> {
  const hash = hashSHA256(token);
  return await this.redis.sismember(
    `user:${userId}:revoked_tokens`,
    hash
  );
}
```

**Option 3: Bloom Filter (For massive scale)**
```typescript
// Store: probabilistic data structure
// Lookup: O(k) hash functions, essentially O(1), minimal memory
// Trade-off: False positives possible (acceptable for revocation)
async isRevoked(token: string): Promise<boolean> {
  const hash = hashSHA256(token);
  return await this.redis.bf.exists('token_blacklist', hash);
}
```

### 7.2 Handling Token Expiration Edge Cases

```typescript
// Case 1: Token used after expiration
// Solution: JWT library rejects automatically
// Case 2: Refresh token rotated, old one reused
// Solution: Check against rotation blacklist

async validateRefreshToken(token: string): Promise<JwtPayload> {
  try {
    const payload = this.jwtService.verify(token);

    // Check if rotated
    const hash = hashSHA256(token);
    const isRotated = await this.redis.exists(
      `blacklist:refresh:${hash}`
    );
    if (isRotated) {
      // Possible token compromise - revoke all user tokens
      await this.revokeAllUserTokens(payload.sub);
      throw new UnauthorizedException('Token rotation detected');
    }

    return payload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new UnauthorizedException('Refresh token expired');
    }
    throw error;
  }
}

// Revoke all tokens if suspicious activity detected
async revokeAllUserTokens(userId: string): Promise<void> {
  const tokens = await this.redis.keys(`refresh:${userId}:*`);
  for (const token of tokens) {
    await this.redis.del(token);
  }

  // Notify user of forced logout
  await this.notificationService.sendSecurityAlert(
    userId,
    'All sessions have been terminated due to suspicious activity'
  );
}
```

---

## 8. Security Considerations & OWASP Alignment

### 8.1 OWASP JWT Security Checklist

| Item | Status | Implementation |
|------|--------|-----------------|
| Algorithm Explicitly Specified | ✅ | RS256 in sign options |
| Algorithm Validation | ✅ | JwtStrategy specifies algorithms |
| Signature Verification Mandatory | ✅ | Passport-JWT verifies all tokens |
| None Algorithm Rejected | ✅ | PassportStrategy rejects `alg:none` |
| Token Expiration Enforced | ✅ | `ignoreExpiration: false` |
| Token Revocation | ✅ | Redis blacklist + refresh rotation |
| No Sensitive Data in Token | ✅ | Only sub, email, tokenId |
| CSRF Protection | ✅ | httpOnly + SameSite + Origin check |
| XSS Mitigation | ✅ | In-memory storage + httpOnly cookie |
| Secure Transport | ✅ | HTTPS enforced in production |

### 8.2 Additional Security Hardening

```typescript
// Claim validation
async validate(payload: JwtPayload): Promise<User> {
  // Verify issuer
  if (payload.iss !== 'm-tracking-api') {
    throw new UnauthorizedException('Invalid issuer');
  }

  // Verify audience (if multi-service)
  if (payload.aud && !payload.aud.includes('api.m-tracking')) {
    throw new UnauthorizedException('Invalid audience');
  }

  // Verify subject is valid UUID
  if (!isUUID(payload.sub)) {
    throw new UnauthorizedException('Invalid subject format');
  }

  // Check token isn't too old (issued more than 1 year ago)
  if (Date.now() - payload.iat * 1000 > 365 * 24 * 60 * 60 * 1000) {
    throw new UnauthorizedException('Token too old');
  }

  return user;
}
```

---

## 9. Implementation Roadmap for M-Tracking

### Phase 1: Core JWT Setup (Week 1)
- [ ] Configure JwtModule with RS256
- [ ] Implement JwtStrategy with algorithm validation
- [ ] Create JwtAuthGuard with additional validation
- [ ] Setup Redis connection for token management

### Phase 2: Token Lifecycle (Week 2)
- [ ] Implement login endpoint (generate token pair)
- [ ] Implement refresh endpoint (token rotation)
- [ ] Add logout with blacklisting
- [ ] Configure httpOnly cookie settings

### Phase 3: Security Hardening (Week 2-3)
- [ ] Add CSRF protection (SameSite + Origin check)
- [ ] Implement token revocation check
- [ ] Add rate limiting to auth endpoints
- [ ] Implement session tracking per device

### Phase 4: Testing & Documentation (Week 4)
- [ ] Unit tests for all auth flows
- [ ] Integration tests for token lifecycle
- [ ] Security penetration testing
- [ ] Document token storage strategy for frontend team

---

## 10. Frontend Integration Guide

### 10.1 Access Token Retrieval

```javascript
// On login: Extract from response
const response = await fetch('/auth/login', {
  method: 'POST',
  credentials: 'include',  // ← Include cookies
  body: JSON.stringify({ email, password })
});

const { accessToken, expiresIn } = await response.json();

// Store in memory (survives page refresh via sessionStorage workaround)
let accessToken = accessToken;

// ✅ Safe: In-memory variable
// ❌ Unsafe: localStorage.setItem('token', accessToken)
```

### 10.2 Automatic Token Refresh

```javascript
// Intercept 401 responses
async function refreshAccessToken() {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include',  // ← Send refresh cookie
  });

  if (response.ok) {
    const { accessToken, expiresIn } = await response.json();
    return accessToken;  // Store in memory
  } else {
    // Refresh failed, redirect to login
    window.location.href = '/login';
  }
}

// Attach to all requests
const makeRequest = async (url, options = {}) => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    // Try refresh
    accessToken = await refreshAccessToken();
    if (accessToken) {
      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
    }
  }

  return response;
};
```

### 10.3 Logout

```javascript
async function logout() {
  // Clear in-memory token
  accessToken = null;

  // Notify backend (blacklist any remaining access token)
  await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  // Redirect to login (backend clears refresh cookie)
  window.location.href = '/login';
}
```

---

## 11. Performance Considerations

### 11.1 Token Validation Performance

| Approach | Latency | Notes |
|----------|---------|-------|
| Stateless JWT validation | <1ms | No DB/Redis lookup, signature only |
| Blacklist check | 1-2ms | Single Redis key lookup |
| Full user lookup | 10-50ms | Database query required |

**Recommendation:** Validate token signature, check blacklist, skip user lookup unless needed.

### 11.2 Redis Memory Optimization

```
Estimated Redis memory for 100K active users:

Refresh tokens (7-day TTL):
  100K users × 200 bytes = ~20MB

Sessions (24-hour TTL):
  100K sessions × 300 bytes = ~30MB

Blacklist entries (15-min TTL, 80% hit rate):
  100K active users × 0.2 refresh rate × 15min TTL = ~1K entries = <1MB

Total: ~50MB for 100K active users
At 10K users: ~5MB
```

**Scaling:** Redis can handle 1M+ tokens, linear memory growth.

---

## 12. Trade-offs & Decision Matrix

| Approach | Pros | Cons | Recommendation |
|----------|------|------|-----------------|
| **All tokens in localStorage** | Simple | XSS vulnerable, CSRF risky | ❌ Avoid |
| **All tokens in cookies** | Auto-sent, CSRF mitigated | XSS can steal tokens | ⚠️ Acceptable if CSP strong |
| **Hybrid (recommended)** | XSS limited to 15min, CSRF protected, revocable | Slightly more complex | ✅ Choose this |
| **HS256 for monolith** | Simpler setup | Can't scale to services | ⚠️ For MVP only |
| **RS256 from start** | Future-proof, supports services | Key management needed | ✅ Choose this |
| **No blacklist** | Faster, simpler | Can't revoke tokens | ❌ Security risk |
| **Token rotation** | Prevents reuse attacks | More complex | ✅ Choose for refresh tokens |

---

## 13. Common Pitfalls & Solutions

### 13.1 Pitfall: Storing tokens in localStorage

**Problem:**
```javascript
// ❌ DANGEROUS
localStorage.setItem('token', jwtToken);
const token = localStorage.getItem('token');  // XSS can steal this
```

**Solution:**
```javascript
// ✅ SAFE
let token;  // In-memory only
response.json().then(data => {
  token = data.accessToken;  // Only available in this scope
});
```

### 13.2 Pitfall: Not validating algorithm

**Problem:**
```typescript
// ❌ DANGEROUS
const payload = jwt.verify(token, secret);  // Accepts any algorithm
```

**Solution:**
```typescript
// ✅ SAFE
const payload = jwt.verify(token, secret, {
  algorithms: ['RS256'],  // ← Explicit whitelist
});
```

### 13.3 Pitfall: Ignoring token expiration

**Problem:**
```typescript
// ❌ DANGEROUS
const payload = jwt.verify(token, secret, {
  ignoreExpiration: true,  // ← Allows expired tokens
});
```

**Solution:**
```typescript
// ✅ SAFE
const payload = jwt.verify(token, secret, {
  ignoreExpiration: false,  // ← Reject expired
});
```

### 13.4 Pitfall: No CSRF protection on refresh endpoint

**Problem:**
```typescript
// ❌ DANGEROUS
@Post('refresh')
async refresh(@Body() { refreshToken }): Promise<TokenResponse> {
  // No origin/referer check - CSRF possible
}
```

**Solution:**
```typescript
// ✅ SAFE
@Post('refresh')
async refresh(
  @Req() request,
  @Body() { refreshToken }
): Promise<TokenResponse> {
  // Validate origin
  if (!allowedOrigins.includes(request.headers.origin)) {
    throw new ForbiddenException('Invalid origin');
  }

  // Or use SameSite cookie + browser SameSite enforcement
  // ... rest of refresh logic
}
```

---

## 14. Comparison with Alternative Approaches

### 14.1 Session-Based (Traditional Cookies)

**Pros:**
- Server-side revocation (any time)
- Better CSRF default protection

**Cons:**
- Requires session storage (memory or Redis)
- Doesn't scale to microservices
- Per-request session lookup overhead

**When to use:** Legacy systems, simple monoliths

### 14.2 OAuth 2.0

**Pros:**
- Standardized, third-party authentication
- Delegation model

**Cons:**
- More complex setup
- Requires auth provider

**When to use:** Multi-tenant systems, social login

### 14.3 Opaque Tokens (Stateful)

**Pros:**
- Instant revocation
- Can't be decoded client-side

**Cons:**
- Requires database lookup per request
- Doesn't scale for high throughput

**When to use:** High-security requirements, willing to pay latency cost

### Recommendation for M-Tracking:
**JWT + Redis Blacklist (Recommended)** balances security, scalability, and complexity.

---

## 15. Testing Strategy

### 15.1 Unit Tests Required

```typescript
describe('JwtStrategy', () => {
  it('should reject tokens with wrong algorithm');
  it('should reject tokens signed with HS256');
  it('should reject expired tokens');
  it('should reject blacklisted tokens');
  it('should validate correct tokens');
  it('should extract user from valid payload');
});

describe('TokenBlacklistService', () => {
  it('should add token to blacklist');
  it('should check if token is blacklisted');
  it('should expire tokens from blacklist');
  it('should handle concurrent requests');
});
```

### 15.2 Integration Tests

```typescript
describe('Auth E2E', () => {
  it('should login and receive token pair');
  it('should refresh token and rotate');
  it('should reject reuse of rotated token');
  it('should logout and blacklist tokens');
  it('should reject access with expired token');
  it('should handle concurrent refresh requests');
});
```

---

## 16. Monitoring & Observability

### 16.1 Key Metrics to Track

```
- Token generation rate (logins/sec)
- Token refresh rate (expiration detection)
- Blacklist hit rate (revoked token attempts)
- Token validation latency (p50, p95, p99)
- Failed authentication attempts
- Suspicious activity (same user multiple regions)
```

### 16.2 Alerting Rules

```
- Alert if token validation latency > 10ms
- Alert if blacklist hit rate > 5%
- Alert if >10 failed auth attempts from same IP (5min)
- Alert if user logs in from different countries < 1 hour
```

---

## 17. Unresolved Questions & Follow-ups

1. **Algorithm choice finalization:** Should M-Tracking start with RS256 or switch to ECDSA for better performance?
   - Recommendation: Start with RS256 (industry standard), evaluate ECDSA in performance testing

2. **Token signing key management:** How to rotate JWT signing keys safely without breaking tokens?
   - Recommendation: Use key versioning in token header (kid), support multiple keys temporarily

3. **Multi-device session management:** Should terminate old sessions when user logs in from new device?
   - Recommendation: Allow concurrent sessions but notify user of new device, provide one-click termination

4. **Token encryption:** Should tokens be encrypted in addition to signed?
   - Recommendation: Only if storing sensitive PII in claims; M-Tracking currently only stores userId/email, so signing is sufficient

5. **Frontend storage persistence:** How to handle token loss on page refresh?
   - Recommendation: Use sessionStorage + automatic refresh on app boot to refetch access token

6. **Rate limiting strategy:** Should rate limit be per-user or per-IP for refresh endpoint?
   - Recommendation: Dual strategy - per-user (prevent brute force) + per-IP (prevent DDOS)

---

## 18. References & Sources

### OWASP & Security Standards
- [OWASP JWT Cheat Sheet for Java](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP JWT Testing Guide](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/10-Testing_JSON_Web_Tokens)

### JWT Best Practices
- [Curity JWT Best Practices](https://curity.io/resources/learn/jwt-best-practices/)
- [Security Boulevard: Using JWT as API Keys](https://securityboulevard.com/2026/01/using-jwt-as-api-keys-security-best-practices-implementation-guide/)
- [Akamai: OWASP Authentication Threats for JWT](https://www.akamai.com/blog/security-research/owasp-authentication-threats-for-json-web-token)

### NestJS Implementation Patterns
- [DEV Community: Building Secure JWT Auth in NestJS](https://dev.to/david_essien/building-secure-jwt-auth-in-nestjs-argon2-redis-blacklisting-and-token-rotation-3gl9)
- [NestJS JWT Refresh Token Rotation Guide](https://dev.to/zenstok/how-to-implement-refresh-tokens-with-token-rotation-in-nestjs-1deg)
- [Complete NestJS Auth System with Refresh Tokens](https://js.elitedev.in/js/build-complete-nestjs-authentication-system-with-refresh-tokens-prisma-and-redis/)
- [NestJS JWT Token Blacklisting with Redis](https://anamul-haque.medium.com/implementing-jwt-token-blacklisting-in-nestjs-with-redis-ddb59da9d493)
- [NestJS JWT Authentication with Refresh Tokens](https://www.elvisduru.com/blog/nestjs-jwt-authentication-refresh-token)
- [Syskool: Refresh Tokens and Token Rotation in NestJS](https://syskool.com/refresh-tokens-and-token-rotation-in-nestjs-secure-jwt-authentication/)

### Token Storage & CSRF/XSS
- [Understanding Token Storage: LocalStorage vs HttpOnly Cookies](https://www.wisp.blog/blog/understanding-token-storage-local-storage-vs-httponly-cookies)
- [Cookies vs LocalStorage for Sessions](https://supertokens.com/blog/cookies-vs-localstorage-for-sessions-everything-you-need-to-know)
- [DEV Community: LocalStorage vs Cookies for JWT](https://dev.to/cotter/localstorage-vs-cookies-all-you-need-to-know-about-storing-jwt-tokens-securely-in-the-front-end-15id)
- [Preventing CSRF and XSS with JWT](https://dev.to/kurtchan/preventing-csrf-and-xss-attacks-with-jwt-and-fingerprint-cookies-in-express-1jol)
- [HackerNoon: Avoid XSS and CSRF Attacks in JWT](https://hackernoon.com/avoid-xss-and-csrf-attacks-in-jwt-react-golang-a-tutorial)

---

## Summary

**Recommended Architecture for M-Tracking:**

```
┌─────────────────────────────────────────────────────────┐
│ LOGIN ENDPOINT                                          │
│ - Hash password with bcrypt (cost 12)                   │
│ - Generate access token (15m, RS256, stateless)         │
│ - Generate refresh token (7d, RS256, rotated)           │
│ - Store refresh token hash in Redis with TTL            │
│ - Send refresh token in httpOnly cookie (SameSite)      │
│ - Send access token in response body                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ API REQUEST FLOW                                        │
│ - Extract access token from Authorization header       │
│ - Validate signature (RS256)                            │
│ - Check blacklist (Redis, <2ms lookup)                  │
│ - Proceed with request                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ TOKEN EXPIRATION (15 min)                               │
│ - Access token rejected by JWT library                  │
│ - Client calls refresh endpoint                         │
│ - Refresh token validated and rotated                   │
│ - Old token added to blacklist (7d TTL)                 │
│ - New token pair issued                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ SECURITY FEATURES                                       │
│ ✅ CSRF: SameSite cookie + origin validation            │
│ ✅ XSS: 15-min token + httpOnly cookie                  │
│ ✅ Revocation: Redis blacklist + rotation               │
│ ✅ Algorithm: RS256 (future-proof for services)         │
│ ✅ None algorithm: Explicitly rejected                  │
│ ✅ Rate limiting: Per-user + per-IP                     │
│ ✅ Activity logging: Session tracking per device        │
└─────────────────────────────────────────────────────────┘
```

**Implementation Timeline:** 4 weeks (setup → testing → docs)

**Status:** Ready for implementation planning with detailed specifications and code examples.

---

**Report Generated:** January 16, 2026, 2:09 PM UTC
**Report Version:** 1.0
**Classification:** Internal - Development Guidance
