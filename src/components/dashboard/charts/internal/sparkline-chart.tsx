'use client'

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { STATUS_COLORS } from '@/constants'

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
