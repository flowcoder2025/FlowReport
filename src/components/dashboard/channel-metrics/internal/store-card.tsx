'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StoreCardProps } from '../types'
import { MetricBox } from './metric-box'

export function StoreCard({ metrics, name }: StoreCardProps) {
  const icon = name === '스마트스토어' ? '🛒' : '🚀'

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
        </div>
      </CardContent>
    </Card>
  )
}
