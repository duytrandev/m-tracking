# Authentication & Authorization

**Last Updated**: February 2, 2026 | **Version**: 1.0 | **Status**: Production Ready (Core Auth)

---

## Overview

M-Tracking implements a comprehensive authentication system with multiple login methods, session management, and role-based access control (RBAC). The system prioritizes security while maintaining developer simplicity and user experience.

**Supported Authentication Methods:**

- Email/Password with password reset
- OAuth 2.0 (Google, GitHub, Facebook with PKCE)
- Magic Links (planned)
- SMS OTP (planned)
- Two-Factor Authentication (2FA) via TOTP (infrastructure ready, UI pending)

**Key Characteristics:**

- **Asymmetric JWT tokens**: RS256 for access tokens, automatic refresh mechanism
- **Secure token storage**: Access tokens in memory, refresh tokens in httpOnly cookies
- **Session tracking**: Device fingerprinting, IP address logging, multi-device support
- **Rate limiting**: 5 req/min on login/register, 3 req/min on password reset
- **RBAC ready**: User → Roles → Permissions hierarchy via database relationships

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                          │
│  • Auth Store (Zustand)     • Auth Hooks                     │
│  • Token Service (in-memory) • Protected Routes              │
│  • Axios Interceptors        • OAuth Redirect Handlers       │
└────────────────┬────────────────────────────────┬────────────┘
                 │                                │
    Login/Register/OAuth/2FA              Refresh Token (httpOnly)
                 │                                │
┌────────────────▼────────────────────────────────▼────────────┐
│             Backend (NestJS)                                 │
│  • Auth Controller (login, register, OAuth)                  │
│  • Token Service (JWT generation, validation)                │
│  • Session Service (device tracking, multi-device)           │
│  • OAuth Service (provider integration, account linking)     │
│  • Email Service (verification, password reset)              │
│  • Password Service (hashing, validation)                    │
└────────────────┬────────────────────────────────┬────────────┘
                 │                                │
          ┌──────┴────────────┬──────────────────┴──────┐
          │                   │                         │
    ┌─────▼────┐      ┌──────▼─────┐         ┌────────▼──┐
    │PostgreSQL│      │   Redis    │         │ RabbitMQ  │
    │          │      │            │         │           │
    │ Users    │      │ Token      │         │ Email     │
    │ Sessions │      │ Blacklist  │         │ Queue     │
    │ Roles    │      │ Rate Limit │         │           │
    │ Perms    │      │ Cache      │         │           │
    │ OAuth    │      └────────────┘         └───────────┘
    │ Tokens   │
    └──────────┘
```

---

## Backend API Endpoints

### Core Authentication Endpoints

| Method | Path                         | Auth   | Rate Limit | Purpose                                         |
| ------ | ---------------------------- | ------ | ---------- | ----------------------------------------------- |
| POST   | `/auth/register`             | Public | 5/min      | Register new user with email & password         |
| POST   | `/auth/verify-email`         | Public | None       | Verify email with token                         |
| POST   | `/auth/login`                | Public | 5/min      | Login with email/username and password          |
| POST   | `/auth/refresh`              | Public | None       | Refresh access token using refresh token cookie |
| POST   | `/auth/logout`               | JWT    | None       | Logout, blacklist tokens, revoke session        |
| GET    | `/auth/me`                   | JWT    | None       | Get authenticated user's profile                |
| POST   | `/auth/forgot-password`      | Public | 3/min      | Request password reset email                    |
| POST   | `/auth/reset-password`       | Public | None       | Reset password with token                       |
| POST   | `/auth/add-password/request` | JWT    | 3/min      | Request password setup for OAuth-only users     |

### OAuth Endpoints

| Method | Path                             | Auth   | Purpose                          |
| ------ | -------------------------------- | ------ | -------------------------------- |
| GET    | `/auth/google`                   | Public | Redirect to Google OAuth login   |
| GET    | `/auth/google/callback`          | Public | Handle Google OAuth callback     |
| GET    | `/auth/github`                   | Public | Redirect to GitHub OAuth login   |
| GET    | `/auth/github/callback`          | Public | Handle GitHub OAuth callback     |
| GET    | `/auth/facebook`                 | Public | Redirect to Facebook OAuth login |
| GET    | `/auth/facebook/callback`        | Public | Handle Facebook OAuth callback   |
| GET    | `/auth/oauth/accounts`           | JWT    | Get user's linked OAuth accounts |
| DELETE | `/auth/oauth/accounts/:provider` | JWT    | Unlink OAuth account             |

### Two-Factor Authentication Endpoints

| Method | Path                     | Auth   | Purpose                           |
| ------ | ------------------------ | ------ | --------------------------------- |
| POST   | `/auth/2fa/enroll`       | JWT    | Start 2FA enrollment, get QR code |
| POST   | `/auth/2fa/verify`       | JWT    | Verify 2FA setup with TOTP code   |
| GET    | `/auth/2fa/backup-codes` | JWT    | Get backup codes for 2FA          |
| POST   | `/auth/2fa/disable`      | JWT    | Disable 2FA                       |
| POST   | `/auth/2fa/validate`     | Public | Validate TOTP during login        |

---

## JWT Strategy

### Token Structure

**Access Token (RS256 - RSA Asymmetric)**

```typescript
{
  userId: string // User UUID
  email: string // User email
  iat: number // Issued at timestamp
  exp: number // Expiration (15 minutes)
}
```

**Refresh Token (HS256 - HMAC Symmetric)**

```typescript
{
  userId: string // User UUID
  type: 'refresh' // Token type
  version: number // Rotation version for revocation
  iat: number // Issued at timestamp
  exp: number // Expiration (7 days)
}
```

### Token Lifetime & Rotation

- **Access Token TTL**: 15 minutes (short-lived for security)
- **Refresh Token TTL**: 7 days (extends session duration)
- **Refresh Rotation**: New refresh token issued on each refresh
- **Automatic Refresh**: Frontend refreshes 60 seconds before expiry
- **Token Blacklisting**: Logout blacklists both tokens via Redis (7-day TTL)

### Key Management

- **Access Token**: Signed with RSA private key, verified with RSA public key
- **Refresh Token**: Signed with symmetric secret (JWT_REFRESH_SECRET)
- **Key Paths**: `/path/to/private.key` and `/path/to/public.key` (configurable via environment)

---

## Password Security

### Password Requirements

**Frontend Validation:**

- Minimum 12 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 numeric digit (0-9)
- At least 1 special character (!@#$%^&\*)

**Backend Enforcement:**

- Minimum 8 characters (more permissive for API consumers)
- Same complexity requirements as frontend
- Reject common/weak passwords (optional integration with haveibeenpwned)

### Password Hashing

- **Algorithm**: bcrypt
- **Salt Rounds**: 10 (balance between security and performance)
- **Password never returned**: API responses omit password fields
- **Plaintext never logged**: Sanitized in logging/error responses

### Password Reset Flow

1. User requests reset via `/auth/forgot-password` with email
2. Backend generates 1-hour TTL reset token (SHA-256 hashed in DB)
3. Email sent with reset link: `{frontendUrl}/reset-password?token={token}`
4. User submits new password to `/auth/reset-password`
5. Token validated, password updated, tokens blacklisted
6. User must re-login with new password

**Security**: Generic success response prevents email enumeration

### Password Setup Flow (OAuth-only Users)

**Scenario**: User signs up via OAuth (Google, GitHub, Facebook) but later wants to set a password for email/password login.

1. OAuth user requests setup via `POST /auth/add-password/request` (authenticated)
2. Backend generates 1-hour TTL password setup token (reuses password reset infrastructure)
3. Email sent with setup link: `{frontendUrl}/set-password?token={token}`
4. User submits new password to `/auth/reset-password` with token
5. Password is hashed and stored on user account
6. User can now login via email/password or OAuth

**Request:**

```json
POST /auth/add-password/request
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Password setup email sent. Please check your inbox.",
  "code": "PASSWORD_SETUP_EMAIL_SENT"
}
```

**Error Codes:**

- `PASSWORD_ALREADY_SET` (409): User already has password
- `INVALID_TOKEN` (401): User not authenticated
- Rate limited to 3 requests/minute per user

---

## Session Management

### Session Storage

Sessions stored in PostgreSQL with device tracking:

```typescript
interface SessionEntity {
  id: string // UUID
  userId: string // FK to User
  deviceInfo: {
    userAgent: string // Browser/device identifier
    platform: string // OS platform (from sec-ch-ua-platform)
  }
  ipAddress: string // IP at login
  expiresAt: Date // 7 days from creation
  lastActiveAt: Date // Last request timestamp
  createdAt: Date
  updatedAt: Date
}
```

### Multi-Device Support

- Users can maintain multiple concurrent sessions
- Each session is independent with separate refresh tokens
- Device info helps identify suspicious activity
- Logout only affects current session/device

### Session Expiration

- **Idle Timeout**: Sessions expire after 7 days regardless of activity
- **Activity Tracking**: `lastActiveAt` updated on token refresh
- **Expired Sessions**: Refresh token becomes invalid, user re-authenticates

---

## Role-Based Access Control (RBAC)

### Database Design

```
User (ManyToMany) ←→ Role (ManyToMany) ←→ Permission
  ↓                    ↓
  id                   id
  email                name (USER, ADMIN, PREMIUM)
  username             description
  ...                  createdAt
                       updatedAt
```

### Default User Role

All newly registered users automatically assigned **USER** role on account creation.

### Available Roles

| Role    | Purpose              | Assigned            | Default Permissions                |
| ------- | -------------------- | ------------------- | ---------------------------------- |
| USER    | Standard user access | Auto (registration) | View own data, manage transactions |
| ADMIN   | Full system access   | Manual              | All endpoints, user management     |
| PREMIUM | Enhanced features    | Manual              | Advanced analytics, larger limits  |

### Role Assignment

- Roles assigned via database (no self-service elevation)
- Requires admin intervention or application-triggered logic
- Changes take effect on next token refresh

### Permission Enforcement

Currently **permission enforcement not yet implemented** in API endpoints. Roles are defined for future fine-grained access control.

---

## Email Verification

### Email Verification Flow

1. User completes registration with email address
2. Backend generates verification token (SHA-256 hashed, 24-hour TTL)
3. Email sent: `{frontendUrl}/verify-email?token={token}`
4. User clicks link or manually submits token to `/auth/verify-email`
5. Token validated, `emailVerified` flag set to `true`

### Unverified User Behavior

- **Account Creation**: Successful, user created with `emailVerified = false`
- **Login**: Allowed before verification (with warning)
- **API Access**: Full access; some features may require verified email (configurable)
- **Email Resend**: User can request new verification email

### Token Management

- **Token Format**: Random string hashed with SHA-256 before storage
- **TTL**: 24 hours from generation
- **Single Use**: Token marked as used after successful verification
- **Resend**: Generates new token, invalidates previous

---

## OAuth Integration

### Supported Providers

**Google OAuth 2.0 (PKCE)**

- Uses Passport.js Google Strategy
- Automatic email linking for verified emails
- Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL

**GitHub OAuth 2.0**

- Uses Passport.js GitHub Strategy
- Email required for account linking
- Requires: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL

**Facebook OAuth 2.0**

- Uses Passport.js Facebook Strategy
- Public email required (not all users expose)
- Requires: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL

### OAuth Flow

```
1. User clicks "Sign in with Google"
   └─> Frontend redirects to GET /auth/google

2. Backend redirects to Google login
   └─> Google OAuth flow (user authenticates)

3. Google redirects back to GET /auth/google/callback
   └─> Passport validates, creates/updates user
   └─> OAuthAccount record created/updated
   └─> Access + refresh tokens generated
   └─> Refresh token set in httpOnly cookie
   └─> Redirect to frontend: /auth/oauth/callback?accessToken={token}

4. Frontend stores access token, validates, redirects to dashboard
```

### Account Linking

**Auto-Linking Logic:**

- OAuth email matches verified email in system → auto-link to account
- OAuth email not found → create new account
- OAuth email conflicts with unverified email → error (user must verify first)

**Manual Unlinking:**

- Users can unlink OAuth accounts via `/auth/oauth/accounts/:provider`
- Protection: Cannot unlink last authentication method
- Example: If user has only Google OAuth, cannot unlink until password set

### OAuth Token Storage

- Provider OAuth tokens encrypted using AES encryption (configurable)
- Storage enables account refresh without re-authentication
- Tokens can be revoked per provider

---

## Two-Factor Authentication (2FA)

### Current Status

**Infrastructure Ready**: Core TOTP system implemented in backend
**UI Pending**: Frontend components for enrollment and verification not yet built

### TOTP (Time-based One-Time Password)

- Uses industry-standard TOTP (RFC 6238)
- 30-second time window per code
- Support for authenticator apps (Google Authenticator, Authy, Microsoft Authenticator)
- 6-digit codes for user entry

### 2FA Enrollment Flow

1. User requests 2FA enrollment: POST `/auth/2fa/enroll`
2. Backend generates secret key, returns QR code
3. User scans QR code in authenticator app
4. User enters 6-digit code to verify: POST `/auth/2fa/verify`
5. On success, `twoFactorEnabled` flag set, backup codes generated

### Backup Codes

- Generated during 2FA enrollment
- Single-use codes for account recovery if authenticator lost
- Stored hashed in database
- Retrieved via GET `/auth/2fa/backup-codes` (requires 2FA)

### 2FA Verification During Login

After successful password verification:

1. If `twoFactorEnabled = true`, redirect to 2FA verification page
2. User enters 6-digit code or backup code
3. POST `/auth/2fa/validate` with code and email
4. On success, return access token

---

## Frontend Authentication

### Auth Store (Zustand)

```typescript
interface AuthState {
  // Current authentication state
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // 2FA flow state
  requires2FA: boolean
  pendingEmail?: string

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setRequires2FA: (requires: boolean) => void
  logout: () => void
}
```

**Storage Policy:**

- **User data**: Stored in sessionStorage (cleared on tab close)
- **Access token**: Stored in-memory only (XSS mitigation)
- **Refresh token**: Stored in httpOnly cookie (CSRF mitigation)

### Token Service

In-memory token management with automatic refresh:

```typescript
// Usage
tokenService.setToken(accessToken, expiresIn)
const token = tokenService.getToken()
const isExpiringSoon = tokenService.isExpiringSoon()

// Automatic refresh
tokenService.setRefreshCallback(async () => {
  const response = await authApi.refresh()
  return response?.accessToken || null
})
```

**Refresh Mechanism:**

- Background timer triggers 60 seconds before expiry
- Calls refresh API, updates token with new access token
- Silent refresh (no user interaction)
- Failed refresh clears auth state, redirects to login

### Validation Schemas (Zod)

**Registration Schema:**

```typescript
{
  email: string // Valid email format
  name: string // 2-100 characters
  password: string // 12+ chars, complexity required
}
```

**Login Schema:**

```typescript
{
  identifier: string    // Email or username
  password: string      // Any length (validated on backend)
  rememberMe?: boolean  // Extends refresh token to 30 days
}
```

**Password Reset Schema:**

```typescript
{
  token: string // Reset token from email
  password: string // 12+ chars, complexity required
}
```

### Authentication Hooks

**useAuth()** - Primary hook for accessing auth state

```typescript
const { user, isAuthenticated, isLoading } = useAuth()
```

**useLogin()** - Handle login submission

```typescript
const { mutate: login, isPending } = useLogin()
login({ identifier, password, rememberMe })
```

**useRegister()** - Handle registration

```typescript
const { mutate: register, isPending } = useRegister()
register({ email, name, password })
```

**useLogout()** - Logout and cleanup

```typescript
const { mutate: logout, isPending } = useLogout()
logout()
```

**use2FASetup()** - Enroll in 2FA

```typescript
const { data: qrCode, mutate: setupTwoFA } = use2FASetup()
```

**useOAuth()** - OAuth provider flow

```typescript
const handleGoogleClick = useOAuth('google')
```

Additional hooks for magic links, OTP, password recovery (see `/apps/frontend/src/features/auth/hooks/`)

### Protected Routes

**ProtectedRoute** Component:

```typescript
<ProtectedRoute requiredRole="USER">
  <Dashboard />
</ProtectedRoute>
```

Redirects unauthenticated users to login. Optional role-based access control.

**GuestRoute** Component:

```typescript
<GuestRoute>
  <LoginPage />
</GuestRoute>
```

Redirects authenticated users away from auth pages (login, register).

### OAuth Callback Handling

The `/auth/oauth/callback` page:

1. Extracts `accessToken` from URL query parameter
2. Sets token in-memory via TokenService
3. Updates auth store with user data
4. Redirects to dashboard on success
5. Displays error message on failure

**URL Safety**: Access token passed via URL (short-lived, visible in referrer logs)

---

## Error Handling

### Error Codes (Backend & Shared)

| Code                      | Status | Scenario                                               |
| ------------------------- | ------ | ------------------------------------------------------ |
| INVALID_CREDENTIALS       | 401    | Wrong email/password combination                       |
| EMAIL_NOT_VERIFIED        | 403    | Email verification required for feature                |
| EMAIL_ALREADY_REGISTERED  | 409    | Registration email already in use                      |
| INVALID_TOKEN             | 400    | Reset/verification token invalid or expired            |
| TOKEN_EXPIRED             | 401    | JWT or reset token expired                             |
| TOKEN_REVOKED             | 401    | Token was blacklisted (logout)                         |
| SESSION_EXPIRED           | 401    | Session no longer valid                                |
| SESSION_INVALID           | 401    | Session not found or deleted                           |
| OAUTH_ACCOUNT_NOT_FOUND   | 404    | Requested OAuth account doesn't exist                  |
| OAUTH_EMAIL_CONFLICT      | 409    | OAuth email conflicts with existing account            |
| PASSWORD_NOT_SET          | 400    | OAuth user must set password first                     |
| PASSWORD_SETUP_EMAIL_SENT | 200    | Email sent to set password for OAuth account           |
| PASSWORD_ALREADY_SET      | 409    | User already has password (cannot request setup again) |
| USER_NOT_FOUND            | 404    | User ID/email not found                                |
| REFRESH_TOKEN_MISSING     | 400    | Refresh token cookie not present                       |

### Error Response Format

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Frontend Error Handling

Auth API errors caught and mapped to user-friendly messages:

- Network errors → "Unable to connect..."
- Validation errors → Field-specific messages
- Auth errors → Generic "Invalid credentials" (prevents enumeration)
- Server errors → "Something went wrong, try again"

---

## Environment Variables

### Backend Configuration

**OAuth Providers:**

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_CALLBACK_URL=http://localhost:4000/auth/github/callback

FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:4000/auth/facebook/callback
```

**JWT Configuration:**

```bash
JWT_PRIVATE_KEY_PATH=./keys/private.key
JWT_PUBLIC_KEY_PATH=./keys/public.key
JWT_REFRESH_SECRET=your-secret-key
```

**Email Configuration:**

```bash
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@example.com
```

**Frontend URL:**

```bash
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

**API Connection:**

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**OAuth Support:**

```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
```

---

## Security Best Practices

### Token Storage

| Token   | Storage         | Security  | Rationale                                                  |
| ------- | --------------- | --------- | ---------------------------------------------------------- |
| Access  | In-memory       | XSS safe  | Cleared on tab close, not accessible to scripts (with CSP) |
| Refresh | httpOnly Cookie | CSRF safe | Auto-sent with requests, not accessible to JavaScript      |

### Cookie Security

```typescript
res.cookie('refreshToken', token, {
  httpOnly: true, // Not accessible to JavaScript
  secure: isProd, // HTTPS only in production
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
})
```

### Rate Limiting

- **Login/Register**: 5 requests/minute per IP
- **Password Reset**: 3 requests/minute per IP
- **Password Setup (OAuth users)**: 3 requests/minute per user (JWT-based)
- **Email Verification**: No limit (encourage retry)
- **Refresh**: No limit (legitimate use)

**Rationale**: Prevent brute force (login), email enumeration (password reset), abuse (password setup)

### Password Reset

- **Generic Response**: Always returns success, even if email not found
- **Unique Tokens**: Cryptographically secure random tokens
- **Short TTL**: 1-hour expiration limits brute force window
- **Single Use**: Token invalidated after successful reset

### CSRF Protection

- **SameSite Cookies**: Prevents cross-site requests
- **CORS Configuration**: Restrict origins to frontend domain
- **State Validation**: Not applicable (token-based, not session-based)

### Open Redirect Prevention

OAuth callbacks validate:

- Redirect URL matches configured FRONTEND_URL
- No user-controlled redirect parameters accepted

---

## Database Schema

### Core Tables

**users**

```
id (UUID PK)
email (UNIQUE, VARCHAR)
username (UNIQUE, VARCHAR, NULLABLE)
name (VARCHAR)
avatar (VARCHAR, NULLABLE)
passwordHash (VARCHAR, NULLABLE)
emailVerified (BOOLEAN)
twoFactorEnabled (BOOLEAN)
timezone (VARCHAR)
currency (VARCHAR)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)
deletedAt (TIMESTAMP, NULLABLE)
```

**roles**

```
id (UUID PK)
name (ENUM: USER, ADMIN, PREMIUM)
description (TEXT)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)
```

**permissions**

```
id (UUID PK)
name (VARCHAR)
description (TEXT)
resource (VARCHAR)
action (VARCHAR)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)
```

**user_roles** (Junction Table)

```
userId (FK users.id)
roleId (FK roles.id)
assignedAt (TIMESTAMP)
PRIMARY KEY (userId, roleId)
```

**role_permissions** (Junction Table)

```
roleId (FK roles.id)
permissionId (FK permissions.id)
PRIMARY KEY (roleId, permissionId)
```

**sessions**

```
id (UUID PK)
userId (FK users.id)
deviceInfo (JSONB: {userAgent, platform})
ipAddress (VARCHAR)
expiresAt (TIMESTAMP)
lastActiveAt (TIMESTAMP)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)
```

**oauth_accounts**

```
id (UUID PK)
userId (FK users.id)
provider (VARCHAR: google, github, facebook)
providerUserId (VARCHAR)
providerEmail (VARCHAR)
encryptedAccessToken (VARCHAR, NULLABLE)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)
UNIQUE (userId, provider)
```

**email_verification_tokens**

```
id (UUID PK)
userId (FK users.id)
tokenHash (VARCHAR, UNIQUE)
expiresAt (TIMESTAMP)
usedAt (TIMESTAMP, NULLABLE)
createdAt (TIMESTAMP)
```

**password_reset_tokens**

```
id (UUID PK)
userId (FK users.id)
tokenHash (VARCHAR, UNIQUE)
expiresAt (TIMESTAMP)
usedAt (TIMESTAMP, NULLABLE)
createdAt (TIMESTAMP)
```

---

## Implementation Status

### Production Ready

- Email/Password authentication (register, login, logout)
- Password reset with email verification
- OAuth integration (Google, GitHub, Facebook)
- Session management with device tracking
- JWT token generation and validation
- Token blacklisting on logout
- RBAC infrastructure (roles, permissions)
- Email verification flow

### Partial/Infrastructure Ready

- 2FA (TOTP backend ready, UI pending)
- Permission enforcement (RBAC structure ready, endpoint guards not yet implemented)

### Planned

- Magic links (API endpoints stubbed)
- SMS OTP (API endpoints stubbed)
- Passwordless authentication
- Account recovery flows

---

## Related Documents

- **[System Architecture](./system-architecture.md)** - Complete system design including auth module
- **[Code Standards](./code-standards.md)** - Coding patterns and project conventions
- **[Project Roadmap](./project-roadmap.md)** - Feature timeline and development phases
- **[Error Handling Guide](./code-standards.md#error-handling)** - Exception patterns (if exists)
