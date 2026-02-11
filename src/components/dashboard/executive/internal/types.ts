'use client'

// Executive Dashboard 타입 정의

export type RiskLevel = 'critical' | 'warning' | 'info'

export interface RecommendedAction {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  department: 'marketing' | 'commerce' | 'overall'
  departmentUrl: string
  steps?: string[]
}

export interface RiskAlert {
  id: string
  level: RiskLevel
  title: string
  description: string
  metric?: string
  value?: number
  threshold?: number
  department?: 'marketing' | 'commerce' | 'overall'
  actionUrl?: string
  recommendedAction?: RecommendedAction
}

export interface ExecutiveKPI {
  title: string
  value: number | null
  previousValue: number | null
  targetValue?: number | null
  format: 'currency' | 'number' | 'percent'
  description?: string
}

export interface DepartmentMetrics {
  name: string
  slug: 'marketing' | 'commerce'
  status: 'good' | 'warning' | 'critical'
  summary: string
  keyMetric: {
    label: string
    value: number | null
    change: number | null
  }
  drilldownUrl: string
}

export interface ExecutiveMetrics {
  kpis: ExecutiveKPI[]
  riskAlerts: RiskAlert[]
  departments: DepartmentMetrics[]
  overallHealth: 'good' | 'warning' | 'critical'
  lastUpdated: Date
}

// 위험 수준별 스타일 상수
export const RISK_LEVEL_STYLES = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
} as const

// 부서 상태별 스타일 상수
export const DEPARTMENT_STATUS_STYLES = {
  good: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
} as const
