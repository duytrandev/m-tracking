// @ts-check
import { defineConfig } from 'eslint/config'
import rootConfig from '../../eslint.config.js'

export default defineConfig(
  // Extend root config
  rootConfig,

  // Shared library overrides
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts'],
    languageOptions: {
      globals: {
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['vitest.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
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
