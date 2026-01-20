# Authentication Flow Implementation Plan

**Project:** M-Tracking - Personal Finance Management Platform
**Plan Created:** 2026-01-16
**Status:** Ready for Implementation
**Estimated Duration:** 6-8 weeks

---

## Overview

Comprehensive authentication system supporting multiple auth methods, 2FA, session management, and RBAC authorization.

### Requirements

**Authentication Methods:**
- ✅ Email/Password with bcrypt hashing
- ✅ OAuth/Social Login (Google, GitHub, Facebook)
- ✅ Magic Link (passwordless email)
- ✅ Phone/SMS OTP

**Security Features:**
- ✅ Two-Factor Authentication (TOTP)
- ✅ JWT with hybrid session management
- ✅ Token rotation and blacklisting
- ✅ Email verification
- ✅ Password reset flow

**User Management:**
- ✅ User profiles with editable information
- ✅ Role-Based Access Control (RBAC)
- ✅ Multi-device session tracking

---

## Implementation Phases

### Phase 1: Database & Core Infrastructure
**Duration:** Week 1
**Status:** ✅ Complete (2026-01-16)
**File:** [phase-01-database-infrastructure.md](./phase-01-database-infrastructure.md)
**Summary:** [phase-01-implementation-summary.md](./phase-01-implementation-summary.md)

- ✅ Database schema (User, Role, Permission, Session entities)
- ✅ TypeORM entities and migrations
- ✅ Redis connection setup
- ✅ Base module structure

### Phase 2: Email/Password Authentication
**Duration:** Week 1-2
**Status:** ✅ Complete (2026-01-16)
**File:** [phase-02-email-password-auth.md](./phase-02-email-password-auth.md)
**Summary:** [phase-02-implementation-summary.md](./phase-02-implementation-summary.md)

- ✅ User registration with email verification
- ✅ Login with bcrypt password validation
- ✅ JWT token generation (RS256) - Completed in Phase 3
- ✅ Password reset flow
- ✅ Email service integration (Resend)

### Phase 3: JWT Session Management
**Duration:** Week 2
**Status:** ✅ Complete (2026-01-16)
**File:** [phase-03-jwt-session-management.md](./phase-03-jwt-session-management.md)
**Summary:** [phase-03-implementation-summary.md](./phase-03-implementation-summary.md)

- ✅ JWT strategy with Passport (RS256)
- ✅ Access token (15min) + Refresh token (7d)
- ✅ Token rotation and blacklisting via Redis
- ✅ Auth guards and decorators
- ✅ Multi-device session tracking

### Phase 4: OAuth Social Login
**Duration:** Week 3
**Status:** ✅ Complete (2026-01-16)
**File:** [phase-04-oauth-social-login.md](./phase-04-oauth-social-login.md)
**Summary:** [phase-04-implementation-summary.md](./phase-04-implementation-summary.md)

- ✅ Google OAuth 2.1 integration
- ✅ GitHub OAuth integration
- ✅ Facebook Login integration
- ✅ Account linking by verified email
- ✅ Token encryption (AES-256-GCM)
- ✅ Session management with JWT rotation
- ✅ 13/13 tests passing, 91% coverage

### Phase 5: Passwordless Authentication
**Duration:** Week 3-4
**Status:** ⏳ Pending
**File:** [phase-05-passwordless-auth.md](./phase-05-passwordless-auth.md)

- Magic link implementation
- Phone/SMS OTP with Twilio
- Token generation and validation
- Rate limiting for passwordless methods

### Phase 6: Two-Factor Authentication
**Duration:** Week 4-5
**Status:** ⏳ Pending
**File:** [phase-06-two-factor-auth.md](./phase-06-two-factor-auth.md)

- TOTP enrollment with QR codes (otplib)
- Verification flow
- Backup/recovery codes
- 2FA guards and middleware

### Phase 7: RBAC Authorization
**Duration:** Week 5-6
**Status:** ⏳ Pending
**File:** [phase-07-rbac-authorization.md](./phase-07-rbac-authorization.md)

- Role hierarchy (Admin, User, Guest)
- Permission-based guards
- Decorator-based authorization
- Caching strategy (Redis)

### Phase 8: User Profile Management
**Duration:** Week 6
**Status:** ⏳ Pending
**File:** [phase-08-user-profile.md](./phase-08-user-profile.md)

- Profile CRUD endpoints
- Avatar upload
- Settings management
- Account security settings

### Phase 9: Testing & Security Hardening
**Duration:** Week 7-8
**Status:** ⏳ Pending
**File:** [phase-09-testing-security.md](./phase-09-testing-security.md)

- Unit tests for all auth services
- Integration tests for auth flows
- Security hardening (CSRF, XSS, rate limiting)
- Code review and penetration testing

---

## Architecture Overview

### Technology Stack

**Backend:**
- NestJS 11.x with TypeScript 5.9
- TypeORM 0.3.28 + PostgreSQL (Supabase)
- Passport.js (JWT, Local, OAuth strategies)
- Redis 7.x (sessions, token blacklist)

**Libraries:**
- `@nestjs/jwt`, `@nestjs/passport`
- `passport-jwt`, `passport-local`, `passport-google-oauth20`
- `bcrypt` (password hashing)
- `otplib` (TOTP 2FA)
- `resend` (email), `twilio` (SMS)

**Frontend:**
- Next.js 16.1.1 with React 19.2
- Token storage: httpOnly cookies + sessionStorage
- Auto-refresh interceptor

### Security Design

**Token Strategy:**
- Access Token: 15 minutes, RS256 signature
- Refresh Token: 7 days, rotation on use
- Redis blacklist for instant revocation
- httpOnly cookies for refresh tokens

**Password Security:**
- bcrypt with 10 rounds
- Minimum 8 characters, complexity requirements
- Password reset tokens expire in 1 hour

**Rate Limiting:**
- Login: 5 attempts per 15 minutes
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email
- Magic link: 3 per 15 minutes
- SMS OTP: 3 per 15 minutes

---

## Database Schema

### Core Entities

**User**
- id (uuid, PK)
- email (unique, indexed)
- password (nullable for OAuth/passwordless)
- name, avatar
- emailVerified, phoneVerified
- twoFactorEnabled, twoFactorSecret
- createdAt, updatedAt

**Role**
- id (uuid, PK)
- name (admin, user, guest)
- description
- permissions (JSON array or separate entity)

**Session**
- id (uuid, PK)
- userId (FK)
- refreshToken (hashed)
- deviceInfo, ipAddress
- expiresAt
- createdAt, lastActiveAt

**OAuthAccount**
- id (uuid, PK)
- userId (FK)
- provider (google, github, facebook)
- providerId, providerEmail
- accessToken, refreshToken (encrypted)
- createdAt, updatedAt

---

## API Endpoints

### Authentication
```
POST   /auth/register              - Email/password registration
POST   /auth/login                 - Email/password login
POST   /auth/logout                - Logout (blacklist tokens)
POST   /auth/refresh               - Refresh access token
POST   /auth/verify-email          - Verify email with token
POST   /auth/forgot-password       - Request password reset
POST   /auth/reset-password        - Reset password with token

GET    /auth/google                - Initiate Google OAuth
GET    /auth/google/callback       - Google OAuth callback
GET    /auth/github                - Initiate GitHub OAuth
GET    /auth/github/callback       - GitHub OAuth callback
GET    /auth/facebook              - Initiate Facebook OAuth
GET    /auth/facebook/callback     - Facebook OAuth callback

POST   /auth/magic-link/request    - Request magic link
POST   /auth/magic-link/verify     - Verify magic link token
POST   /auth/otp/request           - Request SMS OTP
POST   /auth/otp/verify            - Verify SMS OTP

POST   /auth/2fa/enroll            - Enroll in 2FA (get QR)
POST   /auth/2fa/verify            - Verify 2FA enrollment
POST   /auth/2fa/validate          - Validate 2FA code (login)
POST   /auth/2fa/disable           - Disable 2FA
GET    /auth/2fa/backup-codes      - Generate backup codes
```

### User Profile
```
GET    /users/me                   - Get current user profile
PATCH  /users/me                   - Update profile
POST   /users/me/avatar            - Upload avatar
GET    /users/me/sessions          - List active sessions
DELETE /users/me/sessions/:id      - Revoke session
PATCH  /users/me/password          - Change password
```

---

## Dependencies

### Research Reports
All findings documented in:
- `/plans/reports/researcher-jwt-auth-260116-1409.md`
- `/plans/reports/researcher-oauth-260116-1409.md`
- `/plans/reports/researcher-passwordless-260116-1409.md`
- `/plans/reports/researcher-2fa-totp-260116-1409.md`
- `/plans/reports/researcher-rbac-260116-1409.md`

### External Services
- **Supabase**: PostgreSQL database ($25/month)
- **Redis**: Self-hosted via Docker (free)
- **Resend**: Email delivery ($20/month)
- **Twilio**: SMS OTP ($0.0079-0.068 per SMS)

---

## Risk Assessment

### High Risk
- Token security vulnerabilities → Mitigation: RS256, rotation, blacklisting
- OAuth redirect attacks → Mitigation: Strict URI validation, PKCE
- Brute force attacks → Mitigation: Rate limiting, account lockout

### Medium Risk
- Email delivery failures → Mitigation: Queue with retries, fallback providers
- SMS delivery delays → Mitigation: 5-minute expiry buffer, status tracking
- Session fixation → Mitigation: New session on login, rotate tokens

### Low Risk
- QR code generation issues → Mitigation: Use proven library (otplib)
- Clock drift for TOTP → Mitigation: ±2 time window tolerance

---

## Success Criteria

### Functional
- ✅ All 4 auth methods working (email, OAuth, magic link, SMS)
- ✅ 2FA enrollment and verification functional
- ✅ Token refresh and rotation working
- ✅ RBAC guards protecting routes
- ✅ Profile management complete

### Security
- ✅ All OWASP JWT security checks passing
- ✅ Rate limiting on all sensitive endpoints
- ✅ CSRF protection enabled
- ✅ XSS mitigation implemented
- ✅ Penetration test passed

### Performance
- ✅ Token validation < 10ms
- ✅ Login endpoint < 500ms
- ✅ OAuth redirect < 2s
- ✅ Session lookup < 5ms (Redis)

### Quality
- ✅ 80%+ test coverage
- ✅ All tests passing
- ✅ Code review approved
- ✅ Documentation complete

---

## Next Steps

1. **Review Plan**: Team review and approval
2. **Environment Setup**: Configure services (Resend, Twilio)
3. **Phase 1 Start**: Database schema implementation
4. **Iterative Development**: Follow phases sequentially
5. **Testing**: Continuous testing throughout

---

**Related Documentation:**
- [System Architecture](../../docs/system-architecture.md)
- [Code Standards](../../docs/code-standards.md)
- [Backend Architecture](../../docs/backend-architecture/index.md)
