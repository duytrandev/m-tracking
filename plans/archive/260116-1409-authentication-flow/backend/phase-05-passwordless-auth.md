# Phase 5: Passwordless Authentication

**Duration:** Week 3-4 | **Priority:** Medium | **Status:** ⏳ Pending
**Dependencies:** Phase 2 (Email/Password Auth)

## Overview
Implement magic link (email) and SMS OTP passwordless authentication methods.

## Context Links
- [Passwordless Research Report](../../plans/reports/researcher-passwordless-260116-1409.md)

## Key Implementation Points

### Magic Link
- 256-bit token entropy (crypto.randomBytes(32))
- SHA-256 hash stored in DB
- 30-minute expiration
- Single-use enforcement
- Email via Resend

### SMS OTP
- 6-digit numeric code
- 5-minute expiration
- Rate limiting: 3 requests per 15 minutes
- Twilio integration
- Only as optional 2FA (not primary auth)

### Rate Limiting
- Magic link: 3 per 15 minutes per email
- SMS OTP: 3 per 15 minutes per phone
- Redis-based counters

## Implementation Files

**Create:**
- `services/magic-link.service.ts`
- `services/sms.service.ts`
- `dto/request-magic-link.dto.ts`
- `dto/verify-magic-link.dto.ts`
- `dto/request-otp.dto.ts`
- `dto/verify-otp.dto.ts`

## Todo List
- [ ] Install Twilio SDK
- [ ] Create MagicLinkService
- [ ] Implement token generation and validation
- [ ] Create email template for magic link
- [ ] Implement rate limiting for magic links
- [ ] Create SMSService with Twilio
- [ ] Implement OTP generation and validation
- [ ] Create rate limiting for SMS
- [ ] Add endpoints to AuthController
- [ ] Test magic link flow
- [ ] Test SMS OTP flow
- [ ] Test rate limiting
- [ ] Write unit tests

## Success Criteria
- ✅ Magic link emails delivered
- ✅ Magic links expire after 30 minutes
- ✅ Magic links single-use only
- ✅ SMS OTP delivered within 30 seconds
- ✅ OTP expires after 5 minutes
- ✅ Rate limiting prevents abuse
- ✅ All tests passing
