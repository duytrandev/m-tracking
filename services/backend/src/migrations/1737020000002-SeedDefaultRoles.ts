import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultRoles1737020000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default roles
    await queryRunner.query(`
      INSERT INTO roles (id, name, description) VALUES
      ('00000000-0000-0000-0000-000000000001', 'admin', 'Full system access with all permissions'),
      ('00000000-0000-0000-0000-000000000002', 'user', 'Standard user access with basic permissions'),
      ('00000000-0000-0000-0000-000000000003', 'guest', 'Limited read-only access')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Insert default permissions
    await queryRunner.query(`
      INSERT INTO permissions (name, description) VALUES
      ('users:read', 'Read user data'),
      ('users:write', 'Create and update users'),
      ('users:delete', 'Delete users'),
      ('transactions:read', 'Read transactions'),
      ('transactions:write', 'Create and update transactions'),
      ('transactions:delete', 'Delete transactions'),
      ('budgets:read', 'Read budgets'),
      ('budgets:write', 'Create and update budgets'),
      ('budgets:delete', 'Delete budgets'),
      ('categories:read', 'Read categories'),
      ('categories:write', 'Create and update categories'),
      ('categories:delete', 'Delete categories'),
      ('reports:read', 'Read financial reports'),
      ('reports:generate', 'Generate financial reports'),
      ('settings:read', 'Read system settings'),
      ('settings:write', 'Modify system settings'),
      ('admin:access', 'Access admin dashboard'),
      ('admin:manage-users', 'Manage all users')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Assign permissions to admin role (all permissions)
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT
        '00000000-0000-0000-0000-000000000001' as role_id,
        id as permission_id
      FROM permissions
      ON CONFLICT DO NOTHING;
    `);

    // Assign permissions to user role (standard permissions)
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT
        '00000000-0000-0000-0000-000000000002' as role_id,
        id as permission_id
      FROM permissions
      WHERE name IN (
        'users:read',
        'transactions:read',
        'transactions:write',
        'transactions:delete',
        'budgets:read',
        'budgets:write',
        'budgets:delete',
        'categories:read',
        'categories:write',
        'reports:read',
        'reports:generate',
        'settings:read'
      )
      ON CONFLICT DO NOTHING;
    `);

    // Assign permissions to guest role (read-only)
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT
        '00000000-0000-0000-0000-000000000003' as role_id,
        id as permission_id
      FROM permissions
      WHERE name IN (
        'users:read',
        'transactions:read',
        'budgets:read',
        'categories:read',
        'reports:read'
      )
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete role permissions
    await queryRunner.query(`DELETE FROM role_permissions`);

    // Delete permissions
    await queryRunner.query(`DELETE FROM permissions`);

    // Delete user roles
    await queryRunner.query(`DELETE FROM user_roles`);

    // Delete roles
    await queryRunner.query(`DELETE FROM roles`);
  }
}
