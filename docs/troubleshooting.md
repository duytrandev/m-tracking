# Troubleshooting Guide

**Version:** 1.0
**Last Updated:** 2026-01-18
**Status:** Active

---

## Overview

Common issues, error messages, and their solutions for M-Tracking development and deployment.

**Quick Links:**
- [Installation Issues](#installation-issues)
- [Docker Issues](#docker-issues)
- [Database Issues](#database-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)

---

## Installation Issues

### pnpm install fails

#### Problem
```bash
ERR_PNPM_PEER_DEP_ISSUES  Unmet peer dependencies
```

#### Solution
```bash
# Clear pnpm cache
pnpm store prune

# Remove lockfile and node_modules
rm -rf node_modules pnpm-lock.yaml

# Reinstall with --force
pnpm install --force

# If still failing, check Node.js version
node --version  # Should be >= 20.10.0
```

---

### Python uv sync fails

#### Problem
```bash
error: No solution found when resolving dependencies
```

#### Solution
```bash
# Check Python version
python3 --version  # Should be >= 3.12

# Clear uv cache
rm -rf ~/.cache/uv

# Try with verbose output
cd services/analytics
uv sync --verbose

# If specific package fails, update pyproject.toml
# Remove version constraints temporarily
```

---

## Docker Issues

### Docker containers won't start

#### Problem
```bash
Error response from daemon: Ports are not available
```

#### Solution
```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :4000  # Backend
lsof -i :3000  # Frontend

# Kill processes using the ports
kill -9 <PID>

# Or use different ports via docker-compose.override.yml
cp docker-compose.override.yml.example docker-compose.override.yml
nano docker-compose.override.yml  # Edit ports
```

---

### Docker build fails with "no space left on device"

#### Problem
```bash
ERROR: failed to solve: write /var/lib/docker/...: no space left on device
```

#### Solution
```bash
# Remove unused Docker resources
docker system prune -a --volumes

# Check Docker disk usage
docker system df

# Increase Docker Desktop disk allocation
# Docker Desktop > Settings > Resources > Disk image size
```

---

### Container restarts continuously

#### Problem
```bash
$ docker compose ps
backend    restarting
```

#### Solution
```bash
# Check container logs
docker compose logs backend --tail=100

# Common causes:
# 1. Environment variables missing
cat services/backend/.env  # Verify all required vars

# 2. Database connection failed
docker compose logs postgres

# 3. Port conflict
lsof -i :4000

# Restart with fresh volumes
docker compose down -v
docker compose up -d
```

---

## Database Issues

### Cannot connect to PostgreSQL

#### Problem
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

#### Solution
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Verify PostgreSQL logs
docker compose logs postgres --tail=50

# Test connection manually
docker exec -it mtracking-postgres psql -U mtracking -d mtracking_users

# Check environment variables
echo $DATABASE_URL
echo $DATABASE_HOST

# Restart PostgreSQL
docker compose restart postgres
```

---

### Migration fails

#### Problem
```bash
Error: relation "users" already exists
```

#### Solution
```bash
# Check current migration status
pnpm run migration:show

# Rollback last migration
pnpm run migration:revert

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d postgres
pnpm run migration:run

# Or manually via psql
docker exec -it mtracking-postgres psql -U mtracking -d mtracking_users
DROP TABLE IF EXISTS users CASCADE;
```

---

### Slow database queries

#### Problem
```bash
Query took 5000ms (expected < 100ms)
```

#### Solution
```bash
# Check query execution plan
EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = '...';

# Add missing indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

# Analyze table statistics
ANALYZE transactions;

# Check slow query log
docker compose logs postgres | grep "duration:"
```

---

## Backend Issues

### NestJS won't start

#### Problem
```bash
Error: Nest can't resolve dependencies of the AuthService
```

#### Solution
```bash
# Check module imports
# Ensure all dependencies are provided in module

# Example fix in auth.module.ts:
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // Missing import
    JwtModule.register({...}),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

# Clear NestJS cache
rm -rf dist/
pnpm run build
```

---

### TypeScript compilation errors

#### Problem
```bash
error TS2339: Property 'id' does not exist on type 'User'
```

#### Solution
```bash
# Regenerate TypeORM entities
pnpm run typeorm entity:create --name User

# Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# Clear TypeScript cache
rm -rf node_modules/.cache
pnpm run build

# If using VSCode, restart TS server
# CMD+Shift+P > "TypeScript: Restart TS Server"
```

---

### API returns 500 Internal Server Error

#### Problem
```bash
POST /api/auth/login
500 Internal Server Error
```

#### Solution
```bash
# Check backend logs
docker compose logs backend --tail=100

# Common causes:

# 1. Unhandled exception
# Look for stack trace in logs
# Add try-catch or exception filters

# 2. Database error
# Check database connection and queries

# 3. Missing environment variable
cat services/backend/.env | grep JWT_SECRET

# Enable debug logging
# In main.ts:
app.useLogger(['error', 'warn', 'debug', 'log']);
```

---

## Frontend Issues

### Next.js won't start

#### Problem
```bash
Error: Cannot find module '@m-tracking/common'
```

#### Solution
```bash
# Build shared libraries first
pnpm run build --filter=@m-tracking/common

# Install dependencies
pnpm install

# Clear Next.js cache
rm -rf apps/frontend/.next
pnpm run dev:frontend

# Check workspace configuration in pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'libs/*'
  - 'services/*'
```

---

### Hydration mismatch errors

#### Problem
```bash
Warning: Text content did not match. Server: "..." Client: "..."
```

#### Solution
```typescript
// Avoid using browser-only APIs during SSR

// ❌ Bad
const Component = () => {
  const value = localStorage.getItem('key');
  return <div>{value}</div>;
};

// ✅ Good
const Component = () => {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    setValue(localStorage.getItem('key'));
  }, []);

  return <div>{value}</div>;
};

// Or use 'use client' directive
'use client';

const Component = () => {
  // Client-only component
};
```

---

### API calls fail with CORS errors

#### Problem
```bash
Access to fetch at 'http://localhost:4000/api/auth/login' from origin
'http://localhost:3000' has been blocked by CORS policy
```

#### Solution
```typescript
// Backend: services/backend/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Frontend: Check API_URL in .env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Authentication Issues

### JWT token invalid or expired

#### Problem
```bash
401 Unauthorized: Token has expired
```

#### Solution
```typescript
// Implement token refresh logic

// Frontend: api/auth.ts
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // Redirect to login
    window.location.href = '/login';
    return;
  }

  const { accessToken } = await response.json();
  localStorage.setItem('accessToken', accessToken);
};

// Add interceptor to automatically refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      await refreshToken();
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

### Session not persisting

#### Problem
```
User logged in but session lost on page refresh
```

#### Solution
```typescript
// Check token storage

// ✅ Good - Store in localStorage or cookies
localStorage.setItem('accessToken', token);

// Or use httpOnly cookies (more secure)
// Backend:
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
});

// Frontend: Verify token on app initialization
// app/layout.tsx
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    setIsAuthenticated(true);
  }
}, []);
```

---

### OAuth redirect fails

#### Problem
```bash
Error: redirect_uri_mismatch
```

#### Solution
```bash
# 1. Check OAuth provider configuration
# Google Console: https://console.cloud.google.com/apis/credentials
# Authorized redirect URIs must include:
http://localhost:3000/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google

# 2. Verify environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $NEXTAUTH_URL

# 3. Check callback URL in code
// pages/api/auth/[...nextauth].ts
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      },
    },
  }),
],
```

---

## Performance Issues

### Slow API response times

#### Problem
```bash
GET /api/transactions took 3000ms (expected < 200ms)
```

#### Solution
```bash
# 1. Add database indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);

# 2. Implement Redis caching
@Injectable()
export class TransactionsService {
  async getTransactions(userId: string) {
    // Check cache first
    const cached = await this.redis.get(`transactions:${userId}`);
    if (cached) return JSON.parse(cached);

    // Query database
    const transactions = await this.repository.find({ userId });

    // Cache for 5 minutes
    await this.redis.setex(
      `transactions:${userId}`,
      300,
      JSON.stringify(transactions)
    );

    return transactions;
  }
}

# 3. Add pagination
GET /api/transactions?page=1&limit=50

# 4. Use database query optimization
// ❌ Bad - N+1 query
const transactions = await this.repository.find();
for (const tx of transactions) {
  tx.category = await this.categoryRepository.findOne(tx.categoryId);
}

// ✅ Good - Join
const transactions = await this.repository
  .createQueryBuilder('tx')
  .leftJoinAndSelect('tx.category', 'category')
  .where('tx.userId = :userId', { userId })
  .getMany();
```

---

### High memory usage

#### Problem
```bash
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

#### Solution
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm run dev

# Or in package.json
"scripts": {
  "dev": "NODE_OPTIONS='--max-old-space-size=4096' nest start --watch"
}

# Check for memory leaks
# Install clinic.js
npm install -g clinic

# Run diagnostics
clinic doctor -- node dist/main.js

# Common causes:
# 1. Large arrays not garbage collected
# 2. Event listeners not removed
# 3. Global variables accumulating data
# 4. Unclosed database connections
```

---

## Monitoring Issues (Sentry)

### Sentry not capturing errors

#### Problem
```bash
# Errors not appearing in Sentry dashboard
# Console shows: ⚠️  Sentry DSN not configured
```

#### Solution
```bash
# 1. Verify environment variables are set
echo $SENTRY_DSN  # Backend
echo $NEXT_PUBLIC_SENTRY_DSN  # Frontend

# 2. Check DSN format (should be full URL)
# Correct: https://abc123@o0.ingest.sentry.io/123456
# Wrong: abc123 or empty string

# 3. Restart services to reload env vars
pnpm dev

# 4. Test error capture
# Backend: Throw test error in any controller
# Frontend: Visit /test-error page or trigger error in console

# 5. Check Sentry project settings
# Visit: https://sentry.io/organizations/m-tracking/projects/
# Verify project exists and DSN matches
```

---

### Source maps not working

#### Problem
```bash
# Stack traces show minified code
# Can't identify error source location
```

#### Solution
```bash
# Frontend (Next.js)
# 1. Verify webpack plugin is enabled
# Check apps/frontend/next.config.ts:
disableServerWebpackPlugin: false,
disableClientWebpackPlugin: false,

# 2. Set auth token for source map upload
SENTRY_AUTH_TOKEN=your_token_here
SENTRY_ORG=m-tracking

# 3. Rebuild with source maps
cd apps/frontend
pnpm build

# Backend (NestJS)
# 1. Enable source maps in TypeScript
# Check services/backend/tsconfig.json:
"sourceMap": true,
"inlineSources": true,

# 2. Upload source maps manually
cd services/backend
pnpm run build
npx @sentry/cli sourcemaps upload --org=m-tracking --project=backend ./dist

# 3. Verify upload
# Visit Sentry → Settings → Source Maps
```

---

### Too many Sentry events

#### Problem
```bash
# Sentry quota exceeded
# Receiving quota warning emails
```

#### Solution
```typescript
// 1. Adjust sample rates in production
// services/backend/src/shared/sentry/sentry.config.ts
Sentry.init({
  tracesSampleRate: 0.1,  // 10% instead of 100%
  profilesSampleRate: 0.01, // 1% profiling
});

// 2. Ignore non-critical errors
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Network request failed',
  'Failed to fetch',
  /^AbortError/,
],

// 3. Filter duplicate errors
beforeSend(event) {
  // Custom deduplication logic
  const fingerprint = `${event.exception?.type}:${event.exception?.value}`;
  if (this.recentErrors.has(fingerprint)) {
    return null; // Drop duplicate
  }
  this.recentErrors.add(fingerprint);
  return event;
}

// 4. Review alert rules
// Visit Sentry → Alerts → Alert Rules
// Disable noisy alerts or increase thresholds
```

---

### PII leaking to Sentry

#### Problem
```bash
# Sensitive data (emails, amounts) visible in Sentry
```

#### Solution
```typescript
// Verify beforeSend hook is active

// Backend: services/backend/src/shared/sentry/sentry.config.ts
beforeSend(event, hint) {
  // Add debug logging
  console.log('Scrubbing event:', event.event_id);

  // Verify scrubbing logic
  if (event.user?.email) {
    event.user.email = event.user.email.replace(/(.{2}).*(@.*)/, '$1***$2');
  }

  return event;
}

// Test PII scrubbing
const testEvent = {
  user: { email: 'john.doe@example.com' },
  request: { data: { amount: 1234.56 } },
};
console.log(scrubSensitiveData(testEvent));
// Should show: { email: 'jo***@example.com', amount: '[REDACTED]' }

// Check Sentry dashboard
// Visit issue → Event Details → User
// Verify email is masked: jo***@example.com
```

---

### Sentry performance overhead

#### Problem
```bash
# Application slowdown after adding Sentry
# High CPU usage
```

#### Solution
```typescript
// 1. Reduce sampling in production
tracesSampleRate: 0.1,     // 10% of requests
profilesSampleRate: 0.01,  // 1% profiling only

// 2. Disable debug mode
debug: false,  // Never true in production

// 3. Limit breadcrumbs
maxBreadcrumbs: 50,  // Default is 100

// 4. Disable session replay in production
replaysSessionSampleRate: 0,  // Disable
replaysOnErrorSampleRate: 0.1, // Only 10% on errors

// 5. Use async capture
Sentry.captureException(error);  // Don't await

// 6. Monitor Sentry's own performance
// Check response times before/after Sentry integration
// Use Sentry's own performance monitoring
```

---

## Environment-Specific Issues

### Works locally but fails in production

#### Checklist
```bash
# 1. Environment variables
# Ensure all .env vars are set in production

# 2. Database connection
# Check DATABASE_URL is correct for production

# 3. CORS configuration
# Update CORS_ORIGIN for production domain

# 4. API URLs
# Update NEXT_PUBLIC_API_URL for production

# 5. Build mode
# Verify NODE_ENV=production

# 6. Port binding
# Check firewall allows ports 4000, 5000, 3000

# 7. SSL certificates
# Ensure valid SSL for HTTPS

# 8. Logs
# Check production logs for errors
docker compose logs --tail=200
```

---

## Getting Help

If your issue isn't covered here:

1. **Check logs**:
   ```bash
   docker compose logs --tail=200
   ```

2. **Search existing issues**:
   - GitHub Issues: [repository-url]/issues

3. **Create detailed bug report**:
   - Environment (OS, Node version, Docker version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error logs
   - Screenshots (if UI issue)

4. **Documentation**:
   - [Architecture Overview](./architecture-overview.md)
   - [Backend Architecture](./backend-architecture/index.md)
   - [Frontend Architecture](./frontend-architecture/index.md)
   - [Deployment Guide](./deployment.md)
   - [Testing Guide](./testing.md)

---

## Useful Commands

### Health Checks
```bash
# Check all services
docker compose ps

# Test backend API
curl http://localhost:4000/api/health

# Test analytics API
curl http://localhost:5000/health

# Check database
docker exec -it mtracking-postgres psql -U mtracking -c "SELECT 1"

# Check Redis
docker exec -it mtracking-redis redis-cli ping
```

### Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs backend --tail=100 -f

# Filter by error
docker compose logs | grep ERROR
```

### Clean Reset
```bash
# Nuclear option - full reset (deletes all data)
docker compose down -v
rm -rf node_modules pnpm-lock.yaml
rm -rf services/*/node_modules
rm -rf apps/*/node_modules
pnpm install
docker compose up -d
pnpm run dev
```

---

**Last Updated:** 2026-01-18
