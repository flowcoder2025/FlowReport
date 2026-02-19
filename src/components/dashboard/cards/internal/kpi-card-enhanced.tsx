'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatValue, getNAReasonText } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SparklineChart } from '../../charts'

interface KPICardEnhancedProps {
  title: string
  value: number | null
  previousValue?: number | null
  format?: 'number' | 'currency' | 'percent'
  trendData?: { value: number }[]
  naReason?: string
  /** 목표값 (설정 시 달성률 표시) */
  target?: number | null
}

export const KPICardEnhanced = memo(function KPICardEnhanced({
  title,
  value,
  previousValue,
  format = 'number',
  trendData,
  naReason,
  target,
}: KPICardEnhancedProps) {
  if (value === null || naReason) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">N/A</div>
          {naReason && (
            <p className="text-xs text-muted-foreground">{getNAReasonText(naReason)}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const change =
    previousValue && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null
  const isPositive = change !== null && change > 0
  const isNegative = change !== null && change < 0

  // 목표 달성률 계산
  const achievementRate = target && target > 0 ? (value / target) * 100 : null
  const isTargetMet = achievementRate !== null && achievementRate >= 100

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-2xl font-bold">{formatValue(value, format)}</div>
            {change !== null && (
              <div
                className={cn(
                  'flex items-center text-xs mt-1',
                  isPositive && 'text-green-600',
                  isNegative && 'text-red-600',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : isNegative ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : (
                  <Minus className="h-3 w-3 mr-1" />
                )}
                {Math.abs(change).toFixed(1)}% vs 전기
              </div>
            )}
            {achievementRate !== null && (
              <div
                className={cn(
                  'text-xs mt-1',
                  isTargetMet ? 'text-blue-600' : 'text-orange-600'
                )}
              >
                목표 달성 {achievementRate.toFixed(0)}%
              </div>
            )}
          </div>
          {trendData && trendData.length > 1 && (
            <div className="w-20 h-10">
              <SparklineChart data={trendData} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
