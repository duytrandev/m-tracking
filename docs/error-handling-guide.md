# Error Handling Guide

**Last Updated**: February 3, 2026 | **Version**: 1.0

---

## Overview

The M-Tracking project uses a centralized error handling system with:

- Type-safe error codes shared between backend and frontend
- Factory functions for consistent exception creation
- Global error filter for uniform error responses
- Frontend-specific error messages with recovery actions

---

## Error Code System

### Shared Error Codes

All authentication errors are defined in `libs/shared/src/auth/auth-error-codes.ts`:

```typescript
export const AuthErrorCode = {
  // Login & Credentials
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

  // Token Management
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',

  // Session Management
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',

  // Registration
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',

  // OAuth Flows
  OAUTH_ACCOUNT_NOT_FOUND: 'OAUTH_ACCOUNT_NOT_FOUND',
  OAUTH_EMAIL_CONFLICT: 'OAUTH_EMAIL_CONFLICT',
  OAUTH_ALREADY_LINKED: 'OAUTH_ALREADY_LINKED',
  OAUTH_UNLINK_BLOCKED: 'OAUTH_UNLINK_BLOCKED',
  OAUTH_EMAIL_REQUIRED: 'OAUTH_EMAIL_REQUIRED',
  OAUTH_UNVERIFIED_EMAIL_CONFLICT: 'OAUTH_UNVERIFIED_EMAIL_CONFLICT',

  // Password Management
  PASSWORD_NOT_SET: 'PASSWORD_NOT_SET',
  PASSWORD_SETUP_EMAIL_SENT: 'PASSWORD_SETUP_EMAIL_SENT',
  PASSWORD_ALREADY_SET: 'PASSWORD_ALREADY_SET',

  // Rate Limiting & Locks
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  RATE_LIMITED: 'RATE_LIMITED',

  // Service Status
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',
}
```

Error codes are **single source of truth** - same codes used by both backend and frontend.

---

## Backend Exception Classes

### AuthException

Standard exception for authentication failures:

```typescript
export class AuthException extends HttpException {
  constructor(
    message: string,
    code: AuthErrorCodeType,
    status: HttpStatus = HttpStatus.UNAUTHORIZED
  )
}

// Example
throw new AuthException(
  'Invalid email or password',
  AuthErrorCode.INVALID_CREDENTIALS,
  HttpStatus.UNAUTHORIZED
)
```

**Response Format:**

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "code": "INVALID_CREDENTIALS",
  "error": "UNAUTHORIZED",
  "timestamp": "2026-02-03T21:10:00Z",
  "path": "/auth/login"
}
```

### AuthExceptionWithRetry

Exception for rate-limited scenarios with retry information:

```typescript
export class AuthExceptionWithRetry extends HttpException {
  constructor(
    message: string,
    code: AuthErrorCodeType,
    status: HttpStatus,
    retryAfterSeconds: number
  )
}

// Example - Account locked for 60 seconds
throw new AuthExceptionWithRetry(
  'Account temporarily locked due to too many failed attempts',
  AuthErrorCode.ACCOUNT_LOCKED,
  HttpStatus.TOO_MANY_REQUESTS,
  60 // Client should wait 60 seconds
)
```

**Response Format:**

```json
{
  "statusCode": 429,
  "message": "Account temporarily locked due to too many failed attempts",
  "code": "ACCOUNT_LOCKED",
  "error": "TOO_MANY_REQUESTS",
  "retryAfter": 60,
  "timestamp": "2026-02-03T21:10:00Z",
  "path": "/auth/login"
}
```

---

## Exception Factory Functions

### Complete Factory API

Use `AuthExceptions` factory object instead of manually creating exceptions. This ensures consistency and proper HTTP status codes.

```typescript
import { AuthExceptions } from '@m-tracking/shared'

// Login & Credentials
throw AuthExceptions.invalidCredentials() // 401
throw AuthExceptions.emailNotVerified() // 401

// Token Management
throw AuthExceptions.invalidToken() // 404
throw AuthExceptions.tokenExpired() // 401
throw AuthExceptions.tokenRevoked() // 401
throw AuthExceptions.refreshTokenMissing() // 401

// Session Management
throw AuthExceptions.sessionExpired() // 401
throw AuthExceptions.sessionInvalid() // 401

// Registration
throw AuthExceptions.emailAlreadyRegistered() // 409

// OAuth Flows
throw AuthExceptions.oauthAccountNotFound() // 401
throw AuthExceptions.oauthEmailConflict(email) // 409
throw AuthExceptions.oauthAlreadyLinked(provider) // 409
throw AuthExceptions.oauthUnlinkBlocked() // 409
throw AuthExceptions.oauthEmailRequired() // 401
throw AuthExceptions.oauthUnverifiedEmailConflict() // 409

// Password Management
throw AuthExceptions.passwordNotSet() // 401
throw AuthExceptions.passwordAlreadySet() // 409

// Rate Limiting & Locks
throw AuthExceptions.accountLocked(60) // 429 (60-second retry)
throw AuthExceptions.rateLimited(30) // 429 (30-second retry)

// Service Status
throw AuthExceptions.serviceUnavailable() // 503
```

### Usage Examples

**OAuth Service:**

```typescript
// services/oauth.service.ts
async linkOAuthProvider(userId: string, provider: string, profile: OAuthProfile) {
  // Check if email is required
  if (!profile.email) {
    throw AuthExceptions.oauthEmailRequired()
  }

  // Check for email conflicts
  const existingUser = await this.userRepository.findByEmail(profile.email)
  if (existingUser && existingUser.id !== userId) {
    throw AuthExceptions.oauthEmailConflict(profile.email)
  }

  // Check if provider already linked
  const existingLink = await this.oauthRepository.findByUserAndProvider(
    userId,
    provider
  )
  if (existingLink) {
    throw AuthExceptions.oauthAlreadyLinked(provider)
  }

  // Proceed with linking...
}
```

**Account Lockout:**

```typescript
// services/auth.service.ts
async login(email: string, password: string) {
  const user = await this.userRepository.findByEmail(email)

  if (!user) {
    throw AuthExceptions.invalidCredentials()
  }

  // Check for account lockout
  if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockoutDurationSeconds = 60
    throw AuthExceptions.accountLocked(lockoutDurationSeconds)
  }

  const passwordMatch = await this.cryptoService.verifyPassword(
    password,
    user.passwordHash
  )

  if (!passwordMatch) {
    user.failedLoginAttempts++
    await this.userRepository.save(user)
    throw AuthExceptions.invalidCredentials()
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0
  user.lastLoginAt = new Date()
  await this.userRepository.save(user)

  return this.generateTokens(user)
}
```

---

## Error Messages

### Frontend + Backend Messages

Error messages are configured in `libs/shared/src/auth/auth-error-messages.ts` with both backend (logging) and frontend (UI) configurations:

```typescript
export interface AuthErrorMessage {
  backend: string // For server logging and API responses
  frontend: FrontendErrorConfig
}

export interface FrontendErrorConfig {
  title: string // Main error title
  hints: {
    email?: string // Field-specific hint
    password?: string // Field-specific hint
  }
  recovery?: {
    label: string // Button label
    href: string // Recovery action URL
  }
}
```

**Example Configuration:**

```typescript
[AuthErrorCode.INVALID_CREDENTIALS]: {
  backend: 'Invalid email or password',
  frontend: {
    title: 'Login failed',
    hints: {
      email: 'Double-check this email address is correct',
      password: 'Make sure your password is entered correctly',
    },
    recovery: {
      label: 'Forgot password?',
      href: '/auth/forgot-password',
    },
  },
}
```

### Using Error Messages

**Backend (Logging):**

```typescript
import { getBackendErrorMessage, AuthErrorCode } from '@m-tracking/shared'

const message = getBackendErrorMessage(AuthErrorCode.INVALID_CREDENTIALS)
console.log(message) // "Invalid email or password"
```

**Frontend (UI Rendering):**

```typescript
import { getFrontendErrorConfig, AuthErrorCode } from '@m-tracking/shared'

const config = getFrontendErrorConfig(AuthErrorCode.INVALID_CREDENTIALS)
// {
//   title: 'Login failed',
//   hints: { email: '...', password: '...' },
//   recovery: { label: 'Forgot password?', href: '/auth/forgot-password' }
// }
```

---

## Global Error Filter

### HttpExceptionFilter

All HTTP exceptions are caught and formatted by the global `HttpExceptionFilter`:

**Location:** `services/backend/src/common/filters/http-exception.filter.ts`

**Features:**

- Extracts error code, message, error type, and retryAfter fields
- Filters stack traces in production (`NODE_ENV === 'production'`)
- Logs auth failures at WARN level for security monitoring
- Sends 5xx errors to Sentry for error tracking
- Formats consistent error response with timestamp and path

**Error Logging:**

```typescript
// Auth failures (401, 403) - WARN level
Auth failure: INVALID_CREDENTIALS - POST /auth/login

// Other errors - ERROR level with stack trace (dev only)
POST /api/transactions/create 500
[stack trace in development]
```

**Sentry Integration:**

- 5xx errors automatically captured
- Includes HTTP context (method, URL, status code, user agent)
- Tagged with HTTP method and status for filtering

---

## Response Format

### Standard Error Response

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "code": "INVALID_CREDENTIALS",
  "error": "UNAUTHORIZED",
  "timestamp": "2026-02-03T21:10:00Z",
  "path": "/auth/login"
}
```

### Rate-Limited Response (with retryAfter)

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please slow down.",
  "code": "RATE_LIMITED",
  "error": "TOO_MANY_REQUESTS",
  "retryAfter": 30,
  "timestamp": "2026-02-03T21:10:00Z",
  "path": "/auth/login"
}
```

### Server Error Response

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-02-03T21:10:00Z",
  "path": "/api/transactions"
}
```

---

## Non-Auth Exceptions

For non-authentication errors, create typed exceptions extending `HttpException`:

```typescript
// Define custom exception
export class UserNotFoundException extends HttpException {
  constructor(userId: string) {
    super(`User ${userId} not found`, HttpStatus.NOT_FOUND)
  }
}

// Throw in service
async getUser(id: string): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id } })
  if (!user) throw new UserNotFoundException(id)
  return user
}

// Global filter formats response automatically
// Response:
// {
//   "statusCode": 404,
//   "message": "User 123 not found",
//   "timestamp": "2026-02-03T21:10:00Z",
//   "path": "/api/users/123"
// }
```

---

## Retry Queue System

### Overview

Transient network failures (timeouts, temporary service unavailability) are automatically retried with exponential backoff. The retry queue prevents memory exhaustion during network storms by:

- Limiting queue size to 50 requests
- Setting max 30-second wait time per request
- Checking request age before processing
- Clearing stale requests

### Retryable Error Codes

Only specific errors trigger automatic retry:

| Error Code          | HTTP Status | Cause                    | Retry Behavior        |
| ------------------- | ----------- | ------------------------ | --------------------- |
| SERVICE_UNAVAILABLE | 503         | Backend temporarily down | Yes (3 attempts)      |
| RATE_LIMITED        | 429         | Too many requests        | Yes (3 attempts)      |
| All other errors    | -           | -                        | No (fail immediately) |

### Retry Behavior

```
Attempt 1: Immediate
    ↓
Attempt 2: Wait 1 second + jitter
    ↓
Attempt 3: Wait 2 seconds + jitter
    ↓
Attempt 4: Wait 4 seconds + jitter
    ↓
Give up: Return error to caller
```

**Jitter**: Random 0-100ms added to prevent "thundering herd" problem

**Queue Limits**:

- Max queue size: 50 pending requests
- Max request age: 30 seconds
- If queue is full: Throw "Request queue full" error immediately

### Using Retry Queue

The retry queue is transparent for most use cases. API errors automatically route through it:

```typescript
import { showErrorToast } from '@/lib/toast-error-handler'

try {
  await authApi.login(email, password)
} catch (error) {
  // If error is retryable, it's automatically retried
  // If it fails after 3 attempts, error is shown here
  showErrorToast(error)
}
```

### Retry Queue API Reference

**Location**: `apps/frontend/src/lib/retry-queue.ts`

#### `isRetryableError(errorCode?: string): boolean`

Check if error should trigger automatic retry.

```typescript
import { isRetryableError } from '@/lib/retry-queue'

if (isRetryableError(error.code)) {
  // Will be automatically retried
}
```

**Returns**: `true` if error code is in RETRYABLE_ERROR_CODES list

---

#### `retryQueue.enqueue<T>(retryFn: () => Promise<T>): Promise<T>`

Manually queue a request for retry handling.

```typescript
import { retryQueue } from '@/lib/retry-queue'

const result = await retryQueue.enqueue(async () => {
  return fetch('/api/data').then(r => r.json())
})
```

**Throws**:

- `Error('Request queue full...')` if queue has 50+ items
- `Error('Request timed out in queue')` if request waits > 30 seconds

**Max retries**: 3 attempts with exponential backoff

---

#### `retryQueue.clear(): void`

Clear all pending requests and timeouts. Call on logout or session expiration.

```typescript
import { retryQueue } from '@/lib/retry-queue'

onLogout(() => {
  retryQueue.clear() // Prevents orphaned requests
})
```

**Use cases**:

- User logout (cancel all in-flight requests)
- Session expiration
- App cleanup

---

#### `retryQueue.size: number`

Get current number of pending requests in queue.

```typescript
console.log(`Pending: ${retryQueue.size}`) // For monitoring/debugging
```

---

## Frontend Error Handling

### Reading Error Codes

The API always returns an error code in responses. Use this to handle errors type-safely:

```typescript
import { AuthErrorCode, createAuthFailure } from '@m-tracking/shared'

try {
  await authApi.login(email, password)
} catch (error) {
  const code = error.response?.data?.code // 'INVALID_CREDENTIALS'
  const failure = createAuthFailure(code, error.message)

  // Handle specific errors
  if (code === AuthErrorCode.INVALID_CREDENTIALS) {
    // Show hints for email and password fields
    setEmailError(failure.fieldHints.email)
    setPasswordError(failure.fieldHints.password)
  }

  if (code === AuthErrorCode.ACCOUNT_LOCKED) {
    // Show retry-after countdown
    const retryAfter = error.response?.data?.retryAfter
    showToast(`Account locked. Try again in ${retryAfter}s`)
  }
}
```

### Displaying Recovery Actions

```typescript
const failure = createAuthFailure(code, 'Failed')

if (failure.recoveryAction) {
  // Show recovery action button
  <Button href={failure.recoveryAction.href}>
    {failure.recoveryAction.label}
  </Button>
}
```

### Retry Countdown Display

When error includes `retryAfter` field (rate-limited, account locked), show countdown:

```typescript
import { showErrorToast } from '@/lib/toast-error-handler'
import { isRetryableError } from '@/lib/retry-queue'

try {
  await authApi.login(email, password)
} catch (error) {
  // Handler automatically includes retry countdown if applicable
  showErrorToast(error, 'Login failed')
  // Toast: "Too many requests. Try again in 1 minute."
}
```

**Automatic behavior**:

- Error is checked if retryable via `isRetryableError()`
- If `retryAfter` is present, display: `"Try again in X minute(s)"`
- Countdown calculated from seconds to minutes (rounded up)

---

## Best Practices

1. **Always use factory functions** - Prefer `AuthExceptions.invalidCredentials()` over manually creating exceptions
2. **Don't catch and re-throw auth exceptions** - Let the global filter handle them
3. **Use error codes in frontend** - Check `error.response?.data?.code` for type-safe error handling
4. **Include retry-after in UI** - Show countdown for rate-limited/locked scenarios
5. **Log without sensitive data** - Error messages should never include passwords or tokens
6. **Consistent naming** - Use AuthErrorCode constants, not string literals
7. **Frontend recovery links** - Always provide context-appropriate recovery paths

---

## Related Files

- `libs/shared/src/auth/auth-error-codes.ts` - Error code definitions
- `libs/shared/src/auth/auth-error-messages.ts` - Error messages and frontend config
- `services/backend/src/common/exceptions/auth.exception.ts` - Exception classes and factories
- `services/backend/src/common/filters/http-exception.filter.ts` - Global error filter
- `docs/code-standards.md` - General backend patterns
