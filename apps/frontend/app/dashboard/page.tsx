'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/features/auth/hooks/use-auth'

/**
 * Dashboard page
 * Main landing page after authentication
 */
export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Total Balance</h3>
              <p className="mt-2 text-3xl font-bold">$0.00</p>
              <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">This Month</h3>
              <p className="mt-2 text-3xl font-bold">$0.00</p>
              <p className="mt-1 text-sm text-muted-foreground">Expenses</p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Budget Status</h3>
              <p className="mt-2 text-3xl font-bold">0%</p>
              <p className="mt-1 text-sm text-muted-foreground">On track</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Recent Transactions</h2>
            <p className="text-muted-foreground">No transactions yet. Start tracking your expenses!</p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
