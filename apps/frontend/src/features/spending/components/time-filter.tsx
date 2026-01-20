'use client'

import { TimePeriod } from '@/types/api/spending'
import { motion } from 'motion/react'

interface TimeFilterProps {
  selected: TimePeriod
  onChange: (period: TimePeriod) => void
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: TimePeriod.DAY, label: 'Day' },
  { value: TimePeriod.WEEK, label: 'Week' },
  { value: TimePeriod.MONTH, label: 'Month' },
  { value: TimePeriod.YEAR, label: 'Year' },
]

export function TimeFilter({ selected, onChange }: TimeFilterProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border/40 bg-card/40 backdrop-blur-xl p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ease-out rounded-md ${
            selected === period.value
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={selected === period.value}
        >
          {selected === period.value && (
            <motion.div
              layoutId="time-filter-indicator"
              className="absolute inset-0 rounded-md bg-primary"
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 35,
              }}
            />
          )}
          <span className="relative z-10">{period.label}</span>
        </button>
      ))}
    </div>
  )
}
