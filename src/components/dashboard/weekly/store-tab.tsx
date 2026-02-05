'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '../kpi-card'
import { useDashboardMetrics } from '@/lib/hooks/use-dashboard-data'
import { Skeleton } from '../skeleton'

interface StoreTabProps {
  workspaceId: string
  periodStart: Date
}

export function StoreTab({ workspaceId, periodStart }: StoreTabProps) {
  const { data: metrics, error, isLoading } = useDashboardMetrics(
    workspaceId,
    'WEEKLY',
    periodStart
  )

  if (isLoading) {
    return <StoreSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const traffic = metrics?.store?.traffic
  const channels = metrics?.store?.channels ?? []

  const trafficKPIs = [
    { title: '세션', value: traffic?.sessions ?? null, previousValue: traffic?.previousSessions ?? null },
    { title: '사용자', value: traffic?.users ?? null, previousValue: traffic?.previousUsers ?? null },
    { title: 'DAU', value: traffic?.dau ?? null, previousValue: traffic?.previousDau ?? null },
    { title: 'WAU', value: traffic?.wau ?? null, previousValue: traffic?.previousWau ?? null },
    {
      title: '전환율',
      value: traffic?.conversionRate ?? null,
      previousValue: traffic?.previousConversionRate ?? null,
      format: 'percent' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Traffic KPIs (GA4) */}
      <Card>
        <CardHeader>
          <CardTitle>트래픽/활동 (GA4)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {trafficKPIs.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                previousValue={kpi.previousValue}
                format={kpi.format}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Store Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>채널별 매출</CardTitle>
        </CardHeader>
        <CardContent>
          {channels.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left font-medium">스토어</th>
                    <th className="py-2 px-4 text-right font-medium">매출</th>
                    <th className="py-2 px-4 text-right font-medium">주문수</th>
                    <th className="py-2 px-4 text-right font-medium">객단가</th>
                    <th className="py-2 px-4 text-right font-medium">취소</th>
                    <th className="py-2 px-4 text-right font-medium">환불</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((store) => {
                    const sales = store.data.revenue ?? store.data.sales ?? 0
                    const orders = store.data.orders ?? 0
                    const aov = orders > 0 ? Math.round(sales / orders) : 0
                    const cancels = store.data.cancels ?? 0
                    const refunds = store.data.refunds ?? 0

                    return (
                      <tr key={store.channel} className="border-b">
                        <td className="py-3 px-4 font-medium">{store.channelName}</td>
                        <td className="py-3 px-4 text-right">
                          <div>₩{sales.toLocaleString()}</div>
                          {renderChange(store.change.revenue ?? store.change.sales)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>{orders}</div>
                          {renderChange(store.change.orders)}
                        </td>
                        <td className="py-3 px-4 text-right">₩{aov.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{cancels}</td>
                        <td className="py-3 px-4 text-right">{refunds}</td>
                      </tr>
                    )
                  })}
                  {/* Total Row */}
                  <tr className="bg-muted/50 font-medium">
                    <td className="py-3 px-4">합계</td>
                    <td className="py-3 px-4 text-right">
                      ₩{channels.reduce((sum, s) => sum + (s.data.revenue ?? s.data.sales ?? 0), 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {channels.reduce((sum, s) => sum + (s.data.orders ?? 0), 0)}
                    </td>
                    <td className="py-3 px-4 text-right">-</td>
                    <td className="py-3 px-4 text-right">
                      {channels.reduce((sum, s) => sum + (s.data.cancels ?? 0), 0)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {channels.reduce((sum, s) => sum + (s.data.refunds ?? 0), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              스토어 데이터가 없습니다. CSV를 업로드하거나 채널을 연동하세요.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StoreSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[150px]" />
      <Skeleton className="h-[300px]" />
    </div>
  )
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
