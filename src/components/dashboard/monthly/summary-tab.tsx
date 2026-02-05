'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '../kpi-card'

interface SummaryTabProps {
  workspaceId: string
}

export function SummaryTab({ workspaceId }: SummaryTabProps) {
  // Mock data for 1-page summary
  const mainKPIs = [
    { title: '총 매출', value: 52000000, previousValue: 48000000, format: 'currency' as const },
    { title: 'MAU', value: 35000, previousValue: 32000 },
    { title: '총 도달', value: 520000, previousValue: 480000 },
    { title: '회원가입', value: 620, previousValue: 580 },
  ]

  const channelMix = [
    { name: '스마트스토어', value: 42, color: 'bg-green-500' },
    { name: '쿠팡', value: 38, color: 'bg-blue-500' },
    { name: '자사몰', value: 20, color: 'bg-purple-500' },
  ]

  const snsPerformance = [
    { channel: 'Instagram', followers: 12800, engagement: 4.2 },
    { channel: 'Facebook', followers: 4350, engagement: 1.8 },
    { channel: 'YouTube', followers: 2300, engagement: 5.1 },
  ]

  return (
    <div id="monthly-summary" className="space-y-6">
      {/* Header */}
      <div className="text-center py-4 border-b">
        <h2 className="text-2xl font-bold">월간 리포트 요약</h2>
        <p className="text-muted-foreground">2024년 1월</p>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {mainKPIs.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            previousValue={kpi.previousValue}
            format={kpi.format}
          />
        ))}
      </div>

      {/* Channel Mix & SNS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Channel Mix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">채널 믹스</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {channelMix.map((channel) => (
                <div key={channel.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{channel.name}</span>
                    <span className="font-medium">{channel.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${channel.color} rounded-full`}
                      style={{ width: `${channel.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SNS Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SNS 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {snsPerformance.map((sns) => (
                <div key={sns.channel} className="flex items-center justify-between">
                  <span className="font-medium">{sns.channel}</span>
                  <div className="text-right">
                    <div className="font-medium">{sns.followers.toLocaleString()} 팔로워</div>
                    <div className="text-sm text-muted-foreground">
                      참여율 {sns.engagement}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">핵심 인사이트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium text-green-600 mb-2">성과</h4>
              <ul className="text-sm space-y-1">
                <li>• 매출 전월 대비 8.3% 증가</li>
                <li>• 인스타그램 팔로워 2.4% 성장</li>
                <li>• 전환율 0.2%p 개선</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-orange-600 mb-2">개선 필요</h4>
              <ul className="text-sm space-y-1">
                <li>• 자사몰 매출 비중 하락</li>
                <li>• 블로그 트래픽 정체</li>
                <li>• 신규 고객 획득 비용 증가</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">익월 중점</h4>
              <ul className="text-sm space-y-1">
                <li>• 자사몰 프로모션 강화</li>
                <li>• SEO 최적화 진행</li>
                <li>• 신규 콘텐츠 포맷 테스트</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
