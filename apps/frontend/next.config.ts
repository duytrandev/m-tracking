import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts')

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
}

// Sentry webpack plugin options
const sentryWebpackPluginOptions = {
  // Sentry organization and project
  org: process.env.SENTRY_ORG,
  project: 'frontend',

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress logs during build
  silent: true,

  // Disable source map upload in development (enable only in production builds)
  disableServerWebpackPlugin: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
}

// Wrap with Sentry config for error tracking and performance monitoring
export default withSentryConfig(
  withNextIntl(nextConfig),
  sentryWebpackPluginOptions
)
