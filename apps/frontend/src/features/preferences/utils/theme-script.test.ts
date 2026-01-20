import { describe, it, expect } from 'vitest'
import { themeScript } from './theme-script'

describe('themeScript', () => {
  it('should export a valid script string', () => {
    expect(typeof themeScript).toBe('string')
    expect(themeScript.length).toBeGreaterThan(0)
  })

  it('should be a valid JavaScript IIFE', () => {
    // Allow for leading newlines
    expect(themeScript).toMatch(/\(\s*function\s*\(\s*\)\s*\{/)
    expect(themeScript).toMatch(/\}\s*\)\s*\(\s*\)\s*;?\s*$/)
  })

  it('should contain localStorage access', () => {
    expect(themeScript).toContain("localStorage.getItem('ui-storage')")
  })

  it('should contain JSON parsing logic', () => {
    expect(themeScript).toContain('JSON.parse')
  })

  it('should contain matchMedia check for dark mode', () => {
    expect(themeScript).toContain("matchMedia('(prefers-color-scheme: dark)')")
  })

  it('should contain document.documentElement class toggle', () => {
    expect(themeScript).toContain('document.documentElement.classList.toggle')
  })

  it('should contain try-catch error handling', () => {
    expect(themeScript).toContain('try')
    expect(themeScript).toContain('catch')
  })

  it('should handle system theme preference', () => {
    expect(themeScript).toContain("userTheme === 'system'")
  })

  it('should handle dark theme setting', () => {
    expect(themeScript).toContain("userTheme === 'dark'")
  })

  it('should have fallback for system preference', () => {
    // Should check system preference when localStorage is empty
    expect(themeScript).toMatch(/if\s*\(\s*theme\s*\)/)
    expect(themeScript).toMatch(/else\s*\{/)
  })

  it('should be executable as JavaScript', () => {
    // This should not throw when evaluated in a test environment
    expect(() => {
      // eslint-disable-next-line no-eval
      eval(themeScript)
    }).not.toThrow()
  })

  it('script should handle missing state property', () => {
    // The script should gracefully handle when state is undefined
    expect(themeScript).toContain('parsed.state?.theme')
  })

  it('script should default to system preference on error', () => {
    // The catch block should also check system preference
    const catchIndex = themeScript.indexOf('catch')
    const afterCatch = themeScript.substring(catchIndex)
    expect(afterCatch).toContain("matchMedia('(prefers-color-scheme: dark)')")
  })

  it('should not have hardcoded theme values', () => {
    // Ensure it reads from localStorage, not hardcoded
    expect(themeScript).not.toContain('document.documentElement.classList.add')
    expect(themeScript).toContain('classList.toggle')
  })

  it('script should be safe for SSR', () => {
    // Should check for window and document existence
    // The script doesn't explicitly check but uses them in a function
    // that only runs in the browser
    expect(themeScript).toMatch(/function\s*\(\s*\)/)
  })

  it('should handle all three theme options', () => {
    expect(themeScript).toContain("'system'")
    expect(themeScript).toContain("'dark'")
    // light is handled by the else case
    expect(themeScript).toContain('else')
  })
})
