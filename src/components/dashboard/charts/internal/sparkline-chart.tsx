'use client'

import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { STATUS_COLORS } from '@/constants'
import { formatNumber } from '@/lib/utils/format'

interface SparklineChartProps {
  data: { value: number }[]
  color?: string
  height?: number
  showTrend?: boolean
}

export function SparklineChart({
  data,
  color = STATUS_COLORS.primary,
  height = 40,
  showTrend = true,
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-10 w-20 bg-muted/50 rounded" />
  }

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)

  const trendColor = showTrend && data.length >= 2
    ? data[data.length - 1].value >= data[0].value
      ? STATUS_COLORS.positive
      : STATUS_COLORS.negative
    : color

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <YAxis domain={[min * 0.9, max * 1.1]} hide />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [formatNumber(value), name]}
          labelFormatter={() => ''}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={trendColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
