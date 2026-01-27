import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import nx from '@nx/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default defineConfig(
  // Global ignores
  globalIgnores([
    '**/dist',
    '**/build',
    '**/.next',
    '**/node_modules',
    '**/.nx',
    '**/coverage',
    '**/eslint.config.js',
    '**/*.js', // Ignore plain JS files (config files like postcss.config.js)
    '**/*.mjs',
    '**/*.cjs',
  ]),

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended + strict rules
  ...tseslint.configs.recommendedTypeChecked,
  tseslint.configs.recommended,
  tseslint.configs.strict,

  // Prettier - disable conflicting rules
  prettier,

  // Disable type-aware linting for spec/test files (excluded from tsconfig)
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/vitest.*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Project-specific rules for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/vitest.*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@nx': nx,
    },
    rules: {
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
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            {
              sourceTag: 'scope:frontend',
              onlyDependOnLibsWithTags: ['scope:frontend', 'scope:shared'],
            },
            {
              sourceTag: 'scope:backend',
              onlyDependOnLibsWithTags: ['scope:backend', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },

  // Frontend Overrides
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks.default || reactHooks,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      ...(reactHooks.default || reactHooks).configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          ignoreVoid: true,
          ignoreIIFE: true,
        },
      ],
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Frontend Console Allow List
  {
    files: [
      'apps/frontend/**/safe-storage.ts',
      'apps/frontend/**/sentry.*.config.ts',
      'apps/frontend/**/*-error-boundary.tsx',
      'apps/frontend/**/ui-store.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },

  // Backend Overrides
  {
    files: ['services/backend/**/*.ts'],
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowEmpty: true, allowWithDecorator: true, allowStaticOnly: true },
      ],
    },
  },

  // Backend Migrations
  {
    files: [
      'services/backend/**/migrations/**/*.ts',
      'services/backend/src/migrations/**/*.ts',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
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
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  }
)
