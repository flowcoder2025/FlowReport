'use client'

import { useMemo } from 'react'

interface FunnelDataItem {
  name: string
  value: number
  color?: string
}

interface FunnelChartProps {
  data: FunnelDataItem[]
  height?: number
  showPercentage?: boolean
}

import { FUNNEL_PALETTE } from '@/constants'

const DEFAULT_COLORS = FUNNEL_PALETTE

export function FunnelChart({
  data,
  height = 250,
  showPercentage = true,
}: FunnelChartProps) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []
    const maxValue = data[0].value
    return data.map((item, index) => ({
      ...item,
      percentage: maxValue > 0 ? (item.value / maxValue) * 100 : 0,
      conversionRate:
        index > 0 && data[index - 1].value > 0
          ? (item.value / data[index - 1].value) * 100
          : 100,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }))
  }, [data])

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

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex flex-col gap-2 h-full justify-center">
        {processedData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-3">
            <div className="w-24 text-sm text-right truncate">{item.name}</div>
            <div className="flex-1 relative">
              <div
                className="h-8 rounded transition-all duration-300"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                  minWidth: '40px',
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                  {formatNumber(item.value)}
                </span>
              </div>
            </div>
            {showPercentage && index > 0 && (
              <div className="w-16 text-sm text-muted-foreground">
                {item.conversionRate.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
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
