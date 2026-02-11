// Executive Dashboard - Public API
// 경영진/CEO용 대시보드 컴포넌트

export { ExecutiveView } from './internal/executive-view'
export { ExecutiveSummary } from './internal/executive-summary'
export { RiskAlerts } from './internal/risk-alerts'
export { DepartmentSummary } from './internal/department-summary'
export { RecommendedActions } from './internal/recommended-actions'

// 타입 exports
export type {
  RiskLevel,
  RiskAlert,
  RecommendedAction,
  ExecutiveKPI,
  DepartmentMetrics,
  ExecutiveMetrics,
} from './internal/types'
