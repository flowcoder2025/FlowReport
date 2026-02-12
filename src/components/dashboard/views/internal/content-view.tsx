'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics } from '@/lib/hooks/use-dashboard-data'
import { TopContentCard } from '../../cards'
import { BubbleChart } from '../../charts'
import { ContentTable } from '../../tables'
import { Skeleton } from '../../skeleton'
import { getChannelColor, CHANNEL_LABELS } from '@/constants'

export function ContentView() {
  const { workspaceId, periodType, periodStart, selectedChannels } = useDashboardContext()

  const channelsParam = selectedChannels.length > 0 ? selectedChannels : undefined
  const { data: metrics, error, isLoading } = useDashboardMetrics(
    workspaceId,
    periodType,
    periodStart,
    channelsParam
  )

  if (isLoading) {
    return <ContentSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const topPosts = metrics?.sns?.topPosts || []
  const youtubeVideos = metrics?.channelDetails?.YOUTUBE?.topVideos || []

  const bubbleData = topPosts.map((post, index) => ({
    name: post.title || `콘텐츠 ${index + 1}`,
    x: post.views || 0,
    y: post.engagement ? (post.engagement / (post.views || 1)) * 100 : 0,
    z: post.engagement || 100,
    color: getChannelColor(post.channel),
  }))

  const topContentItems = [
    ...topPosts.map(post => ({
      title: post.title || '제목 없음',
      channel: getChannelLabel(post.channel),
      views: post.views || 0,
      engagementRate: post.engagement && post.views ? (post.engagement / post.views) * 100 : 0,
      url: post.url,
    })),
    ...youtubeVideos.map(video => ({
      title: video.title || '제목 없음',
      channel: CHANNEL_LABELS.YOUTUBE,
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

function getChannelLabel(channel: string): string {
  return CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS] || channel
}

function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  )
}
