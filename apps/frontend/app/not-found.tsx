'use client'

import Link from 'next/link'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * NotFound page (404)
 * Shown when the requested page doesn't exist
 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
