'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, ChevronRight, Megaphone, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { DepartmentMetrics, DEPARTMENT_STATUS_STYLES } from './types'

interface DepartmentSummaryProps {
  departments: DepartmentMetrics[]
}

export function DepartmentSummary({ departments }: DepartmentSummaryProps) {
  if (!departments || departments.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold mb-4">부서별 현황</h3>
      <div className="space-y-3">
        {departments.map((dept) => (
          <DepartmentCard key={dept.slug} department={dept} />
        ))}
      </div>
    </div>
  )
}

interface DepartmentCardProps {
  department: DepartmentMetrics
}

function DepartmentCard({ department }: DepartmentCardProps) {
  const { name, slug, status, summary, keyMetric, drilldownUrl } = department
  const styles = DEPARTMENT_STATUS_STYLES[status]

  const DepartmentIcon = slug === 'marketing' ? Megaphone : ShoppingCart

  const change = keyMetric.change
  const isPositive = change !== null && change > 0
  const isNegative = change !== null && change < 0

  return (
    <Link href={drilldownUrl}>
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-sm',
          styles.bg,
          styles.border
        )}
      >
        {/* 부서 아이콘 */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
            <DepartmentIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* 부서 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{name}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', styles.badge)}>
              {getStatusLabel(status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{summary}</p>
        </div>

        {/* 핵심 지표 */}
        <div className="flex-shrink-0 text-right">
          <div className="text-sm text-muted-foreground">{keyMetric.label}</div>
          <div className="font-semibold">
            {keyMetric.value !== null
              ? formatMetricValue(keyMetric.value, keyMetric.label)
              : 'N/A'}
          </div>
          {change !== null && (
            <div
              className={cn(
                'flex items-center justify-end text-xs',
                isPositive && 'text-green-600',
                isNegative && 'text-red-600',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : isNegative ? (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              ) : (
                <Minus className="h-3 w-3 mr-0.5" />
              )}
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </div>
          )}
        </div>

        {/* 드릴다운 화살표 */}
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  )
}

function getStatusLabel(status: 'good' | 'warning' | 'critical'): string {
  const labels: Record<string, string> = {
    good: '정상',
    warning: '주의',
    critical: '위험',
  }
  return labels[status] || status
}

function formatMetricValue(value: number, label: string): string {
  const lowerLabel = label.toLowerCase()

  if (lowerLabel.includes('율') || lowerLabel.includes('rate') || lowerLabel.includes('%')) {
    return `${value.toFixed(1)}%`
  }

  if (lowerLabel.includes('매출') || lowerLabel.includes('revenue') || lowerLabel.includes('금액')) {
    if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
    if (value >= 10000) return `${(value / 10000).toFixed(0)}만원`
    return `${value.toLocaleString()}원`
  }

  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
