import { defineConfig } from 'vitest/config'
import path from 'path'
import swc from 'unplugin-swc'

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2022',
      },
      module: {
        type: 'es6',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    exclude: [],
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
