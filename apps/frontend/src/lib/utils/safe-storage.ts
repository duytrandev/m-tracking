/**
 * Safe client-side storage utilities with SSR guards
 *
 * These utilities ensure localStorage/sessionStorage are only accessed
 * in browser environments, preventing SSR errors in Next.js.
 */
 

/**
 * Checks if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Checks if localStorage is available
 * (may be blocked in private browsing or due to security settings)
 */
export function isLocalStorageAvailable(): boolean {
  if (!isBrowser()) return false

  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Checks if sessionStorage is available
 * (may be blocked in private browsing or due to security settings)
 */
export function isSessionStorageAvailable(): boolean {
  if (!isBrowser()) return false

  try {
    const testKey = '__sessionStorage_test__'
    sessionStorage.setItem(testKey, 'test')
    sessionStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Safe localStorage wrapper with SSR guards and error handling
 */
export const safeLocalStorage = {
  /**
   * Get item from localStorage
   * @returns The stored value or null if not found/unavailable
   */
  getItem(key: string): string | null {
    if (!isLocalStorageAvailable()) return null

    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn(`Failed to read from localStorage (key: ${key}):`, error)
      return null
    }
  },

  /**
   * Set item in localStorage
   * @returns true if successful, false otherwise
   */
  setItem(key: string, value: string): boolean {
    if (!isLocalStorageAvailable()) return false

    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      // Handle quota exceeded error
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        console.warn(
          `localStorage quota exceeded (key: ${key}). Attempting to clear and retry...`
        )
        try {
          localStorage.clear()
          localStorage.setItem(key, value)
          return true
        } catch (retryError) {
          console.error(
            `Failed to save to localStorage after clearing (key: ${key}):`,
            retryError
          )
          return false
        }
      } else {
        console.error(`Failed to write to localStorage (key: ${key}):`, error)
        return false
      }
    }
  },

  /**
   * Remove item from localStorage
   * @returns true if successful, false otherwise
   */
  removeItem(key: string): boolean {
    if (!isLocalStorageAvailable()) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove from localStorage (key: ${key}):`, error)
      return false
    }
  },

  /**
   * Clear all items from localStorage
   * @returns true if successful, false otherwise
   */
  clear(): boolean {
    if (!isLocalStorageAvailable()) return false

    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  },

  /**
   * Get parsed JSON from localStorage
   * @returns The parsed value or null if not found/invalid
   */
  getJSON<T>(key: string): T | null {
    const item = this.getItem(key)
    if (!item) return null

    try {
      return JSON.parse(item) as T
    } catch (error) {
      console.warn(
        `Failed to parse JSON from localStorage (key: ${key}):`,
        error
      )
      return null
    }
  },

  /**
   * Set JSON value in localStorage
   * @returns true if successful, false otherwise
   */
  setJSON<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value)
      return this.setItem(key, serialized)
    } catch (error) {
      console.error(
        `Failed to serialize JSON for localStorage (key: ${key}):`,
        error
      )
      return false
    }
  },
}

/**
 * Safe sessionStorage wrapper with SSR guards and error handling
 */
export const safeSessionStorage = {
  /**
   * Get item from sessionStorage
   * @returns The stored value or null if not found/unavailable
   */
  getItem(key: string): string | null {
    if (!isSessionStorageAvailable()) return null

    try {
      return sessionStorage.getItem(key)
    } catch (error) {
      console.warn(`Failed to read from sessionStorage (key: ${key}):`, error)
      return null
    }
  },

  /**
   * Set item in sessionStorage
   * @returns true if successful, false otherwise
   */
  setItem(key: string, value: string): boolean {
    if (!isSessionStorageAvailable()) return false

    try {
      sessionStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Failed to write to sessionStorage (key: ${key}):`, error)
      return false
    }
  },

  /**
   * Remove item from sessionStorage
   * @returns true if successful, false otherwise
   */
  removeItem(key: string): boolean {
    if (!isSessionStorageAvailable()) return false

    try {
      sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove from sessionStorage (key: ${key}):`, error)
      return false
    }
  },

  /**
   * Clear all items from sessionStorage
   * @returns true if successful, false otherwise
   */
  clear(): boolean {
    if (!isSessionStorageAvailable()) return false

    try {
      sessionStorage.clear()
      return true
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error)
      return false
    }
  },

  /**
   * Get parsed JSON from sessionStorage
   * @returns The parsed value or null if not found/invalid
   */
  getJSON<T>(key: string): T | null {
    const item = this.getItem(key)
    if (!item) return null

    try {
      return JSON.parse(item) as T
    } catch (error) {
      console.warn(
        `Failed to parse JSON from sessionStorage (key: ${key}):`,
        error
      )
      return null
    }
  },

  /**
   * Set JSON value in sessionStorage
   * @returns true if successful, false otherwise
   */
  setJSON<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value)
      return this.setItem(key, serialized)
    } catch (error) {
      console.error(
        `Failed to serialize JSON for sessionStorage (key: ${key}):`,
        error
      )
      return false
    }
  },
}
