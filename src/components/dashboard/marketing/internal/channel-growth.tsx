'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendLineChart } from '../../charts'
import { MetricBox } from '../../channel-metrics'
import { TrendingUp, Users, Eye, Youtube, Instagram } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHANNEL_COLORS } from '@/constants'

interface ChannelGrowthData {
  youtube?: {
    subscribers: number | null
    subscriberGained: number | null
    views: number | null
    viewsChange: number | null
    trend: Array<{ period: string; subscribers: number; views: number }>
  }
  instagram?: {
    followers: number | null
    followerGained: number | null
    reach: number | null
    reachChange: number | null
    trend: Array<{ period: string; followers: number; reach: number }>
  }
  blog?: {
    visitors: number | null
    visitorChange: number | null
    trend: Array<{ period: string; visitors: number }>
  }
}

interface ChannelGrowthProps {
  data: ChannelGrowthData
}

export function ChannelGrowth({ data }: ChannelGrowthProps) {
  const { youtube, instagram, blog } = data

  // 통합 성장 추이 데이터
  const combinedTrend = buildCombinedTrend(data)

  const trendLines = [
    ...(youtube ? [{ dataKey: 'youtube', name: 'YouTube 구독자', color: CHANNEL_COLORS.YOUTUBE }] : []),
    ...(instagram ? [{ dataKey: 'instagram', name: 'Instagram 팔로워', color: CHANNEL_COLORS.META_INSTAGRAM }] : []),
    ...(blog ? [{ dataKey: 'blog', name: '블로그 방문자', color: CHANNEL_COLORS.NAVER_BLOG }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* 채널별 현황 요약 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* YouTube */}
        {youtube && (
          <ChannelSummaryCard
            icon={<Youtube className="h-5 w-5 text-red-500" />}
            name="YouTube"
            mainLabel="구독자"
            mainValue={youtube.subscribers}
            growth={youtube.subscriberGained}
            subLabel="조회수"
            subValue={youtube.views}
            subChange={youtube.viewsChange}
            accentColor="red"
          />
        )}

        {/* Instagram */}
        {instagram && (
          <ChannelSummaryCard
            icon={<Instagram className="h-5 w-5 text-pink-500" />}
            name="Instagram"
            mainLabel="팔로워"
            mainValue={instagram.followers}
            growth={instagram.followerGained}
            subLabel="도달"
            subValue={instagram.reach}
            subChange={instagram.reachChange}
            accentColor="pink"
          />
        )}

        {/* Blog */}
        {blog && (
          <ChannelSummaryCard
            icon={<Eye className="h-5 w-5 text-green-500" />}
            name="Blog"
            mainLabel="방문자"
            mainValue={blog.visitors}
            growth={blog.visitorChange}
            accentColor="green"
          />
        )}
      </div>

      {/* 통합 성장 추이 차트 */}
      {combinedTrend.length > 0 && trendLines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              채널별 성장 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={combinedTrend}
              lines={trendLines}
              height={280}
              showLegend={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ChannelSummaryCardProps {
  icon: React.ReactNode
  name: string
  mainLabel: string
  mainValue: number | null
  growth?: number | null
  subLabel?: string
  subValue?: number | null
  subChange?: number | null
  accentColor: 'red' | 'pink' | 'green' | 'blue'
}

function ChannelSummaryCard({
  icon,
  name,
  mainLabel,
  mainValue,
  growth,
  subLabel,
  subValue,
  subChange,
  accentColor,
}: ChannelSummaryCardProps) {
  const accentClasses = {
    red: 'bg-red-50 border-red-200',
    pink: 'bg-pink-50 border-pink-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
  }

  return (
    <Card className={cn('border', accentClasses[accentColor])}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 메인 지표 */}
        <div>
          <div className="text-sm text-muted-foreground">{mainLabel}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{formatNumber(mainValue)}</span>
            {growth !== null && growth !== undefined && (
              <span
                className={cn(
                  'text-sm font-medium',
                  growth >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {growth >= 0 ? '+' : ''}
                {formatNumber(growth)}
              </span>
            )}
          </div>
        </div>

        {/* 서브 지표 */}
        {subLabel && subValue !== undefined && (
          <div className="pt-2 border-t">
            <MetricBox
              label={subLabel}
              value={subValue}
              change={subChange}
              size="sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function buildCombinedTrend(data: ChannelGrowthData): Array<{
  period: string
  youtube?: number
  instagram?: number
  blog?: number
}> {
  const periodMap = new Map<string, {
    youtube?: number
    instagram?: number
    blog?: number
  }>()

  // YouTube 데이터
  data.youtube?.trend?.forEach((item) => {
    const existing = periodMap.get(item.period) || {}
    periodMap.set(item.period, { ...existing, youtube: item.subscribers })
  })

  // Instagram 데이터
  data.instagram?.trend?.forEach((item) => {
    const existing = periodMap.get(item.period) || {}
    periodMap.set(item.period, { ...existing, instagram: item.followers })
  })

  // Blog 데이터
  data.blog?.trend?.forEach((item) => {
    const existing = periodMap.get(item.period) || {}
    periodMap.set(item.period, { ...existing, blog: item.visitors })
  })

  return Array.from(periodMap.entries())
    .map(([period, values]) => ({ period, ...values }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

function formatNumber(value: number | null): string {
  if (value === null) return '-'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
