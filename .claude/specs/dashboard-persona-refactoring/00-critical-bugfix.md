# Phase 0: Critical 버그 수정

> Epic: [대시보드 페르소나별 분리](./README.md)
> 상태: ✅ 완료 | 업데이트: 2026-02-10

## 목표

Phase 4/5 완료 후 발견된 Critical 버그 3개 수정

## Task 목록

- [x] Task 0.1: 채널 필터링 API 수정 (P0)
- [x] Task 0.2: 시계열 API 구현
- [x] Task 0.5: Overview 채널 카드 복원
- [x] Task 1.0: Performance 하드코딩 제거

## 구현 상세

### Task 0.1: 채널 필터링 API 수정
**파일:** `src/app/api/workspaces/[workspaceId]/metrics/route.ts`

**변경사항:**
- Line 119: `channels` 파라미터 파싱 추가
- Line 147-149: `currentSnapshots` WHERE절에 provider 필터 추가
- Line 170-172: `previousSnapshots` WHERE절에 동일 필터 추가
- Line 210-212: `contentItem` 쿼리에 channel 필터 추가

### Task 0.2: 시계열 API 구현
**파일:** `src/app/api/workspaces/[workspaceId]/metrics/trend/route.ts` (신규)

**기능:**
- GET `/api/workspaces/{id}/metrics/trend`
- Query: `periodType`, `periodCount`, `channels`
- Response: `{ periods: [{ period, revenue, reach, engagement }] }`

**Hook:** `src/lib/hooks/use-dashboard-data.ts`
- `useDashboardTrendData()` 추가

### Task 0.5: Overview 채널 카드 복원
**파일:** `src/components/dashboard/views/internal/overview-view.tsx`

**변경사항:**
- `YouTubeDetailCard`, `InstagramCard`, `StoreCard` import 추가
- KPI 카드 아래에 2-column grid로 채널 카드 렌더링

### Task 1.0: Performance 하드코딩 제거
**파일:** `src/components/dashboard/views/internal/performance-view.tsx`

**변경사항:**
- 하드코딩된 `trendData` 배열 제거
- `useDashboardTrendData` 훅으로 실제 데이터 바인딩

## 변경된 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/app/api/.../metrics/route.ts` | 수정 | 채널 필터링 로직 추가 |
| `src/app/api/.../metrics/trend/route.ts` | 추가 | 시계열 API 신규 |
| `src/lib/hooks/use-dashboard-data.ts` | 수정 | TrendData 훅 추가 |
| `src/components/dashboard/views/internal/overview-view.tsx` | 수정 | 채널 카드 추가 |
| `src/components/dashboard/views/internal/performance-view.tsx` | 수정 | 하드코딩 제거 |
