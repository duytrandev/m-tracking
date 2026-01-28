import { defineConfig } from 'eslint/config'
import {
  ignores,
  baseRules,
  typescriptRules,
  disableTypeCheckedForTests,
  nxPlugin,
  moduleBoundaryRules,
  reactPlugins,
  reactRecommendedRules,
  reactRules,
  consoleAllowList,
  nestjsRules,
  migrationRules,
  testRules,
} from './tooling/eslint/index.js'

export default defineConfig(
  // Global ignores
  ignores,

  // Base JS & TS rules (includes Prettier)
  ...baseRules,

  // Disable type-checked for tests
  disableTypeCheckedForTests,

  // Global TypeScript Project Service & Rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/vitest.*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: nxPlugin,
    rules: {
      ...typescriptRules,
      ...moduleBoundaryRules,
    },
  },

  // Frontend Overrides
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    plugins: reactPlugins,
    rules: {
      ...reactRecommendedRules,
      ...reactRules,
    },
  },
  {
    files: consoleAllowList.map((pattern) => `apps/frontend/${pattern}`),
    rules: { 'no-console': 'off' },
  },

  // Backend Overrides
  {
    files: ['services/backend/**/*.ts'],
    rules: nestjsRules,
  },
  {
    files: [
      'services/backend/**/migrations/**/*.ts',
      'services/backend/src/migrations/**/*.ts',
    ],
    rules: migrationRules,
  },

  // Shared Libs Overrides
  {
    files: ['libs/shared/**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowStaticOnly: true },
      ],
    },
  },

  // Tests and Mocks Overrides (Global)
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/vitest.*.ts',
      '**/mock-data.ts',
      '**/mocks/**/*.ts',
      'src/**/mock-data.ts',
      'apps/frontend/**/mock-data.ts',
      'apps/frontend/src/features/spending/mock-data.ts',
    ],
    rules: testRules,
  }
)

