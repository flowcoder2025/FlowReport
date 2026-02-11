'use client'

import { cn } from '@/lib/utils'
import { useDashboardContext, DashboardView } from '@/lib/contexts/dashboard-context'
import { useDashboardUrl } from '@/lib/hooks/use-dashboard-url'

const NAV_ITEMS: { value: DashboardView; label: string; group?: 'default' | 'persona' }[] = [
  // 기본 뷰
  { value: 'overview', label: 'Overview', group: 'default' },
  { value: 'performance', label: 'Performance', group: 'default' },
  // Content는 Performance에 통합됨 (?tab=content)
  { value: 'commerce', label: 'Commerce', group: 'default' },
  // 페르소나 뷰
  { value: 'executive', label: '경영진', group: 'persona' },
  { value: 'marketing', label: '마케팅', group: 'persona' },
  { value: 'analytics', label: '분석', group: 'persona' },
]

export function TopNav() {
  const { activeView, setActiveView } = useDashboardContext()
  const { updateUrl } = useDashboardUrl()

  const handleClick = (view: DashboardView) => {
    setActiveView(view)
    updateUrl({ view })
  }

  return (
    <nav className="flex items-center gap-1 border-b bg-background px-4">
      {NAV_ITEMS.map((item, index) => {
        // 그룹 구분선: 'default' 그룹의 마지막 아이템 다음에 표시
        const isGroupBoundary =
          index < NAV_ITEMS.length - 1 &&
          item.group === 'default' &&
          NAV_ITEMS[index + 1].group === 'persona'

        return (
          <div key={item.value} className="flex items-center">
            <button
              onClick={() => handleClick(item.value)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-colors',
                'hover:text-foreground',
                activeView === item.value
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
              {activeView === item.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            {isGroupBoundary && (
              <div className="h-6 w-px bg-border mx-1" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
