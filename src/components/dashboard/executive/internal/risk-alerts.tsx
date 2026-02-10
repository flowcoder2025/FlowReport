'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { RiskAlert, RiskLevel, RISK_LEVEL_STYLES } from './types'

interface RiskAlertsProps {
  alerts: RiskAlert[]
  maxVisible?: number
}

export function RiskAlerts({ alerts, maxVisible = 5 }: RiskAlertsProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">위험 신호</h3>
        </div>
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">현재 감지된 위험 신호가 없습니다.</p>
          <p className="text-xs mt-1">모든 지표가 정상 범위 내에 있습니다.</p>
        </div>
      </div>
    )
  }

  // 위험 수준별 정렬 (critical > warning > info)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const order: Record<RiskLevel, number> = { critical: 0, warning: 1, info: 2 }
    return order[a.level] - order[b.level]
  })

  const visibleAlerts = sortedAlerts.slice(0, maxVisible)
  const hiddenCount = sortedAlerts.length - maxVisible

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold">위험 신호</h3>
          <span className="text-xs text-muted-foreground">
            ({alerts.length}개)
          </span>
        </div>
        <RiskLevelBadges alerts={alerts} />
      </div>

      <div className="space-y-3">
        {visibleAlerts.map((alert) => (
          <RiskAlertItem key={alert.id} alert={alert} />
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className="mt-4 pt-3 border-t">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            +{hiddenCount}개 더 보기
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

interface RiskLevelBadgesProps {
  alerts: RiskAlert[]
}

function RiskLevelBadges({ alerts }: RiskLevelBadgesProps) {
  const criticalCount = alerts.filter((a) => a.level === 'critical').length
  const warningCount = alerts.filter((a) => a.level === 'warning').length
  const infoCount = alerts.filter((a) => a.level === 'info').length

  return (
    <div className="flex items-center gap-2">
      {criticalCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
          <AlertTriangle className="h-3 w-3" />
          {criticalCount}
        </span>
      )}
      {warningCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          <AlertCircle className="h-3 w-3" />
          {warningCount}
        </span>
      )}
      {infoCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          <Info className="h-3 w-3" />
          {infoCount}
        </span>
      )}
    </div>
  )
}

interface RiskAlertItemProps {
  alert: RiskAlert
}

function RiskAlertItem({ alert }: RiskAlertItemProps) {
  const styles = RISK_LEVEL_STYLES[alert.level]

  const IconComponent = {
    critical: AlertTriangle,
    warning: AlertCircle,
    info: Info,
  }[alert.level]

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        styles.bg,
        styles.border,
        alert.actionUrl && 'hover:opacity-90 cursor-pointer'
      )}
    >
      <IconComponent className={cn('h-5 w-5 mt-0.5 flex-shrink-0', styles.icon)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('font-medium text-sm', styles.text)}>{alert.title}</p>
          {alert.department && (
            <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded">
              {getDepartmentLabel(alert.department)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
        {alert.metric && alert.value !== undefined && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-muted-foreground">{alert.metric}:</span>
            <span className={cn('font-medium', styles.text)}>
              {formatAlertValue(alert.value, alert.metric)}
            </span>
            {alert.threshold !== undefined && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">
                  임계값: {formatAlertValue(alert.threshold, alert.metric)}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {alert.actionUrl && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  )

  if (alert.actionUrl) {
    return <Link href={alert.actionUrl}>{content}</Link>
  }

  return content
}

function getDepartmentLabel(department: string): string {
  const labels: Record<string, string> = {
    marketing: '마케팅',
    commerce: '커머스',
    overall: '전체',
  }
  return labels[department] || department
}

function formatAlertValue(value: number, metric: string): string {
  const lowerMetric = metric.toLowerCase()

  if (lowerMetric.includes('율') || lowerMetric.includes('rate') || lowerMetric.includes('%')) {
    return `${value.toFixed(1)}%`
  }

  if (lowerMetric.includes('매출') || lowerMetric.includes('revenue') || lowerMetric.includes('금액')) {
    if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
    if (value >= 10000) return `${(value / 10000).toFixed(0)}만원`
    return `${value.toLocaleString()}원`
  }

  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
