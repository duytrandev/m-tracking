import { defineConfig } from 'eslint/config'
import rootConfig from '../../eslint.config.js'
import {
  reactPlugins,
  reactRecommendedRules,
  reactRules,
  consoleAllowList,
  testRules,
} from '../../tooling/eslint/index.js'

export default defineConfig(
  // Extend root config
  rootConfig,

  // React/Frontend Configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: reactPlugins,
    rules: {
      ...reactRecommendedRules,
      ...reactRules,
    },
  },

  // Test files - relaxed rules
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/vitest.*.ts',
      'src/**/*.test.ts',
    ],
    rules: testRules,
  },

  // Mock files - relaxed rules
  {
    files: ['**/mock-data.ts', 'src/**/mock-data.ts', '**/mocks/**/*.ts'],
    rules: testRules,
  },

  // Files that legitimately need console
  {
    files: consoleAllowList,
    rules: {
      'no-console': 'off',
    },
  }
)
