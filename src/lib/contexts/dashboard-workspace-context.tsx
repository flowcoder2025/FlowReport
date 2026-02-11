'use client'

import { createContext, useContext, useMemo, ReactNode } from 'react'

/**
 * Workspace Context
 *
 * 워크스페이스 ID를 제공하는 Context
 * 거의 변경되지 않는 정적 값으로, 데이터 조회에 사용
 */

interface WorkspaceContextValue {
  workspaceId: string
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

interface WorkspaceProviderProps {
  children: ReactNode
  workspaceId: string
}

export function WorkspaceProvider({
  children,
  workspaceId,
}: WorkspaceProviderProps) {
  const value = useMemo(() => ({ workspaceId }), [workspaceId])

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}
