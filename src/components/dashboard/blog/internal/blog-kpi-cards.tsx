'use client'

import { KPICardEnhanced } from '../../cards'
import type { BlogMetricsData } from './types'

interface BlogKPICardsProps {
  current: BlogMetricsData | null
  previous: BlogMetricsData | null
}

export function BlogKPICards({ current, previous }: BlogKPICardsProps) {
  // 참여율 계산: (comments + likes + shares) / visitors * 100
  const calculateEngagementRate = (data: BlogMetricsData | null): number | null => {
    if (!data || !data.visitors || data.visitors === 0) return null
    const totalEngagement = (data.comments ?? 0) + (data.likes ?? 0) + (data.shares ?? 0)
    return Math.round((totalEngagement / data.visitors) * 10000) / 100
  }

  // 검색 유입 비율: searchVisitors / visitors * 100
  const calculateSearchRatio = (data: BlogMetricsData | null): number | null => {
    if (!data || !data.visitors || data.visitors === 0) return null
    if (data.searchVisitors === null) return null
    return Math.round((data.searchVisitors / data.visitors) * 10000) / 100
  }

  const engagementRate = calculateEngagementRate(current)
  const prevEngagementRate = calculateEngagementRate(previous)
  const searchRatio = calculateSearchRatio(current)
  const prevSearchRatio = calculateSearchRatio(previous)

  const kpis = [
    {
      title: '방문자 수',
      value: current?.visitors ?? null,
      previousValue: previous?.visitors ?? null,
      format: 'number' as const,
    },
    {
      title: '구독자 수',
      value: current?.subscribers ?? null,
      previousValue: previous?.subscribers ?? null,
      format: 'number' as const,
      subtitle: current?.newSubscribers ? `신규 +${current.newSubscribers}` : undefined,
    },
    {
      title: '참여율',
      value: engagementRate,
      previousValue: prevEngagementRate,
      format: 'percent' as const,
    },
    {
      title: '검색 유입 비율',
      value: searchRatio,
      previousValue: prevSearchRatio,
      format: 'percent' as const,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <KPICardEnhanced
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          previousValue={kpi.previousValue}
          format={kpi.format}
        />
      ))}
    </div>
  )
}
