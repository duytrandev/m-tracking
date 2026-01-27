import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/frontend/vitest.config.ts',
  'services/backend/vitest.config.ts',
  {
    test: {
      name: 'libs/shared',
      globals: true,
      environment: 'node',
      include: ['libs/shared/**/*.spec.ts'],
      root: '.',
    },
  },
])
