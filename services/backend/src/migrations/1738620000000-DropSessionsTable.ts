import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm'

/**
 * Migration: Drop Sessions Table
 * Removes the PostgreSQL sessions table as session storage has been migrated to Redis.
 * This is a breaking change - all existing sessions will be invalidated and users must re-login.
 */
export class DropSessionsTable1738620000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint first
    const table = await queryRunner.getTable('sessions')
    if (table) {
      const foreignKey = table.foreignKeys.find(
        fk => fk.columnNames.indexOf('user_id') !== -1
      )
      if (foreignKey) {
        await queryRunner.dropForeignKey('sessions', foreignKey)
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('sessions', 'IDX_SESSIONS_USER').catch(() => {})
    await queryRunner
      .dropIndex('sessions', 'IDX_SESSIONS_TOKEN')
      .catch(() => {})
    await queryRunner
      .dropIndex('sessions', 'IDX_SESSIONS_EXPIRES')
      .catch(() => {})

    // Drop the sessions table
    await queryRunner.dropTable('sessions', true)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate sessions table
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'refresh_token_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'device_info',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'last_active_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    )

    // Recreate indexes
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_SESSIONS_USER',
        columnNames: ['user_id'],
      })
    )

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_SESSIONS_TOKEN',
        columnNames: ['refresh_token_hash'],
      })
    )

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_SESSIONS_EXPIRES',
        columnNames: ['expires_at'],
      })
    )

    // Recreate foreign key
    await queryRunner.createForeignKey(
      'sessions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    )
  }
}
