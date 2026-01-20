# OAuth 2.1 & Social Login Implementation Research Report
**Date:** January 16, 2026 | **Status:** Complete

---

## Executive Summary

OAuth 2.1 represents a hardened security posture with mandatory PKCE, strict redirect URI validation, and removal of legacy insecure flows. NestJS + Passport.js provides a mature, production-ready architecture for multi-provider social authentication. Key innovation: single strategy pattern supporting Google, GitHub, Facebook with extensible provider model.

---

## 1. OAuth 2.1 Security Standards (2026)

### 1.1 Key Changes from OAuth 2.0
- **PKCE Mandatory**: Authorization Code flow now requires PKCE (RFC 9700) for ALL clients (public + confidential)
- **Implicit Flow Removed**: SPAs must use Authorization Code + PKCE instead
- **Strict Redirect URI Matching**: Exact string comparison required (no wildcards/fuzzy matching)
- **State Parameter Required**: CSRF protection via unique, opaque state values
- **Plain PKCE Disabled**: Only S256 (SHA-256) method allowed

### 1.2 PKCE Flow (Proof Key for Code Exchange)

**Process:**
1. Client generates random `code_verifier` (43-128 chars, unreserved characters)
2. Client creates `code_challenge = base64urlEncode(SHA256(code_verifier))`
3. Authorization request includes: `code_challenge` + `code_challenge_method=S256`
4. Provider redirects with `authorization_code`
5. Token exchange: Client sends `code_verifier` in request body
6. Provider validates: `SHA256(code_verifier) == code_challenge`

**Node.js Implementation:**
```javascript
const crypto = require('crypto');

function generateCodeVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64URLEncode(hash);
}

function base64URLEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

### 1.3 State Parameter Security

**Purpose:** Prevent CSRF & phishing attacks

**Requirements:**
- Unique value per authorization request
- Opaque/non-predictable (use crypto.randomBytes)
- Client-side validation: returned state must match initial state
- Session-bound to prevent cross-session reuse

**Flow:**
1. Client generates state → stores in session/localStorage
2. Request: `GET /authorize?state=<unique_value>&...`
3. Provider redirects: `GET /callback?code=<code>&state=<value>`
4. Client validates: `request.query.state === session.oauthState`
5. If mismatch → terminate with error

---

## 2. OAuth Providers Configuration

### 2.1 Google OAuth 2.0

**Setup:**
- Console: [Google Cloud Console](https://console.cloud.google.com)
- Create OAuth 2.0 Client ID (Web application type)
- Configure redirect URIs (must match exactly)

**Scopes:**
- `openid` - OpenID Connect support
- `email` - Access user email
- `profile` - Basic user info (name, picture)

**Response:**
```json
{
  "id": "google_id",
  "displayName": "User Name",
  "emails": [{"value": "email@example.com"}],
  "photos": [{"value": "https://..."}]
}
```

### 2.2 GitHub OAuth

**Setup:**
- Settings → Developer settings → OAuth Apps
- Create new OAuth App
- Authorization URL: `https://github.com/login/oauth/authorize`
- Token URL: `https://github.com/login/oauth/access_token`

**Scopes:**
- `user:email` - Access email addresses
- `read:user` - Read public profile data

**Response:**
```json
{
  "id": "github_id",
  "username": "username",
  "name": "Full Name",
  "email": "email@example.com",
  "avatar_url": "https://..."
}
```

### 2.3 Facebook Login

**Setup:**
- Facebook Developers → Create App
- App type: Consumer
- Add Facebook Login product
- Configure Redirect URIs

**Scopes:**
- `public_profile` - Basic profile
- `email` - User email
- `user_friends` - Friend list (if needed)

**Response:**
```json
{
  "id": "facebook_id",
  "name": "User Name",
  "email": "email@example.com",
  "picture": {"data": {"url": "https://..."}}
}
```

---

## 3. Redirect URI Validation Security

### 3.1 Validation Rules (OAuth 2.1)

**Exact Match Required:**
- `https://app.com/callback` ✅ matches registered
- `https://app.com/callback?foo=bar` ❌ different path component
- `http://app.com/callback` ❌ different scheme
- `https://app.com:8080/callback` ❌ different port (except loopback)

**Loopback Exception:**
- `http://localhost:8080/callback` & `http://localhost:3000/callback` can both be registered for same app
- Must still use exact path matching

**Implementation Checklist:**
- Register all production + staging redirect URIs upfront
- Never accept redirect_uri from request parameter
- Use string comparison, not regex or pattern matching
- Validate before any authorization processing

### 3.2 Open Redirector Prevention

**Risk:** Malicious app parameter: `?redirect=https://attacker.com`

**Prevention:**
- Never forward browser to arbitrary URLs from query params
- Whitelist allowed redirect destinations
- Use session-bound redirect URLs

---

## 4. Account Linking Strategies

### 4.1 Email-Based Auto-Linking

**Pattern:**
- User signs up with Google (email: john@example.com)
- Later attempts email/password signup with same email
- System detects existing email → prompt user to link accounts
- User verifies identity (password confirmation) → accounts merge

**Security:** Prevents account takeover via unverified emails

### 4.2 User-Initiated Linking

**Pattern:**
- User logs in with primary auth (email/password)
- Dashboard → "Connect Social Accounts"
- Select provider → Authorize → Account linked
- Multiple OAuth + email/password on single user

**Database Schema:**
```
User {
  id
  email
  password_hash
  created_at
  oauth_accounts: OAuthAccount[]
}

OAuthAccount {
  id
  user_id (FK)
  provider (google|github|facebook)
  provider_id
  access_token (encrypted)
  refresh_token (encrypted)
  token_expires_at
  profile_data (JSON)
  created_at
}
```

### 4.3 User Profile Data Mapping

**Unified Profile Schema:**
```
User {
  firstName: string
  lastName: string
  email: string
  picture: string
  email_verified: boolean
}
```

**Provider-Specific Mapping:**
```javascript
// Google
{displayName → firstName/lastName, emails[0].value → email, photos[0].value → picture}

// GitHub
{username → firstName, name → lastName, email → email, avatar_url → picture}

// Facebook
{name → firstName/lastName, email → email, picture.data.url → picture}
```

---

## 5. NestJS + Passport Implementation Patterns

### 5.1 Architecture Overview

**Module Structure:**
```
src/auth/
├── strategies/
│   ├── google.strategy.ts
│   ├── github.strategy.ts
│   ├── facebook.strategy.ts
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── guards/
│   ├── google-oauth.guard.ts
│   ├── multi-oauth.guard.ts
│   └── jwt.guard.ts
├── controllers/
│   ├── oauth.controller.ts
│   └── auth.controller.ts
├── services/
│   ├── auth.service.ts
│   └── oauth.service.ts
├── entities/
│   ├── user.entity.ts
│   └── oauth-account.entity.ts
└── auth.module.ts
```

### 5.2 Strategy Pattern (Single Implementation for All Providers)

**Challenge:** Each provider has different config, profile response structure

**Solution:** Generic OAuth Strategy Factory

```typescript
// Generic OAuth Strategy
export abstract class OAuthStrategy extends PassportStrategy(Strategy) {
  abstract provider: OAuthProvider;

  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get(`OAUTH_${provider}_ID`),
      clientSecret: configService.get(`OAUTH_${provider}_SECRET`),
      callbackURL: configService.get(`OAUTH_${provider}_CALLBACK`),
      scope: ['openid', 'email', 'profile'],
      pkce: true, // Mandatory in OAuth 2.1
      state: true,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<User> {
    return this.oauthService.validateAndCreateUser(
      this.provider,
      accessToken,
      refreshToken,
      profile,
    );
  }
}

// Google Implementation
@Injectable()
export class GoogleStrategy extends OAuthStrategy {
  provider = 'google';

  constructor(configService: ConfigService, oauthService: OAuthService) {
    super(configService, oauthService);
  }
}

// GitHub Implementation (minimal code)
@Injectable()
export class GitHubStrategy extends OAuthStrategy {
  provider = 'github';
  constructor(configService: ConfigService, oauthService: OAuthService) {
    super(configService, oauthService);
  }
}
```

### 5.3 OAuth Service (Core Business Logic)

```typescript
@Injectable()
export class OAuthService {
  constructor(
    private userService: UserService,
    private oauthAccountRepo: Repository<OAuthAccount>,
  ) {}

  async validateAndCreateUser(
    provider: string,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<User> {
    // 1. Look up existing OAuth account
    let oauthAccount = await this.oauthAccountRepo.findOne({
      where: { provider, provider_id: profile.id },
    });

    if (oauthAccount) {
      // Update tokens
      oauthAccount.access_token = this.encryptToken(accessToken);
      oauthAccount.refresh_token = refreshToken ? this.encryptToken(refreshToken) : null;
      oauthAccount.token_expires_at = this.calculateExpiry();
      await this.oauthAccountRepo.save(oauthAccount);
      return oauthAccount.user;
    }

    // 2. Check if email exists (account linking)
    const normalizedEmail = this.normalizeEmail(profile.emails[0]?.value);
    let user = await this.userService.findByEmail(normalizedEmail);

    if (user && !user.oauth_accounts.some(oa => oa.provider === provider)) {
      // Link to existing user
      return this.linkOAuthToUser(user, provider, profile, accessToken, refreshToken);
    }

    // 3. Create new user + OAuth account
    if (!user) {
      user = await this.userService.create({
        email: normalizedEmail,
        first_name: this.mapFirstName(profile),
        last_name: this.mapLastName(profile),
        picture: this.mapPicture(profile),
        email_verified: true, // OAuth providers verify email
      });
    }

    // 4. Create OAuth account
    const oauthAccount = new OAuthAccount();
    oauthAccount.user = user;
    oauthAccount.provider = provider;
    oauthAccount.provider_id = profile.id;
    oauthAccount.access_token = this.encryptToken(accessToken);
    oauthAccount.refresh_token = refreshToken ? this.encryptToken(refreshToken) : null;
    oauthAccount.profile_data = profile;
    oauthAccount.token_expires_at = this.calculateExpiry();
    await this.oauthAccountRepo.save(oauthAccount);

    return user;
  }

  private linkOAuthToUser(
    user: User,
    provider: string,
    profile: any,
    accessToken: string,
    refreshToken: string,
  ): Promise<User> {
    const oauthAccount = new OAuthAccount();
    oauthAccount.user = user;
    oauthAccount.provider = provider;
    oauthAccount.provider_id = profile.id;
    oauthAccount.access_token = this.encryptToken(accessToken);
    oauthAccount.refresh_token = refreshToken ? this.encryptToken(refreshToken) : null;
    oauthAccount.profile_data = profile;
    oauthAccount.token_expires_at = this.calculateExpiry();
    return this.oauthAccountRepo.save(oauthAccount).then(() => user);
  }

  private mapFirstName(profile: any): string {
    // Handle different provider response structures
    return profile.name?.familyName || profile.username || profile.name?.split(' ')[0] || '';
  }

  private mapLastName(profile: any): string {
    return profile.name?.givenName || profile.name?.split(' ')[1] || '';
  }

  private mapPicture(profile: any): string {
    return profile.photos?.[0]?.value || profile.picture?.data?.url || '';
  }

  private encryptToken(token: string): string {
    // Use NestJS ConfigService to get encryption key
    // Implement AES-256 encryption
  }

  private calculateExpiry(): Date {
    return new Date(Date.now() + 3600 * 1000); // 1 hour default
  }

  private normalizeEmail(email: string): string {
    return email?.toLowerCase().trim() || '';
  }
}
```

### 5.4 Controller (HTTP Endpoints)

```typescript
@Controller('auth/oauth')
export class OAuthController {
  constructor(private authService: AuthService) {}

  // Google callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req, @Res() res) {
    const user = req.user;
    const tokens = this.authService.generateTokens(user);
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${tokens.access_token}`);
  }

  // GitHub callback
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req, @Res() res) {
    // Same logic
  }

  // Link OAuth account (user-initiated)
  @Post('link/:provider')
  @UseGuards(JwtGuard)
  async linkOAuthAccount(
    @Param('provider') provider: string,
    @Req() req,
  ) {
    const user = req.user;
    // Redirect to OAuth provider with state that indicates "linking mode"
    return this.authService.initiateOAuthLink(provider, user.id);
  }

  // OAuth callback with linking context
  @Get(':provider/link-callback')
  @UseGuards(AuthGuard(provider))
  async linkCallback(@Req() req, @Res() res) {
    const user = req.user;
    res.json({ success: true, user });
  }
}
```

### 5.5 Configuration Management

**Environment Variables:**
```env
# Google
OAUTH_GOOGLE_ID=your_client_id.apps.googleusercontent.com
OAUTH_GOOGLE_SECRET=your_secret
OAUTH_GOOGLE_CALLBACK=http://localhost:3000/auth/oauth/google/callback

# GitHub
OAUTH_GITHUB_ID=your_app_id
OAUTH_GITHUB_SECRET=your_secret
OAUTH_GITHUB_CALLBACK=http://localhost:3000/auth/oauth/github/callback

# Facebook
OAUTH_FACEBOOK_ID=your_app_id
OAUTH_FACEBOOK_SECRET=your_secret
OAUTH_FACEBOOK_CALLBACK=http://localhost:3000/auth/oauth/facebook/callback

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=32_byte_hex_key_for_token_encryption
```

**ConfigService Implementation:**
```typescript
import { registerAs } from '@nestjs/config';

export const oauthConfig = registerAs('oauth', () => ({
  google: {
    clientID: process.env.OAUTH_GOOGLE_ID,
    clientSecret: process.env.OAUTH_GOOGLE_SECRET,
    callbackURL: process.env.OAUTH_GOOGLE_CALLBACK,
    scope: ['openid', 'email', 'profile'],
  },
  github: {
    clientID: process.env.OAUTH_GITHUB_ID,
    clientSecret: process.env.OAUTH_GITHUB_SECRET,
    callbackURL: process.env.OAUTH_GITHUB_CALLBACK,
    scope: ['user:email', 'read:user'],
  },
  facebook: {
    clientID: process.env.OAUTH_FACEBOOK_ID,
    clientSecret: process.env.OAUTH_FACEBOOK_SECRET,
    callbackURL: process.env.OAUTH_FACEBOOK_CALLBACK,
    scope: ['public_profile', 'email'],
  },
}));
```

### 5.6 JWT + Refresh Token Integration

**Token Flow:**
1. OAuth login → generate access_token (short-lived) + refresh_token (long-lived)
2. Access token in Authorization header: `Bearer <access_token>`
3. Refresh token in httpOnly cookie (secure)
4. When access_token expires → POST /auth/refresh with refresh_token
5. Issue new access_token

```typescript
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRY', '1h'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();

      const tokens = this.generateTokens(user);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

@Controller('auth')
export class AuthController {
  @Post('refresh')
  async refresh(@Body() { refreshToken }: { refreshToken: string }) {
    return this.authService.refreshAccessToken(refreshToken);
  }
}
```

### 5.7 Multiple Strategy Registration

```typescript
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    GoogleStrategy,
    GitHubStrategy,
    FacebookStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    AuthService,
    OAuthService,
  ],
  controllers: [OAuthController, AuthController],
})
export class AuthModule {}
```

**Guard Usage:**
```typescript
// Single provider
@UseGuards(AuthGuard('google'))

// Multiple providers (try each)
@UseGuards(AuthGuard(['google', 'github', 'facebook']))

// JWT protected endpoint
@UseGuards(AuthGuard('jwt'))

// Combo: OAuth or JWT
@UseGuards(AuthGuard(['google', 'jwt']))
```

---

## 6. Security Best Practices Implementation

### 6.1 Token Encryption in Database

**Why:** Refresh tokens stored in DB must be encrypted

```typescript
import * as crypto from 'crypto';

export class TokenEncryption {
  private algorithm = 'aes-256-gcm';

  encrypt(token: string, key: string): { iv: string; encryptedData: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(
    encryptedData: string,
    iv: string,
    authTag: string,
    key: string,
  ): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 6.2 PKCE Implementation in NestJS

```typescript
@Injectable()
export class PKCEService {
  generateVerifier(): string {
    // 128 chars for maximum security
    return this.base64URLEncode(crypto.randomBytes(96));
  }

  generateChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return this.base64URLEncode(hash);
  }

  private base64URLEncode(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  verify(verifier: string, challenge: string): boolean {
    return this.generateChallenge(verifier) === challenge;
  }
}

// Usage in strategy
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private pkceService: PKCEService,
  ) {
    super({
      clientID: configService.get('OAUTH_GOOGLE_ID'),
      clientSecret: configService.get('OAUTH_GOOGLE_SECRET'),
      callbackURL: configService.get('OAUTH_GOOGLE_CALLBACK'),
      scope: ['openid', 'email', 'profile'],
      // Passport.js handles PKCE automatically with these settings
      codeChallengeMethod: 'S256',
      state: true,
    });
  }
}
```

### 6.3 State Parameter Validation

```typescript
@Injectable()
export class StateService {
  constructor(private cacheService: CacheService) {}

  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  storeState(sessionId: string, state: string, expiresIn = 600): void {
    this.cacheService.set(`oauth_state:${sessionId}`, state, expiresIn);
  }

  validateState(sessionId: string, state: string): boolean {
    const storedState = this.cacheService.get(`oauth_state:${sessionId}`);
    if (!storedState) return false;

    this.cacheService.del(`oauth_state:${sessionId}`); // One-time use
    return storedState === state;
  }
}

// Usage in controller
@Get('google/callback')
@UseGuards(AuthGuard('google'))
googleCallback(@Query('state') state: string, @Session() session) {
  if (!this.stateService.validateState(session.id, state)) {
    throw new BadRequestException('Invalid state parameter');
  }
  // Continue with authentication
}
```

### 6.4 Redirect URI Whitelist

```typescript
@Injectable()
export class RedirectURIValidator {
  private whitelist = [
    'http://localhost:3000/auth/callback',
    'http://localhost:3001/auth/callback',
    'https://app.example.com/auth/callback',
    'https://staging.app.example.com/auth/callback',
  ];

  validate(redirectURI: string): boolean {
    // Exact match only
    return this.whitelist.includes(redirectURI);
  }
}
```

---

## 7. Token Refresh & Management

### 7.1 Refresh Token Rotation Strategy

```typescript
@Injectable()
export class TokenRotationService {
  async rotateRefreshToken(user: User, oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Validate old token
    const decoded = this.jwtService.verify(oldRefreshToken, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    // 2. Verify user matches
    if (decoded.sub !== user.id) {
      throw new UnauthorizedException('Token mismatch');
    }

    // 3. Check if token is in blacklist (used token cannot be reused)
    const isBlacklisted = await this.tokenBlacklistRepo.findOne({
      where: { token: oldRefreshToken },
    });

    if (isBlacklisted) {
      // Possible token reuse attack
      await this.logSecurityEvent(user.id, 'SUSPICIOUS_TOKEN_REUSE');
      throw new UnauthorizedException('Token reuse detected');
    }

    // 4. Issue new tokens
    const newTokens = this.authService.generateTokens(user);

    // 5. Blacklist old token
    const blacklistedToken = new TokenBlacklist();
    blacklistedToken.token = oldRefreshToken;
    blacklistedToken.user = user;
    blacklistedToken.expires_at = new Date(decoded.exp * 1000);
    await this.tokenBlacklistRepo.save(blacklistedToken);

    return newTokens;
  }
}
```

### 7.2 Token Expiry & Cleanup

```typescript
@Cron('0 * * * *') // Every hour
async cleanupExpiredTokens() {
  await this.tokenBlacklistRepo.delete({
    expires_at: LessThan(new Date()),
  });
}
```

---

## 8. Database Schema (TypeORM)

```typescript
// User Entity
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password_hash: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ default: false })
  email_verified: boolean;

  @OneToMany(() => OAuthAccount, (account) => account.user, { cascade: true })
  oauth_accounts: OAuthAccount[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// OAuth Account Entity
@Entity('oauth_accounts')
export class OAuthAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.oauth_accounts, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  provider: string; // 'google', 'github', 'facebook'

  @Column()
  provider_id: string;

  @Column()
  access_token: string; // Encrypted

  @Column({ nullable: true })
  refresh_token: string; // Encrypted

  @Column({ nullable: true })
  token_expires_at: Date;

  @Column('json', { nullable: true })
  profile_data: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Unique(['provider', 'provider_id'])
  constraint: string;
}

// Token Blacklist Entity
@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  token: string;

  @Column()
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
```

---

## 9. Implementation Checklist

### Phase 1: Security Foundation
- [ ] Implement PKCE service (generateVerifier, generateChallenge)
- [ ] Implement State parameter service (generateState, validateState)
- [ ] Setup token encryption (AES-256-GCM)
- [ ] Configure redirect URI whitelist
- [ ] Setup environment variable validation

### Phase 2: Database & ORM
- [ ] Create User, OAuthAccount, TokenBlacklist entities
- [ ] Setup TypeORM migrations
- [ ] Create indexes on (provider, provider_id)
- [ ] Implement token blacklist cleanup cron job

### Phase 3: Passport Strategies
- [ ] Install dependencies (passport, @nestjs/passport, passport-google-oauth20, etc)
- [ ] Implement abstract OAuthStrategy base class
- [ ] Implement GoogleStrategy
- [ ] Implement GitHubStrategy
- [ ] Implement FacebookStrategy
- [ ] Implement JwtStrategy
- [ ] Implement JwtRefreshStrategy

### Phase 4: OAuth Service
- [ ] Implement OAuthService.validateAndCreateUser
- [ ] Implement OAuthService.linkOAuthToUser
- [ ] Implement profile data mapping for all providers
- [ ] Implement email normalization

### Phase 5: Controllers & Endpoints
- [ ] Implement OAuth callback endpoints (/auth/oauth/:provider/callback)
- [ ] Implement token refresh endpoint (/auth/refresh)
- [ ] Implement account linking endpoint (/auth/oauth/link/:provider)
- [ ] Add proper error handling & validation

### Phase 6: Frontend Integration
- [ ] Setup OAuth redirect URLs (frontend → backend → provider)
- [ ] Store refresh token in httpOnly cookie
- [ ] Store access token in memory
- [ ] Implement token refresh on 401
- [ ] Handle OAuth provider errors gracefully

### Phase 7: Testing & Security Audit
- [ ] Test OAuth flow end-to-end for each provider
- [ ] Test account linking scenarios
- [ ] Test token refresh + rotation
- [ ] Test state parameter validation
- [ ] Test PKCE flow
- [ ] Security audit on redirect URIs
- [ ] Load test token cleanup operations

---

## 10. Critical Implementation Notes

### Do's
- ✅ Use PKCE for ALL flows (mandatory in OAuth 2.1)
- ✅ Use S256 PKCE method only (never 'plain')
- ✅ Store refresh tokens encrypted in database
- ✅ Validate state parameter with one-time use
- ✅ Use exact string matching for redirect URIs
- ✅ Email verification for auto-account-linking
- ✅ Generate unique, opaque state/verifier values
- ✅ Use httpOnly, Secure, SameSite cookies for refresh tokens

### Don'ts
- ❌ Don't expose client_secret in frontend code
- ❌ Don't use implicit flow for SPAs
- ❌ Don't skip state parameter validation
- ❌ Don't store access tokens in localStorage (use memory + httpOnly)
- ❌ Don't use regex/pattern matching for redirect URIs
- ❌ Don't auto-link accounts without email verification
- ❌ Don't expose OAuth accounts via public API
- ❌ Don't forget token expiry handling

---

## 11. Technology Stack

| Component | Package | Version | Notes |
|-----------|---------|---------|-------|
| Framework | @nestjs/core | ^10.0 | Latest LTS |
| Passport | @nestjs/passport, passport | ^10.0, ^0.7 | Official NestJS wrapper |
| Google | passport-google-oauth20 | ^2.0 | Standard package |
| GitHub | passport-github2 | ^0.1 | Updated GitHub API v2 |
| Facebook | passport-facebook | ^3.0 | Maintained strategy |
| JWT | @nestjs/jwt | ^12.0 | JWT generation |
| Config | @nestjs/config | ^3.0 | Env var management |
| Database | typeorm | ^0.3 | ORM + Migrations |
| Encryption | crypto | Built-in | Node.js native |
| Caching | cache-manager | ^5.0 | State/token management |

---

## 12. Unresolved Questions

1. **Token Storage Decision**: Should OAuth refresh tokens be stored client-side (cookie) or server-side (session)? Current recommendation: server-side encrypted in DB with session cookie, but this requires additional infrastructure.

2. **Provider-Specific Refresh**: How to handle providers with different refresh token lifecycles (e.g., Google: 6 months, GitHub: no refresh)?

3. **Account Linking Conflicts**: What if user attempts to link two different OAuth accounts with same email? Need explicit user confirmation flow design.

4. **Rate Limiting**: Should token refresh endpoint have aggressive rate limiting? Current recommendation: client-side backoff + server-side rate limiting (100 req/hour/user).

5. **OAuth Scope Escalation**: How to handle scope upgrades after initial OAuth consent? Need frontend flow for re-consent.

---

## Sources

- [RFC 9700 - Best Current Practice for OAuth 2.0 Security](https://datatracker.ietf.org/doc/rfc9700/)
- [OAuth 2.1 Security Best Practices - Medium](https://medium.com/@basakerdogan/oauth-2-0-security-best-practices-from-authorization-code-to-pkce-beccdbe7ec35)
- [PKCE Downgrade Attacks](https://instatunnel.my/blog/pkce-downgrade-attacks-why-oauth-21-is-no-longer-optional)
- [OAuth 2.1 vs 2.0: What developers need to know - Stytch](https://stytch.com/blog/oauth-2-1-vs-2-0/)
- [What is PKCE? - Descope](https://www.descope.com/learn/post/pkce)
- [OAuth 2.0 Protocol Cheatsheet - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
- [Demystifying OAuth Security: State vs. Nonce vs. PKCE - Auth0](https://auth0.com/blog/demystifying-oauth-security-state-vs-nonce-vs-pkce/)
- [Google OAuth2 Authentication with NestJS - Medium](https://medium.com/@flavtech/google-oauth2-authentication-with-nestjs-explained-ab585c53edec)
- [Full-Stack TypeScript Apps: Developing a Secure API with NestJS - Auth0](https://auth0.com/blog/developing-a-secure-api-with-nestjs-adding-authorization/)
- [Multi-Provider SSO in NestJS with OAuth2 - Medium](https://medium.com/@camillefauchier/multi-provider-oauth2-authentication-in-nestjs-beyond-basic-jwt-7945ece51bb3)
- [A Step-By-Step Guide to OAuth 2.0 - DEV Community](https://dev.to/wulfi/a-step-by-step-guide-to-oauth-2-0-implementing-sign-in-google-facebook-and-github-51hb)
- [OAuth Authentication: Google, Facebook, GitHub Login via NODE JS - DEV Community](https://dev.to/uniyalmanas/oauth-authentication-google-facebook-github-login-via-node-js-backend-22fg)
- [Using OAuth 2.0 for Web Server Applications - Google Developers](https://developers.google.com/identity/protocols/oauth2/web-server)
- [OAuth 2.0 Redirect URI Validation - Connect2id](https://connect2id.com/products/nimbus-oauth-openid-connect-sdk/examples/oauth/redirect-uri-validation)
- [Prevent Attacks and Redirect Users with OAuth 2.0 State Parameters - Auth0](https://auth0.com/docs/secure/attack-protection/state-parameters)
- [User Account Linking - Auth0](https://auth0.com/docs/manage-users/user-accounts/user-account-linking)
- [Account Linking for OAuth - Clerk](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking)
- [Identity Linking - Supabase](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Google Account Linking with OAuth - Google Developers](https://developers.google.com/identity/account-linking/oauth-linking)
- [Definitive guide for Nest.js guards and Passport - Medium](https://romain-kelifa.medium.com/definitive-guide-for-nest-js-guards-and-passport-57915cfb6fd)
- [Implementing secure single sign-on authentication in NestJS - LogRocket](https://blog.logrocket.com/implement-secure-single-sign-on-nestjs-google/)
- [NestJS JWT Authentication with Refresh Tokens - Elvis Duru](https://www.elvisduru.com/blog/nestjs-jwt-authentication-refresh-token)
- [Authorization Code Flow with PKCE - Auth0](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce)
- [Generating the code challenge for PKCE - Valentino G](https://www.valentinog.com/blog/challenge/)
- [pkce-challenge - npm](https://www.npmjs.com/package/pkce-challenge)
- [Passport.js Official Documentation](https://www.passportjs.org/)
- [NestJS Passport Recipes](https://docs.nestjs.com/recipes/passport)
