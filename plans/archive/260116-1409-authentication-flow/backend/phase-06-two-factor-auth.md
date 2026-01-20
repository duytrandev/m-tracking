# Phase 6: Two-Factor Authentication (2FA)

**Duration:** Week 4-5 | **Priority:** High | **Status:** ⏳ Pending
**Dependencies:** Phase 3 (JWT Session Management)

## Overview
Implement TOTP-based 2FA with QR code enrollment, verification, and backup codes.

## Context Links
- [2FA TOTP Research Report](../../plans/reports/researcher-2fa-totp-260116-1409.md)

## Key Implementation Points

### TOTP Implementation
- Library: `otplib` (NOT speakeasy - unmaintained)
- Algorithm: SHA-256 (SHA-1 minimum, SHA-512 alternative)
- Time step: 30 seconds
- Code length: 6 digits
- Clock skew: ±1 time window (30s tolerance)

### Security
- Secret: 32-character base32 string
- Encryption: AES-256-GCM at rest
- Rate limiting: 5 attempts → 15-minute lockout
- Backup codes: 10 single-use recovery codes

### User Flow
1. User requests 2FA enrollment
2. Server generates secret, returns QR code
3. User scans QR with authenticator app
4. User submits verification code
5. Server validates and enables 2FA
6. Server generates 10 backup codes

## Implementation Files

**Create:**
- `services/two-factor.service.ts`
- `dto/enroll-2fa.dto.ts`
- `dto/verify-2fa.dto.ts`
- `dto/validate-2fa.dto.ts`
- `guards/two-factor.guard.ts`

## Todo List
- [ ] Install otplib
- [ ] Install qrcode for QR generation
- [ ] Create TwoFactorService
- [ ] Implement secret generation
- [ ] Implement QR code generation (otpauth:// URL)
- [ ] Implement TOTP verification
- [ ] Implement backup code generation
- [ ] Implement backup code validation
- [ ] Create 2FA guards for protected routes
- [ ] Update login flow to require 2FA if enabled
- [ ] Add 2FA endpoints to AuthController
- [ ] Test enrollment flow
- [ ] Test verification flow
- [ ] Test backup codes
- [ ] Test rate limiting
- [ ] Write unit tests

## Success Criteria
- ✅ Users can enroll in 2FA
- ✅ QR codes generated correctly
- ✅ TOTP codes validated with ±30s tolerance
- ✅ Login requires 2FA when enabled
- ✅ Backup codes work for recovery
- ✅ Rate limiting prevents brute force
- ✅ 2FA secrets encrypted at rest
- ✅ All tests passing
