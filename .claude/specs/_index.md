# FlowReport 스펙 문서 인덱스

> 마지막 업데이트: 2026-02-11

## Active Epics

| Epic | 상태 | Phase 진행 | 마지막 업데이트 |
|------|------|------------|-----------------|
| [blog-channel](./blog-channel/README.md) | 🔄 진행중 | 1/2 (Phase 1 완료) | 2026-02-11 |

## Completed Epics

| Epic | 완료일 | Phase 수 |
|------|--------|----------|
| [menu-ux-improvement](./menu-ux-improvement/README.md) | 2026-02-11 | 4 |
| [dashboard-persona-refactoring](./dashboard-persona-refactoring/README.md) | 2026-02-10 | 3 |
| [dashboard-refactoring](./dashboard-refactoring/README.md) | 2026-02-05 | 5 |
| [dashboard-restructure](./dashboard-restructure/README.md) | 2026-02-10 | 4 (중단→페르소나로 전환) |

## Drift Tracking

- Last Reviewed Commit: `0d365db`
- Last Review Date: 2026-02-11

## 파일 구조

```
specs/
├── _index.md
├── blog-channel/                       ← 2026-02-11 Phase 1 완료
│   ├── README.md
│   └── 01-naver-blog-csv.md
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
- menu-ux-improvement Epic 완료 (Phase 4: 템플릿 DB화, OpenAPI 문서)
- blog-channel Epic Phase 1 완료 (CSV 스키마 확장, 블로그 대시보드)
- 목표값 관리 UI 스프린트 완료

### Git Commits
```
0d365db feat: 블로그 채널 Phase 1 - CSV 스키마 확장 및 대시보드 구현
339e53c feat: 목표값 관리 UI 추가
bd2af66 feat: 권장 조치 템플릿 DB화 및 OpenAPI 문서 추가
efa3944 docs: menu-ux-improvement Epic 스펙 문서
844b99d feat: 메뉴 UX 개선 Phase 3-4
```
