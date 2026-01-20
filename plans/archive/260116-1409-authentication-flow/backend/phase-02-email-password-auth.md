# Phase 2: Email/Password Authentication

**Duration:** Week 1-2
**Priority:** Critical
**Status:** ✅ Complete (2026-01-16)
**Summary:** [phase-02-implementation-summary.md](./phase-02-implementation-summary.md)
**Dependencies:** Phase 1 (Database Infrastructure)

---

## Overview

Implement traditional email/password authentication with registration, login, email verification, and password reset flows.

---

## Context Links

- [JWT Auth Research](../../plans/reports/researcher-jwt-auth-260116-1409.md)
- [Backend Authentication Standards](./.claude/skills/backend-development/references/backend-authentication.md)
- [Code Standards](../../docs/code-standards.md)

---

## Key Insights

- bcrypt with 10 rounds for password hashing (balance security/performance)
- Email verification required before full access
- Password reset tokens expire in 1 hour
- Resend for email delivery (5-min setup, $20/month)
- Rate limiting: 5 login attempts per 15 minutes

---

## Requirements

### Functional Requirements
- User registration with email/password
- Email verification flow
- Login with email/password
- Password reset request
- Password reset confirmation
- Password complexity validation

### Non-Functional Requirements
- Password hashing < 200ms
- Email delivery < 5 seconds
- Login response < 500ms
- Rate limiting on auth endpoints
- Audit logging for auth events

---

## Architecture

### Password Security

**Hashing Strategy:**
```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // ~200ms on modern CPU

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Email Service Integration

**Provider:** Resend (recommended)
- Simple API, TypeScript SDK
- $20/month for 50K emails
- 5-minute setup

**Configuration:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@m-tracking.com',
  to: user.email,
  subject: 'Verify your email',
  html: verificationEmailTemplate,
});
```

### Token Generation

**Email Verification Token:**
- 256-bit random token (crypto.randomBytes(32))
- SHA-256 hash stored in database
- 24-hour expiration
- Single-use only

**Password Reset Token:**
- 256-bit random token
- SHA-256 hash stored in database
- 1-hour expiration
- Single-use only

---

## Related Code Files

### Files to Create

**Services:**
- `services/backend/src/auth/services/auth.service.ts`
- `services/backend/src/auth/services/password.service.ts`
- `services/backend/src/auth/services/email.service.ts`
- `services/backend/src/auth/services/token.service.ts`

**Controllers:**
- `services/backend/src/auth/controllers/auth.controller.ts`

**DTOs:**
- `services/backend/src/auth/dto/register.dto.ts`
- `services/backend/src/auth/dto/login.dto.ts`
- `services/backend/src/auth/dto/verify-email.dto.ts`
- `services/backend/src/auth/dto/forgot-password.dto.ts`
- `services/backend/src/auth/dto/reset-password.dto.ts`

**Guards:**
- `services/backend/src/auth/guards/local-auth.guard.ts`

**Strategies:**
- `services/backend/src/auth/strategies/local.strategy.ts`

**Templates:**
- `services/backend/src/auth/templates/verification-email.html`
- `services/backend/src/auth/templates/password-reset-email.html`

### Files to Modify

- `services/backend/src/auth/auth.module.ts`
- `services/backend/.env` (add RESEND_API_KEY)

---

## Implementation Steps

### Step 1: Install Dependencies (15 minutes)

```bash
cd services/backend
npm install resend
npm install --save-dev @types/bcrypt
```

### Step 2: Create DTOs with Validation (1 hour)

```typescript
// register.dto.ts
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password too weak' }
  )
  password: string;

  @IsString()
  @MinLength(2)
  name: string;
}

// login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// forgot-password.dto.ts
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

// reset-password.dto.ts
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password too weak' }
  )
  password: string;
}
```

### Step 3: Create Password Service (1 hour)

```typescript
// password.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PasswordService {
  private readonly SALT_ROUNDS = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
```

### Step 4: Create Email Service (2 hours)

```typescript
// email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(configService.get('RESEND_API_KEY'));
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: 'M-Tracking <noreply@m-tracking.com>',
      to: email,
      subject: 'Verify your email address',
      html: this.getVerificationEmailTemplate(verificationUrl),
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'M-Tracking <noreply@m-tracking.com>',
      to: email,
      subject: 'Reset your password',
      html: this.getPasswordResetEmailTemplate(resetUrl),
    });
  }

  private getVerificationEmailTemplate(url: string): string {
    return `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${url}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `;
  }

  private getPasswordResetEmailTemplate(url: string): string {
    return `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${url}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `;
  }
}
```

### Step 5: Create Auth Service (4 hours)

```typescript
// auth.service.ts
import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { PasswordService } from './password.service';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private verificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    private passwordService: PasswordService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    // Check if user exists
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(dto.password);

    // Create user
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    await this.userRepository.save(user);

    // Generate verification token
    const token = this.passwordService.generateToken();
    const tokenHash = this.passwordService.hashToken(token);

    const verificationToken = this.verificationTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await this.verificationTokenRepository.save(verificationToken);

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, token);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = this.passwordService.hashToken(token);

    const verificationToken = await this.verificationTokenRepository.findOne({
      where: { tokenHash, used: false },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Verification token expired');
    }

    // Mark user as verified
    await this.userRepository.update(verificationToken.userId, {
      emailVerified: true,
    });

    // Mark token as used
    await this.verificationTokenRepository.update(verificationToken.id, {
      used: true,
    });

    return { message: 'Email verified successfully' };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'emailVerified'],
    });

    if (!user) {
      return null;
    }

    const isValid = await this.passwordService.compare(password, user.password);

    if (!isValid) {
      return null;
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    return user;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    // Generate reset token
    const token = this.passwordService.generateToken();
    const tokenHash = this.passwordService.hashToken(token);

    const resetToken = this.resetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await this.resetTokenRepository.save(resetToken);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, token);

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = this.passwordService.hashToken(token);

    const resetToken = await this.resetTokenRepository.findOne({
      where: { tokenHash, used: false },
    });

    if (!resetToken) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Reset token expired');
    }

    // Hash new password
    const hashedPassword = await this.passwordService.hash(newPassword);

    // Update user password
    await this.userRepository.update(resetToken.userId, {
      password: hashedPassword,
    });

    // Mark token as used
    await this.resetTokenRepository.update(resetToken.id, {
      used: true,
    });

    return { message: 'Password reset successfully' };
  }
}
```

### Step 6: Create Auth Controller (2 hours)

```typescript
// auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // JWT token generation will be added in Phase 3
    return { message: 'Login successful', user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
```

### Step 7: Update Auth Module (30 minutes)

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { EmailService } from './services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
```

### Step 8: Add Environment Variables (15 minutes)

```bash
# services/backend/.env
RESEND_API_KEY=re_xxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

### Step 9: Test Endpoints (2 hours)

Create test file and manual testing:

```bash
# Register user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Check email inbox for verification link
# Click verification link or use token

# Verify email
curl -X POST http://localhost:4000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"xxx"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

---

## Todo List

- [ ] Install bcrypt and resend packages
- [ ] Create RegisterDto with validation
- [ ] Create LoginDto
- [ ] Create VerifyEmailDto
- [ ] Create ForgotPasswordDto
- [ ] Create ResetPasswordDto
- [ ] Implement PasswordService (hash, compare, generateToken)
- [ ] Implement EmailService (Resend integration)
- [ ] Implement AuthService.register()
- [ ] Implement AuthService.verifyEmail()
- [ ] Implement AuthService.validateUser()
- [ ] Implement AuthService.forgotPassword()
- [ ] Implement AuthService.resetPassword()
- [ ] Create AuthController with all endpoints
- [ ] Update Auth module imports
- [ ] Add Resend API key to .env
- [ ] Test registration flow
- [ ] Test email verification flow
- [ ] Test login flow
- [ ] Test password reset flow
- [ ] Write unit tests for services
- [ ] Write integration tests for endpoints

---

## Success Criteria

- ✅ User can register with email/password
- ✅ Verification email sent successfully
- ✅ Email verification works with token
- ✅ Login validates credentials correctly
- ✅ Password reset email sent
- ✅ Password reset works with token
- ✅ All DTOs validate input correctly
- ✅ Passwords hashed with bcrypt
- ✅ 80%+ test coverage
- ✅ All tests passing

---

## Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- Tokens hashed with SHA-256 before storage
- Email enumeration prevented (same response for existing/non-existing emails in forgot password)
- Tokens single-use only
- Tokens expire appropriately (24h verification, 1h reset)
- Rate limiting on auth endpoints (implement in Phase 3)
- Email verification required before login

---

## Next Steps

After completion:
1. Move to Phase 3: JWT Session Management
2. Integrate JWT tokens into login response
3. Add rate limiting middleware
4. Implement audit logging
