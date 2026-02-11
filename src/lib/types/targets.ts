/**
 * Target Config Types - Single Source of Truth
 *
 * 워크스페이스 목표값 설정 관련 타입 및 스키마
 * 모든 목표값 관련 타입은 이 파일에서 관리
 */

import { z } from 'zod'

/**
 * 목표값 설정 Zod 스키마
 * API 검증 및 타입 추론에 사용
 */
export const targetConfigSchema = z.object({
  /** 성장률 목표 (%) */
  revenueGrowthRate: z.number().min(0).max(100).optional(),
  /** 매출 목표 (원) */
  revenueTarget: z.number().min(0).optional(),
  /** 참여율 목표 (%) */
  engagementTarget: z.number().min(0).max(100).optional(),
  /** 전환율 목표 (%) */
  conversionTarget: z.number().min(0).max(100).optional(),
  /** 도달 목표 */
  reachTarget: z.number().min(0).optional(),
  /** 주간 활성 사용자 목표 */
  wauTarget: z.number().min(0).optional(),
  /** 월간 활성 사용자 목표 */
  mauTarget: z.number().min(0).optional(),
})

/**
 * 목표값 설정 타입
 * Zod 스키마에서 추론
 */
export type TargetConfig = z.infer<typeof targetConfigSchema>

/**
 * 기본 목표값
 * 워크스페이스에 설정이 없을 때 사용
 */
export const DEFAULT_TARGET_CONFIG: TargetConfig = {
  revenueGrowthRate: 10,
  engagementTarget: 5,
  conversionTarget: 2,
}

/**
 * 레거시 호환용 상수 (기존 코드 호환)
 * @deprecated DEFAULT_TARGET_CONFIG 사용 권장
 */
export const DEFAULT_TARGETS = {
  REVENUE_GROWTH_RATE: 10,
  REVENUE_GROWTH_MULTIPLIER: 1.05,
} as const

/**
 * 레거시 타입 (기존 코드 호환)
 * @deprecated TargetConfig 사용 권장
 */
export type LegacyTargetConfig = typeof DEFAULT_TARGETS
