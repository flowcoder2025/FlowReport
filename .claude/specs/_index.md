# FlowReport 스펙 문서 인덱스

> 마지막 업데이트: 2026-02-11

## Active Epics

| Epic | 상태 | Phase 진행 | 마지막 업데이트 |
|------|------|------------|-----------------|
| (없음) | - | - | - |

## Completed Epics

| Epic | 완료일 | Phase 수 |
|------|--------|----------|
| [commerce-enhancement](./commerce-enhancement/README.md) | 2026-02-11 | 2 |
| [blog-channel](./blog-channel/README.md) | 2026-02-11 | 2 |
| [menu-ux-improvement](./menu-ux-improvement/README.md) | 2026-02-11 | 4 |
| [dashboard-persona-refactoring](./dashboard-persona-refactoring/README.md) | 2026-02-10 | 3 |
| [dashboard-refactoring](./dashboard-refactoring/README.md) | 2026-02-05 | 5 |
| [dashboard-restructure](./dashboard-restructure/README.md) | 2026-02-10 | 4 (중단→페르소나로 전환) |

## Drift Tracking

- Last Reviewed Commit: `8397161`
- Last Review Date: 2026-02-11

## 파일 구조

```
specs/
├── _index.md
├── commerce-enhancement/               ← 2026-02-11 완료
│   ├── README.md
│   ├── 01-refund-cancel-analysis.md
│   └── 02-product-top5.md
├── blog-channel/                       ← 2026-02-11 완료
│   ├── README.md
│   ├── 01-naver-blog-csv.md
│   └── 02-tistory-ga4-guide.md
├── menu-ux-improvement/                ← 2026-02-11 완료
│   ├── README.md
│   ├── 01-02-urgent-important.md
│   └── 03-04-improvement-stabilization.md
├── dashboard-refactoring/              ← 2026-02-05 완료
│   ├── README.md
│   └── 01-full-implementation.md
├── dashboard-restructure/              ← 2026-02-10 중단 (페르소나로 전환)
│   ├── README.md
│   └── decisions/
│       └── 2026-02-10-department-analysis.md
└── dashboard-persona-refactoring/      ← 2026-02-10 완료
    ├── README.md
    ├── 00-critical-bugfix.md
    ├── 01-persona-implementation.md
    ├── 02-persona-review.md
    └── 03-p0-p1-resolution.md
```

## 최근 변경사항

### 2026-02-11
- **commerce-enhancement Epic 완료** (Phase 1: 반품/취소 분석, Phase 2: 상품 TOP 5)
- menu-ux-improvement Epic 완료 (Phase 4: 템플릿 DB화, OpenAPI 문서)
- blog-channel Epic 완료 (Phase 1: CSV 확장, Phase 2: GA4 가이드)
- 목표값 관리 UI 스프린트 완료
- **성능 최적화 스프린트 완료** (P0 + P1)
  - API 병렬화, Dynamic Import, React.memo
  - useMemo, 전역 SWRConfig, PDF lazy load
- **P2 기술 부채 스프린트 완료**
  - 채널 상수 통합 (CHANNEL_GROUPS)
  - CSV 템플릿 상수 통합
  - TargetConfig 타입 통합 (4곳 → 1곳)
  - Context 분리 (View/Filter/Workspace)

### Git Commits
```
8397161 refactor: P2 기술 부채 해결 - 상수/타입 통합 및 Context 분리
7e99447 perf: 성능 최적화 P1 - useMemo, SWRConfig, PDF lazy load
d456060 perf: 성능 최적화 P0 - API 병렬화, Dynamic Import, React.memo
dfe3c67 feat: 블로그 채널 Phase 2 - 티스토리 GA4 연동 가이드 및 UI 개선
0d365db feat: 블로그 채널 Phase 1 - CSV 스키마 확장 및 대시보드 구현
339e53c feat: 목표값 관리 UI 추가
bd2af66 feat: 권장 조치 템플릿 DB화 및 OpenAPI 문서 추가
```
