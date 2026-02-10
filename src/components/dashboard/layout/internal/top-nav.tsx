'use client'

import { cn } from '@/lib/utils'
import { useDashboardContext, DashboardView } from '@/lib/contexts/dashboard-context'
import { useDashboardUrl } from '@/lib/hooks/use-dashboard-url'

const NAV_ITEMS: { value: DashboardView; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'performance', label: 'Performance' },
  { value: 'content', label: 'Content' },
  { value: 'commerce', label: 'Commerce' },
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
      {NAV_ITEMS.map((item) => (
        <button
          key={item.value}
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
      ))}
    </nav>
  )
}
