'use client'

import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import {
  OverviewView,
  PerformanceView,
  ContentView,
  CommerceView,
} from './views'

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
    default:
      return <OverviewView />
  }
}
