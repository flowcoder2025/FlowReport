'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatMetricByLabel, formatNumber, formatCurrency } from '@/lib/utils/format'
import { AlertTriangle, AlertCircle, Info, ChevronRight, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { RiskAlert, RiskLevel, RISK_LEVEL_STYLES } from './types'

interface RiskAlertsProps {
  alerts: RiskAlert[]
  maxVisible?: number
}

export function RiskAlerts({ alerts, maxVisible = 5 }: RiskAlertsProps) {
  const [showAll, setShowAll] = useState(false)

  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">전 부서 정상 운영 중</p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">모든 지표가 정상 범위 내에 있습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 위험 수준별 정렬 (critical > warning > info)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const order: Record<RiskLevel, number> = { critical: 0, warning: 1, info: 2 }
    return order[a.level] - order[b.level]
  })

  const visibleAlerts = showAll ? sortedAlerts : sortedAlerts.slice(0, maxVisible)
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

      {hiddenCount > 0 && !showAll && (
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={() => setShowAll(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            +{hiddenCount}개 더 보기
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {showAll && hiddenCount > 0 && (
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={() => setShowAll(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            접기
            <ChevronUp className="h-4 w-4" />
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
        alert.level === 'critical' && 'border-l-4 border-l-red-500',
        alert.level === 'warning' && 'border-l-4 border-l-yellow-500',
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
          <div className="mt-2 space-y-1">
            {alert.previousValue != null && alert.currentValue != null ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">
                  {formatRiskValue(alert.previousValue, alert.metric)}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={cn('font-semibold', styles.text)}>
                  {formatRiskValue(alert.currentValue, alert.metric)}
                </span>
                <span className={cn('font-medium', styles.text)}>
                  ({alert.value > 0 ? '+' : ''}{alert.value.toFixed(1)}%)
                </span>
              </div>
            ) : alert.currentValue != null ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{alert.metric}:</span>
                <span className={cn('font-semibold', styles.text)}>
                  {formatRiskValue(alert.currentValue, alert.metric)}
                </span>
                {alert.threshold !== undefined && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">
                      임계값: {formatMetricByLabel(alert.threshold, alert.metric)}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{alert.metric}:</span>
                <span className={cn('font-medium', styles.text)}>
                  {formatMetricByLabel(alert.value, alert.metric)}
                </span>
              </div>
            )}
            {alert.dataSource && (
              <p className="text-[10px] text-muted-foreground/70">{alert.dataSource}</p>
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

function formatRiskValue(value: number, metric: string): string {
  const lower = metric.toLowerCase()
  if (lower.includes('매출') || lower.includes('revenue') || lower.includes('금액')) {
    return formatCurrency(value)
  }
  if (lower.includes('전환율') || lower.includes('rate')) {
    return `${value.toFixed(1)}%`
  }
  return formatNumber(value)
}

