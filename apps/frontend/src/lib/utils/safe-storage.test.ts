import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import * as SafeStorage from './safe-storage'
const {
  isBrowser,
  isLocalStorageAvailable,
  isSessionStorageAvailable,
  safeLocalStorage,
  safeSessionStorage,
} = SafeStorage

describe('isBrowser', () => {
  it('should return true in browser environment', () => {
    expect(isBrowser()).toBe(true)
  })

  it('should return false when window is undefined', () => {
    const originalWindow = global.window
    // @ts-expect-error - Testing SSR environment
    delete global.window

    expect(isBrowser()).toBe(false)

    global.window = originalWindow
  })
})

describe('isLocalStorageAvailable', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return true when localStorage is available', () => {
    expect(isLocalStorageAvailable()).toBe(true)
  })

  it('should return false when localStorage throws error', () => {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('localStorage disabled')
    })

    expect(isLocalStorageAvailable()).toBe(false)

    Storage.prototype.setItem = originalSetItem
  })

  it('should return false in SSR environment', () => {
    const originalWindow = global.window
    // @ts-expect-error - Testing SSR environment
    delete global.window

    expect(isLocalStorageAvailable()).toBe(false)

    global.window = originalWindow
  })
})

describe('isSessionStorageAvailable', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('should return true when sessionStorage is available', () => {
    expect(isSessionStorageAvailable()).toBe(true)
  })

  it('should return false when sessionStorage throws error', () => {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('sessionStorage disabled')
    })

    expect(isSessionStorageAvailable()).toBe(false)

    Storage.prototype.setItem = originalSetItem
  })

  it('should return false in SSR environment', () => {
    const originalWindow = global.window
    // @ts-expect-error - Testing SSR environment
    delete global.window

    expect(isSessionStorageAvailable()).toBe(false)

    global.window = originalWindow
  })
})

describe('safeLocalStorage', () => {
  let originalSetItem: typeof Storage.prototype.setItem
  let originalGetItem: typeof Storage.prototype.getItem
  let originalRemoveItem: typeof Storage.prototype.removeItem
  let originalClear: typeof Storage.prototype.clear

  beforeEach(() => {
    // Save original methods
    originalSetItem = Storage.prototype.setItem
    originalGetItem = Storage.prototype.getItem
    originalRemoveItem = Storage.prototype.removeItem
    originalClear = Storage.prototype.clear

    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original methods after each test
    Storage.prototype.setItem = originalSetItem
    Storage.prototype.getItem = originalGetItem
    Storage.prototype.removeItem = originalRemoveItem
    Storage.prototype.clear = originalClear
  })

  describe('getItem', () => {
    it('should get item from localStorage', () => {
      localStorage.setItem('test', 'value')
      expect(safeLocalStorage.getItem('test')).toBe('value')
    })

    it('should return null for non-existent key', () => {
      expect(safeLocalStorage.getItem('nonexistent')).toBeNull()
    })

    it('should return null in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeLocalStorage.getItem('test')).toBeNull()

      global.window = originalWindow
    })

    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('Read error')
      })

      expect(safeLocalStorage.getItem('test')).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('setItem', () => {
    it('should set item in localStorage', () => {
      expect(safeLocalStorage.setItem('test', 'value')).toBe(true)
      expect(localStorage.getItem('test')).toBe('value')
    })

    it('should return false in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeLocalStorage.setItem('test', 'value')).toBe(false)

      global.window = originalWindow
    })

    it('should handle localStorage write errors gracefully', () => {
      // Simulate a browser environment where storage is blocked
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException('Access denied', 'SecurityError')
      })

      // Should return false and not throw
      expect(safeLocalStorage.setItem('test', 'value')).toBe(false)

      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      originalSetItem.call(localStorage, 'test', 'value')
      expect(safeLocalStorage.removeItem('test')).toBe(true)
      expect(originalGetItem.call(localStorage, 'test')).toBeNull()
    })

    it('should return false in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeLocalStorage.removeItem('test')).toBe(false)

      global.window = originalWindow
    })

    it('should handle localStorage remove errors gracefully', () => {
      const originalRemoveItem = Storage.prototype.removeItem
      Storage.prototype.removeItem = vi.fn(() => {
        throw new DOMException('Access denied', 'SecurityError')
      })

      // Should return false and not throw
      expect(safeLocalStorage.removeItem('test')).toBe(false)

      Storage.prototype.removeItem = originalRemoveItem
    })
  })

  describe('clear', () => {
    it('should clear all items from localStorage', () => {
      originalSetItem.call(localStorage, 'test1', 'value1')
      originalSetItem.call(localStorage, 'test2', 'value2')

      expect(safeLocalStorage.clear()).toBe(true)
      expect(localStorage.length).toBe(0)
    })

    it('should return false in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeLocalStorage.clear()).toBe(false)

      global.window = originalWindow
    })

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      Storage.prototype.clear = vi.fn(() => {
        throw new Error('Clear error')
      })

      expect(safeLocalStorage.clear()).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('getJSON', () => {
    it('should get and parse JSON from localStorage', () => {
      const data = { name: 'test', value: 123 }
      originalSetItem.call(localStorage, 'test', JSON.stringify(data))

      expect(safeLocalStorage.getJSON('test')).toEqual(data)
    })

    it('should return null for non-existent key', () => {
      expect(safeLocalStorage.getJSON('nonexistent')).toBeNull()
    })

    it('should return null for invalid JSON', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})
      originalSetItem.call(localStorage, 'test', 'invalid json {')

      expect(safeLocalStorage.getJSON('test')).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should return null in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeLocalStorage.getJSON('test')).toBeNull()

      global.window = originalWindow
    })
  })

  describe('setJSON', () => {
    it('should stringify and set JSON in localStorage', () => {
      const data = { name: 'test', value: 123 }

      expect(safeLocalStorage.setJSON('test', data)).toBe(true)
      const stored = originalGetItem.call(localStorage, 'test')
      expect(JSON.parse(stored!)).toEqual(data)
    })

    it('should return false for non-serializable values', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const circular: any = { name: 'test' }
      circular.self = circular // Create circular reference

      expect(safeLocalStorage.setJSON('test', circular)).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should return false in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeLocalStorage.setJSON('test', { value: 123 })).toBe(false)

      global.window = originalWindow
    })
  })
})

describe('safeSessionStorage', () => {
  let originalSessionSetItem: typeof Storage.prototype.setItem
  let originalSessionGetItem: typeof Storage.prototype.getItem
  let originalSessionRemoveItem: typeof Storage.prototype.removeItem
  let originalSessionClear: typeof Storage.prototype.clear

  beforeEach(() => {
    // Save original methods for sessionStorage (same prototype as localStorage)
    originalSessionSetItem = Storage.prototype.setItem
    originalSessionGetItem = Storage.prototype.getItem
    originalSessionRemoveItem = Storage.prototype.removeItem
    originalSessionClear = Storage.prototype.clear

    sessionStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original methods after each test
    Storage.prototype.setItem = originalSessionSetItem
    Storage.prototype.getItem = originalSessionGetItem
    Storage.prototype.removeItem = originalSessionRemoveItem
    Storage.prototype.clear = originalSessionClear
  })

  describe('getItem', () => {
    it('should get item from sessionStorage', () => {
      originalSessionSetItem.call(sessionStorage, 'test', 'value')
      expect(safeSessionStorage.getItem('test')).toBe('value')
    })

    it('should return null for non-existent key', () => {
      expect(safeSessionStorage.getItem('nonexistent')).toBeNull()
    })

    it('should return null in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeSessionStorage.getItem('test')).toBeNull()

      global.window = originalWindow
    })
  })

  describe('setItem', () => {
    it('should set item in sessionStorage', () => {
      expect(safeSessionStorage.setItem('test', 'value')).toBe(true)
      expect(originalSessionGetItem.call(sessionStorage, 'test')).toBe('value')
    })

    it('should return false in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeSessionStorage.setItem('test', 'value')).toBe(false)

      global.window = originalWindow
    })
  })

  describe('removeItem', () => {
    it('should remove item from sessionStorage', () => {
      originalSessionSetItem.call(sessionStorage, 'test', 'value')
      expect(safeSessionStorage.removeItem('test')).toBe(true)
      expect(originalSessionGetItem.call(sessionStorage, 'test')).toBeNull()
    })

    it('should return false in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeSessionStorage.removeItem('test')).toBe(false)

      global.window = originalWindow
    })
  })

  describe('clear', () => {
    it('should clear all items from sessionStorage', () => {
      originalSessionSetItem.call(sessionStorage, 'test1', 'value1')
      originalSessionSetItem.call(sessionStorage, 'test2', 'value2')

      expect(safeSessionStorage.clear()).toBe(true)
      expect(sessionStorage.length).toBe(0)
    })

    it('should return false in SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR environment
      delete global.window

      expect(safeSessionStorage.clear()).toBe(false)

      global.window = originalWindow
    })
  })

  describe('getJSON', () => {
    it('should get and parse JSON from sessionStorage', () => {
      const data = { name: 'test', value: 123 }
      originalSessionSetItem.call(sessionStorage, 'test', JSON.stringify(data))

      expect(safeSessionStorage.getJSON('test')).toEqual(data)
    })

    it('should return null for invalid JSON', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})
      originalSessionSetItem.call(sessionStorage, 'test', 'invalid json {')

      expect(safeSessionStorage.getJSON('test')).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('setJSON', () => {
    it('should stringify and set JSON in sessionStorage', () => {
      const data = { name: 'test', value: 123 }

      expect(safeSessionStorage.setJSON('test', data)).toBe(true)
      const stored = originalSessionGetItem.call(sessionStorage, 'test')
      expect(JSON.parse(stored!)).toEqual(data)
    })

    it('should return false for non-serializable values', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const circular: any = { name: 'test' }
      circular.self = circular

      expect(safeSessionStorage.setJSON('test', circular)).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })
})
