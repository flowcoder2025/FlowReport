'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ExternalLink,
  TrendingUp,
  Eye,
  Heart,
  Clock,
  Flame,
} from 'lucide-react'
import { PublishTimeAnalysis } from './publish-time-analysis'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils/format'
import { CHANNEL_LABELS } from '@/constants'

interface ContentItem {
  id: string
  title: string
  channel: 'YOUTUBE' | 'META_INSTAGRAM' | 'NAVER_BLOG' | string
  url?: string
  publishedAt?: string
  views: number
  engagement: number
  engagementRate: number
  isTopPerformer?: boolean
}

interface ContentHighlightsProps {
  items: ContentItem[]
  maxItems?: number
}

export function ContentHighlights({ items, maxItems = 6 }: ContentHighlightsProps) {
  const sortedItems = [...items]
    .sort((a, b) => b.views - a.views)
    .slice(0, maxItems)

  const topPerformer = sortedItems[0]
  const otherItems = sortedItems.slice(1)

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Top 콘텐츠
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            아직 콘텐츠 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top 1 콘텐츠 - 하이라이트 */}
      {topPerformer && (
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-orange-500" />
                Top 콘텐츠
              </CardTitle>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                #{1} Best
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <TopContentItem item={topPerformer} isHero />
          </CardContent>
        </Card>
      )}

      {/* 나머지 콘텐츠 목록 */}
      {otherItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">이번 기간 인기 콘텐츠</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherItems.map((item, index) => (
                <TopContentItem key={item.id} item={item} rank={index + 2} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 채널별 최적 발행 시간 분석 */}
      <PublishTimeAnalysis items={items} />
    </div>
  )
}

interface TopContentItemProps {
  item: ContentItem
  rank?: number
  isHero?: boolean
}

function TopContentItem({ item, rank, isHero = false }: TopContentItemProps) {
  const channelConfig = getChannelConfig(item.channel)

  return (
    <div
      className={cn(
        'group',
        isHero
          ? 'space-y-4'
          : 'flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors'
      )}
    >
      {/* Rank Badge (for non-hero items) */}
      {!isHero && rank && (
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center">
          {rank}
        </span>
      )}

      <div className={cn('flex-1 min-w-0', isHero && 'space-y-3')}>
        {/* Title & Channel */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'font-medium hover:text-primary transition-colors line-clamp-2',
                  isHero ? 'text-lg' : 'text-sm'
                )}
              >
                {item.title}
                <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <span
                className={cn(
                  'font-medium line-clamp-2',
                  isHero ? 'text-lg' : 'text-sm'
                )}
              >
                {item.title}
              </span>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn('flex-shrink-0', channelConfig.badgeClass)}
          >
            {channelConfig.icon}
            <span className="ml-1">{channelConfig.label}</span>
          </Badge>
        </div>

        {/* Metrics */}
        <div
          className={cn(
            'flex gap-4 text-sm',
            isHero ? 'flex-wrap' : 'text-muted-foreground'
          )}
        >
          <MetricItem
            icon={<Eye className="h-3.5 w-3.5" />}
            label="조회수"
            value={formatNumber(item.views)}
            isHero={isHero}
          />
          <MetricItem
            icon={<Heart className="h-3.5 w-3.5" />}
            label="참여"
            value={formatNumber(item.engagement)}
            isHero={isHero}
          />
          <MetricItem
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="참여율"
            value={`${item.engagementRate.toFixed(1)}%`}
            isHero={isHero}
            highlight={item.engagementRate > 5}
          />
          {item.publishedAt && (
            <MetricItem
              icon={<Clock className="h-3.5 w-3.5" />}
              label="발행"
              value={formatDate(item.publishedAt)}
              isHero={isHero}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string
  isHero?: boolean
  highlight?: boolean
}

function MetricItem({ icon, label, value, isHero, highlight }: MetricItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1',
        isHero && 'bg-white/50 px-3 py-1.5 rounded-md',
        highlight && 'text-green-600 font-medium'
      )}
    >
      {icon}
      {isHero && <span className="text-muted-foreground">{label}</span>}
      <span className={cn(isHero && 'font-semibold')}>{value}</span>
    </div>
  )
}

function getChannelConfig(channel: string) {
  const configs: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
    YOUTUBE: {
      label: CHANNEL_LABELS.YOUTUBE,
      icon: <span className="text-red-500">&#9658;</span>,
      badgeClass: 'border-red-200 text-red-700',
    },
    META_INSTAGRAM: {
      label: CHANNEL_LABELS.META_INSTAGRAM,
      icon: <span>&#128247;</span>,
      badgeClass: 'border-pink-200 text-pink-700',
    },
    NAVER_BLOG: {
      label: '블로그',
      icon: <span className="text-green-500">&#9997;</span>,
      badgeClass: 'border-green-200 text-green-700',
    },
  }

  return (
    configs[channel] || {
      label: channel,
      icon: null,
      badgeClass: 'border-gray-200 text-gray-700',
    }
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}
