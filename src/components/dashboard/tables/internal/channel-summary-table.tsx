'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatNullableNumber } from '@/lib/utils/format'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { CHANNEL_COLORS } from '@/constants'

interface ChannelRow {
  channel: string
  channelName: string
  data: Record<string, number | null>
  change: Record<string, number | null>
}

interface ChannelSummaryTableProps {
  title?: string
  channels: ChannelRow[]
  compact?: boolean
}

export function ChannelSummaryTable({
  title = '채널별 요약',
  channels,
  compact = false,
}: ChannelSummaryTableProps) {
  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            채널 데이터가 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const columns = compact
    ? ['조회수', '참여', '팔로워']
    : ['업로드', '조회수', '도달', '참여', '팔로워']

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-3 text-left font-medium">채널</th>
                {!compact && (
                  <th className="py-2 px-3 text-right font-medium">업로드</th>
                )}
                <th className="py-2 px-3 text-right font-medium">조회수</th>
                {!compact && (
                  <th className="py-2 px-3 text-right font-medium">도달</th>
                )}
                <th className="py-2 px-3 text-right font-medium">참여</th>
                <th className="py-2 px-3 text-right font-medium">팔로워</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.channel} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHANNEL_COLORS[channel.channel as keyof typeof CHANNEL_COLORS] || '#8884d8' }}
                        aria-hidden="true"
                      />
                      {channel.channelName}
                    </div>
                  </td>
                  {!compact && (
                    <td className="py-3 px-3 text-right">
                      {formatNullableNumber(channel.data.uploads ?? channel.data.posts)}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right">
                    <MetricCell
                      value={channel.data.views ?? channel.data.impressions}
                      change={channel.change.views ?? channel.change.impressions}
                    />
                  </td>
                  {!compact && (
                    <td className="py-3 px-3 text-right">
                      <MetricCell
                        value={channel.data.reach}
                        change={channel.change.reach}
                      />
                    </td>
                  )}
                  <td className="py-3 px-3 text-right">
                    <MetricCell
                      value={channel.data.engagement ?? channel.data.engagements}
                      change={channel.change.engagement ?? channel.change.engagements}
                    />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <MetricCell
                      value={channel.data.followers ?? channel.data.subscriberGained}
                      change={channel.change.followers ?? channel.change.subscriberGained}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCell({ value, change }: { value: number | null | undefined; change: number | null | undefined }) {
  return (
    <div>
      <div>{formatNullableNumber(value)}</div>
      {change !== null && change !== undefined && (
        <div
          className={cn(
            'flex items-center justify-end gap-0.5 text-xs',
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

