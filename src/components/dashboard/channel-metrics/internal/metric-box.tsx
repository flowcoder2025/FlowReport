'use client'

import { cn } from '@/lib/utils'
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

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'duration':
      const hours = Math.floor(value / 60)
      const minutes = Math.round(value % 60)
      if (hours > 0) {
        return `${hours}시간 ${minutes}분`
      }
      return `${minutes}분`
    default:
      return new Intl.NumberFormat('ko-KR').format(value)
  }
}

function formatChange(change: number): string {
  if (typeof change !== 'number' || isNaN(change)) {
    return '0%'
  }
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}
