import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm'

export class AddUsernameColumn1738534800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add username column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'username',
        type: 'varchar',
        length: '30',
        isNullable: true,
        isUnique: true,
      })
    )

    // Create index on username for faster lookups
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_USERNAME',
        columnNames: ['username'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_USERS_USERNAME')
    await queryRunner.dropColumn('users', 'username')
  }
}
