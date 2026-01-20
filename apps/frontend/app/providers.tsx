'use client'

import { NextIntlClientProvider } from 'next-intl'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/toaster'
import { MSWProvider } from '@/mocks/MSWProvider'
import { AuthInitializer } from '@/features/auth/components/auth-initializer'
import { getQueryClient } from '@/lib/query'

interface ProvidersProps {
  children: React.ReactNode
  locale: string
  messages: Record<string, unknown>
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  const queryClient = getQueryClient()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <MSWProvider>
          <AuthInitializer>
            {children}
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthInitializer>
        </MSWProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}
