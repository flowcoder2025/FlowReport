'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '../kpi-card'

interface OverviewTabProps {
  workspaceId: string
}

export function OverviewTab({ workspaceId }: OverviewTabProps) {
  // In production, fetch data from API
  // const { data } = useQuery(['weekly-overview', workspaceId], fetchWeeklyOverview)

  // Mock data for UI demonstration
  const mockKPIs = [
    { title: '총 매출', value: 12500000, previousValue: 11200000, format: 'currency' as const },
    { title: 'DAU', value: 3420, previousValue: 3100 },
    { title: 'WAU', value: 8500, previousValue: 8200 },
    { title: '회원가입', value: 156, previousValue: 142 },
    { title: '총 도달', value: 125000, previousValue: 110000 },
    { title: '총 상호작용', value: 8900, previousValue: 7500 },
    { title: '팔로워 순증', value: 234, previousValue: 180 },
    { title: '업로드 수', value: 12, previousValue: 10 },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockKPIs.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            previousValue={kpi.previousValue}
            format={kpi.format}
          />
        ))}
      </div>

      {/* Insights Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">원인 Top 3</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">1.</span>
                <span>신규 프로모션 캠페인 진행으로 트래픽 증가</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">2.</span>
                <span>인스타그램 릴스 바이럴 콘텐츠</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">3.</span>
                <span>시즌 특수 (명절 기간 효과)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">개선 Top 3</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">1.</span>
                <span>전환율 개선을 위한 랜딩페이지 A/B 테스트</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">2.</span>
                <span>블로그 SEO 최적화 필요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">3.</span>
                <span>이탈율 높은 상품 상세페이지 개선</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">차주 반영사항</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>신규 상품 3종 등록</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>인스타그램 콘텐츠 5개 업로드</span>
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>블로그 포스팅 2개 작성</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
