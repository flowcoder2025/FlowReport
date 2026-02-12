'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendLineChart } from '../../charts'
import { BLOG_TREND_COLORS } from '@/constants'

const TREND_LINE_COLORS = BLOG_TREND_COLORS

interface TrendDataPoint {
  period: string
  visitors: number
  pageviews: number
  [key: string]: string | number
}

interface BlogTrendChartProps {
  data: TrendDataPoint[]
  title?: string
}

export function BlogTrendChart({ data, title = '최근 7일 트렌드' }: BlogTrendChartProps) {
  const lines = [
    {
      dataKey: 'visitors',
      name: '방문자',
      color: TREND_LINE_COLORS.visitors,
    },
    {
      dataKey: 'pageviews',
      name: '페이지뷰',
      color: TREND_LINE_COLORS.pageviews,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            트렌드 데이터 없음
          </div>
        ) : (
          <TrendLineChart
            data={data}
            lines={lines}
            height={300}
            showGrid={true}
            showLegend={true}
          />
        )}
      </CardContent>
    </Card>
  )
}
