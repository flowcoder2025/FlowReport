# Phase 2: 채널별 최적 발행 시간

> 상태: 진행중
> 예상 기간: 0.5일

## 목표

채널별로 최적의 발행 시간을 분석하여 콘텐츠 도달 최적화 지원

## 현재 상태

`PublishTimeInsight` 컴포넌트 (`content-highlights.tsx`):
- 전체 통합 시간대별 분석만 제공
- 채널별 분리 없음
- 요일별 분석 없음

## 구현 계획

### Task 2.1: PublishTimeAnalysis 컴포넌트 확장

**파일**: `src/components/dashboard/marketing/internal/publish-time-analysis.tsx`

새 컴포넌트로 분리하여 확장:
- 채널별 최적 발행 시간 (YouTube, Instagram, 블로그)
- 요일별 최적 시간
- 히트맵 시각화 (선택)

### Task 2.2: 기존 PublishTimeInsight 교체

ContentHighlights에서 PublishTimeInsight를 새 컴포넌트로 교체

## UI 디자인

```
┌─────────────────────────────────────────┐
│ 채널별 최적 발행 시간                     │
├─────────────────────────────────────────┤
│ YouTube      │ 토요일 오전 (6-12시)      │
│              │ 평균 조회수 12.5K         │
├─────────────────────────────────────────┤
│ Instagram    │ 평일 저녁 (18-24시)       │
│              │ 평균 도달 8.2K            │
├─────────────────────────────────────────┤
│ 블로그       │ 화요일 오전 (6-12시)       │
│              │ 평균 조회수 2.1K          │
└─────────────────────────────────────────┘
```

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `src/components/dashboard/marketing/internal/publish-time-analysis.tsx` | 신규 |
| `src/components/dashboard/marketing/internal/content-highlights.tsx` | 수정 |
| `src/components/dashboard/marketing/index.ts` | export 추가 |
