# Security Policy

## Reporting a Vulnerability

We take the security of M-Tracking seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues via:

1. **Email**: [SECURITY_EMAIL_TO_BE_ADDED]
2. **Subject**: `[SECURITY] Brief description of the issue`

### What to Include in Your Report

Please provide as much information as possible:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### Example Report

```
Subject: [SECURITY] SQL Injection vulnerability in transaction search

Description:
The transaction search endpoint is vulnerable to SQL injection through
the 'category' parameter.

Steps to Reproduce:
1. Send POST request to /api/transactions/search
2. Include payload: {"category": "' OR '1'='1"}
3. All transactions are returned regardless of user access

Impact:
- Unauthorized access to all user transactions
- Potential data breach
- Database manipulation possible

Suggested Fix:
Use parameterized queries or ORM methods that automatically escape inputs.
```

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies by severity (see below)

## Severity Levels

### Critical (P0)

- **Examples**: Authentication bypass, SQL injection, remote code execution
- **Response Time**: Fix within 24-48 hours
- **Disclosure**: After fix is deployed and verified

### High (P1)

- **Examples**: XSS vulnerabilities, sensitive data exposure, privilege escalation
- **Response Time**: Fix within 7 days
- **Disclosure**: After fix is deployed

### Medium (P2)

- **Examples**: CSRF vulnerabilities, information disclosure
- **Response Time**: Fix within 14 days
- **Disclosure**: After fix is deployed

### Low (P3)

- **Examples**: Minor security improvements, rate limiting issues
- **Response Time**: Fix within 30 days
- **Disclosure**: Can be discussed publicly

## Security Best Practices

### For Contributors

When contributing code, please follow these security guidelines:

#### 1. Input Validation

```typescript
// ✅ Good - Validate and sanitize input
@IsEmail()
@MaxLength(255)
email: string;

// ❌ Bad - No validation
email: string;
```

#### 2. Authentication & Authorization

```typescript
// ✅ Good - Verify user has access
@UseGuards(JwtAuthGuard, ResourceOwnerGuard)
async getTransaction(@Param('id') id: string, @CurrentUser() user: User) {
  return this.service.findUserTransaction(user.id, id);
}

// ❌ Bad - No authorization check
async getTransaction(@Param('id') id: string) {
  return this.service.findTransaction(id);
}
```

#### 3. SQL Injection Prevention

```typescript
// ✅ Good - Use ORM or parameterized queries
const user = await this.repository.findOne({
  where: { email: email },
})

// ❌ Bad - String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`
```

#### 4. XSS Prevention

```typescript
// ✅ Good - Sanitize output
import { escape } from 'html-escaper';
const safeHtml = escape(userInput);

// ❌ Bad - Direct HTML rendering
dangerouslySetInnerHTML={{ __html: userInput }}
```

#### 5. Secrets Management

```typescript
// ✅ Good - Use environment variables
const apiKey = process.env.API_KEY

// ❌ Bad - Hard-coded secrets
const apiKey = 'sk_live_abc123xyz'
```

#### 6. Rate Limiting

```typescript
// ✅ Good - Apply rate limiting
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

#### 7. CORS Configuration

```typescript
// ✅ Good - Whitelist specific origins
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
})

// ❌ Bad - Allow all origins
app.enableCors({ origin: '*' })
```

## Security Features in M-Tracking

### Authentication

- **JWT tokens** with 15-minute expiry (access tokens)
- **Refresh tokens** with 7-day expiry
- **Token blacklisting** via Redis for logout/revocation
- **Bcrypt password hashing** with cost factor 10

### Authorization

- **Role-based access control (RBAC)**
- **Resource-level permissions**
- **Route guards** on all protected endpoints

### Data Protection

- **Encryption at rest** (database-level)
- **TLS/SSL** for all communications
- **Secure headers** via Helmet.js
- **CORS** with strict origin whitelist

### API Security

- **Rate limiting** (100 req/min authenticated, 20 req/min public)
- **Input validation** with class-validator
- **SQL injection prevention** via TypeORM
- **XSS prevention** with output sanitization

### Infrastructure Security

- **Supabase RLS** (Row Level Security) policies
- **Redis AUTH** for cache access
- **Docker security** (non-root users, minimal images)
- **Secret management** via environment variables

## Vulnerability Disclosure

When a vulnerability is fixed:

1. **Patch Release**: We release a security patch immediately
2. **Security Advisory**: Published on GitHub Security Advisories
3. **Changelog Update**: Added to `docs/project-changelog.md`
4. **Credit**: Reporter credited (unless they prefer anonymity)

## Security Updates

- **Critical vulnerabilities**: Patched immediately, emergency release
- **Dependency updates**: Weekly automated checks via Dependabot
- **Security audits**: Monthly review of dependencies (`npm audit`)

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅ Yes    |
| < 1.0   | ❌ No     |

## Security Checklist for Developers

Before submitting a PR, verify:

- [ ] All user inputs are validated and sanitized
- [ ] Authentication/authorization checks are in place
- [ ] No secrets or API keys committed to code
- [ ] SQL queries use parameterized statements or ORM
- [ ] CORS is properly configured
- [ ] Rate limiting applied to public endpoints
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up-to-date and vulnerability-free
- [ ] TLS/SSL used for all external communications
- [ ] Logging doesn't include sensitive data (passwords, tokens, PII)

## Third-Party Security

### Dependencies

We monitor dependencies for known vulnerabilities using:

- **Dependabot** (GitHub automated alerts)
- **npm audit** (weekly manual checks)
- **Snyk** (optional, for advanced scanning)

### Banking APIs

- **Plaid**: SOC 2 Type II certified, encryption at rest/in transit
- **Tink**: PSD2 compliant, bank-grade security
- **MoMo**: TLS 1.2+, token-based authentication

## Compliance

M-Tracking follows industry-standard security practices:

- **OWASP Top 10** mitigation strategies
- **PCI DSS** guidelines (for payment data handling)
- **GDPR** principles (for user data protection)

## Contact

For security-related questions that are not vulnerabilities:

- **General Security**: [SECURITY_EMAIL_TO_BE_ADDED]
- **Privacy Questions**: [PRIVACY_EMAIL_TO_BE_ADDED]

---

**Thank you for helping keep M-Tracking secure!** 🔒
