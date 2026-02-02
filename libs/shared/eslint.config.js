// @ts-check
import { defineConfig } from 'eslint/config'
import rootConfig from '../../eslint.config.js'

export default defineConfig(
  // Extend root config (handles all TypeScript and test file rules)
  rootConfig,

  // Shared library specific overrides
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts'],
    languageOptions: {
      globals: {
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      // Allow utility classes with only static properties
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowStaticOnly: true },
      ],
      // Downgrade non-null assertions to warning for utility code
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  }
)
