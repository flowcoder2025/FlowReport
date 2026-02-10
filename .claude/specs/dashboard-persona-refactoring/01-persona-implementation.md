# Phase 1: 페르소나별 대시보드 구현

> Epic: [대시보드 페르소나별 분리](./README.md)
> 상태: ✅ 완료 | 업데이트: 2026-02-10

## 목표

4개 페르소나별 특화 대시보드 모듈 생성

## Task 목록

- [x] Task 1.1: Executive Dashboard (경영진)
- [x] Task 1.2: Marketing Dashboard (마케팅팀)
- [x] Task 1.3: Commerce Dashboard (커머스팀)
- [x] Task 1.4: Analytics Dashboard (데이터팀)

## 구현 상세

### Task 1.1: Executive Dashboard
**경로:** `src/components/dashboard/executive/`

**생성 파일:**
- `index.ts` - Public API
- `internal/types.ts` - 타입 및 상수
- `internal/executive-view.tsx` - 메인 뷰
- `internal/executive-summary.tsx` - 핵심 KPI 3개
- `internal/risk-alerts.tsx` - 위험 신호 (Critical/Warning/Info)
- `internal/department-summary.tsx` - 부서별 요약

**핵심 기능:**
- 30초 전략 파악
- KPI 3개: 매출, WAU/MAU, 성장률
- 목표 대비 달성률 프로그레스 바
- 위험 신호 3단계 (임계값 기반)
- 부서별 드릴다운 링크

### Task 1.2: Marketing Dashboard
**경로:** `src/components/dashboard/marketing/`

**생성 파일:**
- `index.ts` - Public API
- `internal/marketing-view.tsx` - 메인 뷰
- `internal/channel-growth.tsx` - 채널 성장 추이
- `internal/content-highlights.tsx` - Top 콘텐츠 하이라이트
- `internal/competitor-placeholder.tsx` - 경쟁사 비교 (Coming Soon)

**핵심 기능:**
- 마케팅 KPI 6개 (도달, 참여, 팔로워 등)
- YouTube/Instagram 채널 카드
- Top 콘텐츠 히어로 카드
- 발행 시간대별 인사이트

### Task 1.3: Commerce Dashboard
**경로:** `src/components/dashboard/commerce/`

**생성 파일:**
- `index.ts` - Public API
- `internal/commerce-dashboard-view.tsx` - 메인 뷰
- `internal/sales-kpi-section.tsx` - 매출 KPI 4개
- `internal/store-comparison.tsx` - 스토어 비교 + 전환 퍼널
- `internal/product-ranking-placeholder.tsx` - 상품 순위 (Coming Soon)

**핵심 기능:**
- 매출이 첫 화면에 바로 표시
- 스마트스토어 vs 쿠팡 비교
- 전환 퍼널 (방문→장바구니→결제)
- 객단가(AOV) 표시

### Task 1.4: Analytics Dashboard
**경로:** `src/components/dashboard/analytics/`

**생성 파일:**
- `index.ts` - Public API
- `internal/analytics-view.tsx` - 메인 뷰
- `internal/metric-selector.tsx` - 메트릭 다중 선택
- `internal/data-explorer.tsx` - 데이터 탐색 테이블
- `internal/export-button.tsx` - CSV/JSON Export

**백엔드 API:**
- `src/app/api/workspaces/[workspaceId]/metrics/raw/route.ts` - 원본 데이터 쿼리

**핵심 기능:**
- 원본 데이터 접근
- 메트릭 다중 선택 (최대 10개)
- 커스텀 기간 선택
- CSV/JSON Export
- 요약 통계 (합계, 평균, 최소, 최대)

## 변경된 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/components/dashboard/executive/*` | 추가 | 경영진 대시보드 (6파일) |
| `src/components/dashboard/marketing/*` | 추가 | 마케팅 대시보드 (5파일) |
| `src/components/dashboard/commerce/*` | 추가 | 커머스 대시보드 (5파일) |
| `src/components/dashboard/analytics/*` | 추가 | 데이터 대시보드 (5파일) |
| `src/app/api/.../metrics/raw/route.ts` | 추가 | 원본 데이터 API |
| `src/components/ui/calendar.tsx` | 추가 | 날짜 선택 캘린더 |
| `src/components/ui/table.tsx` | 추가 | 테이블 컴포넌트 |
