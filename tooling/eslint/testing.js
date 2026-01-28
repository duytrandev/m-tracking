/**
 * Testing ESLint configuration
 *
 * Contains relaxed rules for test and mock files
 */

/**
 * File patterns for test files
 */
export const testFilePatterns = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/vitest.*.ts',
]

/**
 * File patterns for mock files
 */
export const mockFilePatterns = ['**/mock-data.ts', '**/mocks/**/*.ts']

/**
 * Relaxed rules for test files
 */
export const testRules = {
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/unbound-method': 'off',
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
}

/**
 * Relaxed rules for mock files
 */
export const mockRules = {
  '@typescript-eslint/no-non-null-assertion': 'off',
}
