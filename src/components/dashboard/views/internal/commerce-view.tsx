'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useDashboardMetrics, useDashboardNotes } from '@/lib/hooks/use-dashboard-data'
import { KPICardEnhanced, InsightCard } from '../../cards'
import { FunnelChart, PieChart } from '../../charts'
import { StoreTable } from '../../tables'
import { Skeleton } from '../../skeleton'
import { CHANNEL_COLORS, CHANNEL_LABELS } from '@/constants'

export function CommerceView() {
  const { workspaceId, periodType, periodStart, selectedChannels } = useDashboardContext()

  const channelsParam = selectedChannels.length > 0 ? selectedChannels : undefined
  const { data: metrics, error, isLoading: metricsLoading } = useDashboardMetrics(
    workspaceId,
    periodType,
    periodStart,
    channelsParam
  )

  const { data: notesData, isLoading: notesLoading } = useDashboardNotes(
    workspaceId,
    periodType,
    periodStart
  )

  if (metricsLoading || notesLoading) {
    return <CommerceSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const overview = metrics?.overview
  const previous = metrics?.previous
  const channelDetails = metrics?.channelDetails
  const traffic = metrics?.store?.traffic

  const totalRevenue = overview?.totalRevenue || 0
  const totalOrders = (channelDetails?.SMARTSTORE?.orders || 0) + (channelDetails?.COUPANG?.orders || 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const conversionRate = traffic?.conversionRate || 0

  const kpis = [
    { title: '총 매출', value: totalRevenue, previousValue: previous?.totalRevenue ?? null, format: 'currency' as const },
    { title: '주문 수', value: totalOrders, previousValue: null },
    { title: '객단가', value: avgOrderValue, previousValue: null, format: 'currency' as const },
    { title: '전환율', value: conversionRate, previousValue: traffic?.previousConversionRate ?? null, format: 'percent' as const },
  ]

  const funnelData = [
    { name: '방문자', value: traffic?.users || 0 },
    { name: '세션', value: traffic?.sessions || 0 },
    { name: '장바구니', value: Math.floor((traffic?.sessions || 0) * 0.3) },
    { name: '결제완료', value: totalOrders },
  ]

  const pieData = []
  if (channelDetails?.SMARTSTORE?.revenue) {
    pieData.push({ name: CHANNEL_LABELS.SMARTSTORE, value: channelDetails.SMARTSTORE.revenue, color: CHANNEL_COLORS.SMARTSTORE })
  }
  if (channelDetails?.COUPANG?.revenue) {
    pieData.push({ name: CHANNEL_LABELS.COUPANG, value: channelDetails.COUPANG.revenue, color: CHANNEL_COLORS.COUPANG })
  }

  const storeTableData = []
  if (channelDetails?.SMARTSTORE) {
    storeTableData.push({
      store: CHANNEL_LABELS.SMARTSTORE,
      revenue: channelDetails.SMARTSTORE.revenue || 0,
      previousRevenue: channelDetails.SMARTSTORE.change?.revenue ? (channelDetails.SMARTSTORE.revenue || 0) / (1 + channelDetails.SMARTSTORE.change.revenue / 100) : undefined,
      orders: channelDetails.SMARTSTORE.orders || 0,
      aov: channelDetails.SMARTSTORE.avgOrderValue || 0,
      cancels: 0,
      refunds: 0,
    })
  }
  if (channelDetails?.COUPANG) {
    storeTableData.push({
      store: CHANNEL_LABELS.COUPANG,
      revenue: channelDetails.COUPANG.revenue || 0,
      previousRevenue: channelDetails.COUPANG.change?.revenue ? (channelDetails.COUPANG.revenue || 0) / (1 + channelDetails.COUPANG.change.revenue / 100) : undefined,
      orders: channelDetails.COUPANG.orders || 0,
      aov: channelDetails.COUPANG.avgOrderValue || 0,
      cancels: 0,
      refunds: 0,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICardEnhanced
            key={index}
            title={kpi.title}
            value={kpi.value}
            previousValue={kpi.previousValue}
            format={kpi.format}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">전환 퍼널</h3>
          <FunnelChart data={funnelData} height={250} />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">채널별 매출 구성</h3>
          {pieData.length > 0 ? (
            <PieChart data={pieData} height={250} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {storeTableData.length > 0 && (
        <StoreTable
          title="스토어별 성과"
          data={storeTableData}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <InsightCard
          title="익월 목표"
          items={notesData?.notes?.bestPractices?.slice(0, 3) || ['목표를 설정해주세요']}
        />
        <InsightCard
          title="차주 액션 아이템"
          items={notesData?.actions?.map(a => a.title).slice(0, 3) || []}
        />
      </div>
    </div>
  )
}

function CommerceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
      <Skeleton className="h-[200px]" />
    </div>
  )
}
