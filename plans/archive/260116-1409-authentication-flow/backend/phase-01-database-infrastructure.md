# Phase 1: Database & Core Infrastructure

**Duration:** Week 1
**Priority:** Critical
**Status:** ✅ Complete (2026-01-16)
**Summary:** [phase-01-implementation-summary.md](./phase-01-implementation-summary.md)

---

## Overview

Establish database schema, TypeORM entities, Redis connections, and foundational module structure for authentication system.

---

## Context Links

- [Database Architecture](../../docs/database-architecture/index.md)
- [Backend Architecture](../../docs/backend-architecture/index.md)
- [System Architecture](../../docs/system-architecture.md)

---

## Key Insights

- Use PostgreSQL via Supabase (already configured)
- Redis for session storage and token blacklisting
- UUID primary keys for security
- Composite indexes for query optimization
- TypeORM migrations for schema versioning

---

## Requirements

### Functional Requirements
- User entity with authentication fields
- Role and permission entities for RBAC
- Session entity for multi-device tracking
- OAuth account linking entity
- Redis connection for caching

### Non-Functional Requirements
- Database migrations for version control
- Indexed queries for < 10ms lookups
- Encrypted sensitive data at rest
- Audit logging for security events

---

## Architecture

### Database Schema (PostgreSQL)

**users table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- nullable for OAuth/passwordless
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  phone VARCHAR(50),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255), -- encrypted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```

**roles table**
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- admin, user, guest
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_roles_name ON roles(name);
```

**permissions table**
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- resource:action format
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**user_roles table**
```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
```

**role_permissions table**
```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
```

**sessions table**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL, -- bcrypt hash
  device_info JSONB,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**oauth_accounts table**
```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- google, github, facebook
  provider_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON oauth_accounts(provider, provider_id);
```

**password_reset_tokens table**
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
```

**email_verification_tokens table**
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_verification_token ON email_verification_tokens(token_hash);
```

### Redis Schema

**Token Blacklist**
```
Key: blacklist:refresh:{token_hash}
Value: userId
TTL: 7 days (refresh token expiry)
```

**Rate Limiting**
```
Key: ratelimit:{endpoint}:{identifier}
Value: attempt_count
TTL: 15 minutes
```

**Session Cache**
```
Key: session:{userId}:{sessionId}
Value: JSON session data
TTL: 15 minutes (sync with access token)
```

---

## Related Code Files

### Files to Create

**Entities:**
- `services/backend/src/auth/entities/user.entity.ts`
- `services/backend/src/auth/entities/role.entity.ts`
- `services/backend/src/auth/entities/permission.entity.ts`
- `services/backend/src/auth/entities/user-role.entity.ts`
- `services/backend/src/auth/entities/role-permission.entity.ts`
- `services/backend/src/auth/entities/session.entity.ts`
- `services/backend/src/auth/entities/oauth-account.entity.ts`
- `services/backend/src/auth/entities/password-reset-token.entity.ts`
- `services/backend/src/auth/entities/email-verification-token.entity.ts`

**Migrations:**
- `services/backend/src/migrations/{timestamp}-create-users-table.ts`
- `services/backend/src/migrations/{timestamp}-create-roles-permissions.ts`
- `services/backend/src/migrations/{timestamp}-create-sessions.ts`
- `services/backend/src/migrations/{timestamp}-create-oauth-accounts.ts`
- `services/backend/src/migrations/{timestamp}-create-tokens.ts`
- `services/backend/src/migrations/{timestamp}-seed-default-roles.ts`

**Configuration:**
- `services/backend/src/shared/database/typeorm.config.ts`
- `services/backend/src/shared/redis/redis.config.ts`
- `services/backend/src/shared/redis/redis.service.ts`

**Modules:**
- `services/backend/src/auth/auth.module.ts` (update)
- `services/backend/src/shared/shared.module.ts` (update)

---

## Implementation Steps

### Step 1: Create TypeORM Entities (2 hours)

Create all entity files with proper decorators:

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ name: 'phone', nullable: true })
  phone: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', nullable: true, select: false })
  twoFactorSecret: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Role, (role) => role.users)
  roles: Role[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];
}
```

### Step 2: Generate Migrations (1 hour)

```bash
cd services/backend

# Generate migration from entities
npm run migration:generate -- src/migrations/CreateAuthTables

# Create seed migration manually
npm run migration:create -- src/migrations/SeedDefaultRoles
```

### Step 3: Configure Redis Connection (1 hour)

```typescript
// redis.config.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'redis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor(private configService: ConfigService) {
    this.client = Redis.createClient({
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASSWORD'),
    });
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }
}
```

### Step 4: Update Auth Module (30 minutes)

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Session } from './entities/session.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      Session,
      OAuthAccount,
    ]),
    SharedModule,
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class AuthModule {}
```

### Step 5: Run Migrations (30 minutes)

```bash
# Run migrations
npm run migration:run

# Verify in Supabase dashboard
# Check all tables created with proper indexes
```

### Step 6: Seed Default Data (1 hour)

Create seed migration for default roles:

```typescript
// seed-default-roles.migration.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultRoles1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default roles
    await queryRunner.query(`
      INSERT INTO roles (id, name, description) VALUES
      ('00000000-0000-0000-0000-000000000001', 'admin', 'Full system access'),
      ('00000000-0000-0000-0000-000000000002', 'user', 'Standard user access'),
      ('00000000-0000-0000-0000-000000000003', 'guest', 'Limited read-only access');
    `);

    // Insert default permissions
    await queryRunner.query(`
      INSERT INTO permissions (name, description) VALUES
      ('users:read', 'Read user data'),
      ('users:write', 'Create/update users'),
      ('users:delete', 'Delete users'),
      ('transactions:read', 'Read transactions'),
      ('transactions:write', 'Create/update transactions'),
      ('budgets:read', 'Read budgets'),
      ('budgets:write', 'Create/update budgets');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM role_permissions');
    await queryRunner.query('DELETE FROM permissions');
    await queryRunner.query('DELETE FROM user_roles');
    await queryRunner.query('DELETE FROM roles');
  }
}
```

---

## Todo List

- [ ] Create User entity with all fields
- [ ] Create Role entity
- [ ] Create Permission entity
- [ ] Create Session entity
- [ ] Create OAuthAccount entity
- [ ] Create token entities (password reset, email verification)
- [ ] Generate TypeORM migration from entities
- [ ] Configure Redis connection service
- [ ] Update Auth module imports
- [ ] Run migrations in development
- [ ] Verify tables in Supabase dashboard
- [ ] Create seed migration for default roles
- [ ] Run seed migration
- [ ] Test Redis connection
- [ ] Write unit tests for entities
- [ ] Document entity relationships

---

## Success Criteria

- ✅ All 9 tables created in PostgreSQL
- ✅ All indexes created successfully
- ✅ Redis connection working
- ✅ Default roles seeded (admin, user, guest)
- ✅ TypeORM entities compile without errors
- ✅ Migrations reversible (up/down)
- ✅ No foreign key constraint violations

---

## Risk Assessment

### Database Migration Failures
- **Risk:** Migration fails mid-execution
- **Mitigation:** Test migrations locally first, use transactions
- **Rollback:** `npm run migration:revert`

### Redis Connection Issues
- **Risk:** Redis unavailable during development
- **Mitigation:** Docker Compose health checks, connection retry logic

### Index Performance
- **Risk:** Slow queries on large datasets
- **Mitigation:** Composite indexes on frequent query patterns

---

## Security Considerations

- Password field marked with `select: false` (not fetched by default)
- Two-factor secret encrypted at rest
- OAuth tokens encrypted in database
- Session tokens stored as bcrypt hashes
- All sensitive queries use parameterized statements

---

## Next Steps

After completion:
1. Move to Phase 2: Email/Password Authentication
2. Test database schema with sample data
3. Benchmark query performance
4. Review security with team
