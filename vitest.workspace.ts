import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/frontend/vitest.config.ts',
  'services/backend/vitest.config.ts',
  {
    test: {
      globals: true,
      environment: 'node',
      include: ['libs/**/*.spec.ts'],
    },
  },
])
