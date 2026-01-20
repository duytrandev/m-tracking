/**
 * NestJS ESLint configuration
 * Extends base with NestJS-specific rules
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // NestJS specific rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow console in backend
    'no-console': 'off',
  },
}
