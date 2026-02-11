'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import {
  OverviewView,
  PerformanceView,
  CommerceView,
} from './views'
import { ExecutiveView } from './executive'
import { MarketingView } from './marketing'
import { CommerceDashboardView } from './commerce'
import { AnalyticsView } from './analytics'
import { BlogView } from './blog'

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
      return <CommerceView />
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
