'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Target,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ActionProgressData, ActionItem } from '@/lib/hooks/use-dashboard-data'

interface ActionProgressCardProps {
  data: ActionProgressData | undefined
  isLoading?: boolean
  periodType: 'WEEKLY' | 'MONTHLY'
}

const STATUS_CONFIG = {
  completed: {
    label: '완료',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/40',
    badgeVariant: 'success' as const,
  },
  in_progress: {
    label: '진행중',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeVariant: 'default' as const,
  },
  not_started: {
    label: '미시작',
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeVariant: 'warning' as const,
  },
  overdue: {
    label: '지연',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
    badgeVariant: 'destructive' as const,
  },
  canceled: {
    label: '취소',
    icon: XCircle,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    badgeVariant: 'secondary' as const,
  },
}

export function ActionProgressCard({
  data,
  isLoading = false,
  periodType,
}: ActionProgressCardProps) {
  const periodLabel = periodType === 'WEEKLY' ? '지난 주' : '지난 달'

  // Format period date for display
  const periodDateLabel = useMemo(() => {
    if (!data?.periodStart) return ''
    const date = new Date(data.periodStart)
    return format(date, periodType === 'WEEKLY' ? 'M월 d일 주' : 'yyyy년 M월', {
      locale: ko,
    })
  }, [data?.periodStart, periodType])

  // Calculate progress bar segments
  const progressSegments = useMemo(() => {
    if (!data?.stats) return { completed: 0, inProgress: 0, pending: 0 }

    const { completed, inProgress, pending, total } = data.stats
    const effectiveTotal = total - (data.stats.canceled || 0)

    if (effectiveTotal === 0) return { completed: 0, inProgress: 0, pending: 0 }

    return {
      completed: (completed / effectiveTotal) * 100,
      inProgress: (inProgress / effectiveTotal) * 100,
      pending: (pending / effectiveTotal) * 100,
    }
  }, [data?.stats])

  // Determine performance indicator
  const performanceIndicator = useMemo(() => {
    if (!data) return null

    const rate = data.completionRate
    if (rate >= 80) {
      return {
        icon: TrendingUp,
        label: '우수',
        color: 'text-green-600 dark:text-green-400',
      }
    } else if (rate >= 50) {
      return {
        icon: Target,
        label: '보통',
        color: 'text-amber-600 dark:text-amber-400',
      }
    } else {
      return {
        icon: TrendingDown,
        label: '개선 필요',
        color: 'text-red-600 dark:text-red-400',
      }
    }
  }, [data?.completionRate])

  if (isLoading) {
    return <ActionProgressCardSkeleton />
  }

  if (!data || data.items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="h-5 w-5 text-primary" />
            {periodLabel} 액션 달성률
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {periodLabel}에 설정된 액션 아이템이 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const PerformanceIcon = performanceIndicator?.icon || Target

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="h-5 w-5 text-primary" />
            {periodLabel} 액션 달성률
          </CardTitle>
          {periodDateLabel && (
            <span className="text-xs text-muted-foreground">
              {periodDateLabel}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Rate Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">
              {data.completionRate.toFixed(0)}%
            </div>
            {performanceIndicator && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  performanceIndicator.color
                )}
              >
                <PerformanceIcon className="h-4 w-4" />
                <span>{performanceIndicator.label}</span>
              </div>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {data.stats.completed}
            </span>
            /{data.stats.total - data.stats.canceled}개 완료
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="flex h-full">
              {progressSegments.completed > 0 && (
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${progressSegments.completed}%` }}
                />
              )}
              {progressSegments.inProgress > 0 && (
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${progressSegments.inProgress}%` }}
                />
              )}
              {progressSegments.pending > 0 && (
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${progressSegments.pending}%` }}
                />
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">
                완료 ({data.stats.completed})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">
                진행중 ({data.stats.inProgress})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">
                미시작 ({data.stats.pending})
              </span>
            </div>
            {data.stats.canceled > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-muted-foreground">
                  취소 ({data.stats.canceled})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Items List */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">
            액션 아이템 상세
          </p>
          <ul className="space-y-2 max-h-[200px] overflow-y-auto">
            {data.items.map((item) => (
              <ActionItemRow key={item.id} item={item} />
            ))}
          </ul>
        </div>

        {/* Learning Feedback */}
        {data.completionRate < 80 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <span className="font-medium">학습 피드백: </span>
              {data.completionRate < 50
                ? '목표 설정 시 실현 가능성을 고려해보세요. 우선순위가 높은 핵심 액션에 집중하면 달성률을 높일 수 있습니다.'
                : '좋은 진행률입니다! 미완료 항목들의 공통 원인을 분석하고 다음 주기에 반영해보세요.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ActionItemRowProps {
  item: ActionItem
}

function ActionItemRow({ item }: ActionItemRowProps) {
  const config = STATUS_CONFIG[item.status]
  const StatusIcon = config.icon

  return (
    <li className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <StatusIcon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-sm truncate',
              item.status === 'completed' && 'line-through text-muted-foreground'
            )}
          >
            {item.title}
          </p>
          <Badge variant={config.badgeVariant} className="text-[10px] px-1.5">
            {config.label}
          </Badge>
        </div>
        {item.completedAt && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {format(new Date(item.completedAt), 'M/d 완료', { locale: ko })}
          </p>
        )}
      </div>
    </li>
  )
}

function ActionProgressCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-20 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-muted animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
