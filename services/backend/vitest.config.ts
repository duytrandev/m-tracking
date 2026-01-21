import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.module.ts', 'src/main.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@m-tracking/common': path.resolve(__dirname, '../../libs/common/src'),
      '@m-tracking/types': path.resolve(__dirname, '../../libs/types/src'),
      '@m-tracking/utils': path.resolve(__dirname, '../../libs/utils/src'),
      '@m-tracking/constants': path.resolve(
        __dirname,
        '../../libs/constants/src'
      ),
    },
  },
})
