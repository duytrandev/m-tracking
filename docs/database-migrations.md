# Database Migrations Guide

**Last Updated:** February 3, 2026 | **Database:** PostgreSQL 17 + TimescaleDB

---

## Overview

M-Tracking uses **TypeORM migrations** for schema versioning and data seeding. Migrations are version-controlled, idempotent, and reversible via `up()` and `down()` methods.

**Migration Directory:** `/services/backend/src/migrations/`

---

## Migration Files

| Version | Timestamp       | Migration                  | Purpose                     |
| ------- | --------------- | -------------------------- | --------------------------- |
| 1       | `1737020000001` | CreateAuthTables           | Core auth schema            |
| 2       | `1737020000002` | SeedDefaultRoles           | Default roles & permissions |
| 3       | `1737383000000` | SeedMockSpendingData       | Test data (dev only)        |
| 4       | `1737434400000` | OptimizeTransactionIndexes | Performance indexes         |
| 5       | `1738534800000` | AddUsernameColumn          | Optional username field     |

### Migration Dependencies

```
CreateAuthTables (1)
    └── SeedDefaultRoles (2)
        └── SeedMockSpendingData (3)
            └── OptimizeTransactionIndexes (4)
                └── AddUsernameColumn (5)
```

---

## Running Migrations

### From Project Root

```bash
# Navigate to backend directory first
cd services/backend

# Show pending migrations
pnpm migration:show

# Run pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Create new migration template
pnpm migration:create src/migrations/CreateExampleTable
```

### Alternative: Using pnpm filter

```bash
# From project root
pnpm --filter @m-tracking/backend migration:run
pnpm --filter @m-tracking/backend migration:show
```

---

## TypeORM Configuration

**File:** `/services/backend/ormconfig.ts`

```typescript
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  // ... credentials from env
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  ssl: enableSSL ? { rejectUnauthorized: false } : false,
  logging: process.env.NODE_ENV === 'development',
})
```

**Note:** Schema synchronization (`synchronize: true`) is NOT enabled. All schema changes must go through migrations.

---

## Creating New Migrations

### Template

```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class ExampleMigration1234567890000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'example_table',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('example_table')
  }
}
```

### Naming Convention

- **Timestamp:** Unix milliseconds (13 digits)
- **Class Name:** PascalCase + Timestamp (e.g., `CreateAuthTables1737020000001`)
- **File Name:** `{Timestamp}-{Description}.ts` (e.g., `1738534800000-AddUsernameColumn.ts`)

### Best Practices

1. Always include both `up()` and `down()` methods
2. Use descriptive names (Create, Add, Drop, Modify)
3. Use `IF NOT EXISTS` or `ON CONFLICT DO NOTHING` for idempotent operations
4. Test reversibility before committing
5. One logical change per migration

---

## Common Patterns

### Add Column

```typescript
await queryRunner.addColumn(
  'users',
  new TableColumn({
    name: 'new_field',
    type: 'varchar',
    isNullable: true,
  })
)
```

### Create Index

```typescript
await queryRunner.createIndex(
  'transactions',
  new TableIndex({
    name: 'IDX_TRANSACTIONS_DATE',
    columnNames: ['date'],
  })
)
```

### Seed Data (Idempotent)

```typescript
await queryRunner.query(`
  INSERT INTO roles (id, name, description)
  VALUES ('uuid-here', 'admin', 'Full access')
  ON CONFLICT (name) DO NOTHING;
`)
```

---

## Rollback Strategy

```bash
# Revert last migration
cd services/backend && pnpm migration:revert

# Revert multiple (run multiple times)
pnpm migration:revert && pnpm migration:revert
```

**Safe Rollback Procedure:**

1. Backup database before rollback
2. Review `down()` logic - ensure no data loss
3. Test on staging first
4. Execute rollback
5. Verify data integrity

---

## Troubleshooting

| Error                    | Cause                          | Solution                                             |
| ------------------------ | ------------------------------ | ---------------------------------------------------- |
| "Column already exists"  | Migration ran twice            | Revert, fix `down()`, re-run                         |
| "Foreign key constraint" | Deleting row with dependents   | Use `ON DELETE CASCADE` or reorder deletes           |
| "Index already exists"   | Duplicate or partial migration | Drop manually or use `IF NOT EXISTS`                 |
| "Migration not running"  | Path misconfigured             | Check `ormconfig.ts` migrations path                 |
| "Connection refused"     | Database not running           | Start PostgreSQL via `docker-compose up -d postgres` |

---

## Schema Documentation

For detailed database schema documentation, see:

- **[Authentication Schema](./authentication.md#database-schema)** - Users, sessions, OAuth, RBAC tables
- **[System Architecture](./system-architecture.md#database-schema)** - Complete schema overview

---

## References

- [TypeORM Migration Documentation](https://typeorm.io/migrations)
- [PostgreSQL 17 Docs](https://www.postgresql.org/docs/17/)
