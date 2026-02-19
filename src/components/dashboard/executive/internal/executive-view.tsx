'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { CHANNEL_LABELS } from '@/constants'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/components/common'
import {
  useDashboardMetrics,
  useActionProgress,
  useActionTemplates,
  useWorkspaceTargets,
  TriggerType,
  ActionTemplate,
} from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../../skeleton'
import { ExecutiveSummary } from './executive-summary'
import { RiskAlerts } from './risk-alerts'
import { DepartmentSummary } from './department-summary'
import { RecommendedActions } from './recommended-actions'
import { ActionProgressCard } from '../../cards'
import {
  ExecutiveKPI,
  RiskAlert,
  DepartmentMetrics,
  RiskLevel,
  RecommendedAction,
} from './types'
import { Clock, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, FileText } from 'lucide-react'
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

  // Fetch previous period action progress
  const {
    data: actionProgressData,
    isLoading: isActionProgressLoading,
  } = useActionProgress(workspaceId, periodType, periodStart)

  // Fetch action templates for recommended actions
  const { templateMap } = useActionTemplates(workspaceId)

  // Fetch workspace targets with fallback to defaults
  const { data: targetsData } = useWorkspaceTargets(workspaceId)

  // Compute effective targets: API values -> API defaults -> hardcoded fallback
  const effectiveTargets = useMemo(() => {
    const apiConfig = targetsData?.targetConfig ?? {}
    const apiDefaults = targetsData?.defaults ?? {}

    return {
      revenueGrowthRate:
        apiConfig.revenueGrowthRate ??
        apiDefaults.revenueGrowthRate ??
        DEFAULT_TARGETS.REVENUE_GROWTH_RATE,
      revenueGrowthMultiplier:
        apiConfig.revenueGrowthRate != null
          ? 1 + apiConfig.revenueGrowthRate / 100
          : apiDefaults.revenueGrowthRate != null
            ? 1 + apiDefaults.revenueGrowthRate / 100
            : DEFAULT_TARGETS.REVENUE_GROWTH_MULTIPLIER,
    }
  }, [targetsData])

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
        targetValue: calculateTarget(
          overview.totalRevenue,
          previous?.totalRevenue,
          effectiveTargets.revenueGrowthMultiplier
        ),
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
        targetValue: effectiveTargets.revenueGrowthRate,
        format: 'percent' as const,
        description: '매출 기준 전기 대비',
      },
    ]
  }, [metrics, periodType, effectiveTargets])

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
        const fallbackAction: RecommendedAction = {
          id: 'action-revenue-critical',
          title: '긴급 매출 회복 조치',
          description: '급격한 매출 하락에 대응하기 위한 즉각적인 조치가 필요합니다.',
          priority: 'high',
          department: 'commerce',
          departmentUrl: '/dashboard?view=commerce',
          steps: [
            '채널별 매출 상세 분석 확인',
            '주요 상품 재고 및 가격 점검',
            '경쟁사 프로모션 현황 파악',
            '긴급 할인 또는 프로모션 검토',
          ],
        }
        alerts.push({
          id: 'revenue-critical',
          level: 'critical',
          title: '매출 급락 경고',
          description: `전기 대비 매출이 ${Math.abs(revenueChange).toFixed(1)}% 감소했습니다.`,
          metric: '매출 변화율',
          value: revenueChange,
          threshold: THRESHOLDS.REVENUE_DECLINE_CRITICAL,
          currentValue: overview.totalRevenue,
          previousValue: previous.totalRevenue,
          dataSource: '전 채널 합산 매출 · 전기 대비',
          department: 'commerce',
          actionUrl: '/dashboard?view=commerce',
          recommendedAction: buildRecommendedAction(
            'REVENUE_DECLINE_CRITICAL',
            templateMap.get('REVENUE_DECLINE_CRITICAL'),
            fallbackAction
          ),
        })
      } else if (revenueChange <= THRESHOLDS.REVENUE_DECLINE_WARNING) {
        const fallbackAction: RecommendedAction = {
          id: 'action-revenue-warning',
          title: '매출 추이 모니터링 강화',
          description: '매출 하락 추세를 면밀히 관찰하고 대응책을 준비하세요.',
          priority: 'medium',
          department: 'commerce',
          departmentUrl: '/dashboard?view=commerce',
          steps: [
            '일별 매출 추이 모니터링',
            '하락 채널 집중 분석',
            '고객 이탈 원인 파악',
          ],
        }
        alerts.push({
          id: 'revenue-warning',
          level: 'warning',
          title: '매출 하락 주의',
          description: `전기 대비 매출이 ${Math.abs(revenueChange).toFixed(1)}% 감소했습니다.`,
          metric: '매출 변화율',
          value: revenueChange,
          threshold: THRESHOLDS.REVENUE_DECLINE_WARNING,
          currentValue: overview.totalRevenue,
          previousValue: previous.totalRevenue,
          dataSource: '전 채널 합산 매출 · 전기 대비',
          department: 'commerce',
          actionUrl: '/dashboard?view=commerce',
          recommendedAction: buildRecommendedAction(
            'REVENUE_DECLINE_WARNING',
            templateMap.get('REVENUE_DECLINE_WARNING'),
            fallbackAction
          ),
        })
      }
    }

    // 참여도 하락 체크
    if (previous?.engagement && overview.engagement !== null) {
      const engagementChange = ((overview.engagement - previous.engagement) / previous.engagement) * 100

      if (engagementChange <= THRESHOLDS.ENGAGEMENT_DECLINE_CRITICAL) {
        const fallbackAction: RecommendedAction = {
          id: 'action-engagement-critical',
          title: '긴급 참여도 회복 전략',
          description: '콘텐츠 전략 및 채널 운영 방식의 즉각적인 검토가 필요합니다.',
          priority: 'high',
          department: 'marketing',
          departmentUrl: '/dashboard?view=performance',
          steps: [
            '최근 콘텐츠 성과 분석',
            '타겟 오디언스 반응 확인',
            '경쟁 콘텐츠 벤치마킹',
            '콘텐츠 포맷 및 발행 시간 최적화',
          ],
        }
        alerts.push({
          id: 'engagement-critical',
          level: 'critical',
          title: '참여도 급락 경고',
          description: `전기 대비 참여도가 ${Math.abs(engagementChange).toFixed(1)}% 감소했습니다.`,
          metric: '참여 변화율',
          value: engagementChange,
          threshold: THRESHOLDS.ENGAGEMENT_DECLINE_CRITICAL,
          currentValue: overview.engagement,
          previousValue: previous.engagement,
          dataSource: '전 채널 합산 참여 · 전기 대비',
          department: 'marketing',
          actionUrl: '/dashboard?view=performance',
          recommendedAction: buildRecommendedAction(
            'ENGAGEMENT_DECLINE_CRITICAL',
            templateMap.get('ENGAGEMENT_DECLINE_CRITICAL'),
            fallbackAction
          ),
        })
      } else if (engagementChange <= THRESHOLDS.ENGAGEMENT_DECLINE_WARNING) {
        const fallbackAction: RecommendedAction = {
          id: 'action-engagement-warning',
          title: '콘텐츠 성과 점검',
          description: '참여도 하락 추세를 분석하고 개선 방안을 마련하세요.',
          priority: 'medium',
          department: 'marketing',
          departmentUrl: '/dashboard?view=performance',
          steps: [
            '채널별 참여 지표 비교',
            '고성과 콘텐츠 유형 분석',
            'A/B 테스트 계획 수립',
          ],
        }
        alerts.push({
          id: 'engagement-warning',
          level: 'warning',
          title: '참여도 하락 주의',
          description: `전기 대비 참여도가 ${Math.abs(engagementChange).toFixed(1)}% 감소했습니다.`,
          metric: '참여 변화율',
          value: engagementChange,
          threshold: THRESHOLDS.ENGAGEMENT_DECLINE_WARNING,
          currentValue: overview.engagement,
          previousValue: previous.engagement,
          dataSource: '전 채널 합산 참여 · 전기 대비',
          department: 'marketing',
          actionUrl: '/dashboard?view=performance',
          recommendedAction: buildRecommendedAction(
            'ENGAGEMENT_DECLINE_WARNING',
            templateMap.get('ENGAGEMENT_DECLINE_WARNING'),
            fallbackAction
          ),
        })
      }
    }

    // 전환율 체크 (스마트스토어)
    if (channelDetails?.SMARTSTORE?.conversionRate !== null && channelDetails?.SMARTSTORE?.conversionRate !== undefined) {
      const convRate = channelDetails.SMARTSTORE.conversionRate

      if (convRate < THRESHOLDS.CONVERSION_CRITICAL) {
        const fallbackAction: RecommendedAction = {
          id: 'action-conversion-critical',
          title: '전환율 긴급 개선',
          description: '구매 전환 과정의 심각한 문제를 즉시 해결해야 합니다.',
          priority: 'high',
          department: 'commerce',
          departmentUrl: '/dashboard?view=commerce',
          steps: [
            '결제 프로세스 오류 점검',
            '상품 상세페이지 UX 검토',
            '가격 경쟁력 분석',
            '배송/반품 정책 재검토',
          ],
        }
        alerts.push({
          id: 'conversion-critical',
          level: 'critical',
          title: '전환율 위험',
          description: '스마트스토어 전환율이 위험 수준입니다.',
          metric: '전환율',
          value: convRate,
          threshold: THRESHOLDS.CONVERSION_CRITICAL,
          currentValue: convRate,
          dataSource: '스마트스토어 전환율 · 절대값 기준',
          department: 'commerce',
          actionUrl: '/dashboard?view=commerce',
          recommendedAction: buildRecommendedAction(
            'CONVERSION_LOW_CRITICAL',
            templateMap.get('CONVERSION_LOW_CRITICAL'),
            fallbackAction
          ),
        })
      } else if (convRate < THRESHOLDS.CONVERSION_WARNING) {
        const fallbackAction: RecommendedAction = {
          id: 'action-conversion-warning',
          title: '전환율 개선 방안 검토',
          description: '구매 전환을 높이기 위한 최적화 작업을 진행하세요.',
          priority: 'medium',
          department: 'commerce',
          departmentUrl: '/dashboard?view=commerce',
          steps: [
            '이탈 페이지 분석',
            '상품 리뷰 및 평점 개선',
            '프로모션 효과 측정',
          ],
        }
        alerts.push({
          id: 'conversion-warning',
          level: 'warning',
          title: '전환율 주의',
          description: '스마트스토어 전환율이 낮습니다.',
          metric: '전환율',
          value: convRate,
          threshold: THRESHOLDS.CONVERSION_WARNING,
          currentValue: convRate,
          dataSource: '스마트스토어 전환율 · 절대값 기준',
          department: 'commerce',
          actionUrl: '/dashboard?view=commerce',
          recommendedAction: buildRecommendedAction(
            'CONVERSION_LOW_WARNING',
            templateMap.get('CONVERSION_LOW_WARNING'),
            fallbackAction
          ),
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
        const dept = getHighlightDepartment(highlight.channel)
        const isWarning = Math.abs(highlight.change) > 30

        alerts.push({
          id: `highlight-${idx}`,
          level: isWarning ? 'warning' : 'info',
          title: `${highlight.channel} ${highlight.metric} 하락`,
          description: `${highlight.metric}이(가) ${Math.abs(highlight.change).toFixed(0)}% 감소했습니다.`,
          metric: `${highlight.metric} 변화율`,
          value: highlight.change,
          currentValue: highlight.currentValue ?? null,
          previousValue: highlight.previousValue ?? null,
          dataSource: `${highlight.channel} · 전기 대비`,
          department: dept,
          recommendedAction: isWarning ? {
            id: `action-highlight-${idx}`,
            title: `${highlight.channel} 채널 점검`,
            description: `${highlight.metric} 지표가 크게 하락하여 점검이 필요합니다.`,
            priority: 'medium',
            department: dept,
            departmentUrl: dept === 'marketing' ? '/dashboard?view=performance' : '/dashboard?view=commerce',
            steps: [
              `${highlight.channel} 채널 상세 데이터 확인`,
              '하락 원인 분석 및 기록',
              '개선 방안 수립',
            ],
          } : undefined,
        })
      }
    })

    return alerts
  }, [metrics, templateMap])

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

  // Derive overall health from risk alerts (must be before early returns)
  const overallHealth = useMemo((): 'good' | 'warning' | 'critical' => {
    if (riskAlerts.some((a) => a.level === 'critical')) return 'critical'
    if (riskAlerts.some((a) => a.level === 'warning')) return 'warning'
    return 'good'
  }, [riskAlerts])

  if (isLoading) {
    return <ExecutiveSkeleton />
  }

  if (error) {
    return <ErrorState />
  }

  const healthConfig = {
    good: {
      icon: <CheckCircle className="h-5 w-5" />,
      label: '양호',
      className: 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    warning: {
      icon: <AlertCircle className="h-5 w-5" />,
      label: '주의',
      className: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    },
    critical: {
      icon: <AlertTriangle className="h-5 w-5" />,
      label: '위험',
      className: 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    },
  }

  const health = healthConfig[overallHealth]
  const riskCount = riskAlerts.length

  return (
    <div className="space-y-6">
      {/* 헤더: 마지막 업데이트 시간 + 새로고침 + 리포트 내보내기 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {format(periodStart, 'yyyy년 M월 d일', { locale: ko })} 기준
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors bg-secondary px-3 py-1.5 rounded-lg"
          >
            <FileText className="h-4 w-4" />
            리포트 내보내기
          </Link>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 건강도 배너 - 1-line summary */}
      <div className={cn(
        'rounded-lg p-3 flex items-center gap-2 text-sm font-medium',
        health.className,
      )}>
        {health.icon} 비즈니스 상태: {health.label} | 리스크 {riskCount}건
      </div>

      {/* 핵심 KPI 3개 - 가장 먼저 눈에 들어옴 */}
      <ExecutiveSummary kpis={executiveKPIs} />

      {/* 위험 신호 - 즉시 주의가 필요한 항목 */}
      <RiskAlerts alerts={riskAlerts} />

      {/* 권장 조치 - 위험 신호에 대한 대응 방안 */}
      <RecommendedActions alerts={riskAlerts} />

      {/* 부서별 요약 - 드릴다운 링크 포함 */}
      <DepartmentSummary departments={departments} />

      {/* 이전 기간 액션 달성률 - 학습 피드백 루프 */}
      <ActionProgressCard
        data={actionProgressData}
        isLoading={isActionProgressLoading}
        periodType={periodType}
      />

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
      </div>
    </div>
  )
}

// 템플릿 기반 RecommendedAction 빌더
function buildRecommendedAction(
  triggerType: TriggerType,
  template: ActionTemplate | undefined,
  fallback: RecommendedAction
): RecommendedAction {
  if (!template) {
    return fallback
  }

  return {
    id: `action-${template.id}`,
    title: template.title,
    description: template.description,
    priority: template.priority.toLowerCase() as 'high' | 'medium' | 'low',
    department: template.department.toLowerCase() as 'marketing' | 'commerce' | 'overall',
    departmentUrl: template.departmentUrl,
    steps: template.steps,
  }
}

// 헬퍼 함수들
function calculateTarget(
  current: number | null,
  previous: number | null,
  multiplier: number = DEFAULT_TARGETS.REVENUE_GROWTH_MULTIPLIER
): number | null {
  if (current === null || previous === null) return null
  return previous * multiplier
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
  if (channelDetails?.SMARTSTORE) activeStores.push(CHANNEL_LABELS.SMARTSTORE)
  if (channelDetails?.COUPANG) activeStores.push(CHANNEL_LABELS.COUPANG)

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
    <Link href={href} className={`${baseStyles} ${variantStyles[variant]}`}>
      {label}
    </Link>
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
      <Skeleton className="h-[220px]" /> {/* Action Progress Card */}
      <Skeleton className="h-[160px]" />
      <Skeleton className="h-[180px]" />
    </div>
  )
}
