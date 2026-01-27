import { create } from 'zustand'

/**
 * Toast notification system using Zustand for state management
 * Provides imperative API for showing toast notifications
 */

export interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastState {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>(set => ({
  toasts: [],
  addToast: toast => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    set(state => ({ toasts: [...state.toasts, newToast] }))

    // Auto-remove after duration
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }))
    }, toast.duration || 5000)
  },
  removeToast: id => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }))
  },
}))

/**
 * Hook to trigger toast notifications
 * Returns a toast function to show notifications
 */
export function useToast() {
  const addToast = useToastStore(state => state.addToast)

  return {
    toast: addToast,
  }
}
