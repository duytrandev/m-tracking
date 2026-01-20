import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './use-theme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should return current theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBeDefined()
    expect(['light', 'dark', 'system']).toContain(result.current.theme)
  })

  it('should return resolved theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.resolvedTheme).toBeDefined()
    expect(['light', 'dark']).toContain(result.current.resolvedTheme)
  })

  it('should provide setTheme function', () => {
    const { result } = renderHook(() => useTheme())
    expect(typeof result.current.setTheme).toBe('function')
  })

  it('should provide isDark flag', () => {
    const { result } = renderHook(() => useTheme())
    expect(typeof result.current.isDark).toBe('boolean')
  })

  it('isDark should be true when resolvedTheme is dark', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.isDark).toBe(true)
  })

  it('isDark should be false when resolvedTheme is light', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('light')
    })
    expect(result.current.isDark).toBe(false)
  })

  it('should update theme when setTheme is called', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.theme).toBe('dark')
  })

  it('should update resolvedTheme when theme changes', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('should listen for system preference changes when theme is system', async () => {
    const mediaQueryListMock = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }

    const matchMediaSpy = vi.fn(() => mediaQueryListMock)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaSpy,
    })

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('system')
    })

    // Wait for effect to run
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mediaQueryListMock.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('should remove event listener when theme is not system', async () => {
    const mediaQueryListMock = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }

    const matchMediaSpy = vi.fn(() => mediaQueryListMock)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaSpy,
    })

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('system')
    })

    // Wait for effect to run
    await new Promise((resolve) => setTimeout(resolve, 0))

    act(() => {
      result.current.setTheme('dark')
    })

    // Wait for effect to run
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mediaQueryListMock.removeEventListener).toHaveBeenCalled()
  })

  it('should handle multiple theme changes', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('light')
    })
    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.setTheme('system')
    })
    expect(result.current.theme).toBe('system')
  })

  it('should maintain consistent isDark with resolvedTheme', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.isDark).toBe(result.current.resolvedTheme === 'dark')

    act(() => {
      result.current.setTheme('light')
    })
    expect(result.current.isDark).toBe(result.current.resolvedTheme === 'dark')
  })
})
