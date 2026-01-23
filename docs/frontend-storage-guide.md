# Frontend Storage Guide: SSR-Safe localStorage/sessionStorage

## Overview

This guide explains how to safely use browser storage (localStorage/sessionStorage) in the M-Tracking Next.js application while avoiding Server-Side Rendering (SSR) errors.

## The Problem

Next.js uses Server-Side Rendering (SSR) by default, which means React components are rendered on the server before being hydrated on the client. Browser APIs like `localStorage` and `sessionStorage` are **not available** on the server, so directly accessing them will cause errors:

```typescript
// ❌ BAD - Causes SSR errors
const theme = localStorage.getItem('theme')

// Error: ReferenceError: localStorage is not defined
```

## The Solution

Use the provided **safe storage utilities** that include client-side guards and error handling.

## Safe Storage Utilities

Located at: `src/lib/utils/safe-storage.ts`

### Quick Start

```typescript
import { safeLocalStorage } from '@/lib/utils'

// ✅ GOOD - Safe in both SSR and browser environments
const theme = safeLocalStorage.getItem('theme')
```

### Available Utilities

#### 1. Environment Checks

```typescript
import { isBrowser, isLocalStorageAvailable } from '@/lib/utils'

// Check if running in browser (vs SSR)
if (isBrowser()) {
  console.log('Running in browser')
}

// Check if localStorage is available (handles private browsing, etc.)
if (isLocalStorageAvailable()) {
  console.log('localStorage is available')
}
```

#### 2. Safe localStorage

**Basic Operations:**

```typescript
import { safeLocalStorage } from '@/lib/utils'

// Get item (returns null if unavailable or not found)
const value = safeLocalStorage.getItem('myKey')

// Set item (returns true if successful, false otherwise)
const success = safeLocalStorage.setItem('myKey', 'myValue')

// Remove item (returns true if successful)
const removed = safeLocalStorage.removeItem('myKey')

// Clear all items
const cleared = safeLocalStorage.clear()
```

**JSON Operations:**

```typescript
import { safeLocalStorage } from '@/lib/utils'

// Store objects/arrays as JSON
interface UserPrefs {
  theme: string
  language: string
}

const prefs: UserPrefs = { theme: 'dark', language: 'en' }

// Set JSON (automatically stringifies)
safeLocalStorage.setJSON('userPrefs', prefs)

// Get JSON (automatically parses, returns null if invalid)
const stored = safeLocalStorage.getJSON<UserPrefs>('userPrefs')
if (stored) {
  console.log(stored.theme) // 'dark'
}
```

#### 3. Safe sessionStorage

Same API as `safeLocalStorage`, but uses `sessionStorage`:

```typescript
import { safeSessionStorage } from '@/lib/utils'

safeSessionStorage.setItem('tempToken', 'abc123')
const token = safeSessionStorage.getItem('tempToken')
```

## Best Practices

### 1. Use Safe Storage Utilities

**Always use the safe storage utilities** instead of directly accessing browser APIs:

```typescript
// ❌ BAD - Direct access causes SSR errors
const theme = localStorage.getItem('theme')

// ✅ GOOD - Uses safe wrapper with SSR guards
import { safeLocalStorage } from '@/lib/utils'
const theme = safeLocalStorage.getItem('theme')
```

### 2. Handle Null Returns

Safe storage utilities return `null` when storage is unavailable:

```typescript
import { safeLocalStorage } from '@/lib/utils'

const theme = safeLocalStorage.getItem('theme')

// ✅ GOOD - Handle null case
const currentTheme = theme ?? 'system' // Provide default

// ❌ BAD - Assumes value exists
const currentTheme = theme.toUpperCase() // Can throw error if null
```

### 3. Use useEffect for Side Effects

When you need to read from storage on component mount, use `useEffect`:

```typescript
import { useEffect, useState } from 'react'
import { safeLocalStorage } from '@/lib/utils'

function MyComponent() {
  const [theme, setTheme] = useState<string>('system')

  useEffect(() => {
    // Safe to access localStorage in useEffect (only runs in browser)
    const stored = safeLocalStorage.getItem('theme')
    if (stored) {
      setTheme(stored)
    }
  }, [])

  return <div>Current theme: {theme}</div>
}
```

### 4. Check Return Values

When writing to storage, check if the operation succeeded:

```typescript
import { safeLocalStorage } from '@/lib/utils'

const success = safeLocalStorage.setItem('theme', 'dark')

if (!success) {
  // Handle failure (quota exceeded, private browsing, etc.)
  console.warn('Failed to save theme preference')
  // Maybe show a toast notification to the user
}
```

### 5. Use Server Components When Possible

Next.js 16 prioritizes Server Components. Only use Client Components when you need interactivity or browser APIs:

```typescript
// ✅ GOOD - Server Component (no storage needed)
export default function ServerComponent() {
  return <div>No browser APIs needed</div>
}

// ✅ GOOD - Client Component with safe storage
'use client'
import { useEffect, useState } from 'react'
import { safeLocalStorage } from '@/lib/utils'

export default function ClientComponent() {
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    setValue(safeLocalStorage.getItem('myKey'))
  }, [])

  return <div>Value: {value}</div>
}
```

## Common Patterns

### Pattern 1: Theme Persistence (Already Implemented)

See `src/lib/store/ui-store.ts` for a complete example using Zustand with safe localStorage persistence.

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'

const safeStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(name)
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(name, value)
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
  },
}

export const useStore = create(
  persist(
    (set) => ({
      // Your state here
    }),
    {
      name: 'my-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
```

### Pattern 2: User Preferences Hook

```typescript
import { useState, useEffect } from 'react'
import { safeLocalStorage } from '@/lib/utils'

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  // Hydrate from storage on mount
  useEffect(() => {
    const stored = safeLocalStorage.getJSON<T>(key)
    if (stored !== null) {
      setValue(stored)
    }
  }, [key])

  // Persist to storage on change
  const setPersistedValue = (newValue: T) => {
    setValue(newValue)
    safeLocalStorage.setJSON(key, newValue)
  }

  return [value, setPersistedValue]
}

// Usage
function MyComponent() {
  const [prefs, setPrefs] = usePersistedState('userPrefs', {
    theme: 'system',
    language: 'en',
  })

  return (
    <button onClick={() => setPrefs({ ...prefs, theme: 'dark' })}>
      Set Dark Theme
    </button>
  )
}
```

### Pattern 3: One-Time Initialization

```typescript
import { useEffect, useRef } from 'react'
import { safeLocalStorage } from '@/lib/utils'

export function useOnceOnClient(callback: () => void) {
  const hasRun = useRef(false)

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true
      callback()
    }
  }, [callback])
}

// Usage
function MyComponent() {
  useOnceOnClient(() => {
    // This runs once on client, safe to use browser APIs
    const value = safeLocalStorage.getItem('initFlag')
    if (!value) {
      safeLocalStorage.setItem('initFlag', 'true')
      console.log('First time visitor!')
    }
  })

  return <div>Welcome</div>
}
```

## Error Handling

The safe storage utilities handle these error cases automatically:

### 1. SSR Environment

```typescript
// On server: returns null/false, no error thrown
const value = safeLocalStorage.getItem('key') // null
const success = safeLocalStorage.setItem('key', 'value') // false
```

### 2. Private Browsing Mode

Some browsers disable storage in private/incognito mode:

```typescript
// Returns null/false if storage is disabled
const value = safeLocalStorage.getItem('key') // null
```

### 3. Quota Exceeded

When storage quota is exceeded, the utilities attempt to clear and retry:

```typescript
// Automatically clears old data and retries
const success = safeLocalStorage.setItem('key', largeValue)

if (!success) {
  // Even after retry, storage failed
  console.warn('Storage quota exceeded, changes not saved')
}
```

### 4. Invalid JSON

```typescript
// Returns null if JSON parsing fails (logs warning)
const value = safeLocalStorage.getJSON('corrupted-key') // null
```

## Testing

When writing tests that use storage:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { safeLocalStorage } from '@/lib/utils'

describe('MyComponent', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear()
  })

  it('should persist user preferences', () => {
    const prefs = { theme: 'dark' }
    safeLocalStorage.setJSON('prefs', prefs)

    const stored = safeLocalStorage.getJSON('prefs')
    expect(stored).toEqual(prefs)
  })
})
```

## Migration Guide

If you have existing code that directly accesses localStorage:

### Before:

```typescript
// ❌ Old code with SSR issues
function MyComponent() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') ?? 'system' // SSR error!
  )

  const updateTheme = (newTheme: string) => {
    localStorage.setItem('theme', newTheme)
    setTheme(newTheme)
  }

  return <div>{theme}</div>
}
```

### After:

```typescript
// ✅ New code with safe storage
import { useEffect, useState } from 'react'
import { safeLocalStorage } from '@/lib/utils'

function MyComponent() {
  const [theme, setTheme] = useState<string>('system') // SSR-safe default

  // Hydrate from storage after mount
  useEffect(() => {
    const stored = safeLocalStorage.getItem('theme')
    if (stored) {
      setTheme(stored)
    }
  }, [])

  const updateTheme = (newTheme: string) => {
    if (safeLocalStorage.setItem('theme', newTheme)) {
      setTheme(newTheme)
    } else {
      console.warn('Failed to save theme preference')
    }
  }

  return <div>{theme}</div>
}
```

## Summary

**Key Takeaways:**

1. ✅ **Always use** `safeLocalStorage` / `safeSessionStorage` utilities
2. ✅ **Handle null returns** with defaults or conditionals
3. ✅ **Use useEffect** for hydration from storage on mount
4. ✅ **Check return values** when writing to storage
5. ✅ **Prefer Server Components** when browser APIs aren't needed
6. ❌ **Never access** `localStorage` or `sessionStorage` directly
7. ❌ **Don't assume** storage operations succeed

## Additional Resources

- [Next.js SSR Documentation](https://nextjs.org/docs/app/building-your-application/rendering)
- [Web Storage API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

## Questions?

If you encounter issues with storage in development:

1. Check browser console for warnings/errors
2. Verify you're using the safe storage utilities
3. Check if storage is available: `isLocalStorageAvailable()`
4. Review the test file: `src/lib/utils/safe-storage.test.ts`
