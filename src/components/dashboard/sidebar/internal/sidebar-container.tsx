'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useDashboardContext } from '@/lib/contexts/dashboard-context'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { ChannelList } from './channel-list'
import { ChannelFilter } from './channel-filter'
import { SidebarToggle, MobileSidebarTrigger } from './sidebar-toggle'
import { ChannelConnection } from '../types'
import { cn } from '@/lib/utils'

interface SidebarContainerProps {
  connections: ChannelConnection[]
  isLoading: boolean
}

export function SidebarContainer({ connections, isLoading }: SidebarContainerProps) {
  const { selectedChannels, setSelectedChannels } = useDashboardContext()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false)
    }
  }, [isDesktop])

  const sidebarContent = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">연결된 채널</h3>
        <ChannelList connections={connections} isLoading={isLoading} />
      </div>

      <div className="border-t pt-4">
        <ChannelFilter
          connections={connections}
          selectedChannels={selectedChannels}
          onSelectionChange={setSelectedChannels}
        />
      </div>
    </div>
  )

  if (!isDesktop) {
    return (
      <>
        <MobileSidebarTrigger onClick={() => setMobileOpen(true)} />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-4">
            <SheetHeader className="mb-4">
              <SheetTitle>대시보드 메뉴</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <aside
      className={cn(
        'border-r transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0',
        sidebarCollapsed ? 'w-0' : 'w-[280px]'
      )}
    >
      <div className={cn(
        'h-full flex flex-col p-4 transition-opacity duration-200',
        sidebarCollapsed ? 'opacity-0' : 'opacity-100'
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">필터</h2>
          <SidebarToggle
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {sidebarContent}
        </div>
      </div>
    </aside>
  )
}

export function SidebarExpandButton() {
  // This component is deprecated as sidebar is moved to FilterBar
  // Keeping for backwards compatibility
  return null
}
