# Passwordless Authentication Research - Quick Reference

**Full Report:** `/Users/DuyHome/dev/any/freelance/m-tracking/plans/reports/researcher-passwordless-260116-1409.md`

## Key Recommendations for M-Tracking MVP

### Primary Approach: Magic Links

**Why:** Email-based one-time links balance security, UX, and implementation simplicity.

**MVP Implementation (Weeks 3-4):**
- Generate 256-bit cryptographically random tokens
- Hash tokens before storage (SHA-256)
- Store in Redis (30-min TTL) + PostgreSQL (audit trail)
- Send via **Resend** (5-min setup, cost-effective)
- Single-use enforcement + rate limiting (3 requests/15 min)

**Security Properties:**
- Phishing-resistant (token only works on your domain)
- Brute-force resistant (256-bit entropy)
- Replay-proof (single-use tokens)
- Email-bound (attacker needs email access)

### Secondary: OTP SMS (Phase 2, Optional 2FA)

**Considerations:**
- India phasing out SMS OTP (April 2026)
- UAE already phased out (March 2026)
- Twilio recommended if implemented (mature rate limiting)
- Use only as 2FA, not primary auth

### Tertiary: WebAuthn/Passkeys (Phase 3+)

**Timeline:** Post-launch after magic links stable
**Benefits:** Most secure, phishing-proof, best UX for capable devices
**Implementation:** Use `@simplewebauthn/server` library

---

## Technology Stack

| Component | Choice | Cost/Month |
|-----------|--------|-----------|
| Token Generation | `crypto.randomBytes()` | Free |
| Token Storage (Hot) | Redis | ~$50 |
| Token Storage (Audit) | PostgreSQL (Supabase) | Included |
| Email Delivery | Resend | ~$20 |
| Rate Limiting | Redis + Custom | Included |
| Session Management | JWT (RS256) | Free |

**Total MVP Cost: ~$70/month for 100k users**

---

## Implementation Checklist

### Magic Link Flow

- [ ] POST `/auth/magic-link` - Request link
  - Validate email format
  - Generate 256-bit token
  - Hash token, store in Redis (30 min) + DB
  - Send via Resend
  - Rate limit: 3 requests/15 min

- [ ] POST `/auth/magic-link/verify` - Consume link
  - Receive token from URL
  - Hash and lookup in Redis
  - Validate expiration + single-use
  - Delete token immediately
  - Issue JWT (15 min) + refresh token (7 days)
  - Send success notification email

### Security Hardening

- [ ] Token entropy validation (256 bits minimum)
- [ ] Hash tokens before storage
- [ ] Expire tokens: 30 minutes
- [ ] Single-use enforcement (atomic delete)
- [ ] Rate limiting with exponential backoff
- [ ] No sensitive data in logs
- [ ] Account takeover notifications
- [ ] Email verification on signup (prerequisite)

### Testing

- [ ] Unit tests: Token generation, hashing, validation
- [ ] Integration tests: Full magic link flow
- [ ] Security tests: Replay attack prevention, brute force
- [ ] Rate limiting tests: Max requests enforcement
- [ ] E2E tests: Full signup → login flow

---

## Known Issues & Mitigations

**Email Client Pre-Fetching:** Gmail/Outlook pre-fetch links for spam checking
- ✅ Solution: Single-use tokens + graceful retry (user clicks, link already used, resend prompt)

**Recovery Scenario:** Lost email access → Account locked
- ✅ Solution: Implement recovery codes (10 unique codes per user)
- ✅ Or: Phone number backup authentication

**Device Binding:** Attacker intercepts email → Uses link on different device
- ✅ Solution: Include device fingerprint in token validation
- ✅ Or: Rate limit (max 1 login per email per 5 min)

---

## Compliance Notes

- **NIST 800-63B (2023):** Magic links approved, magic link entropy requirement met
- **CISA:** Recommends email-based passwordless for most users
- **GDPR:** Account takeover notifications required (implemented)
- **SOC 2 Type II:** 2FA recommended for high-value users (WebAuthn Phase 3)

---

## Cost Comparison (Post-Launch)

| Provider | Volume | Monthly Cost | Notes |
|----------|--------|-------------|-------|
| **Resend** | 100k/mo | $20-30 | Easy setup, best DX |
| **SendGrid** | 100k/mo | $89.95 | More features, slower setup |
| **AWS SES** | 100k/mo | $10 | Cheapest, harder setup |
| **Resend → AWS SES** | 500k+/mo | Save $300-800/mo | Break-even: ~27-40 months |

---

## Next Steps

1. **Planner:** Create detailed implementation plan with Phase 1 subtasks
2. **Dev Agent:** Implement magic link endpoints (API + Frontend)
3. **QA:** Test security + UX
4. **Docs Manager:** Add passwordless auth to architecture docs

