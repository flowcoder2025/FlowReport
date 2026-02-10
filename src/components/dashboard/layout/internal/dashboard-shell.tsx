'use client'

import { ReactNode } from 'react'
import { TopNav } from './top-nav'
import { FilterBar } from './filter-bar'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col">
      <TopNav />
      <FilterBar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
