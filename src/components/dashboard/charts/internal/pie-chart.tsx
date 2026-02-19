'use client'

import { memo } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CHART_PALETTE } from '@/constants'
import { formatNumber } from '@/lib/utils/format'

interface DataItem {
  name: string
  value: number
  color?: string
}

interface PieChartProps {
  data: DataItem[]
  height?: number
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
}

const DEFAULT_COLORS = CHART_PALETTE

export const PieChart = memo(function PieChart({
  data,
  height = 250,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 80,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/50 rounded"
        style={{ height }}
      >
        <span className="text-muted-foreground">데이터 없음</span>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={(value: number, name: string) => [
            `${formatNumber(value)} (${((value / total) * 100).toFixed(1)}%)`,
            name,
          ]}
        />
        {showLegend && (
          <Legend
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
})

