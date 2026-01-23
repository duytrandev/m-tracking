import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
export type SidebarState = 'expanded' | 'collapsed'

/**
 * Safe localStorage wrapper that handles quota exceeded errors
 * and other localStorage failures gracefully.
 * Includes client-side guards for SSR compatibility.
 */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    // Guard: Only access localStorage in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null
    }

    try {
      return localStorage.getItem(name)
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return null
    }
  },
  setItem: (name, value) => {
    // Guard: Only access localStorage in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      localStorage.setItem(name, value)
    } catch (error) {
      // Handle quota exceeded error
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        console.warn('localStorage quota exceeded. Theme will not persist.')
        // Try to clear old data and retry
        try {
          localStorage.clear()
          localStorage.setItem(name, value)
        } catch (retryError) {
          console.error('Failed to save to localStorage after clearing:', retryError)
        }
      } else {
        console.error('Failed to write to localStorage:', error)
      }
    }
  },
  removeItem: (name) => {
    // Guard: Only access localStorage in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      localStorage.removeItem(name)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  },
}

export interface UIState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  sidebarState: SidebarState
  isMobileMenuOpen: boolean

  // Actions
  setTheme: (theme: Theme) => void
  setResolvedTheme: (theme: ResolvedTheme) => void
  toggleSidebar: () => void
  setSidebarState: (state: SidebarState) => void
  setMobileMenuOpen: (open: boolean) => void
}

/**
 * Resolves theme based on user preference and system setting
 */
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return 'light' // SSR fallback
  }
  return theme
}

/**
 * Applies theme to document
 */
function applyTheme(resolvedTheme: ResolvedTheme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'light',
      sidebarState: 'expanded',
      isMobileMenuOpen: false,

      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme)
        applyTheme(resolvedTheme)
        set({ theme, resolvedTheme })
      },

      setResolvedTheme: (resolvedTheme) => {
        applyTheme(resolvedTheme)
        set({ resolvedTheme })
      },

      toggleSidebar: () =>
        set((state) => ({
          sidebarState:
            state.sidebarState === 'expanded' ? 'collapsed' : 'expanded',
        })),

      setSidebarState: (sidebarState) => set({ sidebarState }),

      setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarState: state.sidebarState,
      }),
      onRehydrateStorage: () => (state) => {
        // After hydration, resolve and apply theme
        if (state) {
          const resolved = resolveTheme(state.theme)
          state.setResolvedTheme(resolved)
        }
      },
    }
  )
)

// Selector hooks for optimized re-renders
export const useTheme = (): Theme => useUIStore((s) => s.theme)
export const useResolvedTheme = (): ResolvedTheme =>
  useUIStore((s) => s.resolvedTheme)
export const useSidebarState = (): SidebarState =>
  useUIStore((s) => s.sidebarState)
export const useIsMobileMenuOpen = (): boolean =>
  useUIStore((s) => s.isMobileMenuOpen)
