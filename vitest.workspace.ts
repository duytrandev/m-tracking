import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/frontend/vitest.config.ts',
  'services/backend/vitest.config.ts',
  'libs/common/vitest.config.ts',
  'libs/types/vitest.config.ts',
  'libs/utils/vitest.config.ts',
  'libs/constants/vitest.config.ts',
])
