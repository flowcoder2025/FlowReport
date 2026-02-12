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
 * 채널 컬러 (hex) - 차트, 그래프용
 */
export const CHANNEL_COLORS: Record<ChannelProvider, string> = {
  GA4: '#f97316',
  META_INSTAGRAM: '#ec4899',
  META_FACEBOOK: '#3b82f6',
  YOUTUBE: '#ef4444',
  SMARTSTORE: '#22c55e',
  COUPANG: '#0ea5e9',
  GOOGLE_SEARCH_CONSOLE: '#eab308',
  NAVER_BLOG: '#10b981',
  NAVER_KEYWORDS: '#14b8a6',
}

/**
 * 채널 뱃지 컬러 (Tailwind) - UI 뱃지, 태그용
 */
export const CHANNEL_BADGE_COLORS: Record<ChannelProvider, string> = {
  GA4: 'bg-orange-100 text-orange-700',
  META_INSTAGRAM: 'bg-pink-100 text-pink-700',
  META_FACEBOOK: 'bg-blue-100 text-blue-700',
  YOUTUBE: 'bg-red-100 text-red-700',
  SMARTSTORE: 'bg-green-100 text-green-700',
  COUPANG: 'bg-sky-100 text-sky-700',
  GOOGLE_SEARCH_CONSOLE: 'bg-yellow-100 text-yellow-700',
  NAVER_BLOG: 'bg-emerald-100 text-emerald-700',
  NAVER_KEYWORDS: 'bg-teal-100 text-teal-700',
}

/**
 * 채널 뱃지 컬러 (Tailwind bg-*-500) - 프로그레스바, 도트용
 */
export const CHANNEL_DOT_COLORS: Record<string, string> = {
  SMARTSTORE: 'bg-green-500',
  COUPANG: 'bg-blue-500',
  GA4: 'bg-purple-500',
}

/**
 * 채널 컬러 조회 헬퍼
 */
export function getChannelColor(channel: ChannelProvider | string): string {
  return CHANNEL_COLORS[channel as ChannelProvider] || '#8884d8'
}

/**
 * 채널 뱃지 컬러 조회 헬퍼
 */
export function getChannelBadgeColor(channel: ChannelProvider | string): string {
  return CHANNEL_BADGE_COLORS[channel as ChannelProvider] || 'bg-gray-100 text-gray-700'
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
