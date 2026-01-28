/**
 * Base ESLint configuration - shared by all projects
 *
 * Contains:
 * - Global ignores
 * - JavaScript recommended rules
 * - TypeScript recommended + strict rules
 * - Prettier config
 * - Common TypeScript rules
 */
import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

/**
 * Global ignore patterns
 */
export const ignores = globalIgnores([
  '**/dist',
  '**/build',
  '**/.next',
  '**/node_modules',
  '**/.nx',
  '**/coverage',
  '**/eslint.config.js',
  '**/*.js',
  '**/*.mjs',
  '**/*.cjs',
])

/**
 * Base JavaScript/TypeScript rules
 */
export const baseRules = defineConfig(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended + strict rules
  ...tseslint.configs.recommendedTypeChecked,
  tseslint.configs.recommended,
  tseslint.configs.strict,

  // Prettier - disable conflicting rules
  prettier
)

/**
 * Common TypeScript rules for all projects
 */
export const typescriptRules = {
  'no-console': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
    },
  ],
}

/**
 * Disable type-aware linting for test/spec files
 */
export const disableTypeCheckedForTests = {
  files: ['**/*.spec.ts', '**/*.test.ts', '**/vitest.*.ts'],
  ...tseslint.configs.disableTypeChecked,
}

export { tseslint }
