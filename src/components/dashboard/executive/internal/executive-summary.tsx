'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatValue } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { ExecutiveKPI } from './types'

interface ExecutiveSummaryProps {
  kpis: ExecutiveKPI[]
}

export function ExecutiveSummary({ kpis }: ExecutiveSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi, index) => (
        <ExecutiveKPICard key={index} kpi={kpi} />
      ))}
    </div>
  )
}

interface ExecutiveKPICardProps {
  kpi: ExecutiveKPI
}

function ExecutiveKPICard({ kpi }: ExecutiveKPICardProps) {
  const { title, value, previousValue, targetValue, format, description } = kpi

  if (value === null) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-muted-foreground">N/A</div>
        </CardContent>
      </Card>
    )
  }

  // 변화율 계산
  const change =
    previousValue && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null

  // 목표 달성률 계산
  const targetAchievement =
    targetValue && targetValue !== 0 ? (value / targetValue) * 100 : null

  const isPositive = change !== null && change > 0
  const isNegative = change !== null && change < 0
  const isOnTarget = targetAchievement !== null && targetAchievement >= 100
  const isNearTarget = targetAchievement !== null && targetAchievement >= 80 && targetAchievement < 100

  return (
    <Card className="relative overflow-hidden">
      {/* 목표 달성률 표시 바 */}
      {targetAchievement !== null && (
        <div
          className={cn(
            'absolute top-0 left-0 h-1 transition-all',
            isOnTarget ? 'bg-green-500' : isNearTarget ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${Math.min(targetAchievement, 100)}%` }}
        />
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span>{title}</span>
          {targetValue && (
            <span className="flex items-center gap-1 text-xs">
              <Target className="h-3 w-3" />
              {formatValue(targetValue, format)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">{formatValue(value, format)}</div>

          <div className="flex items-center justify-between">
            {/* 전기 대비 변화 */}
            {change !== null && (
              <div
                className={cn(
                  'flex items-center text-sm',
                  isPositive && 'text-green-600',
                  isNegative && 'text-red-600',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : isNegative ? (
                  <TrendingDown className="h-4 w-4 mr-1" />
                ) : (
                  <Minus className="h-4 w-4 mr-1" />
                )}
                <span className="font-medium">
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1 text-xs">vs 전기</span>
              </div>
            )}

            {/* 목표 달성률 */}
            {targetAchievement !== null && (
              <div
                className={cn(
                  'text-sm font-medium px-2 py-0.5 rounded-full',
                  isOnTarget && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                  isNearTarget && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                  !isOnTarget && !isNearTarget && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                )}
              >
                {targetAchievement.toFixed(0)}% 달성
              </div>
            )}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
