import { defineConfig } from 'eslint/config'
import rootConfig from '../../eslint.config.js'
import {
  migrationRules,
  nestjsRules,
  sharedUtilityRules,
} from '../../tooling/eslint/index.js'

export default defineConfig(
  // Extend root config
  rootConfig,

  // Backend-specific TypeScript rules with type-aware linting
  {
    files: ['**/*.ts'],
    ignores: ['vitest.config.ts', 'vitest.setup.ts'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.ts', 'ormconfig.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: nestjsRules,
  },

  // Less strict rules for migrations
  {
    files: ['**/migrations/**/*.ts', 'src/migrations/**/*.ts'],
    rules: migrationRules,
  },

  // Less strict rules for shared utilities
  {
    files: ['**/shared/**/*.ts'],
    rules: sharedUtilityRules,
  },

  // Backend test files with type-aware linting
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.ts', 'ormconfig.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
)
