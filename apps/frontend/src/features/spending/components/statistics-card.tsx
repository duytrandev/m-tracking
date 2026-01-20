'use client'

import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

interface StatisticsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  iconColor?: string
  delay?: number
}

export function StatisticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconColor = 'text-primary',
  delay = 0,
}: StatisticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="group relative cursor-pointer"
    >
      {/* Glass card with border glow */}
      <div className="relative overflow-hidden rounded-lg border border-border/40 bg-card/40 backdrop-blur-xl p-6 transition-all duration-300 ease-out hover:border-primary/40 hover:bg-card/60">
        {/* Glow effect on hover */}
        <div className="pointer-events-none absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/0 via-primary/10 to-accent/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative space-y-2">
          {/* Icon and title row */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <div className={`rounded-lg bg-background/50 p-2 ${iconColor}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>

          {/* Value */}
          <p className="font-heading text-3xl font-bold tracking-tight">{value}</p>

          {/* Subtitle and trend */}
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 text-sm">
              {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
              {trend && (
                <span
                  className={`flex items-center gap-1 font-medium ${
                    trend.isPositive ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
