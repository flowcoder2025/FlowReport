'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import {
  OverviewView,
  PerformanceView,
  ContentView,
  CommerceView,
} from './views'
import { ExecutiveView } from './executive'
import { MarketingView } from './marketing'
import { CommerceDashboardView } from './commerce'
import { AnalyticsView } from './analytics'

export function DashboardViewRenderer() {
  const { activeView } = useDashboardContext()

  switch (activeView) {
    case 'overview':
      return <OverviewView />
    case 'performance':
      return <PerformanceView />
    case 'content':
      return <ContentView />
    case 'commerce':
      return <CommerceView />
    // 페르소나 뷰
    case 'executive':
      return <ExecutiveView />
    case 'marketing':
      return <MarketingView />
    case 'analytics':
      return <AnalyticsView />
    default:
      return <OverviewView />
  }
}
