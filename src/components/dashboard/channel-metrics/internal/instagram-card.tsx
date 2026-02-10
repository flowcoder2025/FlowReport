'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InstagramCardProps } from '../types'
import { MetricBox } from './metric-box'

export function InstagramCard({ metrics }: InstagramCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>📷</span>
          Instagram
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            label="도달"
            value={metrics.reach}
            change={metrics.change.reach}
          />
          <MetricBox
            label="참여율"
            value={metrics.engagementRate}
            format="percent"
          />
          <MetricBox
            label="팔로워"
            value={metrics.followers}
            change={metrics.change.followers}
          />
          <MetricBox
            label="노출"
            value={metrics.impressions}
            change={metrics.change.impressions}
          />
        </div>
      </CardContent>
    </Card>
  )
}
