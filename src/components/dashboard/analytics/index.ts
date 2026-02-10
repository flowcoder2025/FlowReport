/**
 * Analytics Dashboard Module
 *
 * 데이터팀/분석가용 대시보드
 * - 원본 데이터 탐색
 * - 메트릭 다중 선택
 * - 기간 커스텀 선택
 * - CSV Export
 * - 채널 간 상관관계 차트
 */

// Public API exports
export { AnalyticsView } from './internal/analytics-view'
export { MetricSelector } from './internal/metric-selector'
export { DataExplorer } from './internal/data-explorer'
export { ExportButton } from './internal/export-button'

// Types
export type { MetricOption, SelectedMetric } from './internal/metric-selector'
export type { RawMetricData, DataExplorerProps } from './internal/data-explorer'
