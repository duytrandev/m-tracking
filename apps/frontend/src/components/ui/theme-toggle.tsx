'use client'

import { useTheme } from '@/hooks/use-theme'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Modern Theme Toggle Button Component
 *
 * Features:
 * - Smooth icon transitions with rotation and scale
 * - Respects prefers-reduced-motion
 * - Keyboard accessible (Tab + Enter/Space)
 * - Visual hover feedback
 * - High contrast in both light and dark modes
 */

interface ThemeToggleProps {
  variant?: 'default' | 'sliding' | 'minimal' | 'morphing'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ThemeToggle({
  variant = 'default',
  size = 'md',
  showLabel = false,
}: ThemeToggleProps) {
  const { setTheme, isDark } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch - standard Next.js pattern

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={`
          ${getSizeClasses(size)}
          bg-gray-200 dark:bg-gray-800
          rounded-lg animate-pulse
        `}
      />
    )
  }

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  // Render based on variant
  switch (variant) {
    case 'sliding':
      return (
        <SlidingToggle
          isDark={isDark}
          toggleTheme={toggleTheme}
          size={size}
          showLabel={showLabel}
        />
      )
    case 'minimal':
      return (
        <MinimalToggle
          isDark={isDark}
          toggleTheme={toggleTheme}
          size={size}
          showLabel={showLabel}
        />
      )
    case 'morphing':
      return (
        <MorphingToggle
          isDark={isDark}
          toggleTheme={toggleTheme}
          size={size}
          showLabel={showLabel}
        />
      )
    default:
      return (
        <DefaultToggle
          isDark={isDark}
          toggleTheme={toggleTheme}
          size={size}
          showLabel={showLabel}
        />
      )
  }
}

// Default: Icon rotation with background transition
function DefaultToggle({
  isDark,
  toggleTheme,
  size,
  showLabel,
}: {
  isDark: boolean
  toggleTheme: () => void
  size: string
  showLabel: boolean
}) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`
        group relative flex items-center gap-2
        ${getSizeClasses(size)}
        bg-gradient-to-br
        ${
          isDark
            ? 'from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800'
            : 'from-white to-gray-50 hover:from-gray-50 hover:to-gray-100'
        }
        border ${isDark ? 'border-slate-700' : 'border-gray-200'}
        rounded-lg shadow-sm hover:shadow-md
        cursor-pointer
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-400'}
        motion-reduce:transition-none
      `}
    >
      {/* Icon container with rotation */}
      <div className="relative w-5 h-5">
        <Sun
          className={`
            absolute inset-0 w-5 h-5
            text-amber-500
            transition-all duration-300 ease-out
            motion-reduce:transition-none
            ${
              isDark
                ? 'rotate-90 scale-0 opacity-0'
                : 'rotate-0 scale-100 opacity-100'
            }
          `}
        />
        <Moon
          className={`
            absolute inset-0 w-5 h-5
            text-blue-400
            transition-all duration-300 ease-out
            motion-reduce:transition-none
            ${
              isDark
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0'
            }
          `}
        />
      </div>

      {/* Optional label */}
      {showLabel && (
        <span
          className={`
          text-sm font-medium
          ${isDark ? 'text-gray-200' : 'text-gray-700'}
          transition-colors duration-300
        `}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}

// Sliding: iOS-style toggle switch
function SlidingToggle({
  isDark,
  toggleTheme,
  size: _size,
  showLabel,
}: {
  isDark: boolean
  toggleTheme: () => void
  size: string
  showLabel: boolean
}) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      role="switch"
      aria-checked={isDark}
      className={`
        group relative flex items-center gap-3
        cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-400'}
        rounded-full
      `}
    >
      {/* Track */}
      <div
        className={`
        relative w-14 h-7 rounded-full
        transition-all duration-300 ease-out
        motion-reduce:transition-none
        ${
          isDark
            ? 'bg-gradient-to-r from-blue-900 to-indigo-900'
            : 'bg-gradient-to-r from-amber-200 to-orange-200'
        }
        shadow-inner
      `}
      >
        {/* Thumb with icon */}
        <div
          className={`
          absolute top-0.5
          ${isDark ? 'left-[28px]' : 'left-0.5'}
          w-6 h-6 rounded-full
          bg-white shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          motion-reduce:transition-none
          group-hover:scale-110
        `}
        >
          <Sun
            className={`
              absolute w-3.5 h-3.5 text-amber-500
              transition-all duration-300 ease-out
              motion-reduce:transition-none
              ${isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
            `}
          />
          <Moon
            className={`
              absolute w-3.5 h-3.5 text-blue-600
              transition-all duration-300 ease-out
              motion-reduce:transition-none
              ${isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
            `}
          />
        </div>

        {/* Background icons */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <Sun className="w-3 h-3 text-amber-600/40" />
          <Moon className="w-3 h-3 text-blue-300/40" />
        </div>
      </div>

      {/* Optional label */}
      {showLabel && (
        <span
          className={`
          text-sm font-medium
          ${isDark ? 'text-gray-200' : 'text-gray-700'}
        `}
        >
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  )
}

// Minimal: Simple icon button
function MinimalToggle({
  isDark,
  toggleTheme,
  size,
  showLabel,
}: {
  isDark: boolean
  toggleTheme: () => void
  size: string
  showLabel: boolean
}) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`
        group relative flex items-center gap-2
        ${getSizeClasses(size)}
        rounded-lg
        ${
          isDark
            ? 'text-gray-200 hover:text-white hover:bg-slate-800/50'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }
        cursor-pointer
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-400'}
        motion-reduce:transition-none
      `}
    >
      <Sun
        className={`
          w-5 h-5
          transition-all duration-300 ease-out
          motion-reduce:transition-none
          ${isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        `}
      />
      <Moon
        className={`
          absolute w-5 h-5
          transition-all duration-300 ease-out
          motion-reduce:transition-none
          ${isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}
      />

      {showLabel && (
        <span className="text-sm font-medium">{isDark ? 'Dark' : 'Light'}</span>
      )}
    </button>
  )
}

// Morphing: Gradient orb that morphs between sun and moon
function MorphingToggle({
  isDark,
  toggleTheme,
  size: _size,
  showLabel: _showLabel,
}: {
  isDark: boolean
  toggleTheme: () => void
  size: string
  showLabel: boolean
}) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`
        group relative flex items-center gap-3
        cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-400'}
        rounded-lg
      `}
    >
      {/* Orb container */}
      <div
        className={`
        relative w-12 h-12 rounded-full
        bg-gradient-to-br
        ${
          isDark
            ? 'from-blue-600 via-indigo-600 to-purple-700'
            : 'from-amber-400 via-orange-400 to-yellow-500'
        }
        shadow-lg
        ${
          isDark
            ? 'shadow-blue-500/50 hover:shadow-blue-400/60'
            : 'shadow-orange-400/50 hover:shadow-orange-300/60'
        }
        transition-all duration-500 ease-out
        group-hover:scale-110
        motion-reduce:transition-none
        overflow-hidden
      `}
      >
        {/* Icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Sun
            className={`
              absolute w-6 h-6 text-white
              transition-all duration-500 ease-out
              motion-reduce:transition-none
              ${
                isDark
                  ? 'rotate-180 scale-0 opacity-0'
                  : 'rotate-0 scale-100 opacity-100'
              }
            `}
          />
          <Moon
            className={`
              absolute w-6 h-6 text-white
              transition-all duration-500 ease-out
              motion-reduce:transition-none
              ${
                isDark
                  ? 'rotate-0 scale-100 opacity-100'
                  : '-rotate-180 scale-0 opacity-0'
              }
            `}
          />
        </div>

        {/* Glow effect */}
        <div
          className={`
          absolute inset-0 rounded-full
          bg-gradient-to-br from-white/20 to-transparent
          transition-opacity duration-500
          ${isDark ? 'opacity-30' : 'opacity-50'}
        `}
        />
      </div>

      {/* Optional label */}
      {_showLabel && (
        <span
          className={`
          text-sm font-medium
          ${isDark ? 'text-gray-200' : 'text-gray-700'}
        `}
        >
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  )
}

// Helper: Size classes
function getSizeClasses(size: string): string {
  switch (size) {
    case 'sm':
      return 'px-2 py-1'
    case 'lg':
      return 'px-4 py-3'
    case 'md':
    default:
      return 'px-3 py-2'
  }
}
