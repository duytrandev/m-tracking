'use client'

import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * AuthLayout component
 * Split-screen layout for authentication pages
 * Left: Login form with white background
 * Right: Gradient showcase section
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-2/5 flex flex-col bg-white dark:bg-gray-900">
        {/* Logo/Branding */}
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5046E5] to-[#3730A3] flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              M-Tracking
            </span>
          </div>
          <ThemeToggle variant="minimal" size="sm" />
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Copyright © 2025 M-Tracking</span>
          <button
            type="button"
            className="hover:text-[#5046E5] transition-colors"
            onClick={() => {
              // TODO: Navigate to privacy policy page
            }}
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* Right Side - Gradient Showcase */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        {/* Blue Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5046E5] via-[#4338CA] to-[#3730A3]">
          {/* Decorative Circles */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16 py-24 text-white">
          <div className="max-w-xl text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Effortlessly manage your team and operations.
            </h2>
            <p className="text-lg text-white/90">
              Log in to access your CRM dashboard and manage your team.
            </p>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="w-full max-w-2xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Metric Cards */}
                <div className="bg-white/95 rounded-lg p-4 shadow-lg">
                  <div className="text-xs text-gray-600 mb-1">Total Sales</div>
                  <div className="text-2xl font-bold text-[#5046E5]">
                    $189,374
                  </div>
                  <div className="text-xs text-green-600">+8.2%</div>
                </div>
                <div className="bg-white/95 rounded-lg p-4 shadow-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    Goal Performance
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    00:01:30
                  </div>
                  <div className="h-8 mt-2">
                    <div className="w-full h-full bg-gradient-to-r from-blue-200 to-purple-200 rounded"></div>
                  </div>
                </div>
                <div className="bg-white/95 rounded-lg p-4 shadow-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    Sales Overview
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5046E5] to-[#3730A3]"></div>
                    <div>
                      <div className="text-sm font-semibold">6,248 Units</div>
                      <div className="text-xs text-gray-600">Monthly</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white/95 rounded-lg p-4 shadow-lg">
                <div className="text-sm font-semibold text-gray-900 mb-3">
                  Product Transaction
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gray-200"></div>
                        <span className="text-gray-700">
                          Order #{950001 + i}
                        </span>
                      </div>
                      <span className="text-gray-600">14 February, 2025</span>
                      <span className="font-semibold text-gray-900">$549</span>
                      <span className="text-green-600">+ Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
