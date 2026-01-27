'use client'

import { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary for ThemeProvider
 *
 * Catches errors in theme initialization and prevents app crash.
 * Falls back to default theme rendering if theme system fails.
 */
export class ThemeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging - this is intentional for error boundaries
    console.error('ThemeProvider error:', error, errorInfo)

    // In production, you might want to report this to an error tracking service
    // Example: reportError(error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      // Render fallback UI or just pass through children
      // The theme will fallback to system preference via FOUC prevention script
      return this.props.fallback || this.props.children
    }

    return this.props.children
  }
}
