/**
 * Report Automation Constants
 *
 * 리포트 자동화 관련 상수 정의
 */

export const REPORT_CONFIG = {
  /** 스케줄당 최대 수신자 수 */
  MAX_RECIPIENTS: 20,
  /** 기본 발송 시간 (시) */
  DEFAULT_SCHEDULE_HOUR: 9,
  /** 기본 타임존 */
  TIMEZONE: 'Asia/Seoul',
  /** PDF 생성 타임아웃 (ms) */
  PDF_TIMEOUT: 60000,
  /** 이메일 발송 재시도 횟수 */
  EMAIL_RETRY_COUNT: 3,
} as const

export const REPORT_SECTIONS = {
  KPI: 'kpi',
  CHANNEL_MIX: 'channelMix',
  SNS_PERFORMANCE: 'snsPerformance',
  STORE_PERFORMANCE: 'storePerformance',
  INSIGHTS: 'insights',
} as const

export type ReportSection = (typeof REPORT_SECTIONS)[keyof typeof REPORT_SECTIONS]

/** 기본 리포트 설정 (모든 섹션 활성화) */
export const DEFAULT_REPORT_CONFIG = {
  sections: Object.values(REPORT_SECTIONS),
  includeCharts: true,
  includeTrends: true,
} as const

/** 요일 레이블 (한국어) */
export const WEEKDAY_LABELS = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
} as const

/** 월간 리포트 발송일 옵션 */
export const MONTHLY_DAY_OPTIONS = [1, 5, 10, 15, 20, 25] as const

export type WeekdayKey = keyof typeof WEEKDAY_LABELS
export type MonthlyDay = (typeof MONTHLY_DAY_OPTIONS)[number]
