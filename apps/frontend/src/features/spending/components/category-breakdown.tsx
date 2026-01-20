'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { CategoryBreakdown } from '@/types/api/spending'

interface CategoryBreakdownProps {
  data: CategoryBreakdown[]
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No category data available
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.total, 0)
  const chartData = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.total / total) * 100).toFixed(1) : 0,
  }))

  return (
    <div className="space-y-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="total"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.categoryColor} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
              }}
              formatter={(value: number | undefined) => [`$${(value || 0).toFixed(2)}`, 'Total']}
            />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              formatter={(_value, entry: any) => (
                <span className="text-sm text-muted-foreground">
                  {entry.payload.categoryName} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {chartData.map((category) => (
          <div
            key={category.categoryId}
            className="flex items-center justify-between rounded-lg border border-border/40 bg-card/40 p-3 backdrop-blur-xl transition-all duration-200 hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: category.categoryColor }}
              />
              <div>
                <p className="text-sm font-medium">{category.categoryName}</p>
                <p className="text-xs text-muted-foreground">
                  {category.count} transaction{category.count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-heading text-lg font-semibold">${category.total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{category.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
