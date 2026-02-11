# Phase 1: 콘텐츠 타입별 성과 분석

> 상태: 진행중
> 예상 기간: 1일

## 목표

콘텐츠 형식(동영상/릴스/포스트 등)별 평균 성과를 비교하여 최고 성과 형식 파악

## 구현 계획

### Task 1.1: 콘텐츠 타입별 집계 API

**파일**: `src/app/api/workspaces/[workspaceId]/content/analytics/route.ts`

```typescript
// GET /api/workspaces/{workspaceId}/content/analytics?periodStart=...
// 응답:
{
  byType: [
    {
      contentType: 'VIDEO',
      count: 10,
      avgViews: 5000,
      avgEngagement: 500,
      avgEngagementRate: 10.0,
      totalViews: 50000,
      totalEngagement: 5000,
    },
    // ...
  ],
  byChannel: [
    {
      channel: 'YOUTUBE',
      types: [
        { contentType: 'VIDEO', count: 8, avgViews: 6000 },
        { contentType: 'SHORT', count: 5, avgViews: 3000 },
      ]
    },
    // ...
  ],
  bestPerformer: {
    contentType: 'VIDEO',
    reason: '평균 조회수 최고',
  }
}
```

### Task 1.2: useContentAnalytics 훅

**파일**: `src/lib/hooks/use-dashboard-data.ts`

```typescript
export interface ContentTypeStats {
  contentType: string
  count: number
  avgViews: number
  avgEngagement: number
  avgEngagementRate: number
  totalViews: number
  totalEngagement: number
}

export interface ContentAnalyticsData {
  byType: ContentTypeStats[]
  byChannel: Array<{
    channel: string
    types: ContentTypeStats[]
  }>
  bestPerformer: {
    contentType: string
    reason: string
  } | null
}

export function useContentAnalytics(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date
)
```

### Task 1.3: ContentTypeAnalysis 컴포넌트

**파일**: `src/components/dashboard/marketing/internal/content-type-analysis.tsx`

- 콘텐츠 타입별 성과 비교 차트 (막대 그래프)
- 최고 성과 타입 하이라이트
- 채널별 타입 분포

### Task 1.4: MarketingView에 컴포넌트 추가

ContentHighlights 위에 ContentTypeAnalysis 배치

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `src/app/api/.../content/analytics/route.ts` | 신규 API |
| `src/lib/hooks/use-dashboard-data.ts` | 훅 추가 |
| `src/components/dashboard/marketing/internal/content-type-analysis.tsx` | 신규 컴포넌트 |
| `src/components/dashboard/marketing/internal/marketing-view.tsx` | 컴포넌트 연결 |
