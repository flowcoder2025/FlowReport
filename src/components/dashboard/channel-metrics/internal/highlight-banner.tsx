'use client'

import { cn } from '@/lib/utils'
import { HighlightBannerProps } from '../types'
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react'

export function HighlightBanner({ highlights }: HighlightBannerProps) {
  if (!highlights || highlights.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold">주요 변화</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {highlights.map((highlight, index) => (
          <HighlightChip key={index} {...highlight} />
        ))}
      </div>
    </div>
  )
}

interface HighlightChipProps {
  channel: string
  metric: string
  change: number
  direction: 'up' | 'down'
  severity: 'positive' | 'negative' | 'neutral'
}

function HighlightChip({
  channel,
  metric,
  change,
  direction,
  severity,
}: HighlightChipProps) {
  const isPositive = severity === 'positive'
  const isNegative = severity === 'negative'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
        isPositive && 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        isNegative && 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        !isPositive && !isNegative && 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      )}
    >
      {direction === 'up' ? (
        <TrendingUp className="h-3.5 w-3.5" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5" />
      )}
      <span>
        {channel} {metric}{' '}
        <span className="font-bold">
          {typeof change === 'number' && change > 0 ? '+' : ''}
          {typeof change === 'number' ? change.toFixed(0) : '0'}%
        </span>
      </span>
    </div>
  )
}
