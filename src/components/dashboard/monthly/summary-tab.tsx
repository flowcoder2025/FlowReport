'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '../kpi-card'
import { useDashboardMetrics, useDashboardNotes } from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../skeleton'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface SummaryTabProps {
  workspaceId: string
  periodStart: Date
}

export function SummaryTab({ workspaceId, periodStart }: SummaryTabProps) {
  const { data: metrics, error: metricsError, isLoading: metricsLoading } = useDashboardMetrics(
    workspaceId,
    'MONTHLY',
    periodStart
  )

  const { data: notesData, isLoading: notesLoading } = useDashboardNotes(
    workspaceId,
    'MONTHLY',
    periodStart
  )

  if (metricsLoading || notesLoading) {
    return <SummarySkeleton />
  }

  if (metricsError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const overview = metrics?.overview
  const previous = metrics?.previous
  const snsChannels = metrics?.sns?.channels ?? []
  const storeChannels = metrics?.store?.channels ?? []
  const notes = notesData?.notes

  const mainKPIs = [
    {
      title: '총 매출',
      value: overview?.totalRevenue ?? null,
      previousValue: previous?.totalRevenue ?? null,
      format: 'currency' as const,
    },
    { title: 'MAU', value: overview?.mau ?? overview?.wau ?? null, previousValue: previous?.mau ?? previous?.wau ?? null },
    { title: '총 도달', value: overview?.reach ?? null, previousValue: previous?.reach ?? null },
    { title: '회원가입', value: overview?.signups ?? null, previousValue: previous?.signups ?? null },
  ]

  // Calculate channel mix from store data
  const totalSales = storeChannels.reduce((sum, c) => sum + (c.data.revenue ?? c.data.sales ?? 0), 0)
  const channelMix = storeChannels.map((channel) => {
    const sales = channel.data.revenue ?? channel.data.sales ?? 0
    const percentage = totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0
    return {
      name: channel.channelName,
      value: percentage,
      color: getChannelColor(channel.channel),
    }
  }).filter((c) => c.value > 0)

  // SNS performance from channels
  const snsPerformance = snsChannels.map((channel) => ({
    channel: channel.channelName,
    followers: channel.data.followers ?? 0,
    engagement: channel.data.engagementRate ?? channel.change.engagement ?? 0,
  }))

  return (
    <div id="monthly-summary" className="space-y-6">
      {/* Header */}
      <div className="text-center py-4 border-b">
        <h2 className="text-2xl font-bold">월간 리포트 요약</h2>
        <p className="text-muted-foreground">{format(periodStart, 'yyyy년 M월', { locale: ko })}</p>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {mainKPIs.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            previousValue={kpi.previousValue}
            format={kpi.format}
          />
        ))}
      </div>

      {/* Channel Mix & SNS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Channel Mix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">채널 믹스</CardTitle>
          </CardHeader>
          <CardContent>
            {channelMix.length > 0 ? (
              <div className="space-y-3">
                {channelMix.map((channel) => (
                  <div key={channel.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{channel.name}</span>
                      <span className="font-medium">{channel.value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${channel.color} rounded-full`}
                        style={{ width: `${channel.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                스토어 데이터가 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* SNS Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SNS 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {snsPerformance.length > 0 ? (
              <div className="space-y-4">
                {snsPerformance.map((sns) => (
                  <div key={sns.channel} className="flex items-center justify-between">
                    <span className="font-medium">{sns.channel}</span>
                    <div className="text-right">
                      <div className="font-medium">{sns.followers.toLocaleString()} 팔로워</div>
                      <div className="text-sm text-muted-foreground">
                        참여율 {typeof sns.engagement === 'number' ? sns.engagement.toFixed(1) : '0'}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                SNS 데이터가 없습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">핵심 인사이트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium text-green-600 mb-2">성과</h4>
              <ul className="text-sm space-y-1">
                {(notes?.causes?.length ?? 0) > 0 ? (
                  notes!.causes.slice(0, 3).map((cause, index) => (
                    <li key={index}>• {cause}</li>
                  ))
                ) : (
                  <li className="text-muted-foreground">등록된 내용이 없습니다.</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-orange-600 mb-2">개선 필요</h4>
              <ul className="text-sm space-y-1">
                {(notes?.improvements?.length ?? 0) > 0 ? (
                  notes!.improvements.slice(0, 3).map((improvement, index) => (
                    <li key={index}>• {improvement}</li>
                  ))
                ) : (
                  <li className="text-muted-foreground">등록된 내용이 없습니다.</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">익월 중점</h4>
              <ul className="text-sm space-y-1">
                {(notes?.bestPractices?.length ?? 0) > 0 ? (
                  notes!.bestPractices.slice(0, 3).map((practice, index) => (
                    <li key={index}>• {practice}</li>
                  ))
                ) : (
                  <li className="text-muted-foreground">등록된 내용이 없습니다.</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[80px] mx-auto w-[300px]" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
      <Skeleton className="h-[200px]" />
    </div>
  )
}

function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    SMARTSTORE: 'bg-green-500',
    COUPANG: 'bg-blue-500',
    GA4: 'bg-purple-500',
  }
  return colors[channel] || 'bg-gray-500'
}
