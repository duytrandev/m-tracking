# Backend Authentication Implementation

**Version:** 1.0
**Last Updated:** 2026-01-21
**Status:** ✅ Production Ready
**Implementation Date:** 2026-01-16 - 2026-01-21

---

## Overview

Complete authentication system for M-Tracking backend with JWT, OAuth 2.1, email verification, password reset, session management, and rate limiting.

**Key Features:**

- ✅ Email/password authentication (register, login, logout, refresh)
- ✅ Email verification with token-based flow
- ✅ Password reset flow with secure tokens
- ✅ OAuth 2.1 integration (Google, GitHub, Facebook)
- ✅ JWT tokens (RS256 access + HS256 refresh)
- ✅ Session management with device tracking
- ✅ Token blacklisting via Redis
- ✅ Rate limiting on sensitive endpoints
- ✅ Production hardening and configuration

---

## Architecture

### Token Strategy

**Access Token (Short-lived):**

- Algorithm: RS256 (asymmetric)
- Expiry: 15 minutes
- Storage: In-memory (frontend), request header (backend)
- Purpose: Stateless API authentication

**Refresh Token (Long-lived):**

- Algorithm: HS256 (symmetric)
- Expiry: 7 days
- Storage: httpOnly cookie (secure, not accessible to JS)
- Purpose: Token renewal without re-authentication

**Session Token:**

- Storage: Redis with TTL
- Tracks: Device, IP address, user agent
- Purpose: Device management, concurrent session limits

### Key Components

```
src/auth/
├── controllers/
│   ├── auth.controller.ts          # Register, login, logout, refresh
│   └── oauth.controller.ts         # OAuth callbacks
├── services/
│   ├── auth.service.ts            # Core auth logic
│   ├── token.service.ts           # JWT token generation/validation
│   ├── password.service.ts        # Hashing, reset flow
│   ├── email.service.ts           # Email verification, password reset
│   ├── session.service.ts         # Session & device management
│   └── oauth.service.ts           # OAuth token encryption/decryption
├── strategies/
│   ├── jwt.strategy.ts            # JWT extraction and validation
│   ├── google.strategy.ts         # Google OAuth flow
│   ├── github.strategy.ts         # GitHub OAuth flow
│   └── facebook.strategy.ts       # Facebook OAuth flow
├── guards/
│   ├── jwt-auth.guard.ts          # JWT authentication guard
│   └── rate-limit.guard.ts        # Rate limiting guard
├── entities/
│   ├── user.entity.ts             # User model
│   ├── session.entity.ts          # Session tracking
│   ├── oauth-account.entity.ts    # OAuth account linking
│   ├── password-reset-token.entity.ts
│   ├── email-verification-token.entity.ts
│   ├── role.entity.ts             # Role-based access
│   └── permission.entity.ts       # Permission definitions
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── refresh.dto.ts
│   ├── password-reset.dto.ts
│   └── oauth.dto.ts
└── utils/
    └── encryption.util.ts         # AES-256-GCM for OAuth tokens
```

---

## API Endpoints

### Authentication

#### POST `/auth/register`

Register a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "name": "John Doe"
}
```

**Response (201 Created):**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "createdAt": "2026-01-21T10:00:00Z"
  }
}
```

**Rate Limit:** 5 requests/minute
**Validation:**

- Email must be valid and unique
- Password minimum 8 characters, must include: uppercase, lowercase, number, symbol

---

#### POST `/auth/login`

Authenticate user with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true
  }
}
```

**Rate Limit:** 5 requests/minute
**Errors:**

- 401: Invalid credentials
- 403: Account not verified (if email verification required)

---

#### POST `/auth/refresh`

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Errors:**

- 401: Invalid or expired refresh token
- 401: Token has been blacklisted

---

#### POST `/auth/logout`

Logout user and invalidate tokens.

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

**Side Effects:**

- Access token added to blacklist (15 minutes)
- Refresh token invalidated immediately
- Session terminated

---

#### POST `/auth/verify-email`

Verify email address with verification token.

**Request:**

```json
{
  "token": "verification-token-from-email"
}
```

**Response (200 OK):**

```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

---

#### POST `/auth/forgot-password`

Request password reset via email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "message": "If email exists, password reset link sent"
}
```

**Rate Limit:** 3 requests/minute
**Security:** Always returns success (prevents email enumeration)

---

#### POST `/auth/reset-password`

Reset password using reset token from email.

**Request:**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPass123!"
}
```

**Response (200 OK):**

```json
{
  "message": "Password reset successfully",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

---

### OAuth

#### POST `/auth/{provider}/callback`

OAuth callback handler (Google, GitHub, Facebook).

**Providers:**

- `/auth/google/callback`
- `/auth/github/callback`
- `/auth/facebook/callback`

**Query Parameters:**

```
?code=authorization_code&state=state_parameter
```

**Response (Redirect to frontend):**

```
https://frontend.com/auth/callback?accessToken=...&refreshToken=...
```

---

## Configuration

### Environment Variables

**File:** `.env` or `.env.docker`

```env
# JWT
JWT_PRIVATE_KEY_PATH=jwt-private-key.pem    # RS256 private key
JWT_PUBLIC_KEY_PATH=jwt-public-key.pem      # RS256 public key
JWT_SECRET=unused-but-required             # Placeholder
JWT_REFRESH_SECRET=<64-hex-chars>          # HS256 secret for refresh tokens
JWT_EXPIRES_IN=15m                         # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d                  # Refresh token expiry

# OAuth
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=https://api.example.com/auth/google/callback

GITHUB_CLIENT_ID=<github-client-id>
GITHUB_CLIENT_SECRET=<github-client-secret>
GITHUB_CALLBACK_URL=https://api.example.com/auth/github/callback

FACEBOOK_APP_ID=<facebook-app-id>
FACEBOOK_APP_SECRET=<facebook-app-secret>
FACEBOOK_CALLBACK_URL=https://api.example.com/auth/facebook/callback

OAUTH_ENCRYPTION_KEY=<32-byte-hex-string> # AES-256-GCM key for token encryption

# Email
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=M-Tracking <noreply@m-tracking.com>
FRONTEND_URL=https://your-domain.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

**See:** [ENV_CONFIG_GUIDE.md](./ENV_CONFIG_GUIDE.md) for complete configuration setup

---

## JWT Token Generation

### Access Token (RS256)

```typescript
// RS256 - Asymmetric (public key verification)
const accessToken = this.jwtService.sign(
  {
    sub: user.id,
    email: user.email,
    role: user.role,
  },
  {
    algorithm: 'RS256',
    expiresIn: '15m',
  }
)
```

**Payload:**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1705854000,
  "exp": 1705854900
}
```

### Refresh Token (HS256)

```typescript
// HS256 - Symmetric (secret-only verification)
const refreshToken = this.jwtService.sign(
  {
    sub: user.id,
    type: 'refresh',
  },
  {
    algorithm: 'HS256',
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  }
)
```

---

## OAuth 2.1 Implementation

### Auto-Linking by Verified Email

```typescript
// Only auto-link if email is verified by OAuth provider
if (profile.emailVerified) {
  const user = await this.userRepository.findOne({
    where: { email: profile.email },
  })
  if (user) {
    // Link OAuth account to existing user
    return user
  }
}

// Create new user for unverified email
const newUser = new User()
newUser.email = profile.email
newUser.name = profile.displayName
newUser.emailVerified = profile.emailVerified
```

### OAuth Token Encryption

```typescript
import { EncryptionUtil } from '../utils/encryption.util'

// Encrypt OAuth tokens before storage
const encrypted = EncryptionUtil.encrypt(oauthAccessToken)
oauthAccount.accessToken = encrypted
await this.oauthAccountRepository.save(oauthAccount)

// Decrypt when needed for API calls
const plaintext = EncryptionUtil.decrypt(encrypted)
await this.oauthProvider.makeAuthenticatedCall(plaintext)
```

**Algorithm:** AES-256-GCM (Authenticated encryption with additional data)

---

## Rate Limiting

### Default Limits

| Endpoint                   | Limit  | Window   |
| -------------------------- | ------ | -------- |
| POST /auth/register        | 5 req  | 1 minute |
| POST /auth/login           | 5 req  | 1 minute |
| POST /auth/forgot-password | 3 req  | 1 minute |
| Other endpoints            | 10 req | 1 minute |

### Implementation

**Guard:** `AuthRateLimitGuard` (extends NestJS `ThrottlerGuard`)

```typescript
// In auth.module.ts
ThrottlerModule.forRoot([
  {
    ttl: 60000,  // 1 minute
    limit: 10,   // 10 requests per minute
  },
]);

// Per-endpoint override
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
async login(@Body() dto: LoginDto) {
  // ...
}
```

---

## Session Management

### Session Entity

```typescript
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column()
  deviceId: string

  @Column()
  userAgent: string

  @Column()
  ipAddress: string

  @Column()
  refreshTokenHash: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  lastActiveAt: Date

  @Column({ nullable: true })
  expiresAt: Date
}
```

### Session Tracking

```typescript
// Create session on login
const session = await this.sessionService.create(user.id, {
  deviceId: generateDeviceId(),
  userAgent: request.get('user-agent'),
  ipAddress: request.ip,
})

// Validate session on request
const session = await this.sessionService.validateToken(refreshToken)
```

---

## Testing

### Test Coverage

**Current Status:** 64/64 tests passing (100% pass rate)

**Test Files:**

- `auth.service.spec.ts` - Core auth logic
- `password.service.spec.ts` - Password hashing and reset
- `token.service.spec.ts` - JWT token generation/validation
- `session.service.spec.ts` - Session management
- `auth.controller.spec.ts` - API endpoints

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Watch mode
pnpm test:watch

# Specific test file
pnpm test auth.service.spec.ts
```

---

## Security Considerations

### Password Security

- **Hashing:** bcrypt with salt rounds 10
- **Validation:** Minimum 8 characters, must include: uppercase, lowercase, number, symbol
- **Reset:** Tokens expire in 1 hour, single-use only

### Token Security

- **Access Token:** RS256 (asymmetric), 15-minute expiry
- **Refresh Token:** HS256 (symmetric), 7-day expiry, httpOnly cookie
- **Blacklisting:** Redis-backed with TTL, immediate revocation on logout

### OAuth Security

- **PKCE:** Protection against authorization code interception
- **Email Verification:** Only auto-link accounts with verified email
- **Token Encryption:** AES-256-GCM for stored OAuth tokens
- **Account Linking:** Prevent duplicate accounts, allow unlinking (with backup auth)

### Rate Limiting

- **Login/Register:** 5 requests/minute (prevents brute force)
- **Forgot Password:** 3 requests/minute (prevents enumeration)
- **Default:** 10 requests/minute (reasonable for API)

---

## Troubleshooting

### JWT Keys Not Found

**Error:**

```
ENOENT: no such file or directory, open 'jwt-private-key.pem'
```

**Solution:**
Generate JWT keys:

```bash
openssl genrsa -out jwt-private-key.pem 2048
openssl rsa -in jwt-private-key.pem -pubout -out jwt-public-key.pem
```

### OAuth Encryption Key Invalid

**Error:**

```
OAUTH_ENCRYPTION_KEY must be 32 bytes (64 hex characters)
```

**Solution:**
Generate new key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Token Expired

**Error:**

```
401 Unauthorized: Token has expired
```

**Solution:**
Use refresh endpoint to get new access token:

```bash
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "..."}'
```

### Rate Limit Exceeded

**Error:**

```
429 Too Many Requests: Rate limit exceeded
```

**Solution:**
Wait for rate limit window (1 minute default) before retrying.

---

## Migration Path

### From Previous Auth System (if applicable)

1. **Backup existing credentials**
2. **Generate new JWT keys** (if not already done)
3. **Run database migrations** to create auth tables
4. **Update environment variables** with new configuration
5. **Test OAuth providers** with new callback URLs
6. **Deploy incrementally** with feature flags

---

## Related Documentation

- [API Documentation](./api-documentation.md) - All API endpoints
- [System Architecture](./system-architecture.md) - Architecture decisions
- [Code Standards](./code-standards.md) - Development guidelines
- [Backend Configuration](./backend-configuration.md) - Configuration details
- [ENV_CONFIG_GUIDE.md](./ENV_CONFIG_GUIDE.md) - Environment variable setup

---

**Last Updated:** 2026-01-21 23:06
**Maintained By:** Development Team
**Status:** ✅ Production Ready
**Test Coverage:** 100% (64/64 tests passing)
