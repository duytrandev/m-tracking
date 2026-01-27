import { defineConfig } from 'eslint/config'
import rootConfig from '../../eslint.config.js'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default defineConfig(
  // Extend root config
  rootConfig,

  // React Hooks plugin
  reactHooks.configs.flat.recommended,

  // Frontend-specific rules
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
    },
    rules: {
      // Accessibility (JSX A11y recommended rules)
      ...jsxA11y.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React Hooks - SSR hydration patterns are common and valid
      'react-hooks/set-state-in-effect': 'off',
      // React Compiler not configured in this project - these warnings are noise
      'react-hooks/incompatible-library': 'off',

      // Promise handling - these are overly strict for React patterns
      // React event handlers and mutation callbacks don't need explicit void
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      // TanStack Query callbacks handle promises internally
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          ignoreVoid: true,
          ignoreIIFE: true,
        },
      ],

      // Practical TypeScript rules
      '@typescript-eslint/no-unsafe-enum-comparison': 'off', // String enums are fine
      '@typescript-eslint/require-await': 'off', // Async without await is valid for interface consistency
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
      'src/**/*.test.ts', // Explicit path
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Mock files - relaxed rules
  {
    files: ['**/mock-data.ts', 'src/**/mock-data.ts', '**/mocks/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Files that legitimately need console
  {
    files: [
      '**/safe-storage.ts',
      '**/sentry.*.config.ts',
      '**/*-error-boundary.tsx',
      '**/ui-store.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  }
)
