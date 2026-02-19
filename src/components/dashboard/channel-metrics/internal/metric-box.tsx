'use client'

import { cn } from '@/lib/utils'
import { formatValue as sharedFormatValue, formatDurationMinutes } from '@/lib/utils/format'
import { MetricBoxProps } from '../types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function MetricBox({
  label,
  value,
  change,
  format = 'number',
  size = 'md',
}: MetricBoxProps) {
  const formattedValue = formatValue(value, format)
  const changeDirection = change === null || change === undefined ? 'neutral' : change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  }

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className={cn('rounded-lg bg-muted/50', sizeClasses[size])}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('font-semibold', valueSizeClasses[size])}>
        {formattedValue}
      </p>
      {change !== undefined && change !== null && (
        <div className={cn(
          'flex items-center gap-1 text-xs mt-1',
          changeDirection === 'up' && 'text-green-600',
          changeDirection === 'down' && 'text-red-600',
          changeDirection === 'neutral' && 'text-muted-foreground'
        )}>
          {changeDirection === 'up' && <TrendingUp className="h-3 w-3" />}
          {changeDirection === 'down' && <TrendingDown className="h-3 w-3" />}
          {changeDirection === 'neutral' && <Minus className="h-3 w-3" />}
          <span>{formatChange(change)}</span>
        </div>
      )}
    </div>
  )
}

function formatValue(value: number | null, format: string): string {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return '-'
  }

  if (format === 'duration') {
    return formatDurationMinutes(value)
  }

  return sharedFormatValue(value, format as 'number' | 'currency' | 'percent' | 'compact')
}

function formatChange(change: number): string {
  if (typeof change !== 'number' || isNaN(change)) {
    return '0%'
  }
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}
