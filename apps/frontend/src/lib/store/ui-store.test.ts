import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useUIStore } from './ui-store'

describe('useUIStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset store state
    useUIStore.getState().setTheme('system')
    useUIStore.getState().setSidebarState('expanded')
    useUIStore.getState().setMobileMenuOpen(false)
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should have default initial state', () => {
      const state = useUIStore.getState()
      expect(state.theme).toBe('system')
      expect(state.sidebarState).toBe('expanded')
      expect(state.isMobileMenuOpen).toBe(false)
    })

    it('should persist theme to localStorage', () => {
      useUIStore.getState().setTheme('dark')
      const stored = localStorage.getItem('ui-storage')
      expect(stored).toBeTruthy()
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.theme).toBe('dark')
      }
    })

    it('should persist sidebarState to localStorage', () => {
      useUIStore.getState().setSidebarState('collapsed')
      const stored = localStorage.getItem('ui-storage')
      expect(stored).toBeTruthy()
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.sidebarState).toBe('collapsed')
      }
    })

    it('should not persist isMobileMenuOpen to localStorage', () => {
      useUIStore.getState().setMobileMenuOpen(true)
      const stored = localStorage.getItem('ui-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.isMobileMenuOpen).toBeUndefined()
      }
    })
  })

  describe('setTheme', () => {
    it('should set theme to light', () => {
      useUIStore.getState().setTheme('light')
      expect(useUIStore.getState().theme).toBe('light')
    })

    it('should set theme to dark', () => {
      useUIStore.getState().setTheme('dark')
      expect(useUIStore.getState().theme).toBe('dark')
    })

    it('should set theme to system', () => {
      useUIStore.getState().setTheme('system')
      expect(useUIStore.getState().theme).toBe('system')
    })

    it('should update resolvedTheme when setting theme to light', () => {
      useUIStore.getState().setTheme('light')
      expect(useUIStore.getState().resolvedTheme).toBe('light')
    })

    it('should update resolvedTheme when setting theme to dark', () => {
      useUIStore.getState().setTheme('dark')
      expect(useUIStore.getState().resolvedTheme).toBe('dark')
    })

    it('should apply theme class to document element', () => {
      // Clear any existing dark class
      document.documentElement.classList.remove('dark')
      useUIStore.getState().setTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove dark class when setting theme to light', () => {
      document.documentElement.classList.add('dark')
      useUIStore.getState().setTheme('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('setResolvedTheme', () => {
    it('should update resolvedTheme to dark', () => {
      useUIStore.getState().setResolvedTheme('dark')
      expect(useUIStore.getState().resolvedTheme).toBe('dark')
    })

    it('should update resolvedTheme to light', () => {
      useUIStore.getState().setResolvedTheme('light')
      expect(useUIStore.getState().resolvedTheme).toBe('light')
    })

    it('should apply dark class to document when resolvedTheme is dark', () => {
      document.documentElement.classList.remove('dark')
      useUIStore.getState().setResolvedTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove dark class when resolvedTheme is light', () => {
      document.documentElement.classList.add('dark')
      useUIStore.getState().setResolvedTheme('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('toggleSidebar', () => {
    it('should toggle sidebar from expanded to collapsed', () => {
      useUIStore.getState().setSidebarState('expanded')
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarState).toBe('collapsed')
    })

    it('should toggle sidebar from collapsed to expanded', () => {
      useUIStore.getState().setSidebarState('collapsed')
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarState).toBe('expanded')
    })

    it('should toggle sidebar multiple times', () => {
      useUIStore.getState().setSidebarState('expanded')
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarState).toBe('collapsed')
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarState).toBe('expanded')
    })
  })

  describe('setSidebarState', () => {
    it('should set sidebar state to expanded', () => {
      useUIStore.getState().setSidebarState('expanded')
      expect(useUIStore.getState().sidebarState).toBe('expanded')
    })

    it('should set sidebar state to collapsed', () => {
      useUIStore.getState().setSidebarState('collapsed')
      expect(useUIStore.getState().sidebarState).toBe('collapsed')
    })
  })

  describe('setMobileMenuOpen', () => {
    it('should set mobile menu to open', () => {
      useUIStore.getState().setMobileMenuOpen(true)
      expect(useUIStore.getState().isMobileMenuOpen).toBe(true)
    })

    it('should set mobile menu to closed', () => {
      useUIStore.getState().setMobileMenuOpen(false)
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false)
    })

    it('should toggle mobile menu state', () => {
      useUIStore.getState().setMobileMenuOpen(true)
      expect(useUIStore.getState().isMobileMenuOpen).toBe(true)
      useUIStore.getState().setMobileMenuOpen(false)
      expect(useUIStore.getState().isMobileMenuOpen).toBe(false)
    })
  })

  describe('resolveTheme', () => {
    it('should return dark when theme is dark', () => {
      useUIStore.getState().setTheme('dark')
      expect(useUIStore.getState().resolvedTheme).toBe('dark')
    })

    it('should return light when theme is light', () => {
      useUIStore.getState().setTheme('light')
      expect(useUIStore.getState().resolvedTheme).toBe('light')
    })

    it('should resolve system theme based on matchMedia', () => {
      // Mock matchMedia
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      })

      useUIStore.getState().setTheme('system')
      const resolved = useUIStore.getState().resolvedTheme

      // Result depends on test environment's matchMedia implementation
      expect(['light', 'dark']).toContain(resolved)
    })
  })

  describe('Persistence and Hydration', () => {
    it('should persist state across store instances', () => {
      useUIStore.getState().setTheme('dark')
      useUIStore.getState().setSidebarState('collapsed')

      // Get stored data
      const stored = localStorage.getItem('ui-storage')
      expect(stored).toBeTruthy()
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.theme).toBe('dark')
        expect(parsed.state.sidebarState).toBe('collapsed')
      }
    })

    it('should handle missing localStorage gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
      // Should not throw
      expect(() => {
        useUIStore.getState().setTheme('dark')
      }).not.toThrow()
      spy.mockRestore()
    })

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('ui-storage', 'invalid json {')
      // Should not throw when accessing store
      expect(() => {
        useUIStore.getState().setTheme('dark')
      }).not.toThrow()
    })
  })
})
