'use client'

import dynamic from 'next/dynamic'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { Skeleton } from './skeleton'

// 로딩 스켈레톤 컴포넌트
function ViewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  )
}

// Dynamic imports - 코드 스플리팅으로 초기 번들 사이즈 최적화
const OverviewView = dynamic(
  () => import('./views').then((mod) => ({ default: mod.OverviewView })),
  { loading: () => <ViewSkeleton /> }
)

const PerformanceView = dynamic(
  () => import('./views').then((mod) => ({ default: mod.PerformanceView })),
  { loading: () => <ViewSkeleton /> }
)

const CommerceDashboardView = dynamic(
  () => import('./commerce').then((mod) => ({ default: mod.CommerceDashboardView })),
  { loading: () => <ViewSkeleton /> }
)

const ExecutiveView = dynamic(
  () => import('./executive').then((mod) => ({ default: mod.ExecutiveView })),
  { loading: () => <ViewSkeleton /> }
)

const MarketingView = dynamic(
  () => import('./marketing').then((mod) => ({ default: mod.MarketingView })),
  { loading: () => <ViewSkeleton /> }
)

const AnalyticsView = dynamic(
  () => import('./analytics').then((mod) => ({ default: mod.AnalyticsView })),
  { loading: () => <ViewSkeleton /> }
)

const BlogView = dynamic(
  () => import('./blog').then((mod) => ({ default: mod.BlogView })),
  { loading: () => <ViewSkeleton /> }
)

export function DashboardViewRenderer() {
  const { activeView } = useDashboardContext()

  switch (activeView) {
    case 'overview':
      return <OverviewView />
    case 'performance':
      return <PerformanceView />
    case 'content':
      // 하위 호환성: content 뷰는 Performance 뷰의 콘텐츠 분석 탭으로 리다이렉트
      return <PerformanceView defaultTab="content" />
    case 'commerce':
      return <CommerceDashboardView />
    // 페르소나 뷰
    case 'executive':
      return <ExecutiveView />
    case 'marketing':
      return <MarketingView />
    case 'analytics':
      return <AnalyticsView />
    case 'blog':
      return <BlogView />
    default:
      return <OverviewView />
  }
}
