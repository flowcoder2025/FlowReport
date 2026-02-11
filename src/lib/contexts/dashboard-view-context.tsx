'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'

/**
 * View Context
 *
 * 현재 활성화된 뷰(탭)를 관리하는 Context
 * TopNav, DashboardViewRenderer에서 사용
 */

export type DashboardView =
  | 'overview'
  | 'performance'
  | 'content'
  | 'commerce'
  | 'executive'
  | 'marketing'
  | 'analytics'
  | 'blog'

interface ViewContextValue {
  activeView: DashboardView
  setActiveView: (view: DashboardView) => void
}

const ViewContext = createContext<ViewContextValue | null>(null)

interface ViewProviderProps {
  children: ReactNode
  initialView?: DashboardView
}

export function ViewProvider({
  children,
  initialView = 'overview',
}: ViewProviderProps) {
  const [activeView, setActiveViewState] = useState<DashboardView>(initialView)

  const setActiveView = useCallback((view: DashboardView) => {
    setActiveViewState(view)
  }, [])

  const value = useMemo(
    () => ({
      activeView,
      setActiveView,
    }),
    [activeView, setActiveView]
  )

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>
}

export function useViewContext() {
  const context = useContext(ViewContext)
  if (!context) {
    throw new Error('useViewContext must be used within a ViewProvider')
  }
  return context
}
