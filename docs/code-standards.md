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

### OAuth Token Encryption

**Always encrypt OAuth tokens at rest:**

```typescript
// ✅ Good - Encrypt sensitive tokens
import { EncryptionUtil } from '../utils/encryption.util';

const encrypted = EncryptionUtil.encrypt(oauthAccessToken);
await this.oauthAccountRepository.save({
  accessToken: encrypted, // Stored encrypted
});

// ❌ Bad - Plaintext tokens in database
const oauthAccount = new OAuthAccount();
oauthAccount.accessToken = oauthAccessToken; // Plain dangerous!
```

**OAuth Account Auto-Linking (Email Verification):**

```typescript
// ✅ Good - Only auto-link verified emails
if (profile.emailVerified) {
  const user = await this.userRepository.findOne({
    where: { email: profile.email },
  });
  if (user) return user; // Safe to link
}

// ❌ Bad - Auto-link unverified emails
const user = await this.userRepository.findOne({
  where: { email: profile.email }, // May not be user's email!
});
```

**OAuth Account Unlinking (Prevent Lockout):**

```typescript
// ✅ Good - Ensure alternative auth exists
if (!user.password && user.oauthAccounts.length === 1) {
  throw new ConflictException(
    'Cannot unlink last authentication method',
  );
}

// ❌ Bad - Allow complete lockout
await this.oauthAccountRepository.remove(oauthAccount); // User locked out!
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

```markdown
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
  return (
    <div className="relative">
      {/* Custom dropdown logic */}
    </div>
  )
}
```

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
import { motion } from "motion/react";

export function LoginForm() {
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Form content */}
    </motion.form>
  );
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
  "(prefers-reduced-motion: reduce)"
).matches;

const duration = prefersReducedMotion ? 0 : 400;
```

### Bundle Optimization

**Use LazyMotion to minimize bundle size (4.6KB vs 34KB):**

```tsx
import { LazyMotion, domAnimation } from "motion/react";

export function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
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

**Last Updated:** 2026-01-20
**Maintained By:** Development Team
