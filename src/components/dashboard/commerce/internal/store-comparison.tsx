'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FunnelChart, PieChart } from '../../charts'
import { StoreTable } from '../../tables'
import type { StoreMetrics } from '@/lib/hooks/use-dashboard-data'

interface StoreComparisonProps {
  smartstoreMetrics: StoreMetrics | undefined
  coupangMetrics: StoreMetrics | undefined
  trafficData: {
    users: number | null
    sessions: number | null
    conversionRate: number | null
    previousConversionRate: number | null
  } | undefined
}

interface StoreTableRow {
  store: string
  revenue: number
  previousRevenue?: number
  orders: number
  previousOrders?: number
  aov: number
  previousAov?: number
  /** 취소 건수 (null: 데이터 미제공) */
  cancels: number | null
  /** 반품 건수 (null: 데이터 미제공) */
  refunds: number | null
}

/**
 * 스토어 비교 섹션
 *
 * - 전환 퍼널: 방문 -> 세션 -> 장바구니 -> 결제완료
 * - 채널별 매출 구성 (파이차트)
 * - 스토어별 상세 성과 테이블 (매출, 주문수, 객단가, 취소, 반품)
 */
export function StoreComparison({
  smartstoreMetrics,
  coupangMetrics,
  trafficData,
}: StoreComparisonProps) {
  // 전환 퍼널 데이터
  const totalOrders =
    (smartstoreMetrics?.orders || 0) + (coupangMetrics?.orders || 0)

  const funnelData = [
    { name: '방문자', value: trafficData?.users || 0 },
    { name: '세션', value: trafficData?.sessions || 0 },
    { name: '장바구니', value: Math.floor((trafficData?.sessions || 0) * 0.3) },
    { name: '결제완료', value: totalOrders },
  ]

  // 파이차트 데이터
  const pieData: Array<{ name: string; value: number; color: string }> = []
  if (smartstoreMetrics?.revenue) {
    pieData.push({
      name: '스마트스토어',
      value: smartstoreMetrics.revenue,
      color: '#22c55e',
    })
  }
  if (coupangMetrics?.revenue) {
    pieData.push({
      name: '쿠팡',
      value: coupangMetrics.revenue,
      color: '#3b82f6',
    })
  }

  // 스토어 테이블 데이터
  const storeTableData: StoreTableRow[] = []

  if (smartstoreMetrics) {
    const previousRevenue = smartstoreMetrics.change?.revenue
      ? smartstoreMetrics.revenue! / (1 + smartstoreMetrics.change.revenue / 100)
      : undefined

    storeTableData.push({
      store: '스마트스토어',
      revenue: smartstoreMetrics.revenue || 0,
      previousRevenue,
      orders: smartstoreMetrics.orders || 0,
      aov: smartstoreMetrics.avgOrderValue || 0,
      // TODO: 실제 반품/취소 데이터는 스토어 API 연동 후 제공
      cancels: null,
      refunds: null,
    })
  }

  if (coupangMetrics) {
    const previousRevenue = coupangMetrics.change?.revenue
      ? coupangMetrics.revenue! / (1 + coupangMetrics.change.revenue / 100)
      : undefined

    storeTableData.push({
      store: '쿠팡',
      revenue: coupangMetrics.revenue || 0,
      previousRevenue,
      orders: coupangMetrics.orders || 0,
      aov: coupangMetrics.avgOrderValue || 0,
      // TODO: 실제 반품/취소 데이터는 스토어 API 연동 후 제공
      cancels: null,
      refunds: null,
    })
  }

  return (
    <section aria-label="스토어 비교 분석" className="space-y-6">
      {/* 전환 퍼널 & 채널별 매출 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              전환 퍼널
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={funnelData} height={250} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              채널별 매출 구성
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <PieChart data={pieData} height={250} />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 스토어별 성과 테이블 */}
      {storeTableData.length > 0 && (
        <StoreTable
          title="스토어별 성과"
          data={storeTableData}
          showTotals={storeTableData.length > 1}
        />
      )}

      {/* 반품/취소 현황 안내 */}
      {storeTableData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              반품/취소 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              현재 연동된 채널에서 반품/취소 데이터가 제공되지 않습니다.
              <br />
              CSV 업로드 또는 추가 채널 연동 시 해당 데이터가 표시됩니다.
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
