# Database Migration Guide

## Prerequisites

1. **Environment Variables**: Copy `.env.example` to `.env` and configure database credentials:
   ```bash
   cp .env.example .env
   ```

2. **Required Variables**:
   ```env
   SUPABASE_DB_HOST=db.your-project.supabase.co
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your-database-password
   ```

## Migration Commands

### Run All Pending Migrations
```bash
npm run migration:run
```

### Revert Last Migration
```bash
npm run migration:revert
```

### Show Migration Status
```bash
npm run migration:show
```

### Generate New Migration from Entities
```bash
npm run migration:generate -- src/migrations/MigrationName
```

### Create Empty Migration
```bash
npm run migration:create -- src/migrations/MigrationName
```

## Current Migrations

1. **CreateAuthTables** (1737020000001)
   - Creates all 9 authentication tables
   - Sets up indexes and foreign keys
   - Status: Ready to run

2. **SeedDefaultRoles** (1737020000002)
   - Seeds default roles (admin, user, guest)
   - Seeds default permissions
   - Assigns permissions to roles
   - Status: Ready to run

## Migration Workflow

### First Time Setup
```bash
# 1. Configure .env file
cp .env.example .env
# Edit .env with your database credentials

# 2. Run migrations
npm run migration:run

# 3. Verify in Supabase dashboard
# Check that all tables are created
```

### Development Workflow
```bash
# 1. Make changes to entities
# 2. Generate migration
npm run migration:generate -- src/migrations/DescriptiveNameHere

# 3. Review generated migration
# Check src/migrations/ for the new file

# 4. Run migration
npm run migration:run

# 5. Test migration rollback (optional)
npm run migration:revert
npm run migration:run
```

## Troubleshooting

### Migration Fails
```bash
# Check migration status
npm run migration:show

# If migration is marked as executed but failed
# Manual rollback in Supabase SQL editor, then:
npm run migration:revert
```

### Connection Issues
```bash
# Verify database credentials
# Check Supabase project is running
# Verify SSL configuration in ormconfig.ts
```

### Reset Database (DANGER!)
```bash
# This will drop all tables - USE WITH CAUTION
npm run migration:revert  # Run multiple times to revert all
npm run migration:run     # Run migrations again
```

## Migration Best Practices

1. **Always test migrations locally first**
2. **Use transactions in migrations** (TypeORM does this automatically)
3. **Write reversible migrations** (implement both up() and down())
4. **Test migration rollback** before deploying
5. **Never edit executed migrations** - create a new one instead
6. **Include seed data in separate migrations**

## Verification

After running migrations, verify in Supabase:

1. Check all 9 tables exist:
   - users
   - roles
   - permissions
   - user_roles
   - role_permissions
   - sessions
   - oauth_accounts
   - password_reset_tokens
   - email_verification_tokens

2. Verify indexes are created (15 total)
3. Check foreign key constraints (9 total)
4. Verify seed data (3 roles, 18 permissions)

## Next Steps

After successful migration:
1. Proceed to Phase 2: Email/Password Authentication
2. Implement auth services
3. Create auth controllers
4. Write tests
