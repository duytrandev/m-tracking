'use client'

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { DailyTrend } from '@/types/api/spending'
import { format } from 'date-fns'

interface SpendingChartProps {
  data: DailyTrend[]
  type?: 'line' | 'area'
}

export function SpendingChart({ data, type = 'area' }: SpendingChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    dateFormatted: format(new Date(item.date), 'MMM dd'),
  }))

  const ChartComponent = type === 'line' ? LineChart : AreaChart

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={formattedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />

          <XAxis
            dataKey="dateFormatted"
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
            }}
            labelStyle={{ color: '#F8FAFC', fontWeight: 600 }}
            itemStyle={{ color: '#94A3B8' }}
            formatter={(value: number | undefined) => [`$${(value || 0).toFixed(2)}`, '']}
          />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
          />

          {type === 'area' ? (
            <>
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#expenseGradient)"
                name="Expense"
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#incomeGradient)"
                name="Income"
              />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
                name="Expense"
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Income"
              />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}
