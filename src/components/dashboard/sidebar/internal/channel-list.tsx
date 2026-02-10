'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/dashboard/skeleton'
import { ChannelListProps, CHANNEL_DISPLAY_NAMES, CHANNEL_ICONS } from '../types'
import { CheckCircle2, XCircle } from 'lucide-react'

export function ChannelList({ connections, isLoading }: ChannelListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (connections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          연결된 채널이 없습니다
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {connections.map((connection) => (
        <Card
          key={connection.id}
          className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
        >
          <span className="text-lg" role="img" aria-label={connection.provider}>
            {CHANNEL_ICONS[connection.provider]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {connection.accountName || CHANNEL_DISPLAY_NAMES[connection.provider]}
            </p>
            <p className="text-xs text-muted-foreground">
              {CHANNEL_DISPLAY_NAMES[connection.provider]}
            </p>
          </div>
          {connection.isActive ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </Card>
      ))}
    </div>
  )
}
