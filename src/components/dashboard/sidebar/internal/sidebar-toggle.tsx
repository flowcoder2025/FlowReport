'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { SidebarToggleProps } from '../types'

export function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="h-8 w-8"
      aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  )
}

export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="h-9 w-9 lg:hidden"
      aria-label="메뉴 열기"
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}
