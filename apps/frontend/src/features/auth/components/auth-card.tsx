import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  showLogo?: boolean
}

export function AuthCard({ title, description, children, className, showLogo = false }: AuthCardProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="mb-8">
        {showLogo && (
          <div className="mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xl font-bold shadow-lg">
              M
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-base">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}
