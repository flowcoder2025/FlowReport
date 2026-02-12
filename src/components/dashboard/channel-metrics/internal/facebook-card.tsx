'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FacebookMetrics } from '@/lib/hooks/use-dashboard-data'
import { MetricBox } from './metric-box'

interface FacebookCardProps {
  metrics: FacebookMetrics
}

export function FacebookCard({ metrics }: FacebookCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>📘</span>
          Facebook
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            label="노출"
            value={metrics.impressions}
            change={metrics.change.impressions}
          />
          <MetricBox
            label="참여"
            value={metrics.engagement}
            change={metrics.change.engagement}
          />
          <MetricBox
            label="팬 증가"
            value={metrics.fanAdds}
            change={metrics.change.fanAdds}
          />
          <MetricBox
            label="페이지 조회"
            value={metrics.pageViews}
            change={metrics.change.pageViews}
          />
        </div>
      </CardContent>
    </Card>
  )
}
