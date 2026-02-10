'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Clock,
  Users,
  ThumbsUp,
  MessageCircle,
  Share2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface YouTubeMetrics {
  views: number | null
  estimatedMinutesWatched: number | null
  subscribers: number | null
  subscriberGained: number | null
  engagement: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  change: {
    views: number | null
    estimatedMinutesWatched: number | null
    subscribers: number | null
    engagement: number | null
  }
  topVideos: Array<{
    id: string
    title: string | null
    url: string
    views: number | null
    engagement: number | null
  }>
}

interface YouTubeDetailCardProps {
  metrics: YouTubeMetrics
  defaultExpanded?: boolean
}

export function YouTubeDetailCard({ metrics, defaultExpanded = false }: YouTubeDetailCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-red-600">▶️</span>
            YouTube
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 px-2"
          >
            {expanded ? (
              <>
                접기 <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                상세 <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics - Always Visible */}
        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            icon={<Eye className="h-4 w-4" />}
            label="조회수"
            value={metrics.views}
            change={metrics.change.views}
          />
          <MetricBox
            icon={<Clock className="h-4 w-4" />}
            label="시청시간"
            value={metrics.estimatedMinutesWatched}
            change={metrics.change.estimatedMinutesWatched}
            format="duration"
          />
          <MetricBox
            icon={<Users className="h-4 w-4" />}
            label="구독자"
            value={metrics.subscribers}
            change={metrics.change.subscribers}
          />
          <MetricBox
            label="참여"
            value={metrics.engagement}
            change={metrics.change.engagement}
          />
        </div>

        {/* Expanded Details */}
        {expanded && (
          <>
            {/* Detailed Engagement Breakdown */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">참여 상세</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <ThumbsUp className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">좋아요</div>
                    <div className="font-medium">{formatNumber(metrics.likes)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">댓글</div>
                    <div className="font-medium">{formatNumber(metrics.comments)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Share2 className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">공유</div>
                    <div className="font-medium">{formatNumber(metrics.shares)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscriber Growth */}
            {metrics.subscriberGained !== null && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">구독자 순증</span>
                <span className={cn(
                  'font-medium',
                  (metrics.subscriberGained ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {(metrics.subscriberGained ?? 0) >= 0 ? '+' : ''}
                  {formatNumber(metrics.subscriberGained)}
                </span>
              </div>
            )}

            {/* Top Videos */}
            {metrics.topVideos && metrics.topVideos.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Top 영상
                </h4>
                <div className="space-y-2">
                  {metrics.topVideos.map((video, index) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary">
                          {video.title || '제목 없음'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          조회수 {formatNumber(video.views)} · 참여 {formatNumber(video.engagement)}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface MetricBoxProps {
  icon?: React.ReactNode
  label: string
  value: number | null
  change?: number | null
  format?: 'number' | 'duration'
}

function MetricBox({ icon, label, value, change, format = 'number' }: MetricBoxProps) {
  const formattedValue = format === 'duration'
    ? formatDuration(value)
    : formatNumber(value)

  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-lg">{formattedValue}</div>
      {change !== null && change !== undefined && (
        <div
          className={cn(
            'flex items-center gap-0.5 text-xs mt-0.5',
            change >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        >
          {change >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  )
}

function formatNumber(value: number | null): string {
  if (value === null) return '-'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '-'
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}시간 ${mins}분`
  }
  return `${Math.round(minutes)}분`
}
