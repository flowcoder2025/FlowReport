'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StoreRow {
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

interface StoreTableProps {
  title?: string
  data: StoreRow[]
  showTotals?: boolean
}

export function StoreTable({
  title = '스토어 성과',
  data,
  showTotals = true,
}: StoreTableProps) {
  const totals = showTotals
    ? {
        store: '합계',
        revenue: data.reduce((sum, r) => sum + r.revenue, 0),
        previousRevenue: data.reduce((sum, r) => sum + (r.previousRevenue || 0), 0),
        orders: data.reduce((sum, r) => sum + r.orders, 0),
        previousOrders: data.reduce((sum, r) => sum + (r.previousOrders || 0), 0),
        aov: data.length > 0
          ? data.reduce((sum, r) => sum + r.revenue, 0) / data.reduce((sum, r) => sum + r.orders, 0)
          : 0,
        // 모든 데이터가 null이면 합계도 null, 하나라도 숫자면 합계 계산
        cancels: data.every((r) => r.cancels === null)
          ? null
          : data.reduce((sum, r) => sum + (r.cancels ?? 0), 0),
        refunds: data.every((r) => r.refunds === null)
          ? null
          : data.reduce((sum, r) => sum + (r.refunds ?? 0), 0),
      }
    : null

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
                <th className="text-left py-2 px-2 font-medium">스토어</th>
                <th className="text-right py-2 px-2 font-medium">매출</th>
                <th className="text-right py-2 px-2 font-medium">주문 수</th>
                <th className="text-right py-2 px-2 font-medium">객단가</th>
                <th className="text-right py-2 px-2 font-medium">취소</th>
                <th className="text-right py-2 px-2 font-medium">반품</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-2 font-medium">{row.store}</td>
                  <td className="py-2 px-2 text-right">
                    <MetricCell
                      value={row.revenue}
                      previousValue={row.previousRevenue}
                      format="currency"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <MetricCell
                      value={row.orders}
                      previousValue={row.previousOrders}
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <MetricCell
                      value={row.aov}
                      previousValue={row.previousAov}
                      format="currency"
                    />
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    {row.cancels !== null ? row.cancels.toLocaleString() : '-'}
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    {row.refunds !== null ? row.refunds.toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
              {totals && (
                <tr className="bg-muted/50 font-medium">
                  <td className="py-2 px-2">{totals.store}</td>
                  <td className="py-2 px-2 text-right">
                    <MetricCell
                      value={totals.revenue}
                      previousValue={totals.previousRevenue}
                      format="currency"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <MetricCell
                      value={totals.orders}
                      previousValue={totals.previousOrders}
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    {formatCurrency(totals.aov)}
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    {totals.cancels !== null ? totals.cancels.toLocaleString() : '-'}
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    {totals.refunds !== null ? totals.refunds.toLocaleString() : '-'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricCellProps {
  value: number
  previousValue?: number
  format?: 'number' | 'currency'
}

function MetricCell({ value, previousValue, format = 'number' }: MetricCellProps) {
  const change =
    previousValue && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null
  const isPositive = change !== null && change > 0
  const isNegative = change !== null && change < 0

  const formatted = format === 'currency' ? formatCurrency(value) : value.toLocaleString()

  return (
    <div className="flex items-center justify-end gap-1">
      <span>{formatted}</span>
      {change !== null && (
        <span
          className={cn(
            'flex items-center text-xs',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600',
            !isPositive && !isNegative && 'text-muted-foreground'
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : isNegative ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
        </span>
      )}
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}
