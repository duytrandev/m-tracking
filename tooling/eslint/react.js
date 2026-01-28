/**
 * React/Next.js ESLint configuration
 *
 * Contains:
 * - React Hooks rules
 * - JSX Accessibility rules
 * - Promise handling adjustments for React patterns
 */
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export const reactPlugins = {
  'jsx-a11y': jsxA11y,
  'react-hooks': reactHooks.default || reactHooks,
}

/**
 * React Hooks and JSX A11y recommended rules
 */
export const reactRecommendedRules = {
  ...jsxA11y.configs.recommended.rules,
  ...(reactHooks.default || reactHooks).configs.recommended.rules,
}

/**
 * React-specific rule overrides
 */
export const reactRules = {
  // SSR hydration patterns are common and valid
  'react-hooks/set-state-in-effect': 'off',
  // React Compiler not configured - these warnings are noise
  'react-hooks/incompatible-library': 'off',

  // Promise handling - overly strict for React patterns
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

  // Practical TypeScript rules for React
  '@typescript-eslint/no-unsafe-enum-comparison': 'off',
  '@typescript-eslint/require-await': 'off',
}

/**
 * Files that legitimately need console access in frontend
 */
export const consoleAllowList = [
  '**/safe-storage.ts',
  '**/sentry.*.config.ts',
  '**/*-error-boundary.tsx',
  '**/ui-store.ts',
]

export { reactHooks, jsxA11y }
