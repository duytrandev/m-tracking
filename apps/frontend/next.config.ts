import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts')
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

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

// Apply plugins in order: intl -> bundleAnalyzer -> sentry
export default withSentryConfig(
  withBundleAnalyzer(withNextIntl(nextConfig)),
  sentryWebpackPluginOptions
)
