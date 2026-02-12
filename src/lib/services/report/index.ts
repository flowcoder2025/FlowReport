/**
 * Report Service Module - Public API
 *
 * 리포트 자동화 서비스
 */

// Types
export type {
  ReportPeriodRange,
  ReportScheduleConfig,
  ScheduleInfo,
  GenerateReportOptions,
  ReportGenerationResult,
  DistributionResult,
  WeeklyReportData,
  ReportData,
} from './types'

// Data Building
export {
  buildMonthlyReportData,
  buildWeeklyReportData,
  getMonthlyPeriodLabel,
  getWeeklyPeriodLabel,
} from './internal/data-builder'

// Scheduling
export {
  calculateNextRunAt,
  calculateReportPeriod,
  isDueForExecution,
} from './internal/scheduler'

// Generation
export {
  generateReport,
  generateTestReport,
} from './internal/generator'

// Distribution
export {
  distributeReport,
  sendTestEmail,
} from './internal/distributor'
