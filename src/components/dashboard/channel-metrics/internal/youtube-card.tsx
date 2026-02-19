'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { YouTubeCardProps } from '../types'
import { formatNullableNumber } from '@/lib/utils/format'
import { MetricBox } from './metric-box'
import { Play, ExternalLink } from 'lucide-react'

export function YouTubeCard({ metrics }: YouTubeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-red-600">▶️</span>
          YouTube
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            label="조회수"
            value={metrics.views}
            change={metrics.change.views}
          />
          <MetricBox
            label="시청시간"
            value={metrics.estimatedMinutesWatched}
            change={metrics.change.estimatedMinutesWatched}
            format="duration"
          />
          <MetricBox
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
                  <span className="text-xs font-medium text-muted-foreground w-4">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary">
                      {video.title || '제목 없음'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      조회수 {formatNullableNumber(video.views)} · 참여 {formatNullableNumber(video.engagement)}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

