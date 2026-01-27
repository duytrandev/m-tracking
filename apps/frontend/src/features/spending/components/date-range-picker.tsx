'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  isValid,
} from 'date-fns'
import { Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Date range presets
 */
type PresetKey = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'custom'

interface Preset {
  key: PresetKey
  label: string
  getRange: () => { start: Date; end: Date }
}

const presets: Preset[] = [
  {
    key: 'today',
    label: 'Today',
    getRange: () => {
      const today = new Date()
      return { start: today, end: today }
    },
  },
  {
    key: 'last7days',
    label: 'Last 7 Days',
    getRange: () => ({
      start: subDays(new Date(), 6),
      end: new Date(),
    }),
  },
  {
    key: 'last30days',
    label: 'Last 30 Days',
    getRange: () => ({
      start: subDays(new Date(), 29),
      end: new Date(),
    }),
  },
  {
    key: 'thisMonth',
    label: 'This Month',
    getRange: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
]

/**
 * DateRangePicker component props
 */
interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onDateChange: (start: Date | null, end: Date | null) => void
  showPresets?: boolean
  className?: string
}

/**
 * DateRangePicker component
 * Allows users to select a date range with preset options or custom dates
 */
export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  showPresets = true,
  className,
}: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<PresetKey | null>(
    'last30days'
  )

  // Respect user's motion preferences
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  /**
   * Format date for input value (yyyy-MM-dd)
   */
  const formatDateForInput = (date: Date | null): string => {
    if (!date || !isValid(date)) return ''
    return format(date, 'yyyy-MM-dd')
  }

  /**
   * Handle preset selection
   */
  const handlePresetClick = (preset: Preset) => {
    const range = preset.getRange()
    setActivePreset(preset.key)
    onDateChange(range.start, range.end)
  }

  /**
   * Handle start date input change
   */
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!value) {
      onDateChange(null, endDate)
      setActivePreset('custom')
      return
    }
    const date = new Date(value)
    if (isValid(date)) {
      // Validate start <= end
      if (endDate && isAfter(date, endDate)) {
        onDateChange(date, date)
      } else {
        onDateChange(date, endDate)
      }
      setActivePreset('custom')
    }
  }

  /**
   * Handle end date input change
   */
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!value) {
      onDateChange(startDate, null)
      setActivePreset('custom')
      return
    }
    const date = new Date(value)
    if (isValid(date)) {
      // Validate start <= end
      if (startDate && isBefore(date, startDate)) {
        onDateChange(date, date)
      } else {
        onDateChange(startDate, date)
      }
      setActivePreset('custom')
    }
  }

  /**
   * Clear date selection
   */
  const handleClear = () => {
    onDateChange(null, null)
    setActivePreset(null)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preset Buttons */}
      {showPresets && (
        <div className="flex flex-wrap gap-2">
          {presets.map(preset => (
            <button
              key={preset.key}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'relative px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md cursor-pointer',
                activePreset === preset.key
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={activePreset === preset.key}
            >
              {activePreset === preset.key && (
                <motion.div
                  layoutId="date-preset-indicator"
                  className="absolute inset-0 rounded-md bg-primary/20 border border-primary/40"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 500, damping: 35 }
                  }
                />
              )}
              <span className="relative z-10">{preset.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Date Inputs */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={handleStartDateChange}
            max={formatDateForInput(endDate) || undefined}
            className={cn(
              'flex h-10 w-full rounded-md border px-3 pl-9 py-2 text-sm cursor-pointer',
              'bg-background/50 backdrop-blur-sm',
              'border-border/40',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              'transition-all duration-200'
            )}
            aria-label="Start date"
          />
        </div>

        <span className="text-muted-foreground text-sm hidden sm:block">
          to
        </span>

        <div className="relative flex-1 w-full">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={handleEndDateChange}
            min={formatDateForInput(startDate) || undefined}
            className={cn(
              'flex h-10 w-full rounded-md border px-3 pl-9 py-2 text-sm cursor-pointer',
              'bg-background/50 backdrop-blur-sm',
              'border-border/40',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              'transition-all duration-200'
            )}
            aria-label="End date"
          />
        </div>

        {/* Clear Button */}
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-10 px-2"
            aria-label="Clear date selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
