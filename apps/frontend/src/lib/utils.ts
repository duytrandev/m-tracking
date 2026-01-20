import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { sleep as sharedSleep } from '@m-tracking/utils'

/**
 * Utility function to merge Tailwind CSS classes with clsx and tailwind-merge
 * Handles conditional classes and removes duplicates/conflicts
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format error messages from various error types
 * Provides consistent error message handling across the app
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

/**
 * Sleep utility for async operations
 * Useful for testing and simulating delays
 * Re-exported from shared utilities for consistency
 */
export const sleep = sharedSleep
