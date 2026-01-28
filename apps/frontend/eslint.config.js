import { defineConfig } from 'eslint/config'
import rootConfig from '../../eslint.config.js'
import {
  reactPlugins,
  reactRecommendedRules,
  reactRules,
  consoleAllowList,
  testFilePatterns,
  mockFilePatterns,
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
    files: testFilePatterns,
    rules: testRules,
  },

  // Mock files - relaxed rules
  {
    files: mockFilePatterns,
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
