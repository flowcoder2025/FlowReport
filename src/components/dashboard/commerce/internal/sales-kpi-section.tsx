'use client'

import { KPICardEnhanced } from '../../cards'

interface SalesKPISectionProps {
  totalRevenue: number
  previousRevenue: number | null
  totalOrders: number
  previousOrders: number | null
  avgOrderValue: number
  previousAov: number | null
  conversionRate: number
  previousConversionRate: number | null
}

/**
 * 매출 KPI 섹션
 *
 * 커머스팀이 가장 먼저 확인해야 할 핵심 지표:
 * - 총 매출 (전기 대비)
 * - 주문 수
 * - 객단가 (AOV)
 * - 전환율
 */
export function SalesKPISection({
  totalRevenue,
  previousRevenue,
  totalOrders,
  previousOrders,
  avgOrderValue,
  previousAov,
  conversionRate,
  previousConversionRate,
}: SalesKPISectionProps) {
  const kpis = [
    {
      title: '총 매출',
      value: totalRevenue,
      previousValue: previousRevenue,
      format: 'currency' as const,
    },
    {
      title: '주문 수',
      value: totalOrders,
      previousValue: previousOrders,
      format: 'number' as const,
    },
    {
      title: '객단가 (AOV)',
      value: avgOrderValue,
      previousValue: previousAov,
      format: 'currency' as const,
    },
    {
      title: '전환율',
      value: conversionRate,
      previousValue: previousConversionRate,
      format: 'percent' as const,
    },
  ]

  return (
    <section aria-label="매출 핵심 지표">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICardEnhanced
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            previousValue={kpi.previousValue}
            format={kpi.format}
          />
        ))}
      </div>
    </section>
  )
}
