import { defineConfig } from 'eslint/config'
import rootConfig from '../../eslint.config.js'

export default defineConfig(
  // Extend root config
  rootConfig,

  // Backend-specific TypeScript rules with type-aware linting
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', 'vitest.config.ts', 'vitest.setup.ts'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['ormconfig.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow I prefix for interfaces (NestJS convention)
      '@typescript-eslint/interface-name-prefix': 'off',
      // Allow decorated classes (NestJS modules, controllers, etc.)
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowEmpty: true, allowWithDecorator: true, allowStaticOnly: true },
      ],
    },
  },

  // Less strict rules for migrations
  {
    files: ['**/migrations/**/*.ts', 'src/migrations/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },

  // Less strict rules for shared utilities
  {
    files: ['**/shared/**/*.ts'],
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
    },
  }
)
