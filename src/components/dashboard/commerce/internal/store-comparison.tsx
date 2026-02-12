'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FunnelChart, PieChart } from '../../charts'
import { StoreTable } from '../../tables'
import type { StoreMetrics } from '@/lib/hooks/use-dashboard-data'
import { XCircle, RotateCcw, AlertTriangle } from 'lucide-react'
import { CHANNEL_LABELS, CHANNEL_COLORS } from '@/constants'

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
      name: CHANNEL_LABELS.SMARTSTORE,
      value: smartstoreMetrics.revenue,
      color: CHANNEL_COLORS.SMARTSTORE,
    })
  }
  if (coupangMetrics?.revenue) {
    pieData.push({
      name: CHANNEL_LABELS.COUPANG,
      value: coupangMetrics.revenue,
      color: CHANNEL_COLORS.COUPANG,
    })
  }

  // 스토어 테이블 데이터
  const storeTableData: StoreTableRow[] = []

  if (smartstoreMetrics) {
    const previousRevenue = smartstoreMetrics.change?.revenue
      ? smartstoreMetrics.revenue! / (1 + smartstoreMetrics.change.revenue / 100)
      : undefined

    storeTableData.push({
      store: CHANNEL_LABELS.SMARTSTORE,
      revenue: smartstoreMetrics.revenue || 0,
      previousRevenue,
      orders: smartstoreMetrics.orders || 0,
      aov: smartstoreMetrics.avgOrderValue || 0,
      cancels: smartstoreMetrics.cancels ?? null,
      refunds: smartstoreMetrics.refunds ?? null,
    })
  }

  if (coupangMetrics) {
    const previousRevenue = coupangMetrics.change?.revenue
      ? coupangMetrics.revenue! / (1 + coupangMetrics.change.revenue / 100)
      : undefined

    storeTableData.push({
      store: CHANNEL_LABELS.COUPANG,
      revenue: coupangMetrics.revenue || 0,
      previousRevenue,
      orders: coupangMetrics.orders || 0,
      aov: coupangMetrics.avgOrderValue || 0,
      cancels: coupangMetrics.cancels ?? null,
      refunds: coupangMetrics.refunds ?? null,
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

      {/* 반품/취소 현황 */}
      {storeTableData.length > 0 && (
        <RefundCancelSummary data={storeTableData} />
      )}
    </section>
  )
}

/**
 * 반품/취소 현황 요약 컴포넌트
 */
function RefundCancelSummary({ data }: { data: StoreTableRow[] }) {
  const totalCancels = data.reduce((sum, r) => sum + (r.cancels ?? 0), 0)
  const totalRefunds = data.reduce((sum, r) => sum + (r.refunds ?? 0), 0)
  const totalOrders = data.reduce((sum, r) => sum + r.orders, 0)
  const hasData = data.some((r) => r.cancels !== null || r.refunds !== null)

  // 손실률 계산 (취소+반품 / 총주문)
  const lossRate =
    totalOrders > 0 ? ((totalCancels + totalRefunds) / totalOrders) * 100 : 0

  if (!hasData) {
    return (
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
            CSV 업로드 시 cancels_count, refunds_count 컬럼을 포함하면 표시됩니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          반품/취소 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* 취소 건수 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">취소</p>
              <p className="text-lg font-semibold">
                {totalCancels.toLocaleString()}건
              </p>
            </div>
          </div>

          {/* 반품 건수 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">반품</p>
              <p className="text-lg font-semibold">
                {totalRefunds.toLocaleString()}건
              </p>
            </div>
          </div>

          {/* 손실률 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">손실률</p>
              <p className="text-lg font-semibold">
                {lossRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* 스토어별 상세 */}
        {data.length > 1 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">스토어별</p>
            <div className="space-y-2">
              {data.map((row) => (
                <div
                  key={row.store}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{row.store}</span>
                  <span>
                    취소 {row.cancels?.toLocaleString() ?? '-'}건 / 반품{' '}
                    {row.refunds?.toLocaleString() ?? '-'}건
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
