import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type SidebarState = 'expanded' | 'collapsed'

export interface UIState {
  theme: Theme
  sidebarState: SidebarState
  isMobileMenuOpen: boolean

  // Actions
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarState: (state: SidebarState) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarState: 'expanded',
      isMobileMenuOpen: false,

      setTheme: (theme) => set({ theme }),

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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarState: state.sidebarState,
      }),
    }
  )
)

// Selector hooks for optimized re-renders
export const useTheme = (): Theme => useUIStore((s) => s.theme)
export const useSidebarState = (): SidebarState =>
  useUIStore((s) => s.sidebarState)
export const useIsMobileMenuOpen = (): boolean =>
  useUIStore((s) => s.isMobileMenuOpen)
