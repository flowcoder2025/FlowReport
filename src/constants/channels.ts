/**
 * Channel Constants - Single Source of Truth
 *
 * Prisma ChannelProvider enum 기반 채널 그룹 정의
 * 모든 채널 관련 상수는 이 파일에서 관리
 */

import { ChannelProvider } from '@prisma/client'

/**
 * 채널 그룹 정의
 * - SNS: 소셜 미디어 채널
 * - STORE: 이커머스 채널
 * - TRAFFIC: 트래픽/분석 채널
 * - API_SUPPORTED: API 연동 지원 채널
 * - CSV_ONLY: CSV 업로드만 지원 채널
 */
export const CHANNEL_GROUPS = {
  /** SNS 채널 (Instagram, Facebook, YouTube, 네이버 블로그) */
  SNS: ['META_INSTAGRAM', 'META_FACEBOOK', 'YOUTUBE', 'NAVER_BLOG'] as const,

  /** 이커머스 채널 (스마트스토어, 쿠팡) */
  STORE: ['SMARTSTORE', 'COUPANG'] as const,

  /** 트래픽/분석 채널 */
  TRAFFIC: ['GA4', 'GOOGLE_SEARCH_CONSOLE', 'NAVER_KEYWORDS'] as const,

  /** API 연동 지원 채널 */
  API_SUPPORTED: ['GA4', 'META_INSTAGRAM', 'META_FACEBOOK', 'YOUTUBE'] as const,

  /** CSV 업로드만 지원 채널 */
  CSV_ONLY: [
    'SMARTSTORE',
    'COUPANG',
    'NAVER_BLOG',
    'NAVER_KEYWORDS',
    'GOOGLE_SEARCH_CONSOLE',
  ] as const,

  /** 전체 채널 */
  ALL: [
    'GA4',
    'META_INSTAGRAM',
    'META_FACEBOOK',
    'YOUTUBE',
    'SMARTSTORE',
    'COUPANG',
    'GOOGLE_SEARCH_CONSOLE',
    'NAVER_BLOG',
    'NAVER_KEYWORDS',
  ] as const,
} as const

/** 채널 그룹 타입 */
export type ChannelGroup = keyof typeof CHANNEL_GROUPS

/** SNS 채널 타입 */
export type SnsChannel = (typeof CHANNEL_GROUPS.SNS)[number]

/** Store 채널 타입 */
export type StoreChannel = (typeof CHANNEL_GROUPS.STORE)[number]

/** Traffic 채널 타입 */
export type TrafficChannel = (typeof CHANNEL_GROUPS.TRAFFIC)[number]

/**
 * 채널 한글명 매핑
 */
export const CHANNEL_LABELS: Record<ChannelProvider, string> = {
  GA4: 'Google Analytics 4',
  META_INSTAGRAM: 'Instagram',
  META_FACEBOOK: 'Facebook',
  YOUTUBE: 'YouTube',
  SMARTSTORE: '스마트스토어',
  COUPANG: '쿠팡',
  GOOGLE_SEARCH_CONSOLE: 'Google Search Console',
  NAVER_BLOG: '네이버 블로그',
  NAVER_KEYWORDS: '네이버 키워드',
}

/**
 * 채널이 특정 그룹에 속하는지 확인
 */
export function isChannelInGroup(
  channel: ChannelProvider,
  group: ChannelGroup
): boolean {
  return (CHANNEL_GROUPS[group] as readonly string[]).includes(channel)
}

/**
 * API 연동 지원 여부 확인
 */
export function isApiSupported(channel: ChannelProvider): boolean {
  return isChannelInGroup(channel, 'API_SUPPORTED')
}

/**
 * CSV 전용 채널 여부 확인
 */
export function isCsvOnly(channel: ChannelProvider): boolean {
  return isChannelInGroup(channel, 'CSV_ONLY')
}
