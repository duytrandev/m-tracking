import type { ReactNode } from 'react'
import { AuthLayout } from '@/components/layout/auth-layout'

interface AuthPagesLayoutProps {
  children: ReactNode
}

/**
 * Layout for all authentication pages
 * Applies the split-screen design with form on left and showcase on right
 */
export default function AuthPagesLayout({ children }: AuthPagesLayoutProps) {
  return <AuthLayout>{children}</AuthLayout>
}
