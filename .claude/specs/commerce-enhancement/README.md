# Epic: Commerce Enhancement (커머스 고도화)

> 시작일: 2026-02-11
> 완료일: 2026-02-11
> 상태: 완료

## 목표

커머스 대시보드의 데이터 완성도를 높여 실질적인 의사결정 지원

## Phase 구성

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | 반품/취소 현황 분석 | 완료 |
| Phase 2 | 상품별 성과 TOP 5 | 완료 |

## 기술 스택

- Frontend: React 18, Recharts
- Backend: Next.js API Routes
- 데이터 소스: CSV 업로드 (스마트스토어, 쿠팡)

## 관련 파일

### 핵심 컴포넌트
- `src/components/dashboard/commerce/internal/commerce-dashboard-view.tsx`
- `src/components/dashboard/commerce/internal/store-comparison.tsx`
- `src/components/dashboard/commerce/internal/product-ranking-placeholder.tsx`

### 데이터 레이어
- `src/lib/hooks/use-dashboard-data.ts` - StoreMetrics 타입
- `src/app/api/workspaces/[workspaceId]/metrics/route.ts` - 메트릭 API
- `src/lib/csv/schemas.ts` - storeMetricSchema (cancels_count, refunds_count 등)
- `src/lib/services/csv-to-snapshot.ts` - CSV 변환 로직

## 변경 이력

- 2026-02-11: Epic 생성
