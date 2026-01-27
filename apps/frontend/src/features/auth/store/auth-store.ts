import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * User model interface
 * Represents authenticated user data
 */
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  roles: string[]
}

/**
 * Auth state interface
 * Manages authentication state and user session
 */
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  requires2FA: boolean
  pendingEmail?: string // For 2FA flow - stores email during verification

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setRequires2FA: (requires: boolean, email?: string) => void
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

/**
 * Global auth store using Zustand
 * Persists user info in sessionStorage (not sensitive tokens)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start loading until we check auth status
      requires2FA: false,
      pendingEmail: undefined,

      setUser: user =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: isLoading => set({ isLoading }),

      setRequires2FA: (requires2FA, pendingEmail) =>
        set({ requires2FA, pendingEmail }),

      login: user =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          requires2FA: false,
          pendingEmail: undefined,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          requires2FA: false,
          pendingEmail: undefined,
        }),

      updateUser: updates =>
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: state => ({
        // Only persist user info, not loading/auth state
        // Auth state is re-validated on app load
        user: state.user,
      }),
    }
  )
)

// Selector hooks for common patterns
export const useUser = (): User | null => useAuthStore(state => state.user)
export const useIsAuthenticated = (): boolean =>
  useAuthStore(state => state.isAuthenticated)
export const useIsAuthLoading = (): boolean =>
  useAuthStore(state => state.isLoading)
