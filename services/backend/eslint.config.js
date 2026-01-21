// @ts-check
import rootConfig from '../../eslint.config.js'
import tseslint from 'typescript-eslint'

export default tseslint.config(...rootConfig, {
  files: ['**/*.ts'],
  ignores: ['**/*.spec.ts', 'vitest.config.ts', 'vitest.setup.ts'],
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-extraneous-class': [
      'error',
      { allowEmpty: false, allowWithDecorator: true },
    ],
  },
})
