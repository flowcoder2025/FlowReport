'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StoreCardProps } from '../types'
import { MetricBox } from './metric-box'
import { CHANNEL_LABELS } from '@/constants'

export function StoreCard({ metrics, name }: StoreCardProps) {
  const icon = name === CHANNEL_LABELS.SMARTSTORE ? '🛒' : '🚀'

  // 취소율: 취소건수 / 주문수 * 100
  const cancelRate =
    metrics.cancels !== null && metrics.orders !== null && metrics.orders > 0
      ? (metrics.cancels / metrics.orders) * 100
      : null

  // 반품율: 반품건수 / 주문수 * 100
  const refundRate =
    metrics.refunds !== null && metrics.orders !== null && metrics.orders > 0
      ? (metrics.refunds / metrics.orders) * 100
      : null

  const hasCancelRefundData = cancelRate !== null || refundRate !== null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>{icon}</span>
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            label="매출"
            value={metrics.revenue}
            change={metrics.change.revenue}
            format="currency"
          />
          <MetricBox
            label="주문수"
            value={metrics.orders}
            change={metrics.change.orders}
          />
          <MetricBox
            label="전환율"
            value={metrics.conversionRate}
            change={metrics.change.conversionRate}
            format="percent"
          />
          <MetricBox
            label="객단가"
            value={metrics.avgOrderValue}
            format="currency"
          />
          {hasCancelRefundData && (
            <>
              {cancelRate !== null && (
                <MetricBox
                  label="취소율"
                  value={cancelRate}
                  change={metrics.change.cancels}
                  format="percent"
                />
              )}
              {refundRate !== null && (
                <MetricBox
                  label="반품율"
                  value={refundRate}
                  change={metrics.change.refunds}
                  format="percent"
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
