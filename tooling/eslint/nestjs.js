/**
 * NestJS/Backend ESLint configuration
 *
 * Contains:
 * - NestJS-specific rule adjustments
 * - Migration file rules
 */

/**
 * NestJS-specific rules
 */
export const nestjsRules = {
  // Allow I prefix for interfaces (NestJS convention)
  '@typescript-eslint/interface-name-prefix': 'off',
  // Allow decorated classes (NestJS modules, controllers, etc.)
  '@typescript-eslint/no-extraneous-class': [
    'error',
    { allowEmpty: true, allowWithDecorator: true, allowStaticOnly: true },
  ],
}

/**
 * Relaxed rules for database migrations
 */
export const migrationRules = {
  'no-console': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
}

/**
 * Relaxed rules for shared/utility code that handles dynamic data
 */
export const sharedUtilityRules = {
  'no-console': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unsafe-argument': 'warn',
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/restrict-template-expressions': 'warn',
  '@typescript-eslint/no-base-to-string': 'warn',
  '@typescript-eslint/no-redundant-type-constituents': 'warn',
}
