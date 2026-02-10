/**
 * Executive Dashboard 목표값 상수
 *
 * TODO: workspace 설정 API 연결 시 동적 값으로 교체
 * - workspace별로 다른 목표값 설정 가능하도록 확장
 * - 관리자 설정 페이지에서 목표값 수정 기능 추가
 */
export const DEFAULT_TARGETS = {
  /** 목표 성장률 (%) - 성장률 KPI 카드에서 표시 */
  REVENUE_GROWTH_RATE: 10,

  /** 매출 목표 승수 (전기 대비) - 목표 매출 계산에 사용 */
  REVENUE_GROWTH_MULTIPLIER: 1.05,
} as const

// Type export for future workspace-specific config extension
export type TargetConfig = typeof DEFAULT_TARGETS
