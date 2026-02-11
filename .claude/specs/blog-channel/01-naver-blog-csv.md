# Phase 1: 네이버 블로그 CSV 고도화

> 상태: ✅ 완료 | 기간: 2026-02-11

## 개요

네이버 블로그 CSV 업로드 기능을 고도화하여 16개 필드를 지원하고, 블로그 전용 대시보드를 구현.

## 완료된 Tasks

### Task 1: blogMetricSchema 확장

**수정 파일:**
- `src/lib/csv/schemas.ts`
- `src/lib/services/csv-to-snapshot.ts`
- `src/lib/connectors/base.ts`

**확장된 필드 (16개):**

| 카테고리 | CSV 필드 (snake_case) | MetricData 키 (camelCase) |
|----------|----------------------|---------------------------|
| 기본 | `date` | - |
| 기본 | `visitors` | `visitors` |
| 기본 | `pageviews` | `pageviews` |
| 기본 | `avg_time_on_page` | `avgTimeOnPage` |
| 성장 | `subscribers` | `subscribers` |
| 성장 | `new_subscribers` | `newSubscribers` |
| 성장 | `subscriber_growth_rate` | `subscriberGrowthRate` |
| 참여 | `comments` | `comments` |
| 참여 | `likes` | `likes` |
| 참여 | `shares` | `shares` |
| 유입 | `search_visitors` | `searchVisitors` |
| 유입 | `direct_visitors` | `directVisitors` |
| 유입 | `social_visitors` | `socialVisitors` |
| 유입 | `referral_visitors` | `referralVisitors` |
| 콘텐츠 | `posts_published` | `postsPublished` |
| 콘텐츠 | `top_post_url` | `topPostUrl` |
| 콘텐츠 | `top_post_views` | `topPostViews` |
| 계산됨 | - | `engagementRate` (자동) |

**Zod 스키마:**
```typescript
export const blogMetricSchema = z.object({
  date: dateString,
  visitors: z.number().int().optional().nullable(),
  pageviews: z.number().int().optional().nullable(),
  avg_time_on_page: z.number().optional().nullable(),
  subscribers: z.number().int().optional().nullable(),
  new_subscribers: z.number().int().optional().nullable(),
  subscriber_growth_rate: z.number().optional().nullable(),
  comments: z.number().int().optional().nullable(),
  likes: z.number().int().optional().nullable(),
  shares: z.number().int().optional().nullable(),
  search_visitors: z.number().int().optional().nullable(),
  direct_visitors: z.number().int().optional().nullable(),
  social_visitors: z.number().int().optional().nullable(),
  referral_visitors: z.number().int().optional().nullable(),
  posts_published: z.number().int().optional().nullable(),
  top_post_url: z.string().url().optional().nullable(),
  top_post_views: z.number().int().optional().nullable(),
})
```

---

### Task 2: CSV 템플릿 다운로드 기능

**신규 파일:**
- `src/app/api/workspaces/[workspaceId]/csv-templates/route.ts`

**수정 파일:**
- `src/components/dashboard/csv-upload.tsx`
- `src/lib/csv/upload-handler.ts`
- `src/app/api/csv/upload/route.ts`

**API:**
```
GET /api/workspaces/{workspaceId}/csv-templates?channel=NAVER_BLOG
Response: CSV file (headers + sample data)
```

**템플릿 헤더:**
```
date,visitors,pageviews,avg_time_on_page,subscribers,new_subscribers,comments,likes,shares,search_visitors,direct_visitors,social_visitors,referral_visitors,posts_published,top_post_url,top_post_views
```

**샘플 데이터:**
```
2026-02-10,1500,3200,180,5000,50,25,100,15,800,400,200,100,3,https://blog.naver.com/example/123,500
```

---

### Task 3: 블로그 대시보드 뷰

**신규 파일:**
```
src/components/dashboard/blog/
├── index.ts
└── internal/
    ├── types.ts
    ├── blog-view.tsx
    ├── blog-kpi-cards.tsx
    ├── traffic-source-chart.tsx
    └── blog-trend-chart.tsx
```

**수정 파일:**
- `src/lib/contexts/dashboard-context.tsx` - DashboardView 타입에 'blog' 추가
- `src/components/dashboard/layout/internal/top-nav.tsx` - 메뉴 추가
- `src/components/dashboard/dashboard-view-renderer.tsx` - 라우팅 연결

**KPI 카드 (4개):**
1. 방문자 수 (visitors) + 전주 대비 변화율
2. 구독자 수 (subscribers) + 신규 구독자
3. 참여율 (comments + likes + shares) / visitors * 100
4. 검색 유입 비율 (searchVisitors / visitors * 100)

**차트:**
- 유입 경로 분석 (Pie Chart): 검색/직접/소셜/외부 비율
- 트렌드 차트 (Line Chart): 방문자 + 페이지뷰

---

## CTO 코드 리뷰

**결과:** ⚠️ 조건부 승인 → ✅ 승인 (P1 이슈 해결)

### 해결된 이슈

| 우선순위 | 이슈 | 해결 방법 |
|---------|------|----------|
| P1 | BlogMetricsData 중복 정의 | `types.ts`로 분리, index.ts에서 export |
| P1 | MetricData.metrics 타입 | `Record<string, number \| string \| null>`로 확장 |

### 기술 부채 (P2)

- CSV 템플릿 2곳 중복 정의
- upload-handler.ts의 `Record<string, any>` 사용
- 채널명 하드코딩 (`'NAVER_BLOG'`)

---

## Git Commit

```
0d365db feat: 블로그 채널 Phase 1 - CSV 스키마 확장 및 대시보드 구현
```

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `src/lib/csv/schemas.ts` | 수정 |
| `src/lib/services/csv-to-snapshot.ts` | 수정 |
| `src/lib/connectors/base.ts` | 수정 |
| `src/app/api/workspaces/[workspaceId]/csv-templates/route.ts` | 신규 |
| `src/components/dashboard/csv-upload.tsx` | 수정 |
| `src/lib/csv/upload-handler.ts` | 수정 |
| `src/app/api/csv/upload/route.ts` | 수정 |
| `src/components/dashboard/blog/index.ts` | 신규 |
| `src/components/dashboard/blog/internal/types.ts` | 신규 |
| `src/components/dashboard/blog/internal/blog-view.tsx` | 신규 |
| `src/components/dashboard/blog/internal/blog-kpi-cards.tsx` | 신규 |
| `src/components/dashboard/blog/internal/traffic-source-chart.tsx` | 신규 |
| `src/components/dashboard/blog/internal/blog-trend-chart.tsx` | 신규 |
| `src/lib/contexts/dashboard-context.tsx` | 수정 |
| `src/components/dashboard/layout/internal/top-nav.tsx` | 수정 |
| `src/components/dashboard/dashboard-view-renderer.tsx` | 수정 |
