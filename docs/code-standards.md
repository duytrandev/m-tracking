# Code Standards

**Version:** 1.2
**Last Updated:** 2026-01-20
**Status:** Active - Updated with Animation Best Practices (Motion Library)

---

## Overview

This document defines coding standards, conventions, and best practices for M-Tracking development. All contributors must follow these guidelines to ensure code consistency, maintainability, and quality.

**Core Principles:**

- **YAGNI** (You Aren't Gonna Need It) - Don't build features until needed
- **KISS** (Keep It Simple, Stupid) - Favor simple solutions over complex ones
- **DRY** (Don't Repeat Yourself) - Avoid code duplication

---

## TypeScript Guidelines

### Strict Mode

**Always use TypeScript strict mode:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Definitions

**Explicit return types for functions:**

```typescript
// ✅ Good
function getUserById(id: string): Promise<User> {
  return this.repository.findOne({ where: { id } })
}

// ❌ Bad
function getUserById(id: string) {
  return this.repository.findOne({ where: { id } })
}
```

**Interface over type for object shapes:**

```typescript
// ✅ Good - Use interface for objects
interface User {
  id: string
  email: string
  name: string
}

// ✅ Good - Use type for unions/intersections
type UserRole = 'admin' | 'user' | 'guest'
type UserWithRole = User & { role: UserRole }

// ❌ Bad - Using type for simple objects
type User = {
  id: string
  email: string
}
```

**Enum for fixed sets of values:**

```typescript
// ✅ Good
enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

// ❌ Bad - Magic strings
const type = 'income' // No type safety
```

### Type Import Standards (Updated 2026-01-18)

**CRITICAL: Use centralized type definitions only**

All type definitions must be imported from centralized locations. Feature-specific type definitions are NOT allowed.

**Centralized Type Locations:**

```typescript
// API Types (requests, responses, DTOs)
import type { LoginRequest, LoginResponse } from '@/types/api/auth'
import type { User, Session } from '@/types/entities'

// ❌ NEVER import from feature-specific types
import type { LoginRequest } from '@/features/auth/types/auth-types' // WRONG!
```

**Type Organization:**

```
types/
├── api/              # API-related types
│   ├── auth.ts      # Authentication types (25+ types)
│   ├── profile.ts   # Profile types
│   ├── common.ts    # Shared API patterns
│   └── index.ts     # Re-exports
└── entities/         # Domain models
    ├── user.ts      # User entity
    ├── session.ts   # Session entity
    └── index.ts     # Re-exports
```

**Import Patterns:**

```typescript
// ✅ CORRECT - Centralized imports
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
} from '@/types/api/auth'

import type { User } from '@/types/entities'

// ✅ CORRECT - Constants in feature directory
import { OAUTH_CONFIGS } from '@/features/auth/constants/oauth-config'

// ❌ WRONG - Feature-specific types
import type { LoginRequest } from '../types/auth-types'
import type { User } from './types/user'
```

**Benefits:**

- ✅ Single source of truth for types
- ✅ No type drift between features
- ✅ Easier to find and update types
- ✅ Better IDE autocomplete
- ✅ Prevents duplicate definitions

**Enforcement:**

This pattern is enforced through:

1. Code review
2. TypeScript compilation (will fail if duplicate types exist)
3. Future: ESLint rule to prevent feature-specific type files

---

## Naming Conventions

### Files

**Use kebab-case with descriptive names:**

```
✅ Good:
user-profile.service.ts
transaction-categorization.service.ts
bank-account.entity.ts
create-transaction.dto.ts

❌ Bad:
UserProfile.ts
transactionCategorization.ts
ba.entity.ts
dto.ts
```

**File naming patterns:**

- Entities: `{entity-name}.entity.ts` (user.entity.ts)
- Services: `{service-name}.service.ts` (auth.service.ts)
- Controllers: `{controller-name}.controller.ts` (transaction.controller.ts)
- DTOs: `{action}-{entity}.dto.ts` (create-user.dto.ts)
- Guards: `{guard-name}.guard.ts` (jwt-auth.guard.ts)
- Interceptors: `{interceptor-name}.interceptor.ts` (logging.interceptor.ts)
- Middleware: `{middleware-name}.middleware.ts` (cors.middleware.ts)
- Filters: `{filter-name}.filter.ts` (http-exception.filter.ts)

### Classes

**Use PascalCase:**

```typescript
// ✅ Good
class UserProfileService {}
class TransactionController {}
class JwtAuthGuard {}

// ❌ Bad
class userProfileService {}
class transaction_controller {}
```

### Functions and Variables

**Use camelCase:**

```typescript
// ✅ Good
const userId = '123'
function getUserProfile() {}
async function createTransaction() {}

// ❌ Bad
const UserId = '123'
function GetUserProfile() {}
```

### Constants

**Use SCREAMING_SNAKE_CASE:**

```typescript
// ✅ Good
const MAX_RETRY_ATTEMPTS = 3
const API_BASE_URL = 'https://api.example.com'
const DEFAULT_PAGE_SIZE = 20

// ❌ Bad
const maxRetryAttempts = 3
const apiBaseUrl = 'https://api.example.com'
```

### Boolean Variables

**Use is/has/can prefix:**

```typescript
// ✅ Good
const isActive = true
const hasPermission = false
const canEdit = true

// ❌ Bad
const active = true
const permission = false
const edit = true
```

---

## File Organization

### File Size Limit

**Keep files under 200 lines:**

- Split large files into smaller, focused modules
- Extract utility functions into separate files
- Use composition over inheritance

```typescript
// ✅ Good - Split into multiple files
// user.service.ts (150 lines)
// user-validation.service.ts (80 lines)
// user-notification.service.ts (90 lines)

// ❌ Bad - Single 500-line file
// user.service.ts (500 lines)
```

### One Class Per File

**Each file should contain exactly one class:**

```typescript
// ✅ Good
// user.service.ts
export class UserService {
  // Implementation
}

// ❌ Bad - Multiple classes in one file
// services.ts
export class UserService {}
export class TransactionService {}
export class BudgetService {}
```

### Directory Structure

**Group related files in directories:**

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── strategies/
│       └── jwt.strategy.ts
```

---

## Error Handling

### Custom Exception Classes

**Use custom exceptions for domain errors:**

```typescript
// ✅ Good
export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`)
  }
}

export class InsufficientBalanceException extends BadRequestException {
  constructor(balance: number, required: number) {
    super(`Insufficient balance. Available: ${balance}, Required: ${required}`)
  }
}

// Usage
throw new UserNotFoundException(userId)
```

### Try-Catch Blocks

**Always handle async errors:**

```typescript
// ✅ Good
async function processTransaction(data: TransactionDto): Promise<Transaction> {
  try {
    const transaction = await this.repository.save(data)
    await this.budgetService.updateSpending(transaction)
    return transaction
  } catch (error) {
    this.logger.error('Failed to process transaction', {
      error: error.message,
      data,
    })
    throw new TransactionProcessingException(error.message)
  }
}

// ❌ Bad - Unhandled errors
async function processTransaction(data: TransactionDto) {
  const transaction = await this.repository.save(data)
  await this.budgetService.updateSpending(transaction)
  return transaction
}
```

**Type casting pattern for error handling (Phase 0 - Configuration Fixes):**

```typescript
// ✅ Good - Type guard for error objects
async function fetchData() {
  try {
    return await externalApi.call()
  } catch (error) {
    // Always type-guard error as unknown first
    if (error instanceof Error) {
      this.logger.error('API call failed', {
        message: error.message,
        stack: error.stack,
      })
    } else {
      this.logger.error('Unknown error occurred', { error })
    }
    throw new ApiException('Failed to fetch data')
  }
}

// Type-safe error handling with custom errors
try {
  // operation
} catch (error) {
  const typedError = error as Error
  // Now safe to access .message, .stack
  throw new CustomException(typedError.message)
}
```

### Logging Errors

**Log all errors with context:**

```typescript
// ✅ Good
this.logger.error('Failed to create user', {
  error: error.message,
  stack: error.stack,
  email: dto.email,
  timestamp: new Date().toISOString(),
})

// ❌ Bad
console.error('Error:', error)
```

### Consistent Error Responses

**Use standard error response format:**

```typescript
// Error response format
{
  "statusCode": 404,
  "message": "User with ID 123 not found",
  "error": "Not Found",
  "timestamp": "2026-01-16T13:54:00.000Z",
  "path": "/api/v1/users/123"
}
```

---

## Code Quality

### Comments

**Write meaningful comments for complex logic:**

```typescript
// ✅ Good
/**
 * Calculates remaining budget using 4-tier caching strategy:
 * 1. Redis cache (80% hit rate)
 * 2. In-memory user history (10% hit rate)
 * 3. Database query (10% usage)
 */
async function calculateRemainingBudget(userId: string): Promise<number> {
  // Implementation
}

// ❌ Bad - Obvious comment
// Get user by ID
async function getUserById(id: string) {}
```

**Use JSDoc for public APIs:**

```typescript
/**
 * Creates a new transaction and updates related budgets
 *
 * @param userId - The user's unique identifier
 * @param dto - Transaction creation data
 * @returns The created transaction
 * @throws {UserNotFoundException} If user doesn't exist
 * @throws {InsufficientBalanceException} If balance is insufficient
 */
async createTransaction(
  userId: string,
  dto: CreateTransactionDto,
): Promise<Transaction> {
  // Implementation
}
```

### Code Formatting

**Use Prettier for automatic formatting:**

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Linting

**Use ESLint for code quality:**

```json
// .eslintrc.json
{
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Code Reviews

**All code must be reviewed before merge:**

- At least 1 approval required
- All CI checks must pass
- No merge conflicts
- Follow PR template

---

## NestJS Patterns

### Dependency Injection

**Always use constructor injection:**

```typescript
// ✅ Good
@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
    private readonly budgetService: BudgetService,
    private readonly logger: LoggerService
  ) {}
}

// ❌ Bad - Direct instantiation
export class TransactionService {
  private repository = new Repository()
  private budgetService = new BudgetService()
}
```

### DTOs with Validation

**Use class-validator decorators:**

```typescript
// ✅ Good
export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  merchant: string

  @IsNumber()
  @Min(0)
  amount: number

  @IsEnum(TransactionType)
  type: TransactionType

  @IsDateString()
  @IsOptional()
  date?: string
}

// ❌ Bad - No validation
export class CreateTransactionDto {
  merchant: string
  amount: number
  type: string
  date?: string
}
```

### Service Layer

**Keep controllers thin, services thick:**

```typescript
// ✅ Good
@Controller('transactions')
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto): Promise<Transaction> {
    return this.service.create(dto)
  }
}

// Service contains business logic
export class TransactionService {
  async create(dto: CreateTransactionDto): Promise<Transaction> {
    // Validation
    // Business logic
    // Database operations
    // Side effects (events, notifications)
    return transaction
  }
}
```

---

## Database

### Entity Definitions

**Use TypeORM decorators:**

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  name: string

  @Column({ select: false })
  password: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Transaction, transaction => transaction.user)
  transactions: Transaction[]
}
```

### Repository Pattern

**Use repository methods:**

```typescript
// ✅ Good
async findByEmail(email: string): Promise<User | null> {
  return this.repository.findOne({ where: { email } });
}

async findWithTransactions(userId: string): Promise<User | null> {
  return this.repository.findOne({
    where: { id: userId },
    relations: ['transactions'],
  });
}

// ❌ Bad - Raw queries everywhere
async findByEmail(email: string) {
  return this.repository.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
}
```

### Migrations

**Always use migrations for schema changes:**

```bash
# Generate migration
pnpm run migration:generate -- src/migrations/AddUserPhoneNumber

# Run migrations
pnpm run migration:run

# Revert migration
pnpm run migration:revert
```

---

## Testing Guidelines

### Unit Tests

**Test services in isolation:**

```typescript
describe('TransactionService', () => {
  let service: TransactionService
  let repository: Repository<Transaction>

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<TransactionService>(TransactionService)
    repository = module.get(getRepositoryToken(Transaction))
  })

  it('should create a transaction', async () => {
    const dto = { merchant: 'Test', amount: 100 }
    const expected = { id: '1', ...dto }

    jest.spyOn(repository, 'save').mockResolvedValue(expected as Transaction)

    const result = await service.create(dto)

    expect(result).toEqual(expected)
    expect(repository.save).toHaveBeenCalledWith(dto)
  })
})
```

### Integration Tests

**Test API endpoints:**

```typescript
describe('TransactionController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  it('/transactions (POST)', () => {
    return request(app.getHttpServer())
      .post('/transactions')
      .send({ merchant: 'Test', amount: 100 })
      .expect(201)
      .expect(res => {
        expect(res.body.id).toBeDefined()
        expect(res.body.merchant).toBe('Test')
      })
  })
})
```

---

## Security Best Practices

### Input Validation

**Always validate and sanitize input:**

```typescript
// ✅ Good - Use DTOs with validation
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}

// ❌ Bad - Raw input
@Post()
async create(@Body() body: any) {
  return this.service.create(body);
}
```

### SQL Injection Prevention

**Use parameterized queries:**

```typescript
// ✅ Good
await this.repository.findOne({
  where: { email },
})

// ❌ Bad - String concatenation
await this.repository.query(`SELECT * FROM users WHERE email = '${email}'`)
```

### Password Hashing

**Always hash passwords:**

```typescript
import * as bcrypt from 'bcrypt'

// ✅ Good
const hashedPassword = await bcrypt.hash(password, 10)

// ❌ Bad - Plain text
const password = dto.password
```

### JWT Security

**Use secure JWT configuration:**

```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '15m', // Short-lived access tokens
    algorithm: 'HS256',
  },
})
```

### OAuth Token Encryption (Production Implementation ✅)

**Always encrypt OAuth tokens at rest using AES-256-GCM:**

```typescript
// ✅ Good - Encrypt sensitive tokens (AES-256-GCM)
import { EncryptionUtil } from '../utils/encryption.util'

const encrypted = EncryptionUtil.encrypt(oauthAccessToken)
await this.oauthAccountRepository.save({
  accessToken: encrypted, // Stored encrypted with authentication tag
})

// Decrypt when needed for API calls
const plaintext = EncryptionUtil.decrypt(encrypted)
await this.oauthProvider.makeAuthenticatedCall(plaintext)

// ❌ Bad - Plaintext tokens in database
const oauthAccount = new OAuthAccount()
oauthAccount.accessToken = oauthAccessToken // Plain dangerous!
```

**OAuth Account Auto-Linking (Email Verification - Production ✅):**

```typescript
// ✅ Good - Only auto-link verified emails (prevents account takeover)
if (profile.emailVerified) {
  const user = await this.userRepository.findOne({
    where: { email: profile.email },
  })
  if (user) return user // Safe to link
}

// Create new user if email not already linked
const newUser = new User()
newUser.email = profile.email
newUser.emailVerified = profile.emailVerified
newUser.name = profile.displayName

// ❌ Bad - Auto-link unverified emails
const user = await this.userRepository.findOne({
  where: { email: profile.email }, // May not be user's email!
})
```

**OAuth Account Unlinking (Prevent Lockout - Production ✅):**

```typescript
// ✅ Good - Ensure alternative auth exists (prevents account lockout)
if (!user.password && user.oauthAccounts.length === 1) {
  throw new ConflictException('Cannot unlink last authentication method')
}

// Safe to unlink
await this.oauthAccountRepository.remove(oauthAccount)

// ❌ Bad - Allow complete lockout
await this.oauthAccountRepository.remove(oauthAccount) // User locked out!
```

### JWT Token Generation (Production Implementation ✅)

**Use RS256 for access tokens, HS256 for refresh tokens:**

```typescript
// ✅ Good - Hybrid JWT strategy (asymmetric + symmetric)
async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
  // Access token: RS256 (asymmetric), 15 minutes
  const accessToken = this.jwtService.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    {
      algorithm: 'RS256',
      expiresIn: '15m',
    }
  );

  // Refresh token: HS256 (symmetric), 7 days
  const refreshToken = this.jwtService.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    {
      algorithm: 'HS256',
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    }
  );

  return { accessToken, refreshToken };
}

// ❌ Bad - Same algorithm for both tokens
const token = this.jwtService.sign(payload, {
  expiresIn: '7d', // Long expiry on short-lived token!
})
```

### Token Validation with Blacklist Check (Production ✅)

```typescript
// ✅ Good - Validate and check Redis blacklist
async validateToken(token: string): Promise<User | null> {
  try {
    // Check if token is blacklisted (from logout)
    const isBlacklisted = await this.redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Verify signature and decode
    const payload = this.jwtService.verify(token);

    // Fetch user to ensure still exists and active
    const user = await this.userRepository.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid token');
    }
    throw error;
  }
}

// ❌ Bad - No blacklist check on logout
// User can still use token for 15 minutes after logout!
```

### Rate Limiting for Auth Endpoints (Production ✅)

```typescript
// ✅ Good - Strict rate limiting on sensitive endpoints
@Post('login')
@Throttle({ limit: 5, ttl: 60000 }) // 5 req/min
async login(@Body() dto: LoginDto) {
  // Protects against brute force attacks
}

@Post('register')
@Throttle({ limit: 5, ttl: 60000 }) // 5 req/min
async register(@Body() dto: RegisterDto) {
  // Prevents account enumeration
}

@Post('forgot-password')
@Throttle({ limit: 3, ttl: 60000 }) // 3 req/min
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  // Prevents abuse of password reset
}

// ❌ Bad - Default limits on auth endpoints
@Post('login')
async login(@Body() dto: LoginDto) {
  // 10 req/min default - too high for security-critical endpoint
}
```

---

## Git Workflow

### Branch Naming

```
feature/user-authentication
fix/transaction-validation-bug
refactor/budget-service
docs/api-documentation
```

### Commit Messages

**Use conventional commits:**

```
feat: add user authentication with JWT
fix: resolve budget calculation bug
refactor: simplify transaction service
docs: update API documentation
test: add transaction service tests
chore: update dependencies
```

### Pull Request Template

````markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

---

## UI Component Standards (shadcn/ui)

### Component Installation & Usage

**All UI components must use shadcn/ui (Radix UI + Tailwind):**

```tsx
// ✅ Good - Using shadcn/ui component
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export function MyComponent() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ❌ Bad - Custom dropdown implementation
export function MyComponent() {
  return <div className="relative">{/* Custom dropdown logic */}</div>
}
```
````

### Available Components

Installed shadcn/ui components in `apps/frontend/src/components/ui/`:

- **Button** - Reusable button component with variants
- **Input** - Form input with validation styling
- **Dropdown Menu** - Accessible dropdown menu (Radix UI)
  - DropdownMenuTrigger
  - DropdownMenuContent
  - DropdownMenuItem
  - DropdownMenuLabel
  - DropdownMenuSeparator
  - DropdownMenuCheckboxItem
  - DropdownMenuRadioItem
  - DropdownMenuSub (nested menus)
- **Theme Toggle** - Dark mode toggle button (4 variants)

### Dropdown Menu Patterns

**Basic Menu:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Nested Submenu:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>PDF</DropdownMenuItem>
        <DropdownMenuItem>CSV</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

**Checkbox Group:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Filters</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuCheckboxItem checked={showActive}>
      Show Active
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem checked={showArchived}>
      Show Archived
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Styling & Customization

Dropdown components use Tailwind CSS utility classes. Customize via className prop:

```tsx
<DropdownMenuContent className="w-64">
  {/* Custom width */}
</DropdownMenuContent>

<DropdownMenuItem className="text-red-600">
  {/* Custom text color */}
</DropdownMenuItem>
```

### Accessibility

All shadcn/ui components include:

- ✅ Keyboard navigation (Tab, Enter, Arrow keys, Esc)
- ✅ ARIA labels and roles (aria-label, role="menuitem")
- ✅ Focus management
- ✅ Screen reader support
- ✅ Mobile touch interactions

---

## Theme Management Standards

### Theme Provider Pattern

**Use the theme system for consistent dark mode support:**

```tsx
// ✅ Good - Using theme system
import { useTheme } from '@/hooks/use-theme'

export function MyComponent() {
  const { theme, resolvedTheme, setTheme, isDark } = useTheme()

  return (
    <div>
      <p>Current theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  )
}
```

### Zustand Theme Store

**Access theme state from UIStore:**

```typescript
// ✅ Good - Using Zustand selectors
import { useUIStore } from '@/lib/store/ui-store'

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  return <button onClick={() => setTheme('dark')}>Toggle</button>
}
```

### localStorage Quota Handling

**Theme system handles quota exceeded gracefully:**

```typescript
// ✅ Automatic - safeLocalStorage wrapper handles errors
// When localStorage quota is exceeded:
// 1. Try-catch wraps all localStorage operations
// 2. Log warning (not error) on quota exceeded
// 3. Clear old data and retry
// 4. Fall back to system preference if all fails

// No manual error handling needed - it's built in!
```

### FOUC Prevention

**Theme is applied before React loads via inline script:**

```tsx
// ✅ Automatic - theme script injected in <head>
// In app/layout.tsx:
// <script dangerouslySetInnerHTML={{ __html: themeScript }} />
//
// This prevents flash of unstyled content (FOUC)
// Theme class is applied immediately as HTML loads
```

### System Preference Detection

**Theme system detects OS dark mode:**

```typescript
// ✅ Good - System preference respected
const { resolvedTheme } = useTheme()
// If theme === 'system':
//   resolvedTheme = 'dark' (if OS is dark mode)
//   resolvedTheme = 'light' (if OS is light mode)
```

---

## Animation Best Practices (Motion Library)

### Motion Library Standards

**Always use Motion (Framer Motion) for animations in React components:**

```tsx
// ✅ Good - Motion library
import { motion } from 'motion/react'

export function LoginForm() {
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Form content */}
    </motion.form>
  )
}
```

### Performance Guidelines

**Only animate transform and opacity (GPU-accelerated):**

```tsx
// ✅ Good - GPU-accelerated
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
/>

// ❌ Bad - Layout thrashing
<motion.button
  whileHover={{ width: "110%" }}
/>
```

### Accessibility: Respect prefers-reduced-motion

```tsx
// ✅ Good - Check user preference
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

const duration = prefersReducedMotion ? 0 : 400
```

### Bundle Optimization

**Use LazyMotion to minimize bundle size (4.6KB vs 34KB):**

```tsx
import { LazyMotion, domAnimation } from 'motion/react'

export function MotionProvider({ children }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
```

---

## Frontend Bundle Analysis & Performance (Phase 01+)

### Bundle Monitoring

**Establish baseline and track changes:**

```bash
# Primary analyzer (Turbopack-based, recommended)
pnpm run analyze:turbopack
# Output: http://localhost:4000 (interactive visualization)

# Alternative analyzer (Webpack-based)
pnpm run analyze
# Output: .next/analyze/ (client.html, server.html, edge.html reports)
```

### Code-Splitting Guidelines (Phase 02 Complete)

**Defer heavy components with dynamic imports:**

```typescript
// ❌ Bad - Eager loading blocks initial render
import { SpendingChart } from '@/features/spending/components/spending-chart'

export default function Dashboard() {
  return <SpendingChart data={data} />
}

// ✅ Good - Dynamic import (150KB deferred)
import dynamic from 'next/dynamic'
import { ChartSkeleton } from '@/components/ui/chart-skeleton'

const SpendingChart = dynamic(
  () => import('@/features/spending/components/spending-chart'),
  {
    loading: () => <ChartSkeleton height={300} />,
    ssr: false // Charts don't benefit from SSR
  }
)

export default function Dashboard() {
  const [showCharts, setShowCharts] = useState(false)

  return (
    <div>
      <button onClick={() => setShowCharts(!showCharts)}>
        Toggle Charts
      </button>
      {showCharts && <SpendingChart data={data} />}
    </div>
  )
}
```

**Dynamic Component Export Pattern:**

```typescript
// ✅ Good - Named export + default export for dynamic imports
// src/features/spending/components/spending-chart.tsx
export function SpendingChart({ data }: Props) {
  return <ResponsiveChart data={data} />
}

export default SpendingChart // For dynamic imports
```

**Loading Skeleton Component:**

```typescript
// ✅ Implementation pattern from Phase 02
// src/components/ui/chart-skeleton.tsx
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }}>
      <Skeleton className="h-full w-full" />
    </div>
  )
}
```

**Key Benefits (Verified Phase 02):**

- Initial bundle: 500KB → ~350KB (70% on Recharts)
- jsPDF removed: -200KB (zombie dependency)
- Recharts deferred to lazy chunk: -150KB
- Charts load <2s after toggle
- Skeleton prevents layout shift during loading
- Users see loading state immediately

### Zombie Dependency Prevention

**Verify all imported libraries are actually used:**

```bash
# Check for unused imports before adding new dependencies
grep -r "import.*jspdf" apps/frontend/src/
# Should return matches. If empty = zombie dependency

# Add to package.json only when confirmed needed
# Example: jsPDF was imported nowhere but listed in dependencies
```

### Bundle Size Targets

**Current Phase 01 Baseline (2026-01-21):**

- Total: ~500KB
- Target: ~80-120KB (70% reduction)

**Per-Phase Targets:**

1. Phase 02: Remove jsPDF (-200KB) → 300KB
2. Phase 03: Code-split Recharts (-150KB) → 150KB
3. Phase 04: Server Components (-80KB) → 70KB
4. Phase 05: Provider optimization (-20KB) → 50KB

### Dependency Guidelines

**Before adding new dependencies, evaluate impact:**

```typescript
// Check import size
import { parse } from 'some-library'

// ✅ Good - Tree-shakeable, minimal overhead
import { Icon } from 'lucide-react' // ~80KB total, but tree-shaken
import { create } from 'zustand' // ~10KB, lightweight

// ⚠️ Caution - Heavy dependencies (verify necessity)
import Recharts from 'recharts' // ~150KB, defer with dynamic()
import jsPDF from 'jspdf' // ~200KB, remove if unused

// ❌ Avoid - Monolithic, non-tree-shakeable
import _ from 'lodash' // ~70KB, use individual functions instead
import moment from 'moment' // ~65KB, use date-fns instead
```

### Client vs Server Components

**Minimize client-side rendering (Phase 03 target):**

```typescript
// ❌ Current (100% CSR)
'use client'

export function Page() {
  const [data, setData] = useState([])
  useEffect(() => {
    fetchData().then(setData)
  }, [])
  return <div>{data}</div>
}

// ✅ Target (Server Component by default)
// Remove 'use client' unless needed for interactivity
export async function Page() {
  const data = await fetchData() // Runs on server, no JS sent
  return <div>{data}</div>
}

// ✅ Hybrid (Only interactive parts client-side)
export default function Page() {
  return (
    <main>
      {/* Server-rendered content */}
      <AsyncContent />
      {/* Client-side interactivity only where needed */}
      <ClientInteractiveSection />
    </main>
  )
}
```

### Provider Architecture

**Current Issue: 7 nested providers causing reconciliation overhead (Phase 04 target):**

```typescript
// ❌ Current - Deep nesting
export function Providers({ children }) {
  return (
    <NextIntlClientProvider>
      <QueryClientProvider>
        <MSWProvider>
          <ThemeErrorBoundary>
            <ThemeProvider>
              <AuthInitializer>
                <ReactQueryDevtools>
                  {children}
                </ReactQueryDevtools>
              </AuthInitializer>
            </ThemeProvider>
          </ThemeErrorBoundary>
        </MSWProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}

// ✅ Target - Memoized/flattened providers
const memoizedProviders = {
  intl: NextIntlClientProvider,
  query: QueryClientProvider,
  theme: ThemeProvider,
  auth: AuthInitializer,
}

export function Providers({ children }) {
  return (
    <memoizedProviders.intl>
      <memoizedProviders.query>
        <memoizedProviders.theme>
          <memoizedProviders.auth>
            {children}
          </memoizedProviders.auth>
        </memoizedProviders.theme>
      </memoizedProviders.query>
    </memoizedProviders.intl>
  )
}
```

### Performance Monitoring

**Use bundle analyzer output for decision-making:**

```
Current bundle breakdown (Phase 01 baseline):
├── react + next.js: 50-80KB ✅ (framework minimum)
├── lucide-react: 80KB ✅ (tree-shakeable icons)
├── zustand: 10KB ✅ (minimal state)
├── tanstack/query: 40KB ✅ (data fetching)
├── recharts: 150KB ⚠️ (defer with dynamic())
├── jspdf: 200KB 🔴 (UNUSED - remove immediately)
└── other: 100KB ⚠️ (audit each)
```

---

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes

```

---

## Pre-commit Checklist

Before committing code, ensure:

- [ ] Code compiles without errors (`pnpm run build`)
- [ ] Linting passes (`pnpm run lint`)
- [ ] Formatting is correct (`pnpm run format`)
- [ ] All tests- **Command**: `pnpm run test:unit`)
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Documentation updated
- [ ] No sensitive data (API keys, passwords)

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Last Updated:** 2026-01-21 14:47
**Maintained By:** Development Team
**Recent Updates:** Added Phase 02 Code-Splitting guidelines with dynamic import patterns, ChartSkeleton implementation, and verified bundle metrics
```
