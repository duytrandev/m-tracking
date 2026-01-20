# Phase 3: Utils Module

## Context

- [Code Standards - OAuth Token Encryption](../../docs/code-standards.md)
- [System Architecture - ADR-007](../../docs/system-architecture.md) - AES-256-GCM encryption
- Existing: `auth/utils/encryption.util.ts` (needs relocation)

## Overview

| Property | Value |
|----------|-------|
| Priority | P2 - Required for cross-module utilities |
| Status | pending |
| Effort | 1.5h |

Consolidate backend-specific utilities into shared module. Move encryption util from auth, add date/hash helpers.

## Key Insights

1. **EncryptionUtil exists**: Located at `auth/utils/encryption.util.ts`, used for OAuth tokens
2. **Libs/utils exists**: `libs/utils/src/index.ts` has frontend/cross-platform utils
3. **Backend-specific**: These utils are NestJS/Node specific, not suitable for libs
4. **ADR-007**: OAuth tokens must use AES-256-GCM encryption

## Requirements

### Functional
- F1: Move EncryptionUtil to shared (used by OAuth, future bank tokens)
- F2: Date utilities (ISO conversion, timezone handling)
- F3: Hash utilities (SHA-256 for token fingerprints)
- F4: Slug generation for unique identifiers

### Non-Functional
- NF1: Pure functions (no side effects)
- NF2: Full TypeScript types
- NF3: No external dependencies beyond Node.js crypto

## Architecture

```
shared/utils/
├── encryption.util.ts  # AES-256-GCM encrypt/decrypt
├── date.util.ts        # Date formatting, timezone
├── hash.util.ts        # SHA-256, token fingerprints
├── slug.util.ts        # URL-safe unique IDs
└── index.ts            # Barrel export
```

## Related Code Files

### Files to Create
| File | Purpose | Lines |
|------|---------|-------|
| `shared/utils/encryption.util.ts` | AES-256-GCM crypto (move from auth) | ~90 |
| `shared/utils/date.util.ts` | Date utilities | ~50 |
| `shared/utils/hash.util.ts` | Hashing utilities | ~40 |
| `shared/utils/slug.util.ts` | Slug generation | ~30 |
| `shared/utils/index.ts` | Barrel export | ~10 |

### Files to Modify
| File | Change |
|------|--------|
| `auth/utils/encryption.util.ts` | Re-export from shared (backward compat) |
| `auth/services/oauth.service.ts` | Update import path |
| `.env.example` | Document OAUTH_ENCRYPTION_KEY requirement |

## Implementation Steps

### Step 1: Move EncryptionUtil

The existing `auth/utils/encryption.util.ts` is well-implemented. Move to shared:

```typescript
// shared/utils/encryption.util.ts
// Copy entire file from auth/utils/encryption.util.ts
// (88 lines, under 200 limit)
```

### Step 2: Create Date Utilities

```typescript
// shared/utils/date.util.ts
/**
 * Date utilities for backend operations
 */

/**
 * Convert Date to ISO string in UTC
 */
export function toISOString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Get start of day in UTC
 */
export function startOfDayUTC(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day in UTC
 */
export function endOfDayUTC(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if date is within range
 */
export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/**
 * Get seconds until a date (for TTL calculations)
 */
export function secondsUntil(futureDate: Date): number {
  const now = Date.now();
  const future = futureDate.getTime();
  return Math.max(0, Math.floor((future - now) / 1000));
}
```

### Step 3: Create Hash Utilities

```typescript
// shared/utils/hash.util.ts
import * as crypto from 'crypto';

/**
 * Hash utilities for token fingerprinting and data integrity
 */

/**
 * Generate SHA-256 hash of a string
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate token fingerprint for blacklisting
 * Uses first 16 chars of SHA-256 hash
 */
export function tokenFingerprint(token: string): string {
  return sha256(token).substring(0, 16);
}

/**
 * Generate secure random hex string
 */
export function randomHex(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate secure random base64url string
 */
export function randomBase64Url(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
```

### Step 4: Create Slug Utilities

```typescript
// shared/utils/slug.util.ts
import * as crypto from 'crypto';

/**
 * Slug utilities for URL-safe identifiers
 */

/**
 * Generate a URL-safe unique identifier
 * Format: timestamp-random (e.g., "abc123de-f456")
 */
export function generateSlug(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  const slug = `${timestamp}-${random}`;
  return prefix ? `${prefix}-${slug}` : slug;
}

/**
 * Convert text to kebab-case slug
 */
export function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate transaction reference
 * Format: TXN-YYYYMMDD-XXXXX
 */
export function generateTransactionRef(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TXN-${date}-${random}`;
}
```

### Step 5: Create Barrel Export

```typescript
// shared/utils/index.ts
export * from './encryption.util';
export * from './date.util';
export * from './hash.util';
export * from './slug.util';
```

### Step 6: Create Backward Compatibility Re-export

```typescript
// auth/utils/encryption.util.ts (replace content)
/**
 * @deprecated Import from '@shared/utils' instead
 */
export { EncryptionUtil } from '../../shared/utils/encryption.util';
```

### Step 7: Update OAuth Service Import

```typescript
// auth/services/oauth.service.ts
// Change:
// import { EncryptionUtil } from '../utils/encryption.util';
// To:
import { EncryptionUtil } from '../../shared/utils';
```

### Step 8: Update SharedModule Index

```typescript
// shared/index.ts (create)
export * from './shared.module';
export * from './redis';
export * from './logger';
export * from './queue';
export * from './utils';
```

## Todo List

- [ ] Copy `auth/utils/encryption.util.ts` to `shared/utils/encryption.util.ts`
- [ ] Create `shared/utils/date.util.ts`
- [ ] Create `shared/utils/hash.util.ts`
- [ ] Create `shared/utils/slug.util.ts`
- [ ] Create `shared/utils/index.ts`
- [ ] Update `auth/utils/encryption.util.ts` to re-export
- [ ] Update `auth/services/oauth.service.ts` import
- [ ] Create `shared/index.ts` barrel export
- [ ] Write unit tests for all utilities
- [ ] Update `.env.example` with encryption key docs

## Success Criteria

- [ ] All utils importable from `shared/utils`
- [ ] Backward compatibility maintained for auth module
- [ ] EncryptionUtil works exactly as before
- [ ] New date/hash/slug utils available
- [ ] Unit tests pass with >90% coverage
- [ ] No circular dependencies

## Testing Strategy

### Unit Tests

```typescript
describe('EncryptionUtil', () => {
  it('should encrypt and decrypt string')
  it('should throw on invalid key length')
  it('should generate valid encryption key')
});

describe('DateUtil', () => {
  it('should convert to ISO string')
  it('should get start/end of day UTC')
  it('should calculate seconds until date')
});

describe('HashUtil', () => {
  it('should generate consistent SHA-256 hash')
  it('should generate token fingerprint')
  it('should generate random hex string')
});

describe('SlugUtil', () => {
  it('should generate unique slugs')
  it('should convert text to kebab-case')
  it('should generate transaction reference')
});
```

## Security Considerations

1. **Encryption Key**: OAUTH_ENCRYPTION_KEY must be 64 hex chars (32 bytes)
2. **Key Rotation**: Document key rotation procedure (re-encrypt all tokens)
3. **Randomness**: Use `crypto.randomBytes` not `Math.random`
4. **Hash Collisions**: Token fingerprints are 16 chars (64 bits) - sufficient for blacklist

## Environment Variables

```bash
# .env.example additions

# OAuth Token Encryption (Required for OAuth features)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
OAUTH_ENCRYPTION_KEY=your_64_hex_character_key_here
```

## Final SharedModule Structure

After Phase 3 completion:

```typescript
// shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis/redis.service';
import { LoggerService } from './logger/logger.service';
import { QueueService } from './queue/queue.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, LoggerService, QueueService],
  exports: [RedisService, LoggerService, QueueService],
})
export class SharedModule {}
```

Note: Utils are pure functions, not injectable services. Import directly:
```typescript
import { EncryptionUtil, sha256, generateSlug } from '../shared/utils';
```

## Completion Checklist

After all three phases:

- [ ] Logger service with Winston (JSON/Pretty)
- [ ] Queue service with BullMQ (async jobs)
- [ ] Utils module with encryption, date, hash, slug
- [ ] SharedModule exports all services
- [ ] All unit tests passing
- [ ] No circular dependencies
- [ ] Documentation updated

---

**Implementation Complete**: Return to [Main Plan](./plan.md) for summary.
