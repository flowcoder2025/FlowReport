'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardMetrics } from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../skeleton'
import { ImageIcon } from 'lucide-react'
import { CHANNEL_LABELS } from '@/constants'

interface SNSTabProps {
  workspaceId: string
  periodStart: Date
  selectedChannels?: string[]
}

export function SNSTab({ workspaceId, periodStart, selectedChannels }: SNSTabProps) {
  const channelsParam = selectedChannels && selectedChannels.length > 0 ? selectedChannels : undefined
  const { data: metrics, error, isLoading } = useDashboardMetrics(
    workspaceId,
    'WEEKLY',
    periodStart,
    channelsParam
  )

  if (isLoading) {
    return <SNSSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  // 채널 필터 적용
  const allChannels = metrics?.sns?.channels ?? []
  const allTopPosts = metrics?.sns?.topPosts ?? []

  const channels = selectedChannels && selectedChannels.length > 0
    ? allChannels.filter(ch => selectedChannels.includes(ch.channel))
    : allChannels

  const topPosts = selectedChannels && selectedChannels.length > 0
    ? allTopPosts.filter(post => selectedChannels.includes(post.channel))
    : allTopPosts

  return (
    <div className="space-y-6">
      {/* Channel Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>채널별 요약</CardTitle>
        </CardHeader>
        <CardContent>
          {channels.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left font-medium">채널</th>
                    <th className="py-2 px-4 text-right font-medium">업로드</th>
                    <th className="py-2 px-4 text-right font-medium">조회수</th>
                    <th className="py-2 px-4 text-right font-medium">도달</th>
                    <th className="py-2 px-4 text-right font-medium">상호작용</th>
                    <th className="py-2 px-4 text-right font-medium">팔로워</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((channel) => (
                    <tr key={channel.channel} className="border-b">
                      <td className="py-3 px-4 font-medium">{channel.channelName}</td>
                      <td className="py-3 px-4 text-right">
                        {formatValue(channel.data.uploads ?? channel.data.posts)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>{formatValue(channel.data.views ?? channel.data.impressions)}</div>
                        {renderChange(channel.change.views ?? channel.change.impressions)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {channel.data.reach !== null ? (
                          <>
                            <div>{formatValue(channel.data.reach)}</div>
                            {renderChange(channel.change.reach)}
                          </>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>{formatValue(channel.data.engagement ?? channel.data.engagements)}</div>
                        {renderChange(channel.change.engagement ?? channel.change.engagements)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>{formatValue(channel.data.followers)}</div>
                        {renderChange(channel.change.followers)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              SNS 데이터가 없습니다. CSV를 업로드하거나 채널을 연동하세요.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top 게시물</CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length > 0 ? (
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm w-6">{index + 1}</span>
                    {/* 썸네일 이미지 */}
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      {(post as { thumbnail?: string }).thumbnail ? (
                        <img
                          src={(post as { thumbnail?: string }).thumbnail}
                          alt={post.title || '게시물 썸네일'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{post.title || '제목 없음'}</div>
                      <div className="text-sm text-muted-foreground">
                        {getChannelDisplayName(post.channel)} · {post.contentType}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {post.views !== null ? `${post.views.toLocaleString()} 조회` : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {post.engagement !== null ? `${post.engagement.toLocaleString()} 상호작용` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              이 기간에 게시물 데이터가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SNSSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[300px]" />
      <Skeleton className="h-[250px]" />
    </div>
  )
}

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A'
  return value.toLocaleString()
}

function renderChange(change: number | null | undefined) {
  if (change === null || change === undefined) return null
  const isPositive = change >= 0
  return (
    <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? '+' : ''}{change.toFixed(1)}%
    </div>
  )
}

function getChannelDisplayName(channel: string): string {
  return CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS] || channel
}
