# Phase 1-2: 긴급 및 중요 개선

> Epic: [워크플레이스 메뉴 UX 개선](./README.md)
> 상태: ✅ 완료 | 업데이트: 2026-02-11

## 목표

- 의사결정 속도 향상을 위한 헤드라인 요약 추가
- 액션 권고 제공을 위한 권장 조치 섹션 추가
- 학습 피드백 루프 구축
- 정보 과부하 해소

## Task 목록

### Phase 1 (긴급)
- [x] Task 1.1: Overview 헤드라인 요약 컴포넌트
- [x] Task 1.2: Executive 권장 조치 섹션

### Phase 2 (중요)
- [x] Task 2.1: Marketing 경쟁사 비교 기능 (Mock)
- [x] Task 2.2: 액션 달성률 피드백 시스템
- [x] Task 2.3: Overview KPI 접힘 구조 리팩토링

## 구현 상세

### Task 1.1: HeadlineSummary 컴포넌트

**파일:** `src/components/dashboard/cards/internal/headline-summary.tsx`

```typescript
interface HeadlineSummaryProps {
  metrics: MetricChange[]
  periodType: 'WEEKLY' | 'MONTHLY'
  className?: string
}
```

**주요 기능:**
- 5% 이상 변화 자동 감지 및 추출
- 긍정(초록)/부정(빨강) 색상 구분
- 변화율 크기 순 정렬
- 다크모드 지원

### Task 1.2: RecommendedActions 컴포넌트

**파일:** `src/components/dashboard/executive/internal/recommended-actions.tsx`

```typescript
interface RecommendedActionsProps {
  alerts: RiskAlert[]
  maxVisible?: number
}
```

**주요 기능:**
- 위험 신호 기반 권장 조치 자동 생성
- 우선순위별 정렬 (긴급/주의/참고)
- 확장/축소 가능한 상세 정보
- 담당 부서별 링크 제공

### Task 2.1: CompetitorComparison 컴포넌트 (Mock)

**파일:** `src/components/dashboard/marketing/internal/competitor-comparison.tsx`

**주요 기능:**
- 경쟁사 추가/삭제 Dialog UI
- 3개 지표 비교: 팔로워, 참여율, 업로드
- 순위 표시 (트로피 아이콘)

### Task 2.2: ActionProgressCard 컴포넌트

**파일:** `src/components/dashboard/cards/internal/action-progress-card.tsx`

**API:** `src/app/api/workspaces/[workspaceId]/notes/progress/route.ts`

**주요 기능:**
- 이전 기간 액션 아이템 달성률 추적
- 프로그레스 바 (완료/진행중/미시작)
- 학습 피드백 시스템 (80% 미만 시 조언)

### Task 2.3: Overview KPI 리팩토링

**파일:** `src/components/dashboard/views/internal/overview-view.tsx`

**변경사항:**
- Primary KPIs 4개 (총 매출, WAU/MAU, 총 도달, 총 참여)
- Secondary KPIs 4개 (확장 시 표시)
- CSS transition 애니메이션

## 변경된 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `cards/internal/headline-summary.tsx` | 추가 | 헤드라인 요약 |
| `cards/internal/action-progress-card.tsx` | 추가 | 액션 달성률 |
| `executive/internal/recommended-actions.tsx` | 추가 | 권장 조치 |
| `executive/internal/types.ts` | 수정 | RecommendedAction 타입 |
| `executive/internal/executive-view.tsx` | 수정 | 컴포넌트 통합 |
| `marketing/internal/competitor-comparison.tsx` | 수정 | 경쟁사 비교 UI |
| `views/internal/overview-view.tsx` | 수정 | KPI 리팩토링 |
| `api/.../notes/progress/route.ts` | 추가 | 진행률 API |
