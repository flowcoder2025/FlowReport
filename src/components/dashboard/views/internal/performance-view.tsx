'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics, useDashboardTrendData } from '@/lib/hooks/use-dashboard-data'
import { YouTubeDetailCard, ChannelDetailCard } from '../../cards'
import { TopContentCard } from '../../cards'
import { ChannelSummaryTable, ContentTable } from '../../tables'
import { TrendLineChart, BubbleChart } from '../../charts'
import { InstagramCard, StoreCard } from '../../channel-metrics'
import { Skeleton } from '../../skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 탭 상수 정의
const PERFORMANCE_TABS = {
  OVERVIEW: 'overview',
  CONTENT: 'content',
} as const

type PerformanceTab = typeof PERFORMANCE_TABS[keyof typeof PERFORMANCE_TABS]

// 탭 라벨 정의
const TAB_LABELS: Record<PerformanceTab, string> = {
  [PERFORMANCE_TABS.OVERVIEW]: '성과 개요',
  [PERFORMANCE_TABS.CONTENT]: '콘텐츠 분석',
}

interface PerformanceViewProps {
  defaultTab?: PerformanceTab
}

export function PerformanceView({ defaultTab }: PerformanceViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // URL 파라미터에서 탭 상태 읽기
  const tabParam = searchParams.get('tab') as PerformanceTab | null
  const activeTab = tabParam || defaultTab || PERFORMANCE_TABS.OVERVIEW

  const { workspaceId, periodType, periodStart, selectedChannels } = useDashboardContext()

  const channelsParam = selectedChannels.length > 0 ? selectedChannels : undefined
  const { data: metrics, error, isLoading } = useDashboardMetrics(
    workspaceId,
    periodType,
    periodStart,
    channelsParam
  )

  const { data: trendData, isLoading: trendLoading } = useDashboardTrendData(
    workspaceId,
    periodType,
    8,
    channelsParam
  )

  // 탭 변경 시 URL 파라미터 업데이트
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === PERFORMANCE_TABS.OVERVIEW) {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  if (isLoading || trendLoading) {
    return <PerformanceSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const channelDetails = metrics?.channelDetails
  const snsChannels = metrics?.sns?.channels || []
  const storeChannels = metrics?.store?.channels || []
  const allChannels = [...snsChannels, ...storeChannels]
  const periods = trendData?.periods || []

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value={PERFORMANCE_TABS.OVERVIEW}>
            {TAB_LABELS[PERFORMANCE_TABS.OVERVIEW]}
          </TabsTrigger>
          <TabsTrigger value={PERFORMANCE_TABS.CONTENT}>
            {TAB_LABELS[PERFORMANCE_TABS.CONTENT]}
          </TabsTrigger>
        </TabsList>

        {/* 성과 개요 탭 */}
        <TabsContent value={PERFORMANCE_TABS.OVERVIEW}>
          <PerformanceOverviewContent
            allChannels={allChannels}
            periods={periods}
            periodType={periodType}
            channelDetails={channelDetails}
          />
        </TabsContent>

        {/* 콘텐츠 분석 탭 */}
        <TabsContent value={PERFORMANCE_TABS.CONTENT}>
          <ContentAnalysisContent metrics={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 성과 개요 탭 컨텐츠 컴포넌트
interface PerformanceOverviewContentProps {
  allChannels: any[]
  periods: any[]
  periodType: string
  channelDetails: any
}

function PerformanceOverviewContent({
  allChannels,
  periods,
  periodType,
  channelDetails,
}: PerformanceOverviewContentProps) {
  return (
    <div className="space-y-6">
      {/* 채널별 요약 테이블 (전체) */}
      {allChannels.length > 0 && (
        <ChannelSummaryTable
          title="채널별 성과 요약"
          channels={allChannels}
          compact={false}
        />
      )}

      {/* 시계열 차트 */}
      {periods.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">
            {periodType === 'WEEKLY' ? '8주' : '8개월'} 추이
          </h3>
          <TrendLineChart
            data={periods}
            lines={[
              { dataKey: 'revenue', name: '매출', color: '#3b82f6' },
              { dataKey: 'reach', name: '도달', color: '#22c55e' },
              { dataKey: 'engagement', name: '참여', color: '#f59e0b' },
            ]}
            height={300}
          />
        </div>
      )}

      {/* 채널 상세 카드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* YouTube 확장형 카드 */}
        {channelDetails?.YOUTUBE && (
          <YouTubeDetailCard
            metrics={channelDetails.YOUTUBE}
            defaultExpanded={true}
          />
        )}

        {/* Instagram 카드 */}
        {channelDetails?.META_INSTAGRAM && (
          <InstagramCard metrics={channelDetails.META_INSTAGRAM} />
        )}

        {/* 스토어 카드들 */}
        {channelDetails?.SMARTSTORE && (
          <StoreCard metrics={channelDetails.SMARTSTORE} name="스마트스토어" />
        )}

        {channelDetails?.COUPANG && (
          <StoreCard metrics={channelDetails.COUPANG} name="쿠팡" />
        )}
      </div>
    </div>
  )
}

// 콘텐츠 분석 탭 컨텐츠 컴포넌트
interface ContentAnalysisContentProps {
  metrics: any
}

function ContentAnalysisContent({ metrics }: ContentAnalysisContentProps) {
  const topPosts = metrics?.sns?.topPosts || []
  const youtubeVideos = metrics?.channelDetails?.YOUTUBE?.topVideos || []

  const bubbleData = topPosts.map((post: any, index: number) => ({
    name: post.title || `콘텐츠 ${index + 1}`,
    x: post.views || 0,
    y: post.engagement ? (post.engagement / (post.views || 1)) * 100 : 0,
    z: post.engagement || 100,
    color: post.channel === 'YOUTUBE' ? '#ef4444' : post.channel === 'META_INSTAGRAM' ? '#ec4899' : '#3b82f6',
  }))

  const topContentItems = [
    ...topPosts.map((post: any) => ({
      title: post.title || '제목 없음',
      channel: getChannelLabel(post.channel),
      views: post.views || 0,
      engagementRate: post.engagement && post.views ? (post.engagement / post.views) * 100 : 0,
      url: post.url,
    })),
    ...youtubeVideos.map((video: any) => ({
      title: video.title || '제목 없음',
      channel: 'YouTube',
      views: video.views || 0,
      engagementRate: video.engagement && video.views ? (video.engagement / video.views) * 100 : 0,
      url: video.url,
    })),
  ].sort((a, b) => b.views - a.views)

  const tableData = topContentItems.map((item, index) => ({
    id: `content-${index}`,
    title: item.title,
    channel: item.channel,
    publishedAt: '-',
    views: item.views,
    likes: 0,
    comments: 0,
    engagementRate: item.engagementRate,
    url: item.url,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">조회수 vs 참여율</h3>
          <BubbleChart
            data={bubbleData}
            xLabel="조회수"
            yLabel="참여율"
            height={300}
          />
        </div>

        <TopContentCard
          title="Top 콘텐츠"
          items={topContentItems.slice(0, 5)}
        />
      </div>

      <ContentTable
        title="전체 콘텐츠"
        data={tableData}
      />
    </div>
  )
}

// 채널 라벨 변환 함수
function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    YOUTUBE: 'YouTube',
    META_INSTAGRAM: 'Instagram',
    META_FACEBOOK: 'Facebook',
    NAVER_BLOG: '네이버 블로그',
  }
  return labels[channel] || channel
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[250px]" />
      <Skeleton className="h-[350px]" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[300px]" />
        ))}
      </div>
    </div>
  )
}
