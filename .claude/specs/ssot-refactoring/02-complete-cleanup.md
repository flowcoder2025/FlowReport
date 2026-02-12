# Phase 2: 잔여 하드코딩 전수 조사 + 완전 제거

> Epic: [SSOT 리팩토링](./README.md)
> 상태: 완료 | 업데이트: 2026-02-12

## 목표
1차에서 놓친 모든 하드코딩을 전수 조사하여 완전 제거

## Task 목록
- [x] Task 2.1: colors.ts 신규 - UI 컬러 팔레트 SSOT (차트, 퍼널, 상태, 콘텐츠타입, 트래픽소스)
- [x] Task 2.2: 마케팅 컴포넌트 채널 라벨 하드코딩 제거
- [x] Task 2.3: 차트 DEFAULT_COLORS 하드코딩 제거 (pie, bubble, bar, funnel, sparkline)
- [x] Task 2.4: 블로그/콘텐츠 컬러 하드코딩 제거
- [x] Task 2.5: PDF 컴포넌트 컬러 하드코딩 제거
- [x] Task 2.6: 커넥터 fallback 이름 CHANNEL_LABELS 참조로 교체

## 구현 상세

### Task 2.1: colors.ts
**파일:** `src/constants/colors.ts`
```typescript
export const CHART_PALETTE = ['#3b82f6', '#ef4444', '#22c55e', ...]  // 8색 범용
export const FUNNEL_PALETTE = ['#3b82f6', '#60a5fa', ...]            // 블루 그라데이션
export const STATUS_COLORS = { positive, negative, neutral, primary }
export const CONTENT_TYPE_COLORS = { POST, REEL, STORY, SHORT, VIDEO, ARTICLE }
export const TRAFFIC_SOURCE_COLORS = { search, direct, social, referral }
export const BLOG_TREND_COLORS = { visitors, pageviews }
export const METRIC_TREND_COLORS = { revenue, reach, engagement }
```

## 변경된 파일
| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/constants/colors.ts` | 추가 | UI 컬러 팔레트 SSOT |
| `src/constants/index.ts` | 수정 | colors 관련 export 추가 |
| `src/components/dashboard/charts/internal/pie-chart.tsx` | 수정 | CHART_PALETTE 참조 |
| `src/components/dashboard/charts/internal/bubble-chart.tsx` | 수정 | CHART_PALETTE 참조 |
| `src/components/dashboard/charts/internal/horizontal-bar-chart.tsx` | 수정 | CHART_PALETTE 참조 |
| `src/components/dashboard/charts/internal/funnel-chart.tsx` | 수정 | FUNNEL_PALETTE 참조 |
| `src/components/dashboard/charts/internal/sparkline-chart.tsx` | 수정 | STATUS_COLORS 참조 |
| `src/components/dashboard/blog/internal/traffic-source-chart.tsx` | 수정 | TRAFFIC_SOURCE_COLORS 참조 |
| `src/components/dashboard/blog/internal/blog-trend-chart.tsx` | 수정 | BLOG_TREND_COLORS 참조 |
| `src/components/dashboard/marketing/internal/content-type-analysis.tsx` | 수정 | CONTENT_TYPE_COLORS 참조 |
| `src/components/dashboard/marketing/internal/competitor-comparison.tsx` | 수정 | STATUS_COLORS.primary 참조 |
| `src/components/dashboard/marketing/internal/publish-time-analysis.tsx` | 수정 | CHANNEL_LABELS 참조 |
| `src/components/dashboard/marketing/internal/content-highlights.tsx` | 수정 | CHANNEL_LABELS 참조 |
| `src/lib/export/pdf-components.tsx` | 수정 | STATUS_COLORS 참조 |
| `src/lib/connectors/smartstore.ts` | 수정 | CHANNEL_LABELS.SMARTSTORE |
| `src/lib/connectors/coupang.ts` | 수정 | CHANNEL_LABELS.COUPANG |
