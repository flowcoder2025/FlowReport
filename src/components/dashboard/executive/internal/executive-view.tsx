'use client'

import { useMemo } from 'react'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics } from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../../skeleton'
import { ExecutiveSummary } from './executive-summary'
import { RiskAlerts } from './risk-alerts'
import { DepartmentSummary } from './department-summary'
import {
  ExecutiveKPI,
  RiskAlert,
  DepartmentMetrics,
  RiskLevel,
} from './types'
import { Clock, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { DEFAULT_TARGETS } from '@/constants/targets'

// 임계값 상수
const THRESHOLDS = {
  REVENUE_DECLINE_CRITICAL: -20,
  REVENUE_DECLINE_WARNING: -10,
  ENGAGEMENT_DECLINE_CRITICAL: -30,
  ENGAGEMENT_DECLINE_WARNING: -15,
  CONVERSION_CRITICAL: 1.0,
  CONVERSION_WARNING: 2.0,
} as const

export function ExecutiveView() {
  const { workspaceId, periodType, periodStart, selectedChannels } = useDashboardContext()

  const channelsParam = selectedChannels.length > 0 ? selectedChannels : undefined
  const { data: metrics, error, isLoading, mutate } = useDashboardMetrics(
    workspaceId,
    periodType,
    periodStart,
    channelsParam
  )

  // Executive KPIs 계산 (매출, 활성사용자, 성장률)
  const executiveKPIs: ExecutiveKPI[] = useMemo(() => {
    if (!metrics) return []

    const overview = metrics.overview
    const previous = metrics.previous

    // 성장률 계산 (매출 기준)
    const revenueGrowthRate =
      previous?.totalRevenue && previous.totalRevenue !== 0
        ? ((overview.totalRevenue ?? 0) - previous.totalRevenue) / previous.totalRevenue * 100
        : null

    return [
      {
        title: '총 매출',
        value: overview.totalRevenue,
        previousValue: previous?.totalRevenue ?? null,
        targetValue: calculateTarget(overview.totalRevenue, previous?.totalRevenue),
        format: 'currency' as const,
        description: '전 채널 합산',
      },
      {
        title: periodType === 'WEEKLY' ? 'WAU (주간 활성사용자)' : 'MAU (월간 활성사용자)',
        value: periodType === 'WEEKLY' ? overview.wau : overview.mau,
        previousValue: periodType === 'WEEKLY' ? previous?.wau : previous?.mau,
        targetValue: null,
        format: 'number' as const,
        description: '중복 제거 기준',
      },
      {
        title: '성장률',
        value: revenueGrowthRate !== null ? revenueGrowthRate : null,
        previousValue: null,
        // TODO: workspace 설정 API 연결 시 동적 값으로 교체
        targetValue: DEFAULT_TARGETS.REVENUE_GROWTH_RATE,
        format: 'percent' as const,
        description: '매출 기준 전기 대비',
      },
    ]
  }, [metrics, periodType])

  // 위험 신호 분석
  const riskAlerts: RiskAlert[] = useMemo(() => {
    if (!metrics) return []

    const alerts: RiskAlert[] = []
    const overview = metrics.overview
    const previous = metrics.previous
    const channelDetails = metrics.channelDetails

    // 매출 하락 체크
    if (previous?.totalRevenue && overview.totalRevenue !== null) {
      const revenueChange = ((overview.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100

      if (revenueChange <= THRESHOLDS.REVENUE_DECLINE_CRITICAL) {
        alerts.push({
          id: 'revenue-critical',
          level: 'critical',
          title: '매출 급락 경고',
          description: `전기 대비 매출이 ${Math.abs(revenueChange).toFixed(1)}% 감소했습니다.`,
          metric: '매출 변화율',
          value: revenueChange,
          threshold: THRESHOLDS.REVENUE_DECLINE_CRITICAL,
          department: 'commerce',
          actionUrl: '/dashboard?view=commerce',
        })
      } else if (revenueChange <= THRESHOLDS.REVENUE_DECLINE_WARNING) {
        alerts.push({
          id: 'revenue-warning',
          level: 'warning',
          title: '매출 하락 주의',
          description: `전기 대비 매출이 ${Math.abs(revenueChange).toFixed(1)}% 감소했습니다.`,
          metric: '매출 변화율',
          value: revenueChange,
          threshold: THRESHOLDS.REVENUE_DECLINE_WARNING,
          department: 'commerce',
          actionUrl: '/dashboard?view=commerce',
        })
      }
    }

    // 참여도 하락 체크
    if (previous?.engagement && overview.engagement !== null) {
      const engagementChange = ((overview.engagement - previous.engagement) / previous.engagement) * 100

      if (engagementChange <= THRESHOLDS.ENGAGEMENT_DECLINE_CRITICAL) {
        alerts.push({
          id: 'engagement-critical',
          level: 'critical',
          title: '참여도 급락 경고',
          description: `전기 대비 참여도가 ${Math.abs(engagementChange).toFixed(1)}% 감소했습니다.`,
          metric: '참여 변화율',
          value: engagementChange,
          threshold: THRESHOLDS.ENGAGEMENT_DECLINE_CRITICAL,
          department: 'marketing',
          actionUrl: '/dashboard?view=performance',
        })
      } else if (engagementChange <= THRESHOLDS.ENGAGEMENT_DECLINE_WARNING) {
        alerts.push({
          id: 'engagement-warning',
          level: 'warning',
          title: '참여도 하락 주의',
          description: `전기 대비 참여도가 ${Math.abs(engagementChange).toFixed(1)}% 감소했습니다.`,
          metric: '참여 변화율',
          value: engagementChange,
          threshold: THRESHOLDS.ENGAGEMENT_DECLINE_WARNING,
          department: 'marketing',
          actionUrl: '/dashboard?view=performance',
        })
      }
    }

    // 전환율 체크 (스마트스토어)
    if (channelDetails?.SMARTSTORE?.conversionRate !== null && channelDetails?.SMARTSTORE?.conversionRate !== undefined) {
      const convRate = channelDetails.SMARTSTORE.conversionRate

      if (convRate < THRESHOLDS.CONVERSION_CRITICAL) {
        alerts.push({
          id: 'conversion-critical',
          level: 'critical',
          title: '전환율 위험',
          description: '스마트스토어 전환율이 위험 수준입니다.',
          metric: '전환율',
          value: convRate,
          threshold: THRESHOLDS.CONVERSION_CRITICAL,
          department: 'commerce',
          actionUrl: '/dashboard?view=commerce',
        })
      } else if (convRate < THRESHOLDS.CONVERSION_WARNING) {
        alerts.push({
          id: 'conversion-warning',
          level: 'warning',
          title: '전환율 주의',
          description: '스마트스토어 전환율이 낮습니다.',
          metric: '전환율',
          value: convRate,
          threshold: THRESHOLDS.CONVERSION_WARNING,
          department: 'commerce',
          actionUrl: '/dashboard?view=commerce',
        })
      }
    }

    // 하이라이트에서 추가 인사이트 추출
    const negativeHighlights = metrics.highlights?.filter(
      (h) => h.severity === 'negative' && Math.abs(h.change) > 20
    ) || []

    negativeHighlights.forEach((highlight, idx) => {
      const existingAlert = alerts.find(
        (a) => a.title.includes(highlight.metric) || a.description.includes(highlight.channel)
      )

      if (!existingAlert) {
        alerts.push({
          id: `highlight-${idx}`,
          level: Math.abs(highlight.change) > 30 ? 'warning' : 'info',
          title: `${highlight.channel} ${highlight.metric} 하락`,
          description: `${highlight.metric}이(가) ${Math.abs(highlight.change).toFixed(0)}% 감소했습니다.`,
          metric: highlight.metric,
          value: highlight.change,
          department: getHighlightDepartment(highlight.channel),
        })
      }
    })

    return alerts
  }, [metrics])

  // 부서별 요약 생성
  const departments: DepartmentMetrics[] = useMemo(() => {
    if (!metrics) return []

    const overview = metrics.overview
    const previous = metrics.previous
    const channelDetails = metrics.channelDetails

    // 마케팅 부서 (SNS 채널 기반)
    const reachChange = previous?.reach && overview.reach !== null
      ? ((overview.reach - previous.reach) / previous.reach) * 100
      : null

    const marketingStatus = getStatusFromChange(reachChange)

    // 커머스 부서 (스토어 채널 기반)
    const revenueChange = previous?.totalRevenue && overview.totalRevenue !== null
      ? ((overview.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
      : null

    const commerceStatus = getStatusFromChange(revenueChange)

    return [
      {
        name: '마케팅',
        slug: 'marketing' as const,
        status: marketingStatus,
        summary: generateMarketingSummary(overview, previous, channelDetails),
        keyMetric: {
          label: '총 도달',
          value: overview.reach,
          change: reachChange,
        },
        drilldownUrl: '/dashboard?view=performance',
      },
      {
        name: '커머스',
        slug: 'commerce' as const,
        status: commerceStatus,
        summary: generateCommerceSummary(overview, previous, channelDetails),
        keyMetric: {
          label: '매출',
          value: overview.totalRevenue,
          change: revenueChange,
        },
        drilldownUrl: '/dashboard?view=commerce',
      },
    ]
  }, [metrics])

  if (isLoading) {
    return <ExecutiveSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더: 마지막 업데이트 시간 + 새로고침 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {format(periodStart, 'yyyy년 M월 d일', { locale: ko })} 기준
          </span>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>

      {/* 핵심 KPI 3개 - 가장 먼저 눈에 들어옴 */}
      <ExecutiveSummary kpis={executiveKPIs} />

      {/* 위험 신호 - 즉시 주의가 필요한 항목 */}
      <RiskAlerts alerts={riskAlerts} />

      {/* 부서별 요약 - 드릴다운 링크 포함 */}
      <DepartmentSummary departments={departments} />

      {/* 빠른 액션 버튼 */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <QuickActionButton
          href="/dashboard?view=overview"
          label="전체 대시보드"
        />
        <QuickActionButton
          href="/dashboard?view=content"
          label="콘텐츠 분석"
        />
        <QuickActionButton
          href="/reports"
          label="리포트 내보내기"
          variant="secondary"
        />
      </div>
    </div>
  )
}

// 헬퍼 함수들
function calculateTarget(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null
  // TODO: workspace 설정 API 연결 시 동적 값으로 교체
  return previous * DEFAULT_TARGETS.REVENUE_GROWTH_MULTIPLIER
}

function getStatusFromChange(change: number | null): 'good' | 'warning' | 'critical' {
  if (change === null) return 'warning'
  if (change >= 0) return 'good'
  if (change >= -10) return 'warning'
  return 'critical'
}

function getHighlightDepartment(channel: string): 'marketing' | 'commerce' | 'overall' {
  const marketingChannels = ['youtube', 'instagram', 'tiktok', 'facebook']
  const commerceChannels = ['smartstore', 'coupang', 'gmarket']

  const lowerChannel = channel.toLowerCase()

  if (marketingChannels.some((c) => lowerChannel.includes(c))) {
    return 'marketing'
  }
  if (commerceChannels.some((c) => lowerChannel.includes(c))) {
    return 'commerce'
  }
  return 'overall'
}

function generateMarketingSummary(
  overview: { reach: number | null; engagement: number | null },
  previous: { reach: number | null; engagement: number | null } | null,
  channelDetails: { YOUTUBE?: unknown; META_INSTAGRAM?: unknown } | undefined
): string {
  const parts: string[] = []

  if (overview.reach !== null) {
    const reachFormatted = overview.reach >= 10000
      ? `${(overview.reach / 10000).toFixed(0)}만`
      : overview.reach.toLocaleString()
    parts.push(`도달 ${reachFormatted}`)
  }

  if (overview.engagement !== null && previous?.engagement) {
    const change = ((overview.engagement - previous.engagement) / previous.engagement) * 100
    const direction = change >= 0 ? '상승' : '하락'
    parts.push(`참여 ${Math.abs(change).toFixed(0)}% ${direction}`)
  }

  const activeChannels: string[] = []
  if (channelDetails?.YOUTUBE) activeChannels.push('유튜브')
  if (channelDetails?.META_INSTAGRAM) activeChannels.push('인스타그램')

  if (activeChannels.length > 0) {
    parts.push(`${activeChannels.join(', ')} 활성`)
  }

  return parts.length > 0 ? parts.join(' | ') : '데이터 수집 중'
}

function generateCommerceSummary(
  overview: { totalRevenue: number | null },
  previous: { totalRevenue: number | null } | null,
  channelDetails: { SMARTSTORE?: { orders?: number | null }; COUPANG?: { orders?: number | null } } | undefined
): string {
  const parts: string[] = []

  if (overview.totalRevenue !== null && previous?.totalRevenue) {
    const change = ((overview.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
    const direction = change >= 0 ? '성장' : '감소'
    parts.push(`매출 ${Math.abs(change).toFixed(0)}% ${direction}`)
  }

  const totalOrders = (channelDetails?.SMARTSTORE?.orders ?? 0) + (channelDetails?.COUPANG?.orders ?? 0)
  if (totalOrders > 0) {
    parts.push(`주문 ${totalOrders.toLocaleString()}건`)
  }

  const activeStores: string[] = []
  if (channelDetails?.SMARTSTORE) activeStores.push('스마트스토어')
  if (channelDetails?.COUPANG) activeStores.push('쿠팡')

  if (activeStores.length > 0) {
    parts.push(`${activeStores.join(', ')} 운영 중`)
  }

  return parts.length > 0 ? parts.join(' | ') : '데이터 수집 중'
}

interface QuickActionButtonProps {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

function QuickActionButton({ href, label, variant = 'primary' }: QuickActionButtonProps) {
  const baseStyles = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  }

  return (
    <a href={href} className={`${baseStyles} ${variantStyles[variant]}`}>
      {label}
    </a>
  )
}

function ExecutiveSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px]" />
        ))}
      </div>
      <Skeleton className="h-[200px]" />
      <Skeleton className="h-[180px]" />
    </div>
  )
}
