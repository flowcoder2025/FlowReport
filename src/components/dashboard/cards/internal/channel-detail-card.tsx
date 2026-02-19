'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatValue } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricItem {
  label: string
  value: number | null
  previousValue?: number | null
  format?: 'number' | 'currency' | 'percent' | 'duration'
}

interface ChannelDetailCardProps {
  title: string
  icon?: React.ReactNode
  metrics: MetricItem[]
  className?: string
}

export function ChannelDetailCard({
  title,
  icon,
  metrics,
  className,
}: ChannelDetailCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {metrics.map((metric, index) => (
            <MetricRow key={index} {...metric} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricRow({ label, value, previousValue, format = 'number' }: MetricItem) {
  if (value === null) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">N/A</span>
      </div>
    )
  }

  const change =
    previousValue && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null
  const isPositive = change !== null && change > 0
  const isNegative = change !== null && change < 0

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{formatValue(value, format)}</span>
        {change !== null && (
          <span
            className={cn(
              'flex items-center text-xs',
              isPositive && 'text-green-600',
              isNegative && 'text-red-600',
              !isPositive && !isNegative && 'text-muted-foreground'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
          </span>
        )}
      </div>
    </div>
  )
}
