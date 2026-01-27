'use client'

import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Only enable MSW if the environment variable is explicitly set to 'enabled'
    // and we are running in the browser
    if (
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
    ) {
      const initMocks = async () => {
        const { worker } = await import('./browser')
        await worker.start({
          onUnhandledRequest: 'bypass',
        })
        setIsReady(true)
      }
      void initMocks()
    } else {
      // If mocking is disabled, we are ready immediately (using real API)
      setIsReady(true)
    }
  }, [])

  if (!isReady) {
    return null // or a loading spinner
  }

  return <>{children}</>
}
