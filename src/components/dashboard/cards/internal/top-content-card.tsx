'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

interface ContentItem {
  title: string
  channel: string
  views: number
  engagementRate: number
  url?: string
  thumbnail?: string
}

interface TopContentCardProps {
  title?: string
  items: ContentItem[]
  maxItems?: number
}

export function TopContentCard({
  title = 'Top 콘텐츠',
  items,
  maxItems = 5,
}: TopContentCardProps) {
  const displayItems = items.slice(0, maxItems)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">콘텐츠가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>

                {item.thumbnail && (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    width={64}
                    height={40}
                    className="object-cover rounded flex-shrink-0"
                    unoptimized
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.title}</span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted">{item.channel}</span>
                    <span>조회수 {formatNumber(item.views)}</span>
                    <span>참여율 {item.engagementRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
