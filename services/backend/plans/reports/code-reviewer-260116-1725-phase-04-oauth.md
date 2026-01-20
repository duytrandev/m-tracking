# Code Review Report: Phase 4 OAuth Social Login

**Date:** 2026-01-16
**Reviewer:** code-reviewer agent
**Plan:** `/Users/DuyHome/dev/any/freelance/m-tracking/plans/260116-1409-authentication-flow/backend/phase-04-oauth-social-login.md`
**Score:** 6.5/10

---

## Scope

**Files Reviewed:**
- `src/auth/strategies/google.strategy.ts`
- `src/auth/strategies/github.strategy.ts`
- `src/auth/strategies/facebook.strategy.ts`
- `src/auth/services/oauth.service.ts`
- `src/auth/controllers/oauth.controller.ts`
- `src/auth/utils/encryption.util.ts`
- `src/auth/auth.module.ts`
- `src/auth/entities/oauth-account.entity.ts`

**Test Files:**
- `src/auth/services/oauth.service.spec.ts`
- `src/auth/controllers/oauth.controller.spec.ts`

**Lines Analyzed:** ~700 lines
**Test Results:** 13/13 passing, 86-91% coverage
**Build Status:** ✅ Compiles successfully

---

## Overall Assessment

Implementation provides functional OAuth 2.1 integration with Google, GitHub, and Facebook. Encryption using AES-256-GCM is solid. Tests pass with good coverage (91% for oauth.service.ts).

**Major concerns:**
- **CRITICAL**: Tokens exposed in URL redirects (security vulnerability)
- **CRITICAL**: Missing state parameter validation (CSRF vulnerability)
- **HIGH**: No PKCE validation implementation despite claiming support
- **HIGH**: Type safety issues with `any` types throughout
- **MEDIUM**: Code duplication in controller callbacks
- **MEDIUM**: Missing error handling edge cases

Architecture follows NestJS patterns appropriately. Token encryption implementation is secure when key properly configured.

---

## Critical Issues

### 1. **SECURITY: JWT Tokens Exposed in URL Query Parameters**

**Severity:** 🔴 CRITICAL
**OWASP:** A01:2021 - Broken Access Control / A02:2021 - Cryptographic Failures

**Location:** `oauth.controller.ts` lines 52, 85, 117

```typescript
// ❌ VULNERABLE - Tokens in URL can be logged, cached, leaked via Referer header
const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
return res.redirect(redirectUrl);
```

**Impact:**
- Tokens appear in browser history
- Logged in proxy/CDN access logs
- Exposed via HTTP Referer header to third parties
- Visible in browser developer tools
- Can be stolen via XSS on ANY page user visits after auth

**Fix:** Use POST callback with session/state, or fragment identifier:

```typescript
// ✅ SECURE - Use fragment (not sent to server)
const redirectUrl = `${frontendUrl}/auth/callback#accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
return res.redirect(redirectUrl);

// ✅ BETTER - Use httpOnly cookie + session
res.cookie('auth_token', result.accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
});
const redirectUrl = `${frontendUrl}/auth/callback?success=true`;
return res.redirect(redirectUrl);
```

**References:**
- [OWASP OAuth Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth_2_0_Cheat_Sheet.html#authorization-code-flow)
- RFC 6749 Section 4.1.2: Do not pass tokens in query params

---

### 2. **SECURITY: Missing State Parameter Validation (CSRF)**

**Severity:** 🔴 CRITICAL
**OWASP:** A01:2021 - Broken Access Control (CSRF)

**Location:** All strategies (`google.strategy.ts`, `github.strategy.ts`, `facebook.strategy.ts`)

```typescript
// ❌ State enabled but never validated
super({
  state: true, // Generates state but doesn't validate it
  // ...
});
```

**Impact:**
- Vulnerable to CSRF attacks during OAuth flow
- Attacker can trick user into linking attacker's OAuth account
- Session fixation attacks possible

**Current Implementation:**
- Google strategy: `state: true` (line 19)
- GitHub strategy: `state: true` (line 18)
- Facebook strategy: `state: true` (line 20)
- **NO validation logic found anywhere**

**Fix:** Implement state validation:

```typescript
// Generate and store state
const state = crypto.randomBytes(32).toString('hex');
await redisClient.set(`oauth:state:${state}`, userId, 'EX', 600);

// In callback, validate state
const storedUserId = await redisClient.get(`oauth:state:${state}`);
if (!storedUserId) {
  throw new UnauthorizedException('Invalid state parameter');
}
await redisClient.del(`oauth:state:${state}`);
```

**References:**
- [RFC 6749 Section 10.12](https://tools.ietf.org/html/rfc6749#section-10.12)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

### 3. **SECURITY: PKCE Not Actually Validated**

**Severity:** 🔴 CRITICAL (Claims OAuth 2.1 compliance but doesn't implement key security feature)

**Location:** `google.strategy.ts` line 20

```typescript
// ❌ PKCE enabled in config but Passport doesn't validate it server-side
pkce: true,
```

**Issue:**
- Setting `pkce: true` only enables PKCE on client
- No server-side validation of code_verifier against code_challenge
- Plan claims "PKCE flow implemented" in success criteria but it's incomplete

**Impact:**
- Authorization code interception attacks still possible
- False sense of security claiming OAuth 2.1 compliance
- Does not meet security requirements stated in plan

**Fix:** Implement proper PKCE validation:

```typescript
// Store code_challenge in session/redis during authorize
// In callback, verify code_verifier
const isValid = await validatePKCE(code_verifier, stored_code_challenge);
if (!isValid) {
  throw new UnauthorizedException('Invalid PKCE verification');
}
```

**Note:** Passport strategies may not support full PKCE validation out-of-box. May require custom implementation or different library.

---

## High Priority Findings

### 4. **Type Safety: Excessive Use of `any`**

**Severity:** 🟠 HIGH
**Locations:** Multiple files

```typescript
// oauth.service.ts line 64
async handleOAuthCallback(profile: OAuthProfile, req: any)

// All strategies, e.g. google.strategy.ts line 32
async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback)

// oauth.controller.ts lines 43, 77, 109
async googleCallback(@Req() req: any, @Res() res: Response)
```

**Impact:**
- Loses TypeScript benefits
- Runtime errors not caught at compile time
- Harder to refactor
- Violates code-standards.md strict mode requirements

**Fix:**

```typescript
// Define proper types
interface OAuthRequest extends Request {
  user: OAuthProfile;
  headers: { 'user-agent'?: string };
  ip?: string;
  connection: { remoteAddress?: string };
}

// Use typed interfaces
async handleOAuthCallback(profile: OAuthProfile, req: OAuthRequest): Promise<OAuthLoginResponse>
```

**Linting Issues Detected:**
- 12 instances of `@typescript-eslint/no-explicit-any` warnings
- 5 instances of `@typescript-eslint/no-unused-vars` errors

---

### 5. **Missing Error Handling Edge Cases**

**Severity:** 🟠 HIGH

**Issues:**

**a) Encryption key validation only at runtime:**
```typescript
// encryption.util.ts line 18-21
private static getEncryptionKey(): Buffer {
  const key = process.env.OAUTH_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('OAUTH_ENCRYPTION_KEY environment variable is required');
  }
```

**Problem:** App starts successfully but crashes on first OAuth attempt if key missing.

**Fix:** Validate at module initialization:

```typescript
// auth.module.ts - add to constructor
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    if (!process.env.OAUTH_ENCRYPTION_KEY) {
      throw new Error('OAUTH_ENCRYPTION_KEY must be set');
    }
  }
}
```

**b) No handling for missing email from OAuth provider:**
```typescript
// oauth.service.ts line 167
user.email = profile.email; // Can be null for some providers
```

**Problem:** Database constraint violation if email required.

**Fix:**

```typescript
if (!profile.email) {
  throw new BadRequestException(
    `${profile.provider} did not provide email. Please use different provider.`
  );
}
```

**c) Race condition in account linking:**
```typescript
// oauth.service.ts line 187-198
const existing = await this.oauthAccountRepository.findOne({
  where: { userId, provider: profile.provider },
});
if (existing) {
  throw new ConflictException(...);
}
// Not atomic - race condition if concurrent requests
```

**Fix:** Use unique constraint (already in entity) and catch duplicate key error.

---

### 6. **Performance: N+1 Query in Session Creation**

**Severity:** 🟠 HIGH
**Location:** `oauth.service.ts` lines 94-106

```typescript
// Creates session, generates tokens, then updates session
const session = await this.sessionService.createSession(...);
const accessToken = this.tokenService.generateAccessToken(...);
const refreshToken = this.tokenService.generateRefreshToken(...);
await this.sessionService.updateRefreshToken(session.id, refreshToken);
```

**Impact:**
- 2 database round-trips for session instead of 1
- Higher latency on OAuth callback
- Unnecessary write amplification

**Fix:**

```typescript
// Generate tokens first, then create session with refresh token
const tempSessionId = uuid();
const accessToken = this.tokenService.generateAccessToken(user, tempSessionId);
const refreshToken = this.tokenService.generateRefreshToken(user.id, tempSessionId, 1);

const session = await this.sessionService.createSession(
  user.id,
  refreshToken, // Pass refresh token directly
  req.headers['user-agent'] || 'Unknown',
  req.ip || 'Unknown',
);
```

---

## Medium Priority Improvements

### 7. **Code Duplication: Controller Callback Methods**

**Severity:** 🟡 MEDIUM
**Violates:** DRY principle

**Location:** `oauth.controller.ts` - Nearly identical code in 3 methods (lines 41-61, 75-93, 107-125)

```typescript
// ❌ Duplicated 3 times
async googleCallback(@Req() req: any, @Res() res: Response) {
  try {
    const result = await this.oauthService.handleOAuthCallback(req.user, req);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.accessToken}...`;
    return res.redirect(redirectUrl);
  } catch (error) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`;
    return res.redirect(errorUrl);
  }
}
```

**Fix:** Extract to private method:

```typescript
private async handleProviderCallback(
  req: OAuthRequest,
  res: Response,
): Promise<void> {
  try {
    const result = await this.oauthService.handleOAuthCallback(req.user, req);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}/auth/callback#accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`;
    return res.redirect(errorUrl);
  }
}

@Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleCallback(@Req() req: OAuthRequest, @Res() res: Response) {
  return this.handleProviderCallback(req, res);
}
```

---

### 8. **Unlink Safety: Weak Validation**

**Severity:** 🟡 MEDIUM

**Location:** `oauth.service.ts` lines 241-255

```typescript
// ❌ Only checks for password OR multiple OAuth
if (!user.password && user.oauthAccounts.length === 1) {
  throw new ConflictException(
    'Cannot unlink last authentication method. Set a password first.',
  );
}
```

**Issue:**
- Empty string `password = ''` passes check (line 171)
- Should check for hashed password not empty string

**Fix:**

```typescript
const hasPasswordAuth = user.password && user.password.length > 0;
const hasOtherOAuth = user.oauthAccounts.length > 1;

if (!hasPasswordAuth && !hasOtherOAuth) {
  throw new ConflictException(
    'Cannot unlink last authentication method. Set a password first.',
  );
}
```

---

### 9. **Redirect Parameter Ignored**

**Severity:** 🟡 MEDIUM
**Location:** `oauth.controller.ts` lines 34, 68, 100

```typescript
// ❌ Parameter defined but never used
@Get('google')
@UseGuards(AuthGuard('google'))
async googleAuth(@Query('redirect') redirect?: string) {
  // Guard redirects to Google OAuth
}
```

**Issue:**
- User can't specify custom redirect after OAuth
- Plan doesn't specify if needed, but API suggests intent
- Linter flags as unused variable

**Fix Option 1 - Remove if not needed:**
```typescript
async googleAuth() {
  // Guard redirects to Google OAuth
}
```

**Fix Option 2 - Implement custom redirect:**
```typescript
async googleAuth(@Query('redirect') redirect?: string, @Req() req: any) {
  if (redirect) {
    req.session.oauthRedirect = redirect; // Store in session
  }
}

// In callback, use stored redirect
const customRedirect = req.session.oauthRedirect || '/dashboard';
delete req.session.oauthRedirect;
```

---

### 10. **Missing Input Validation**

**Severity:** 🟡 MEDIUM

**Issues:**

**a) No provider validation in unlink:**
```typescript
// oauth.controller.ts line 152
@Delete('oauth/accounts/:provider')
async unlinkAccount(@Param('provider') provider: string)
```

Should validate `provider` is one of: `google`, `github`, `facebook`

**b) Email format not validated:**
```typescript
// oauth.service.ts line 167
user.email = profile.email; // No validation
```

**Fix:**

```typescript
// Use class-validator DTO
export class UnlinkOAuthDto {
  @IsIn(['google', 'github', 'facebook'])
  provider: string;
}

// Validate email
import { isEmail } from 'class-validator';
if (!isEmail(profile.email)) {
  throw new BadRequestException('Invalid email from OAuth provider');
}
```

---

## Low Priority Suggestions

### 11. **Logging Improvements**

**Current:** Basic logging present but could be enhanced

**Suggestions:**

```typescript
// Add security audit logging
this.logger.warn({
  event: 'oauth_account_unlinked',
  userId,
  provider,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

// Log encryption key issues at startup
this.logger.log('OAuth encryption key validated successfully');
```

---

### 12. **Test Coverage Gaps**

**Current Coverage:** 91.56% statements (oauth.service.ts)

**Uncovered Lines:**
- `oauth.service.ts`: 136-137, 157-163, 195, 247
- Strategies: 0% coverage (not tested)
- `encryption.util.ts`: 50% coverage

**Missing Tests:**

```typescript
// Should test:
- Avatar update logic when linking (lines 135-138)
- Role creation fallback (lines 157-163)
- Encryption key validation errors
- Strategy validation logic
- CSRF scenarios (once fixed)
- Concurrent account creation race conditions
```

---

### 13. **Configuration Validation**

**Suggestion:** Add config validation service

```typescript
// config/oauth.config.ts
export const validateOAuthConfig = () => {
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    // ...
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing OAuth config: ${missing.join(', ')}`);
  }
};
```

---

## Positive Observations

✅ **Good Practices:**

1. **Encryption Implementation:**
   - AES-256-GCM is industry standard
   - Proper IV generation (random per encryption)
   - Auth tag for integrity verification
   - Good error messages for key validation

2. **Account Linking Logic:**
   - Auto-link by verified email is secure
   - Prevents duplicate OAuth accounts per provider
   - Safety check preventing account lockout

3. **Entity Design:**
   - Proper indexes on foreign keys and lookups
   - Unique constraint on provider+providerId
   - CASCADE delete maintains referential integrity

4. **Test Quality:**
   - Comprehensive test scenarios
   - Good mocking structure
   - Tests both happy and error paths

5. **Error Handling:**
   - Appropriate exception types used
   - User-friendly error messages
   - Graceful fallback in error redirects

6. **TypeScript Usage:**
   - Interfaces defined for data contracts
   - Proper use of async/await
   - Dependency injection follows NestJS patterns

---

## Recommended Actions

**Priority Order:**

### MUST FIX (Before Production):

1. **Fix token exposure in URL** - Use fragment identifier or httpOnly cookies
2. **Implement state parameter validation** - Prevent CSRF attacks
3. **Validate PKCE code_verifier** - Or remove PKCE claim from docs
4. **Add encryption key validation at startup** - Fail fast
5. **Fix type safety issues** - Replace all `any` with proper types
6. **Handle missing email edge case** - Validate required fields

### SHOULD FIX (Before Release):

7. **Extract duplicated callback logic** - DRY principle
8. **Fix password validation in unlink** - Check for actual hashed password
9. **Add input validation DTOs** - Validate provider enum
10. **Improve error handling** - Race conditions, edge cases
11. **Fix performance issue** - Single session creation query

### NICE TO HAVE (Post-Release):

12. **Add strategy tests** - Increase coverage to 95%+
13. **Implement custom redirect** - Or remove unused parameter
14. **Add audit logging** - Security events
15. **Create config validation** - Startup checks

---

## Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Type Coverage** | ~70% (many `any` types) | 95% | ❌ Below target |
| **Test Coverage** | 91.56% (service only) | 80% | ✅ Meets target |
| **Linting Issues** | 12 warnings, 5 errors | 0 errors | ⚠️ Has errors |
| **Build Status** | ✅ Compiles | ✅ Compiles | ✅ Pass |
| **Security Issues** | 3 critical, 3 high | 0 critical | ❌ Critical issues |
| **OWASP Compliance** | Fails A01, A02 | Pass all | ❌ Failed |

---

## Plan Status Update

**Plan File:** `/Users/DuyHome/dev/any/freelance/m-tracking/plans/260116-1409-authentication-flow/backend/phase-04-oauth-social-login.md`

### Todo Checklist Status:

- [x] Register OAuth apps (Google, GitHub, Facebook) - ✅ Config in .env.example
- [x] Install passport-google-oauth20, passport-github2, passport-facebook - ✅ Strategies created
- [x] Create Google OAuth strategy - ✅ Implemented
- [x] Create GitHub OAuth strategy - ✅ Implemented
- [x] Create Facebook OAuth strategy - ✅ Implemented
- [x] Implement OAuthService (link accounts, handle callbacks) - ✅ Implemented
- [x] Create OAuth controller with redirect/callback endpoints - ✅ Implemented
- [x] Encrypt OAuth tokens before storage (AES-256-GCM) - ✅ Implemented
- [x] Test OAuth flows for all providers - ✅ Tests passing
- [x] Test account linking scenarios - ✅ Tests passing
- [x] Write integration tests - ✅ Tests passing

### Success Criteria Validation:

- ✅ All 3 OAuth providers working - YES (tests pass)
- ⚠️ Account linking by email functional - YES but needs email validation
- ✅ OAuth tokens encrypted at rest - YES (AES-256-GCM)
- ✅ Profile data mapped correctly - YES (verified in tests)
- ❌ **PKCE flow implemented** - NO (config set but not validated)
- ❌ **State parameter validation working** - NO (enabled but not validated)

**Phase Status:** ⚠️ **INCOMPLETE - Critical Security Issues**

While functional requirements met, security requirements (PKCE, state validation, token exposure) not fully implemented. Cannot mark complete until security issues resolved.

---

## Unresolved Questions

1. **PKCE Implementation:** Does team want full PKCE validation or remove from requirements? May need different Passport strategy or custom implementation.

2. **Token Delivery:** Preference for tokens-in-fragment vs httpOnly-cookie? Frontend architecture impacts choice.

3. **State Validation:** Should state be stored in Redis (stateless) or session? Redis recommended for horizontal scaling.

4. **Email Requirement:** Is email required for all OAuth providers? Facebook may not provide email.

5. **Redirect Parameter:** Is custom redirect after OAuth needed? Currently defined but unused.

6. **Error Telemetry:** Should OAuth failures be sent to monitoring service (Sentry, etc)?

---

## References

**Security Standards:**
- [OWASP OAuth 2.0 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth_2_0_Cheat_Sheet.html)
- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 7636 - PKCE for OAuth 2.0](https://tools.ietf.org/html/rfc7636)
- [OWASP Top 10 2021](https://owasp.org/Top10/)

**Implementation Docs:**
- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)

---

## Conclusion

Implementation demonstrates solid understanding of NestJS patterns and OAuth basics. Token encryption is well-implemented. However, **critical security vulnerabilities prevent production deployment**:

1. Token exposure in URLs is major security risk
2. Missing CSRF protection (state validation)
3. Incomplete PKCE implementation

**Recommendation:** Address 6 MUST FIX items before merging. Consider security audit for OAuth implementation.

**Estimated Effort to Fix Critical Issues:** 4-6 hours

**Final Score: 6.5/10** - Functional but security needs significant improvement.
