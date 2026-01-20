# Phase 2: Centralized Type Definitions

## Context Links
- [Project Structure Review](/docs/project-structure-review.md#priority-2-centralized-type-definitions)
- [Code Standards](/docs/code-standards.md#type-definitions)
- [libs/types Package](/libs/types/package.json)

## Overview

| Item | Value |
|------|-------|
| Priority | P1 - Critical |
| Status | Pending |
| Effort | 2 hours |
| Dependencies | Phase 1 (store structure) |

Create centralized type definitions in frontend `types/` directory. Current state: types scattered in `features/*/types/`. Need single source of truth for API types, entity types, and globals.

## Key Insights

1. **Existing types** in `features/auth/types/` are well-defined
2. **libs/types** package exists but is mostly empty
3. **Duplication risk**: User type defined in auth-store.ts and potentially backend
4. **Pattern**: Domain types in `types/entities/`, API types in `types/api/`

## Requirements

### Functional
- F1: Create `types/` directory with organized subdirectories
- F2: Centralize API request/response types
- F3: Create entity types (User, Transaction, Account, Budget)
- F4: Set up barrel exports for clean imports
- F5: Add global type declarations (env, globals)

### Non-Functional
- NF1: Types should be reusable across features
- NF2: Maintain backward compatibility with existing imports
- NF3: Follow interface-over-type convention for objects

## Architecture

### Type Organization
```
apps/frontend/src/
├── types/
│   ├── index.ts              # Main barrel export
│   ├── api/
│   │   ├── index.ts          # API types barrel
│   │   ├── auth.ts           # Auth API types
│   │   ├── profile.ts        # Profile API types
│   │   ├── common.ts         # Shared API patterns
│   │   └── transaction.ts    # Transaction API types (future)
│   ├── entities/
│   │   ├── index.ts          # Entity barrel
│   │   ├── user.ts           # User entity
│   │   ├── session.ts        # Session entity
│   │   ├── transaction.ts    # Transaction entity (future)
│   │   ├── account.ts        # Account entity (future)
│   │   └── budget.ts         # Budget entity (future)
│   ├── env.d.ts              # Environment variable types
│   └── globals.d.ts          # Global declarations
```

### Type Naming Conventions
```typescript
// Entity types: PascalCase noun
interface User { }
interface Transaction { }

// API types: PascalCase with Request/Response suffix
interface LoginRequest { }
interface LoginResponse { }

// Enum types: PascalCase with explicit values
enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}
```

## Related Code Files

### Files to Create
- `apps/frontend/src/types/index.ts`
- `apps/frontend/src/types/api/index.ts`
- `apps/frontend/src/types/api/auth.ts`
- `apps/frontend/src/types/api/profile.ts`
- `apps/frontend/src/types/api/common.ts`
- `apps/frontend/src/types/entities/index.ts`
- `apps/frontend/src/types/entities/user.ts`
- `apps/frontend/src/types/entities/session.ts`
- `apps/frontend/src/types/env.d.ts`
- `apps/frontend/src/types/globals.d.ts`

### Files to Modify
- `apps/frontend/src/features/auth/store/auth-store.ts` - Use centralized User type
- `apps/frontend/src/features/auth/types/auth-types.ts` - Re-export from central
- `apps/frontend/tsconfig.json` - Add types path alias

## Implementation Steps

### Step 1: Create types directory structure (15 min)

```bash
mkdir -p apps/frontend/src/types/{api,entities}
```

### Step 2: Create entity types (30 min)

2.1 Create `types/entities/user.ts`:
```typescript
/**
 * User entity representing authenticated user
 */
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  roles: string[]
  createdAt?: string
  updatedAt?: string
}

/**
 * User profile with extended information
 */
export interface UserProfile extends User {
  phone?: string
  language: string
  currency: string
  timezone: string
  notificationPreferences: NotificationPreferences
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  email: boolean
  push: boolean
  budgetAlerts: boolean
  transactionAlerts: boolean
  weeklyReport: boolean
}

/**
 * User role enum
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PREMIUM = 'premium',
}
```

2.2 Create `types/entities/session.ts`:
```typescript
/**
 * User session representing active login
 */
export interface Session {
  id: string
  userId: string
  userAgent: string
  ipAddress: string
  lastActive: string
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}
```

2.3 Create `types/entities/index.ts`:
```typescript
export * from './user'
export * from './session'

// Future entities (uncomment as implemented)
// export * from './transaction'
// export * from './account'
// export * from './budget'
```

### Step 3: Create API types (30 min)

3.1 Create `types/api/common.ts`:
```typescript
/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

/**
 * API error response
 */
export interface ApiError {
  statusCode: number
  message: string
  error?: string
  timestamp: string
  path?: string
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

/**
 * Common query parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

3.2 Create `types/api/auth.ts`:
```typescript
import type { User } from '../entities/user'

// ============ Request Types ============

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface Verify2FARequest {
  email: string
  code: string
}

export interface Setup2FARequest {
  password: string
}

export interface MagicLinkRequest {
  email: string
}

export interface OtpRequest {
  email: string
}

export interface OtpVerifyRequest {
  email: string
  code: string
}

// ============ Response Types ============

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
  requires2FA?: boolean
}

export interface RegisterResponse {
  user: User
  message: string
}

export interface Setup2FAResponse {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface OAuthCallbackResponse {
  user: User
  tokens: AuthTokens
  isNewUser: boolean
}

// ============ OAuth Types ============

export type OAuthProvider = 'google' | 'github' | 'facebook'

export interface OAuthUrlResponse {
  url: string
  provider: OAuthProvider
}
```

3.3 Create `types/api/profile.ts`:
```typescript
import type { Session } from '../entities/session'
import type { UserProfile } from '../entities/user'

// ============ Request Types ============

export interface UpdateProfileRequest {
  name?: string
  phone?: string
  language?: string
  currency?: string
  timezone?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UpdateAvatarRequest {
  file: File
}

// ============ Response Types ============

export interface ProfileResponse {
  profile: UserProfile
}

export interface SessionsResponse {
  sessions: Session[]
}

export interface AvatarUploadResponse {
  avatarUrl: string
}
```

3.4 Create `types/api/index.ts`:
```typescript
export * from './common'
export * from './auth'
export * from './profile'

// Future API types (uncomment as implemented)
// export * from './transaction'
// export * from './account'
// export * from './budget'
```

### Step 4: Create global type declarations (15 min)

4.1 Create `types/env.d.ts`:
```typescript
/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string
    NEXT_PUBLIC_APP_URL: string
    NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string
    NEXT_PUBLIC_GITHUB_CLIENT_ID?: string
    NEXT_PUBLIC_FACEBOOK_CLIENT_ID?: string
    NEXT_PUBLIC_ENABLE_MSW?: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
```

4.2 Create `types/globals.d.ts`:
```typescript
// Extend Window interface for global utilities
declare global {
  interface Window {
    // MSW worker for API mocking
    __msw_worker?: import('msw/browser').SetupWorker
  }
}

// Module declarations for assets
declare module '*.svg' {
  import type { FC, SVGProps } from 'react'
  const content: FC<SVGProps<SVGElement>>
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

export {}
```

### Step 5: Create main barrel export (10 min)

5.1 Create `types/index.ts`:
```typescript
// ============ Entity Types ============
export type {
  User,
  UserProfile,
  NotificationPreferences,
  Session,
} from './entities'

export { UserRole } from './entities'

// ============ API Types ============
// Common
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams,
} from './api'

// Auth
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  Verify2FARequest,
  Setup2FARequest,
  Setup2FAResponse,
  MagicLinkRequest,
  OtpRequest,
  OtpVerifyRequest,
  AuthTokens,
  OAuthProvider,
  OAuthUrlResponse,
  OAuthCallbackResponse,
} from './api'

// Profile
export type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateAvatarRequest,
  ProfileResponse,
  SessionsResponse,
  AvatarUploadResponse,
} from './api'
```

### Step 6: Update existing files to use centralized types (20 min)

6.1 Update `features/auth/store/auth-store.ts`:
```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'  // Updated import

// Remove local User interface, use centralized one

export interface AuthState {
  user: User | null
  // ... rest unchanged
}
```

6.2 Update `features/auth/types/auth-types.ts` to re-export:
```typescript
// Re-export from centralized types for backward compatibility
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  Verify2FARequest,
  Setup2FARequest,
  Setup2FAResponse,
  MagicLinkRequest,
  OtpRequest,
  OtpVerifyRequest,
  AuthTokens,
} from '@/types'

// Keep feature-specific types here if any
```

6.3 Update tsconfig.json path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/types": ["./src/types"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

## Todo List

- [ ] Create `types/entities/user.ts`
- [ ] Create `types/entities/session.ts`
- [ ] Create `types/entities/index.ts`
- [ ] Create `types/api/common.ts`
- [ ] Create `types/api/auth.ts`
- [ ] Create `types/api/profile.ts`
- [ ] Create `types/api/index.ts`
- [ ] Create `types/env.d.ts`
- [ ] Create `types/globals.d.ts`
- [ ] Create `types/index.ts`
- [ ] Update auth-store.ts to use centralized User type
- [ ] Update features/auth/types/auth-types.ts to re-export
- [ ] Update tsconfig.json paths (if needed)
- [ ] Run type check
- [ ] Run build

## Success Criteria

1. All type definitions in `types/` directory
2. Barrel exports provide clean import paths
3. Existing code updated to use centralized types
4. No duplicate type definitions
5. TypeScript strict mode passes
6. Build succeeds

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing imports | Re-export from old locations initially |
| Type mismatch with backend | Verify against backend DTOs |
| Missing type properties | Audit all usages before migration |

## Security Considerations

- No sensitive data in type definitions
- Environment variables properly typed
- API response types don't expose internal details

## Next Steps

After completion:
1. Proceed to Phase 3: Backend Enhancements
2. Share types with libs/types package (consider)
3. Generate types from OpenAPI spec (future)
