# Phase 1-5: 대시보드 리팩토링 전체 구현

> Epic: [대시보드 리팩토링](./README.md)
> 상태: 완료 | 업데이트: 2026-02-05

## 목표

접이식 사이드패널, 채널별 메트릭 카드, 핵심 변화 하이라이트 기능 구현

## Task 목록

### Phase 1: 사이드바 UI
- [x] Task 1.1: Sheet 컴포넌트 추가
- [x] Task 1.2: 사이드바 모듈 구조 생성

### Phase 2: 상태 관리
- [x] Task 2.1: Dashboard Context 생성
- [x] Task 2.2: use-media-query 훅 생성
- [x] Task 2.3: use-connections 훅 생성

### Phase 3: API 개선
- [x] Task 3.1: channels 필터 파라미터 추가
- [x] Task 3.2: highlights 배열 응답 추가
- [x] Task 3.3: channelDetails 상세 메트릭 추가

### Phase 4: 채널별 카드
- [x] Task 4.1: MetricBox 컴포넌트
- [x] Task 4.2: YouTubeCard 컴포넌트
- [x] Task 4.3: InstagramCard 컴포넌트
- [x] Task 4.4: StoreCard 컴포넌트
- [x] Task 4.5: HighlightBanner 컴포넌트

### Phase 5: 통합
- [x] Task 5.1: DashboardLayout 컴포넌트
- [x] Task 5.2: 메인 페이지 수정
- [x] Task 5.3: overview-tab 수정
- [x] Task 5.4: summary-tab 수정

## 생성된 파일

| 파일 | 설명 |
|------|------|
| src/components/ui/sheet.tsx | Sheet UI 컴포넌트 |
| src/components/dashboard/sidebar/index.ts | 사이드바 Public API |
| src/components/dashboard/sidebar/types.ts | 타입 정의 |
| src/components/dashboard/sidebar/internal/sidebar-container.tsx | 메인 컨테이너 |
| src/components/dashboard/sidebar/internal/sidebar-toggle.tsx | 토글 버튼 |
| src/components/dashboard/sidebar/internal/channel-list.tsx | 채널 목록 |
| src/components/dashboard/sidebar/internal/channel-filter.tsx | 채널 필터 |
| src/lib/contexts/dashboard-context.tsx | 대시보드 Context |
| src/lib/hooks/use-media-query.ts | 반응형 훅 |
| src/lib/hooks/use-connections.ts | 채널 연결 훅 |
| src/components/dashboard/channel-metrics/index.ts | 채널 메트릭 Public API |
| src/components/dashboard/channel-metrics/types.ts | 타입 정의 |
| src/components/dashboard/channel-metrics/internal/metric-box.tsx | 메트릭 박스 |
| src/components/dashboard/channel-metrics/internal/youtube-card.tsx | YouTube 카드 |
| src/components/dashboard/channel-metrics/internal/instagram-card.tsx | Instagram 카드 |
| src/components/dashboard/channel-metrics/internal/store-card.tsx | 스토어 카드 |
| src/components/dashboard/channel-metrics/internal/highlight-banner.tsx | 하이라이트 배너 |
| src/components/dashboard/dashboard-layout.tsx | 대시보드 레이아웃 |

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| src/app/(dashboard)/workspaces/[workspaceId]/page.tsx | DashboardLayout 래핑 |
| src/app/api/workspaces/[workspaceId]/metrics/route.ts | highlights, channelDetails 추가 |
| src/lib/hooks/use-dashboard-data.ts | 타입 및 channels 파라미터 추가 |
| src/components/dashboard/weekly/overview-tab.tsx | 채널 카드 통합 |
| src/components/dashboard/monthly/summary-tab.tsx | 채널 카드 통합 |
| src/app/(dashboard)/layout.tsx | 배경색 bg-white로 변경 |
