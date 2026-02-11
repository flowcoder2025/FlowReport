# Phase 1: 반품/취소 현황 분석

> 상태: 진행중
> 예상 기간: 1일

## 목표

스토어별 반품/취소 데이터를 대시보드에 표시하여 손실 현황 파악

## 현재 상태

### CSV 스키마 (이미 구현됨)
```typescript
// src/lib/csv/schemas.ts
export const storeMetricSchema = z.object({
  cancels_count: z.number().int().optional().nullable(),
  refunds_count: z.number().int().optional().nullable(),
  refunds_amount: z.number().optional().nullable(),
  returns_count: z.number().int().optional().nullable(),
  // ...
})
```

### CSV 변환 (이미 구현됨)
```typescript
// src/lib/services/csv-to-snapshot.ts
function convertStoreMetrics(records: StoreMetric[]): MetricData[] {
  return records.map((record) => ({
    metrics: {
      cancels: record.cancels_count ?? null,
      refunds: record.refunds_count ?? null,
      refundAmount: record.refunds_amount ?? null,
      returns: record.returns_count ?? null,
      // ...
    },
  }))
}
```

### 문제점
- `StoreMetrics` 타입에 cancels/refunds 필드 없음
- API에서 해당 데이터 반환 안 함
- UI에서 `cancels: null`, `refunds: null` 하드코딩

## 구현 계획

### Task 1.1: StoreMetrics 타입 확장

**파일**: `src/lib/hooks/use-dashboard-data.ts`

```typescript
export interface StoreMetrics {
  revenue: number | null
  orders: number | null
  conversionRate: number | null
  avgOrderValue: number | null
  // 추가 필드
  cancels: number | null
  refunds: number | null
  refundAmount: number | null
  returns: number | null
  change: {
    revenue: number | null
    orders: number | null
    conversionRate: number | null
    // 추가
    cancels: number | null
    refunds: number | null
  }
}
```

### Task 1.2: 메트릭 API 확장

**파일**: `src/app/api/workspaces/[workspaceId]/metrics/route.ts`

`generateChannelDetails` 함수에서 cancels, refunds 데이터 반환:

```typescript
const storeMetrics: StoreMetrics = {
  revenue,
  orders,
  conversionRate: current.conversionRate ?? null,
  avgOrderValue,
  // 추가
  cancels: current.cancels ?? null,
  refunds: current.refunds ?? null,
  refundAmount: current.refundAmount ?? null,
  returns: current.returns ?? null,
  change: {
    revenue: calculateSingleChange(revenue, prevRevenue),
    orders: calculateSingleChange(orders, prev.orders),
    conversionRate: calculateSingleChange(...),
    // 추가
    cancels: calculateSingleChange(current.cancels, prev.cancels),
    refunds: calculateSingleChange(current.refunds, prev.refunds),
  },
}
```

### Task 1.3: StoreComparison 컴포넌트 수정

**파일**: `src/components/dashboard/commerce/internal/store-comparison.tsx`

1. 하드코딩 제거:
```typescript
// Before
cancels: null,
refunds: null,

// After
cancels: smartstoreMetrics?.cancels ?? null,
refunds: smartstoreMetrics?.refunds ?? null,
```

2. 반품/취소 현황 카드 개선:
- 데이터 있을 때: 실제 수치 + 손실액 표시
- 데이터 없을 때: 현재 안내 메시지 유지

### Task 1.4: 손실 분석 섹션 추가

새 컴포넌트 또는 기존 카드 확장:
- 총 취소 건수 / 금액
- 총 반품 건수 / 금액
- 손실률 (취소+반품 / 총주문)

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `src/lib/hooks/use-dashboard-data.ts` | 타입 확장 |
| `src/app/api/workspaces/[workspaceId]/metrics/route.ts` | API 확장 |
| `src/components/dashboard/commerce/internal/store-comparison.tsx` | UI 연결 |

## 테스트 계획

1. CSV 업로드로 cancels_count, refunds_count 포함 데이터 업로드
2. 커머스 대시보드에서 반품/취소 데이터 표시 확인
3. 데이터 없는 경우 기존 안내 메시지 표시 확인
