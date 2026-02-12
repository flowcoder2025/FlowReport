# Phase 1: SSOT 상수 구축 + 주요 하드코딩 제거

> Epic: [SSOT 리팩토링](./README.md)
> 상태: 완료 | 업데이트: 2026-02-12

## 목표
채널/메트릭 관련 상수를 중앙화하고, 가장 심각한 하드코딩을 제거

## Task 목록
- [x] Task 1.1: channels.ts 확장 - CHANNEL_COLORS, CHANNEL_BADGE_COLORS, CHANNEL_DOT_COLORS, 헬퍼 함수
- [x] Task 1.2: metrics.ts 신규 - METRIC_LABELS, METRIC_CATEGORIES, POSITIVE_METRICS, getMetricSeverity
- [x] Task 1.3: constants/index.ts 업데이트
- [x] Task 1.4: API 라우트 하드코딩 제거 (metrics/route.ts, pdf/route.ts, raw/route.ts)
- [x] Task 1.5: 서비스 하드코딩 제거 (data-builder.ts, metric-query.ts)
- [x] Task 1.6: 컴포넌트 하드코딩 제거 (analytics, views, csv-upload, channel-metrics)
- [x] Task 1.7: connectors/index.ts getProviderDisplayName 중복 제거

## 구현 상세

### Task 1.1: channels.ts 확장
**파일:** `src/constants/channels.ts`
```typescript
export const CHANNEL_COLORS: Record<ChannelProvider, string> = {
  GA4: '#f97316', META_INSTAGRAM: '#ec4899', META_FACEBOOK: '#3b82f6',
  YOUTUBE: '#ef4444', SMARTSTORE: '#22c55e', COUPANG: '#0ea5e9',
  GOOGLE_SEARCH_CONSOLE: '#eab308', NAVER_BLOG: '#10b981', NAVER_KEYWORDS: '#14b8a6',
}
export const CHANNEL_BADGE_COLORS: Record<ChannelProvider, string> = { ... }
export const CHANNEL_DOT_COLORS: Record<string, string> = { ... }
export function getChannelColor(channel): string
export function getChannelBadgeColor(channel): string
```

### Task 1.2: metrics.ts 신규
**파일:** `src/constants/metrics.ts`
```typescript
export const METRIC_LABELS: Record<string, string>       // 25개 메트릭 한글 라벨
export const METRIC_CATEGORIES: Record<string, MetricCategory>  // 카테고리 분류
export const CATEGORY_LABELS: Record<MetricCategory, string>    // 카테고리 한글명
export const POSITIVE_METRICS: readonly string[]                // 양성 메트릭
export const HIGHLIGHT_THRESHOLD = 10                           // 하이라이트 임계값
export function getMetricSeverity(metricKey, change): 'positive' | 'negative' | 'neutral'
```

## 변경된 파일
| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/constants/channels.ts` | 수정 | CHANNEL_COLORS, BADGE_COLORS, DOT_COLORS, 헬퍼 추가 |
| `src/constants/metrics.ts` | 추가 | 메트릭 라벨/카테고리/severity 중앙화 |
| `src/constants/index.ts` | 수정 | 새 export 등록 |
| `src/app/api/.../metrics/route.ts` | 수정 | 5개 하드코딩 제거 |
| `src/app/api/.../metrics/raw/route.ts` | 수정 | metricLabels, getChannelDisplayName 제거 |
| `src/app/api/exports/pdf/route.ts` | 수정 | CHANNEL_NAMES, snsChannels 제거 |
| `src/lib/services/report/internal/data-builder.ts` | 수정 | 동일 |
| `src/lib/services/metric-query.ts` | 수정 | getChannelDisplayName 제거 |
| `src/lib/connectors/index.ts` | 수정 | getProviderDisplayName 중복 라벨 제거 |
| `src/components/dashboard/csv-upload.tsx` | 수정 | 9채널 하드코딩 배열 제거 |
| `src/components/dashboard/analytics/internal/*` | 수정 | CHANNEL_COLORS 3중 복사 제거 |
| `src/components/dashboard/views/internal/*` | 수정 | 인라인 컬러/라벨 제거 |
| 기타 12개 컴포넌트 | 수정 | 채널 라벨/컬러 참조 교체 |
