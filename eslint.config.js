import { defineConfig } from 'eslint/config'
import {
  baseRules,
  consoleAllowList,
  ignores,
  migrationRules,
  moduleBoundaryRules,
  nestjsRules,
  nxPlugin,
  reactPlugins,
  reactRecommendedRules,
  reactRules,
  testFilePatterns,
  mockFilePatterns,
  testRules,
  typescriptRules,
} from './tooling/eslint/index.js'

export default defineConfig(
  // Global ignores
  ignores,

  // Base JS & TS rules (includes Prettier)
  ...baseRules,

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
  // Files that legitimately need console (frontend paths are already full patterns)
  {
    files: consoleAllowList.map(pattern => `apps/frontend/${pattern}`),
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
    files: testFilePatterns,
    ignores: mockFilePatterns,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: testRules,
  },
  {
    files: mockFilePatterns,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: testRules,
  }
)
