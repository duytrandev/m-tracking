/**
 * Next.js ESLint configuration
 * Extends React config with Next.js-specific rules
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  extends: ['./react.js', 'next/core-web-vitals'],
  rules: {
    // Next.js specific rules
    '@next/next/no-html-link-for-pages': 'off',
  },
}
