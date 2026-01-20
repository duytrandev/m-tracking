import { getLocale, getMessages } from 'next-intl/server'
import { Providers } from './providers'
import './globals.css'

export const metadata = {
  title: 'M-Tracking - Personal Finance Management',
  description: 'Track your expenses, manage budgets, and achieve financial goals',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
