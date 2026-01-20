'use client';

import { ErrorBoundary } from '@sentry/nextjs';

/**
 * Sentry Error Boundary Component
 *
 * Catches React errors and displays a fallback UI
 * Automatically reports errors to Sentry
 *
 * Usage:
 * ```tsx
 * import { SentryErrorBoundary } from '@/components/shared/sentry-error-boundary';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <SentryErrorBoundary>
 *       {children}
 *     </SentryErrorBoundary>
 *   );
 * }
 * ```
 */

interface SentryErrorBoundaryProps {
  children: React.ReactNode;
}

export function SentryErrorBoundary({ children }: SentryErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h2 className="text-lg font-semibold text-red-900 mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-red-700 mb-4">
                  We've been notified and are working on a fix. Please try refreshing the page or contact support if the problem persists.
                </p>
                {process.env.NEXT_PUBLIC_APP_ENV === 'development' && error ? (
                  <details className="mb-4">
                    <summary className="text-sm text-red-800 cursor-pointer font-medium">
                      Error details (development only)
                    </summary>
                    <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto max-h-32">
                      {String((error as Error).message || error)}
                    </pre>
                  </details>
                ) : null}
                <button
                  onClick={resetError}
                  className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      beforeCapture={(scope, _error, errorInfo) => {
        // Add React error info to Sentry context
        scope.setContext('react', {
          componentStack: typeof errorInfo === 'string' ? errorInfo : (errorInfo as { componentStack?: string }).componentStack || 'N/A',
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
