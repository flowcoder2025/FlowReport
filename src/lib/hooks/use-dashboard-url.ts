'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DashboardView, PeriodType } from '@/lib/contexts/dashboard-context'

interface UrlParams {
  view?: DashboardView
  period?: PeriodType
  date?: string
  channels?: string
}

export function useDashboardUrl() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateUrl = useCallback(
    (params: UrlParams) => {
      const current = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          current.delete(key)
        } else {
          current.set(key, value)
        }
      })

      const query = current.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const getParams = useCallback(() => {
    return {
      view: (searchParams.get('view') as DashboardView) || 'overview',
      period: (searchParams.get('period') as PeriodType) || 'WEEKLY',
      date: searchParams.get('date') || undefined,
      channels: searchParams.get('channels') || undefined,
    }
  }, [searchParams])

  return { updateUrl, getParams }
}
