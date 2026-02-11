'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react'

interface MetricChange {
  title: string
  value: number | null
  previousValue: number | null
  format?: 'number' | 'currency' | 'percent'
}

interface HeadlineSummaryProps {
  metrics: MetricChange[]
  periodType: 'WEEKLY' | 'MONTHLY'
  className?: string
}

interface ChangePoint {
  title: string
  change: number
  direction: 'up' | 'down'
  severity: 'positive' | 'negative' | 'neutral'
}

// 지표별 변화 방향에 따른 긍정/부정 판단
const METRIC_SEVERITY_MAP: Record<string, 'higher_better' | 'lower_better'> = {
  '총 매출': 'higher_better',
  'WAU': 'higher_better',
  'MAU': 'higher_better',
  'DAU': 'higher_better',
  '회원가입': 'higher_better',
  '총 도달': 'higher_better',
  '총 참여': 'higher_better',
  '팔로워 순증': 'higher_better',
  '업로드 수': 'higher_better',
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

function getSeverity(
  title: string,
  direction: 'up' | 'down'
): 'positive' | 'negative' | 'neutral' {
  const preference = METRIC_SEVERITY_MAP[title] || 'higher_better'

  if (preference === 'higher_better') {
    return direction === 'up' ? 'positive' : 'negative'
  } else {
    return direction === 'down' ? 'positive' : 'negative'
  }
}

function extractSignificantChanges(metrics: MetricChange[]): ChangePoint[] {
  const changes: ChangePoint[] = []

  for (const metric of metrics) {
    if (metric.value === null || metric.previousValue === null || metric.previousValue === 0) {
      continue
    }

    const change = calculateChange(metric.value, metric.previousValue)
    const direction: 'up' | 'down' = change >= 0 ? 'up' : 'down'
    const severity = getSeverity(metric.title, direction)

    // 변화율 5% 이상인 경우만 포함
    if (Math.abs(change) >= 5) {
      changes.push({
        title: metric.title,
        change,
        direction,
        severity,
      })
    }
  }

  // 변화율 크기 순으로 정렬
  return changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
}

function generateSummaryText(
  changes: ChangePoint[],
  periodType: 'WEEKLY' | 'MONTHLY'
): { positive: string[]; negative: string[] } {
  const periodLabel = periodType === 'WEEKLY' ? '이번 주' : '이번 달'

  const positive: string[] = []
  const negative: string[] = []

  for (const change of changes.slice(0, 4)) {
    const changeText = `${change.title} ${Math.abs(change.change).toFixed(0)}% ${change.direction === 'up' ? '상승' : '하락'}`

    if (change.severity === 'positive') {
      positive.push(changeText)
    } else if (change.severity === 'negative') {
      negative.push(changeText)
    }
  }

  return { positive, negative }
}

export function HeadlineSummary({
  metrics,
  periodType,
  className,
}: HeadlineSummaryProps) {
  const changes = extractSignificantChanges(metrics)

  if (changes.length === 0) {
    return null
  }

  const { positive, negative } = generateSummaryText(changes, periodType)
  const periodLabel = periodType === 'WEEKLY' ? '이번 주' : '이번 달'

  // 주요 요약문 생성
  const summaryParts: string[] = []
  if (positive.length > 0) {
    summaryParts.push(positive.slice(0, 2).join(', '))
  }
  if (negative.length > 0) {
    const negativeText = negative.slice(0, 2).map(n => n + ' 주의').join(', ')
    summaryParts.push(negativeText)
  }

  const hasPositive = positive.length > 0
  const hasNegative = negative.length > 0

  return (
    <div
      className={cn(
        'rounded-lg border bg-gradient-to-r p-4',
        hasPositive && !hasNegative && 'from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800',
        hasNegative && !hasPositive && 'from-red-50 to-orange-50 border-red-200 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-800',
        hasPositive && hasNegative && 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800',
        !hasPositive && !hasNegative && 'from-gray-50 to-slate-50 border-gray-200 dark:from-gray-950/30 dark:to-slate-950/30 dark:border-gray-700',
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-foreground">{periodLabel} 핵심 요약</h3>
      </div>

      {/* 요약 문장 */}
      <div className="flex flex-wrap gap-3">
        {/* 긍정적 변화 */}
        {positive.map((item, index) => (
          <div
            key={`positive-${index}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
              'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{item}</span>
          </div>
        ))}

        {/* 부정적 변화 */}
        {negative.map((item, index) => (
          <div
            key={`negative-${index}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
              'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
            )}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{item} 주의</span>
          </div>
        ))}
      </div>

      {/* 상세 변화 목록 (3개 이상일 때만) */}
      {changes.length > 2 && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {changes.slice(2, 5).map((change, index) => (
              <span
                key={index}
                className={cn(
                  'inline-flex items-center gap-1',
                  change.severity === 'positive' && 'text-green-700 dark:text-green-400',
                  change.severity === 'negative' && 'text-red-700 dark:text-red-400'
                )}
              >
                {change.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {change.title} {Math.abs(change.change).toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
