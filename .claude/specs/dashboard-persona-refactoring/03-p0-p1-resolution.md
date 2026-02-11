# Phase 3: P0/P1 이슈 해결

> Epic: [dashboard-persona-refactoring](./README.md)
> 상태: ✅ 완료 | 업데이트: 2026-02-10

## 목표

배포 전 필수 이슈(P0) 4개와 우선순위 높은 이슈(P1) 2개 해결

## Task 목록

### P0 이슈 (배포 차단)
- [x] Task 3.1: Executive 목표값 동적화
- [x] Task 3.2: Marketing 트렌드 데이터 연결
- [x] Task 3.3: Commerce 반품/취소 하드코딩 제거
- [x] Task 3.4: Analytics API 크기 제한

### P1 이슈 (UX 개선)
- [x] Task 3.5: Export maxRows 파라미터 전달
- [x] Task 3.6: 데이터 잘림 경고 UI

## 구현 상세

### Task 3.1: Executive 목표값 동적화

**파일:** `src/constants/targets.ts` (신규)

```typescript
export const DEFAULT_TARGETS = {
  REVENUE_GROWTH_RATE: 10,
  REVENUE_GROWTH_MULTIPLIER: 1.05,
} as const
```

**변경사항:**
- 하드코딩된 목표값을 상수 파일로 분리
- `executive-view.tsx`에서 상수 import

### Task 3.2: Marketing 트렌드 데이터 연결

**파일:** `src/components/dashboard/marketing/internal/marketing-view.tsx`

**변경사항:**
- `useDashboardTrendData` 훅 연결
- 빈 배열 대신 실제 API 데이터 사용
- `ChannelTrendMetrics` 인터페이스 추가

### Task 3.3: Commerce 반품/취소 하드코딩 제거

**파일:**
- `src/components/dashboard/commerce/internal/store-comparison.tsx`
- `src/components/dashboard/tables/internal/store-table.tsx`

**변경사항:**
- `cancels: 0, refunds: 0` → `cancels: null, refunds: null`
- UI에서 `null`일 때 `-` 표시
- TODO 주석 추가

### Task 3.4: Analytics API 크기 제한

**파일:** `src/app/api/workspaces/[workspaceId]/metrics/raw/route.ts`

**변경사항:**
- `maxRows` 쿼리 파라미터 추가 (기본 1000, 최대 10000)
- `truncated`, `returnedRows` 응답 필드 추가

### Task 3.5: Export maxRows 파라미터

**파일:** `src/components/dashboard/analytics/internal/export-button.tsx`

**변경사항:**
- `maxRows` prop 추가
- URL 파라미터에 maxRows 전달
- analytics-view에서 `maxRows={10000}` 전달

### Task 3.6: 데이터 잘림 경고 UI

**파일:** `src/components/dashboard/analytics/internal/analytics-view.tsx`

**변경사항:**
- `RawMetricsResponse`에 `truncated`, `returnedRows` 추가
- 잘림 시 amber 색상 경고 배너 표시
- 레코드 수 표시 형식 개선

## 변경된 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/constants/targets.ts` | 추가 | 목표값 상수 |
| `src/constants/index.ts` | 추가 | Public API |
| `src/components/ui/badge.tsx` | 추가 | Badge 컴포넌트 |
| `executive-view.tsx` | 수정 | 상수 import |
| `marketing-view.tsx` | 수정 | 트렌드 훅 연결 |
| `store-comparison.tsx` | 수정 | null 처리 |
| `store-table.tsx` | 수정 | null → "-" 표시 |
| `raw/route.ts` | 수정 | maxRows 파라미터 |
| `export-button.tsx` | 수정 | maxRows prop |
| `analytics-view.tsx` | 수정 | 잘림 경고 UI |
| `use-dashboard-data.ts` | 수정 | 트렌드 훅 |
| `trend/route.ts` | 수정 | channelMetrics 반환 |

## 검토 결과

| 부서 | 승인 여부 | 비고 |
|------|----------|------|
| 경영진 | ⚠️ 조건부 | 목표값 문서화 권장 (P2) |
| 마케팅팀 | ✅ 승인 | - |
| 커머스팀 | ✅ 승인 | - |
| 데이터팀 | ✅ 승인 | P1 해결 후 |
| 공동창업자 | ✅ 배포 승인 | - |

## 라우팅 연결 (추가 수정)

### Task 3.7: 페르소나 뷰 라우팅 연결

**파일:**
- `src/lib/contexts/dashboard-context.tsx`
- `src/components/dashboard/layout/internal/top-nav.tsx`
- `src/components/dashboard/dashboard-view-renderer.tsx`

**변경사항:**
- DashboardView 타입에 `executive`, `marketing`, `analytics` 추가
- TopNav에 페르소나 메뉴 추가 (그룹 구분선 포함)
- DashboardViewRenderer에서 페르소나 뷰 렌더링 연결

## Git Commits

```
7c68f2a feat: 페르소나별 대시보드 리팩토링 및 P0 이슈 해결
156bbf1 fix: Analytics P1 이슈 해결 - Export maxRows 및 잘림 경고 UI
524b150 feat: 페르소나별 대시보드 라우팅 연결
```
