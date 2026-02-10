'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface BubbleDataItem {
  name: string
  x: number
  y: number
  z: number
  color?: string
}

interface BubbleChartProps {
  data: BubbleDataItem[]
  xLabel?: string
  yLabel?: string
  height?: number
  showGrid?: boolean
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
]

export function BubbleChart({
  data,
  xLabel = 'X',
  yLabel = 'Y',
  height = 300,
  showGrid = true,
}: BubbleChartProps) {
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

  const maxZ = Math.max(...data.map((d) => d.z))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatNumber(value)}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <ZAxis
          type="number"
          dataKey="z"
          range={[50, 400]}
          domain={[0, maxZ]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={(value: number, name: string) => {
            if (name === yLabel) return [`${value.toFixed(1)}%`, name]
            return [formatNumber(value), name]
          }}
          labelFormatter={(_, payload) => {
            if (payload && payload[0]) {
              return payload[0].payload.name
            }
            return ''
          }}
        />
        <Scatter data={data} fill="#8884d8">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              fillOpacity={0.7}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}
