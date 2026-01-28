# Database Migrations

TypeORM migrations for PostgreSQL database schema management.

## Commands

### Generate a new migration

```bash
npm run migration:generate -- src/migrations/MigrationName
```

### Create an empty migration

```bash
npm run migration:create -- src/migrations/MigrationName
```

### Run migrations

```bash
npm run migration:run
```

### Revert last migration

```bash
npm run migration:revert
```

### Show migration status

```bash
npm run migration:show
```

## Migration Naming Convention

Use the format: `{timestamp}-{descriptive-name}.ts`

Example: `1704067200000-create-users-table.ts`

## Best Practices

1. **One Logical Change Per Migration**: Keep migrations focused
2. **Test Before Committing**: Always test migrations on development database
3. **Never Edit Applied Migrations**: Create new migrations for changes
4. **Include Rollback Logic**: Ensure `down()` method properly reverts changes
5. **Use Transactions**: Wrap complex migrations in transactions

## Database Extensions

Required PostgreSQL extensions:

- TimescaleDB (time-series optimization)
- pgvector (vector similarity search for AI)

These should be enabled in Supabase dashboard.
