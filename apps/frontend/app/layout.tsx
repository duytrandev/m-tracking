import { getLocale, getMessages } from 'next-intl/server'
import { Poppins, Open_Sans } from 'next/font/google'
import Script from 'next/script'
import { Providers } from './providers'
import { themeScript } from '@/features/preferences/utils/theme-script'
import './globals.css'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const openSans = Open_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  title: 'M-Tracking - Personal Finance Management',
  description:
    'Track your expenses, manage budgets, and achieve financial goals',
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
      <body
        className={`${poppins.variable} ${openSans.variable} font-sans`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {/* FOUC Prevention - runs before React hydrates */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
