'use client'

import { cn } from '@/lib/utils'
import {
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Target,
  Users,
  ShoppingCart,
  CalendarClock
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { RecommendedAction, RiskAlert } from './types'

interface RecommendedActionsProps {
  alerts: RiskAlert[]
  maxVisible?: number
}

const PRIORITY_STYLES = {
  high: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
} as const

const DEPARTMENT_INFO = {
  marketing: {
    label: '마케팅',
    icon: Users,
    url: '/dashboard?view=performance',
  },
  commerce: {
    label: '커머스',
    icon: ShoppingCart,
    url: '/dashboard?view=commerce',
  },
  overall: {
    label: '전체',
    icon: Target,
    url: '/dashboard?view=overview',
  },
} as const

export function RecommendedActions({ alerts, maxVisible = 3 }: RecommendedActionsProps) {
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // 권장 조치가 있는 알림만 필터링
  const actionsFromAlerts = alerts
    .filter((alert) => alert.recommendedAction)
    .map((alert) => alert.recommendedAction!)

  if (actionsFromAlerts.length === 0) {
    return null
  }

  // 우선순위별 정렬
  const sortedActions = [...actionsFromAlerts].sort((a, b) => {
    const order: Record<RecommendedAction['priority'], number> = {
      high: 0,
      medium: 1,
      low: 2
    }
    return order[a.priority] - order[b.priority]
  })

  // High-priority actions are always visible; medium/low collapse after maxVisible
  const highPriorityActions = sortedActions.filter((a) => a.priority === 'high')
  const otherActions = sortedActions.filter((a) => a.priority !== 'high')
  const remainingSlots = Math.max(0, maxVisible - highPriorityActions.length)
  const visibleOtherActions = showAll ? otherActions : otherActions.slice(0, remainingSlots)
  const visibleActions = [...highPriorityActions, ...visibleOtherActions]
  const hiddenCount = otherActions.length - remainingSlots

  const toggleExpand = (actionId: string) => {
    setExpandedActionId((current) => (current === actionId ? null : actionId))
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">권장 조치</h3>
          <span className="text-xs text-muted-foreground">
            ({actionsFromAlerts.length}개)
          </span>
        </div>
        <PriorityBadges actions={actionsFromAlerts} />
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        감지된 위험 신호에 대한 권장 조치 사항입니다.
      </p>

      <div className="space-y-3">
        {visibleActions.map((action) => (
          <ActionItem
            key={action.id}
            action={action}
            isExpanded={expandedActionId === action.id}
            onToggle={() => toggleExpand(action.id)}
          />
        ))}
      </div>

      {hiddenCount > 0 && !showAll && (
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={() => setShowAll(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            +{hiddenCount}개 더 보기
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {showAll && hiddenCount > 0 && (
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={() => setShowAll(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            접기
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

interface PriorityBadgesProps {
  actions: RecommendedAction[]
}

function PriorityBadges({ actions }: PriorityBadgesProps) {
  const highCount = actions.filter((a) => a.priority === 'high').length
  const mediumCount = actions.filter((a) => a.priority === 'medium').length
  const lowCount = actions.filter((a) => a.priority === 'low').length

  return (
    <div className="flex items-center gap-2">
      {highCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
          긴급 {highCount}
        </span>
      )}
      {mediumCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          주의 {mediumCount}
        </span>
      )}
      {lowCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          참고 {lowCount}
        </span>
      )}
    </div>
  )
}

interface ActionItemProps {
  action: RecommendedAction
  isExpanded: boolean
  onToggle: () => void
}

function ActionItem({ action, isExpanded, onToggle }: ActionItemProps) {
  const styles = PRIORITY_STYLES[action.priority]
  const deptInfo = DEPARTMENT_INFO[action.department]
  const DeptIcon = deptInfo.icon

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        styles.bg,
        styles.border
      )}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className={cn('h-5 w-5 mt-0.5 flex-shrink-0', styles.icon)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{action.title}</p>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', styles.badge)}>
                  {getPriorityLabel(action.priority)}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-8 space-y-3">
            {/* 상세 단계 */}
            {action.steps && action.steps.length > 0 && (
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">조치 단계</p>
                <ol className="space-y-1.5">
                  {action.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 마감일 */}
            {action.deadline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 rounded-lg px-3 py-2">
                <CalendarClock className="h-4 w-4 flex-shrink-0" />
                <span>마감: {action.deadline}</span>
              </div>
            )}

            {/* 담당 부서 링크 */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DeptIcon className="h-4 w-4" />
                <span>담당: {deptInfo.label}</span>
              </div>
              <Link
                href={action.departmentUrl}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                상세 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getPriorityLabel(priority: RecommendedAction['priority']): string {
  const labels: Record<RecommendedAction['priority'], string> = {
    high: '긴급',
    medium: '주의',
    low: '참고',
  }
  return labels[priority]
}
