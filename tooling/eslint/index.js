/**
 * Shared ESLint Configurations
 *
 * This module exports reusable ESLint configuration pieces that can be
 * imported by leaf configs without inheriting broken path patterns.
 *
 * Usage in leaf configs:
 *
 * ```js
 * import { defineConfig } from 'eslint/config'
 * import {
 *   ignores,
 *   baseRules,
 *   typescriptRules,
 *   disableTypeCheckedForTests,
 *   nxPlugin,
 *   moduleBoundaryRules,
 * } from '../../tooling/eslint/index.js'
 *
 * export default defineConfig(
 *   ignores,
 *   ...baseRules,
 *   {
 *     files: ['**\/*.ts'],
 *     plugins: nxPlugin,
 *     rules: {
 *       ...typescriptRules,
 *       ...moduleBoundaryRules,
 *     },
 *   }
 * )
 * ```
 */

// Base configuration
export {
  ignores,
  baseRules,
  typescriptRules,
  disableTypeCheckedForTests,
  tseslint,
} from './base.js'

// Nx configuration
export { nxPlugin, moduleBoundaryRules } from './nx.js'

// React/Next.js configuration
export {
  reactPlugins,
  reactRecommendedRules,
  reactRules,
  consoleAllowList,
  reactHooks,
  jsxA11y,
} from './react.js'

// NestJS/Backend configuration
export {
  nestjsRules,
  migrationRules,
  sharedUtilityRules,
} from './nestjs.js'

// Testing configuration
export {
  testFilePatterns,
  mockFilePatterns,
  testRules,
  mockRules,
} from './testing.js'
