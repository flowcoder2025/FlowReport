'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '../kpi-card'

interface StoreTabProps {
  workspaceId: string
}

export function StoreTab({ workspaceId }: StoreTabProps) {
  // Mock data
  const stores = [
    {
      name: '스마트스토어',
      sales: 5200000,
      orders: 85,
      aov: 61176,
      cancels: 3,
      refunds: 2,
      change: { sales: 8.5, orders: 12.3 },
    },
    {
      name: '쿠팡',
      sales: 4800000,
      orders: 72,
      aov: 66667,
      cancels: 5,
      refunds: 1,
      change: { sales: 15.2, orders: 18.7 },
    },
    {
      name: '자사몰',
      sales: 2500000,
      orders: 45,
      aov: 55556,
      cancels: 1,
      refunds: 0,
      change: { sales: -3.2, orders: -5.1 },
    },
  ]

  const trafficKPIs = [
    { title: '세션', value: 12500, previousValue: 11200 },
    { title: '사용자', value: 8900, previousValue: 8100 },
    { title: 'DAU', value: 3420, previousValue: 3100 },
    { title: 'WAU', value: 8500, previousValue: 8200 },
    { title: '전환율', value: 1.8, previousValue: 1.6, format: 'percent' as const },
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
                {stores.map((store) => (
                  <tr key={store.name} className="border-b">
                    <td className="py-3 px-4 font-medium">{store.name}</td>
                    <td className="py-3 px-4 text-right">
                      <div>₩{store.sales.toLocaleString()}</div>
                      <div className={`text-xs ${store.change.sales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {store.change.sales >= 0 ? '+' : ''}{store.change.sales}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div>{store.orders}</div>
                      <div className={`text-xs ${store.change.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {store.change.orders >= 0 ? '+' : ''}{store.change.orders}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">₩{store.aov.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{store.cancels}</td>
                    <td className="py-3 px-4 text-right">{store.refunds}</td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-medium">
                  <td className="py-3 px-4">합계</td>
                  <td className="py-3 px-4 text-right">
                    ₩{stores.reduce((sum, s) => sum + s.sales, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {stores.reduce((sum, s) => sum + s.orders, 0)}
                  </td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right">
                    {stores.reduce((sum, s) => sum + s.cancels, 0)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {stores.reduce((sum, s) => sum + s.refunds, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
