/**
 * Environment variable type definitions
 *
 * Provides type safety for process.env variables.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // Next.js
    readonly NODE_ENV: 'development' | 'production' | 'test'
    readonly NEXT_PUBLIC_APP_URL: string

    // API
    readonly NEXT_PUBLIC_API_URL: string
    readonly NEXT_PUBLIC_ANALYTICS_URL: string

    // Authentication
    readonly NEXT_AUTH_SECRET?: string
    readonly NEXT_AUTH_URL?: string

    // Feature Flags
    readonly NEXT_PUBLIC_ENABLE_MSW?: string
    readonly NEXT_PUBLIC_ENABLE_ANALYTICS?: string

    // Optional: Add more as needed
    readonly [key: string]: string | undefined
  }
}
