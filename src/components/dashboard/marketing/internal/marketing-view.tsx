'use client'

import { useMemo } from 'react'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics, useDashboardTrendData, useWorkspaceTargets, ChannelTrendMetrics } from '@/lib/hooks/use-dashboard-data'
import { KPICardEnhanced } from '../../cards'
import { YouTubeDetailCard } from '../../cards'
import { InstagramCard, HighlightBanner } from '../../channel-metrics'
import { ErrorState } from '@/components/common'
import { Skeleton } from '../../skeleton'
import { ChannelGrowth } from './channel-growth'
import { ContentTypeAnalysis } from './content-type-analysis'
import { ContentHighlights } from './content-highlights'
import { CompetitorComparison } from './competitor-comparison'
import { Megaphone } from 'lucide-react'

export function MarketingView() {
  const { workspaceId, periodType, periodStart, selectedChannels } = useDashboardContext()

  const channelsParam = selectedChannels.length > 0 ? selectedChannels : undefined
  const { data: metrics, error, isLoading } = useDashboardMetrics(
    workspaceId,
    periodType,
    periodStart,
    channelsParam
  )

  // 트렌드 데이터 가져오기
  const { data: trendData } = useDashboardTrendData(
    workspaceId,
    periodType,
    8, // 8개 기간 (주간이면 8주, 월간이면 8개월)
    channelsParam
  )

  // 목표값 데이터 가져오기
  const { data: targetsData } = useWorkspaceTargets(workspaceId)
  const targets = targetsData?.targetConfig

  // 데이터 추출 (hooks 규칙 준수를 위해 early return 이전에 선언)
  const overview = metrics?.overview
  const previous = metrics?.previous
  const channelDetails = metrics?.channelDetails
  const highlights = metrics?.highlights
  const topPosts = metrics?.sns?.topPosts || []
  const youtubeVideos = channelDetails?.YOUTUBE?.topVideos || []

  // 마케팅 중심 KPIs (6개) - hooks는 early return 이전에 호출해야 함
  // 전략적 순서: 매출 > 도달 > 참여 > 팔로워 > 활성사용자 > 회원가입
  const marketingKpis = useMemo(() => [
    {
      title: '총 매출',
      value: overview?.totalRevenue ?? null,
      previousValue: previous?.totalRevenue ?? null,
      format: 'currency' as const,
      target: targets?.revenueTarget ?? null,
    },
    {
      title: '총 도달',
      value: overview?.reach ?? null,
      previousValue: previous?.reach ?? null,
      target: targets?.reachTarget ?? null,
    },
    {
      title: '총 참여',
      value: overview?.engagement ?? null,
      previousValue: previous?.engagement ?? null,
    },
    {
      title: '팔로워 순증',
      value: overview?.followers ?? null,
      previousValue: previous?.followers ?? null,
    },
    {
      title: periodType === 'WEEKLY' ? 'WAU' : 'MAU',
      value: periodType === 'WEEKLY' ? overview?.wau : overview?.mau,
      previousValue: periodType === 'WEEKLY' ? previous?.wau : previous?.mau,
      target: periodType === 'WEEKLY' ? targets?.wauTarget : targets?.mauTarget,
    },
    {
      title: '회원가입',
      value: overview?.signups ?? null,
      previousValue: previous?.signups ?? null,
    },
  ], [overview, previous, periodType, targets])

  // 채널 성장 데이터 구성 (트렌드 데이터 포함)
  const channelGrowthData = useMemo(
    () => buildChannelGrowthData(
      channelDetails as Record<string, unknown> | undefined,
      trendData?.channelMetrics
    ),
    [channelDetails, trendData?.channelMetrics]
  )

  // 콘텐츠 하이라이트 데이터 구성
  const contentItems = useMemo(
    () => buildContentItems(topPosts, youtubeVideos),
    [topPosts, youtubeVideos]
  )

  // Early returns - hooks 이후에 위치
  if (isLoading) {
    return <MarketingSkeleton />
  }

  if (error) {
    return <ErrorState />
  }

  const sections = [
    { id: 'kpi', label: 'KPI' },
    { id: 'channel-growth', label: '채널 성장' },
    { id: 'content-analysis', label: '콘텐츠 분석' },
    { id: 'competitors', label: '경쟁사 비교' },
  ]

  return (
    <div className="space-y-6">
      {/* 대시보드 헤더 */}
      <div className="flex items-center gap-3 pb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Marketing Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            채널별 성과 및 콘텐츠 분석
          </p>
        </div>
      </div>

      {/* 섹션 네비게이션 */}
      <div className="flex gap-2 border-b pb-2 mb-4 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm px-3 py-1 rounded-full bg-muted hover:bg-muted/80 whitespace-nowrap transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 하이라이트 배너 */}
      {highlights && highlights.length > 0 && (
        <HighlightBanner highlights={highlights} />
      )}

      {/* 마케팅 KPI 카드 */}
      <div id="kpi" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {marketingKpis.map((kpi, index) => (
          <KPICardEnhanced
            key={index}
            title={kpi.title}
            value={kpi.value ?? null}
            previousValue={kpi.previousValue ?? null}
            format={kpi.format}
            target={kpi.target}
          />
        ))}
      </div>

      {/* 채널별 성장 섹션 */}
      <div id="channel-growth">
        <ChannelGrowth data={channelGrowthData} />
      </div>

      {/* 채널 상세 카드 (확장 가능) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {channelDetails?.YOUTUBE && (
          <YouTubeDetailCard
            metrics={channelDetails.YOUTUBE}
            defaultExpanded={true}
          />
        )}
        {channelDetails?.META_INSTAGRAM && (
          <InstagramCard metrics={channelDetails.META_INSTAGRAM} />
        )}
      </div>

      {/* 콘텐츠 분석 섹션 */}
      <div id="content-analysis" className="space-y-6">
        {/* 콘텐츠 타입별 성과 분석 */}
        <ContentTypeAnalysis />

        {/* 콘텐츠 하이라이트 */}
        <ContentHighlights items={contentItems} maxItems={6} />
      </div>

      {/* 경쟁사 비교 분석 */}
      <div id="competitors">
        <CompetitorComparison workspaceId={workspaceId} />
      </div>
    </div>
  )
}

// 채널 성장 데이터 빌더
function buildChannelGrowthData(
  channelDetails: Record<string, unknown> | undefined,
  channelMetrics?: ChannelTrendMetrics
) {
  if (!channelDetails) {
    return {}
  }

  const youtube = channelDetails.YOUTUBE as {
    subscribers?: number
    subscriberGained?: number
    views?: number
    change?: { views?: number; subscribers?: number }
  } | undefined

  const instagram = channelDetails.META_INSTAGRAM as {
    followers?: number
    followerGained?: number
    reach?: number
    change?: { reach?: number; followers?: number }
  } | undefined

  return {
    youtube: youtube
      ? {
          subscribers: youtube.subscribers ?? null,
          subscriberGained: youtube.subscriberGained ?? null,
          views: youtube.views ?? null,
          viewsChange: youtube.change?.views ?? null,
          trend: channelMetrics?.youtube ?? [],
        }
      : undefined,
    instagram: instagram
      ? {
          followers: instagram.followers ?? null,
          followerGained: instagram.followerGained ?? null,
          reach: instagram.reach ?? null,
          reachChange: instagram.change?.reach ?? null,
          trend: channelMetrics?.instagram ?? [],
        }
      : undefined,
    // TODO: Blog 데이터 추가
  }
}

// 콘텐츠 아이템 빌더
interface TopPost {
  id?: string
  title?: string | null
  channel?: string
  url?: string
  publishedAt?: string
  views?: number | null
  engagement?: number | null
}

interface TopVideo {
  id: string
  title?: string | null
  url?: string
  views?: number | null
  engagement?: number | null
}

function buildContentItems(topPosts: TopPost[], youtubeVideos: TopVideo[]) {
  const items = [
    ...topPosts.map((post, index) => ({
      id: post.id || `post-${index}`,
      title: post.title || '제목 없음',
      channel: post.channel || 'UNKNOWN',
      url: post.url,
      publishedAt: post.publishedAt,
      views: post.views || 0,
      engagement: post.engagement || 0,
      engagementRate:
        post.engagement && post.views ? (post.engagement / post.views) * 100 : 0,
    })),
    ...youtubeVideos.map((video) => ({
      id: video.id,
      title: video.title || '제목 없음',
      channel: 'YOUTUBE',
      url: video.url,
      views: video.views || 0,
      engagement: video.engagement || 0,
      engagementRate:
        video.engagement && video.views ? (video.engagement / video.views) * 100 : 0,
    })),
  ]

  // 중복 제거 (YouTube 영상이 topPosts에도 있을 수 있음)
  const uniqueItems = items.reduce((acc, item) => {
    const exists = acc.find(
      (i) => i.title === item.title && i.channel === item.channel
    )
    if (!exists) {
      acc.push(item)
    }
    return acc
  }, [] as typeof items)

  return uniqueItems.sort((a, b) => b.views - a.views)
}

function MarketingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 pb-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>

      {/* Channel growth skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[160px]" />
        ))}
      </div>

      {/* Chart skeleton */}
      <Skeleton className="h-[320px]" />

      {/* Channel detail cards skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[280px]" />
        <Skeleton className="h-[180px]" />
      </div>

      {/* Content highlights skeleton */}
      <Skeleton className="h-[300px]" />

      {/* Competitor placeholder skeleton */}
      <Skeleton className="h-[400px]" />
    </div>
  )
}
