# Phase 2: 상품별 성과 TOP 5

> 상태: 진행중
> 예상 기간: 1일

## 목표

상품별 판매 성과를 표시하여 베스트셀러 파악 및 상품 전략 수립 지원

## 접근 방식

기존 ContentItem 모델 활용 (contentType: 'PRODUCT')

### ContentItem 모델 (기존)
```prisma
model ContentItem {
  id           String          @id
  workspaceId  String
  channel      ChannelProvider  // SMARTSTORE, COUPANG
  contentType  ContentType      // PRODUCT
  url          String
  title        String?          // 상품명
  publishedAt  DateTime
  metrics      Json?            // { sales: number, revenue: number, units: number }
}
```

## 구현 계획

### Task 2.1: 상품 CSV 스키마 추가

**파일**: `src/lib/csv/schemas.ts`

```typescript
export const productMetricSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  product_url: z.string().url().optional(),
  date: dateString,
  sales_count: z.number().int().optional().nullable(),
  sales_amount: z.number().optional().nullable(),
  units_sold: z.number().int().optional().nullable(),
})
```

### Task 2.2: 상품 데이터 변환 로직 추가

**파일**: `src/lib/services/csv-to-snapshot.ts`

상품 CSV → ContentItem 변환 로직 추가

### Task 2.3: 상품 TOP 5 API 추가

**파일**: `src/app/api/workspaces/[workspaceId]/products/top/route.ts`

```typescript
// GET /api/workspaces/{workspaceId}/products/top?periodStart=...&limit=5
// 응답: { products: [{ id, name, url, channel, sales, revenue, change }] }
```

### Task 2.4: useDashboardProducts 훅 추가

**파일**: `src/lib/hooks/use-dashboard-data.ts`

```typescript
export interface ProductItem {
  id: string
  name: string
  url: string
  channel: string
  sales: number
  revenue: number
  change: number | null
}

export function useDashboardProducts(
  workspaceId: string,
  periodType: 'WEEKLY' | 'MONTHLY',
  periodStart: Date,
  limit = 5
)
```

### Task 2.5: ProductRanking 컴포넌트 구현

**파일**: `src/components/dashboard/commerce/internal/product-ranking.tsx`

- placeholder 대신 실제 데이터 표시
- 데이터 없을 때 placeholder 유지

## 간소화된 구현 (MVP)

상품별 개별 데이터 없이, 스토어 전체 데이터만으로 "상품 순위" 표시가 불가능하므로:

**Option A**: CSV 업로드 가이드 + placeholder 유지 (현재)
**Option B**: 상품 CSV 템플릿 제공 + API 구현 (권장)

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `src/lib/csv/schemas.ts` | 스키마 추가 |
| `src/constants/csv-templates.ts` | 템플릿 추가 |
| `src/lib/services/csv-to-snapshot.ts` | 변환 로직 |
| `src/app/api/.../products/top/route.ts` | API 신규 |
| `src/lib/hooks/use-dashboard-data.ts` | 훅 추가 |
| `src/components/dashboard/commerce/internal/product-ranking.tsx` | 컴포넌트 |
