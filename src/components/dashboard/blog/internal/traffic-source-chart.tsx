'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from '../../charts'
import { TRAFFIC_SOURCE_COLORS } from '@/constants'

interface TrafficSourceData {
  searchVisitors: number | null
  directVisitors: number | null
  socialVisitors: number | null
  referralVisitors: number | null
}

interface TrafficSourceChartProps {
  data: TrafficSourceData | null
}

export function TrafficSourceChart({ data }: TrafficSourceChartProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">유입 경로 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            데이터 없음
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = [
    {
      name: '검색',
      value: data.searchVisitors ?? 0,
      color: TRAFFIC_SOURCE_COLORS.search,
    },
    {
      name: '직접',
      value: data.directVisitors ?? 0,
      color: TRAFFIC_SOURCE_COLORS.direct,
    },
    {
      name: '소셜',
      value: data.socialVisitors ?? 0,
      color: TRAFFIC_SOURCE_COLORS.social,
    },
    {
      name: '외부',
      value: data.referralVisitors ?? 0,
      color: TRAFFIC_SOURCE_COLORS.referral,
    },
  ].filter((item) => item.value > 0)

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">유입 경로 분석</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            유입 데이터 없음
          </div>
        ) : (
          <PieChart
            data={chartData}
            height={250}
            showLegend={true}
            innerRadius={50}
            outerRadius={80}
          />
        )}
      </CardContent>
    </Card>
  )
}
