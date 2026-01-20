/**
 * Shared Prettier configuration for M-Tracking
 * @type {import('prettier').Config}
 */
module.exports = {
  // Formatting
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,

  // JSX
  jsxSingleQuote: false,
  bracketSameLine: false,

  // Other
  arrowParens: 'always',
  endOfLine: 'lf',
  quoteProps: 'as-needed',

  // Plugins (add as needed)
  // plugins: ['prettier-plugin-tailwindcss'],
}
