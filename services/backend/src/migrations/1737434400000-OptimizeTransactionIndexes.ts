import { MigrationInterface, QueryRunner } from 'typeorm'

export class OptimizeTransactionIndexes1737434400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for user_id + type (for expense/income filtering)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_type
        ON transactions(user_id, type);
    `)

    // Add composite index for user_id + category_id + date (for category time-series)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_category_date
        ON transactions(user_id, category_id, date);
    `)

    // Add index for description (for merchant/keyword search - using GIN for text search)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_description
        ON transactions USING gin(to_tsvector('english', description));
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_transactions_description;
    `)

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_transactions_user_category_date;
    `)

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_transactions_user_type;
    `)
  }
}
