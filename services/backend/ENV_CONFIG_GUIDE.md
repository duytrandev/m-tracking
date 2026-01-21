# Backend Environment Configuration Guide

**Last Updated:** 2026-01-21
**Service:** @m-tracking/backend
**Purpose:** Complete guide for configuring environment variables for production deployment

---

## Required Environment Variables

### Application Settings
```env
NODE_ENV=production                    # Environment: development | production | test
PORT=4000                              # Server port (default: 4000)
```

### Database (Supabase PostgreSQL)
```env
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=<your-secure-password>
```

**Setup:** Create Supabase project at https://supabase.com/dashboard, enable TimescaleDB and pgvector extensions.

### JWT Authentication
```env
# RS256 Keys (file paths relative to backend root)
JWT_PRIVATE_KEY_PATH=jwt-private-key.pem
JWT_PUBLIC_KEY_PATH=jwt-public-key.pem

# Token secrets
JWT_SECRET=<unused-but-required-by-nestjs>
JWT_REFRESH_SECRET=<64-character-random-string>

# Token expiration
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Key Generation:**
```bash
# Generate RS256 key pair for JWT access tokens
openssl genrsa -out jwt-private-key.pem 2048
openssl rsa -in jwt-private-key.pem -pubout -out jwt-public-key.pem

# Generate refresh token secret (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Redis (Session & Token Blacklist)
```env
REDIS_HOST=localhost                   # Redis host
REDIS_PORT=6379                        # Redis port
REDIS_PASSWORD=                        # Optional password
```

**Setup:** Redis 6+ required. Run via Docker: `docker run -d -p 6379:6379 redis:7-alpine`

### Email Service (Resend)
```env
RESEND_API_KEY=re_xxxxxxxxxxxx        # Resend API key
EMAIL_FROM=M-Tracking <noreply@m-tracking.com>
FRONTEND_URL=https://your-domain.com  # Frontend URL for email links
```

**Setup:** Create account at https://resend.com, verify domain, generate API key.

### OAuth Providers

#### Google OAuth 2.0
```env
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://api.your-domain.com/auth/google/callback
```

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://api.your-domain.com/auth/google/callback`

#### GitHub OAuth
```env
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
GITHUB_CALLBACK_URL=https://api.your-domain.com/auth/github/callback
```

**Setup:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create New OAuth App
3. Set Authorization callback URL: `https://api.your-domain.com/auth/github/callback`

#### Facebook OAuth
```env
FACEBOOK_APP_ID=<your-app-id>
FACEBOOK_APP_SECRET=<your-app-secret>
FACEBOOK_CALLBACK_URL=https://api.your-domain.com/auth/facebook/callback
```

**Setup:**
1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create App → Add Facebook Login product
3. Add Valid OAuth Redirect URI: `https://api.your-domain.com/auth/facebook/callback`

#### OAuth Token Encryption
```env
OAUTH_ENCRYPTION_KEY=<64-character-hex-string>
```

**Generation:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Purpose:** Encrypts OAuth access/refresh tokens stored in database.

### Analytics Service (Internal)
```env
ANALYTICS_SERVICE_URL=http://localhost:5000    # Analytics FastAPI service URL
INTERNAL_API_KEY=<your-internal-api-key>       # Shared secret for service-to-service auth
```

### External APIs

#### Plaid (Banking Integration)
```env
PLAID_CLIENT_ID=<your-client-id>
PLAID_SECRET=<your-secret>
PLAID_ENV=sandbox                      # sandbox | development | production
```

**Setup:** Create account at https://plaid.com/dashboard, use sandbox for development.

#### OpenAI (Analytics Service)
```env
OPENAI_API_KEY=sk-...                  # OpenAI API key for transaction categorization
```

**Setup:** Create API key at https://platform.openai.com/api-keys

---

## Security Checklist

### Production Deployment
- [ ] All secrets are randomly generated (minimum 32 bytes)
- [ ] JWT keys are RS256 (2048-bit minimum)
- [ ] OAuth callback URLs use HTTPS
- [ ] Database password is strong (16+ characters, mixed case, numbers, symbols)
- [ ] Redis has password authentication enabled
- [ ] `NODE_ENV=production` is set
- [ ] No secrets are committed to git
- [ ] Environment variables are loaded from secure vault (AWS Secrets Manager, etc.)

### Rate Limiting (Already Configured)
- POST `/auth/register`: 5 requests/minute
- POST `/auth/login`: 5 requests/minute
- POST `/auth/forgot-password`: 3 requests/minute
- Default for other endpoints: 10 requests/minute

### JWT Security
- Access tokens: 15-minute expiry (RS256)
- Refresh tokens: 7-day expiry (HS256)
- Token blacklisting: Redis-backed with TTL
- httpOnly cookies for refresh tokens

---

## Environment File Structure

### Development (.env)
```bash
# Copy from .env.example
cp .env.example .env

# Edit with your local values
nano .env
```

### Docker (.env.docker)
```bash
# For Docker Compose secrets
cp .env.docker.example .env.docker
nano .env.docker
```

### Production
Use environment variable injection via:
- **AWS ECS/Fargate:** Task definition environment variables
- **Kubernetes:** ConfigMaps + Secrets
- **Heroku:** Config vars
- **Vercel/Netlify:** Environment variables UI

---

## Validation

### Test Configuration
```bash
# Start backend
npm run dev

# Check health endpoint
curl http://localhost:4000/health

# Test JWT keys loading
# Should see: "JWT keys loaded successfully" in logs

# Test database connection
# Should see: "Database connected successfully" in logs
```

### Common Issues

#### JWT Keys Not Found
```
Error: ENOENT: no such file or directory, open 'jwt-private-key.pem'
```
**Solution:** Generate JWT keys using commands in JWT section above.

#### OAuth Encryption Key Invalid
```
Error: OAUTH_ENCRYPTION_KEY must be 32 bytes (64 hex characters)
```
**Solution:** Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### Redis Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`

---

## References

- `.env.example` - Template with all variables
- `src/config/` - Configuration service modules
- `src/auth/auth.module.ts` - JWT module configuration
- `src/shared/redis/redis.service.ts` - Redis connection

---

**Status:** ✅ Production Ready
**Last Reviewed:** 2026-01-21
