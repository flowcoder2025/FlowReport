# FlowReport 스펙 문서 인덱스

> 마지막 업데이트: 2026-02-10

## Active Epics

| Epic | 상태 | Phase 진행 | 마지막 업데이트 |
|------|------|------------|-----------------|
| [dashboard-persona-refactoring](./dashboard-persona-refactoring/README.md) | ⚠️ 조건부승인 | 2/5 완료 | 2026-02-10 |

## Completed Epics

| Epic | 완료일 | Phase 수 |
|------|--------|----------|
| [dashboard-refactoring](./dashboard-refactoring/README.md) | 2026-02-05 | 5 |
| [dashboard-restructure](./dashboard-restructure/README.md) | 2026-02-10 | 4 (중단→페르소나로 전환) |

## Drift Tracking

- Last Reviewed Commit: `N/A`
- Last Review Date: 2026-02-10

## 파일 구조

```
specs/
├── _index.md
├── dashboard-refactoring/           ← 2026-02-05 완료
│   ├── README.md
│   └── 01-full-implementation.md
├── dashboard-restructure/           ← 2026-02-10 중단 (페르소나로 전환)
│   ├── README.md
│   └── decisions/
│       └── 2026-02-10-department-analysis.md
└── dashboard-persona-refactoring/   ← 2026-02-10 진행중
    ├── README.md
    ├── 00-critical-bugfix.md
    ├── 01-persona-implementation.md
    └── 02-persona-review.md
```

## 주의사항

### ✅ 해결됨 (2026-02-10)

1. ~~**채널 필터링 버그**~~ - API가 필터 파라미터 무시 → **수정 완료**
2. ~~**YouTube/Instagram 카드 누락**~~ - Overview에서 상세 카드 사라짐 → **수정 완료**
3. ~~**Performance 탭 가짜 데이터**~~ - 하드코딩된 샘플 데이터 → **수정 완료**

### 🟡 P0 이슈 (배포 전 해결 필요)

1. **Executive Dashboard**: 목표값/임계값 동적화
2. **Marketing Dashboard**: 트렌드 데이터 API 연결
3. **Commerce Dashboard**: 반품/취소 하드코딩 제거
4. **Analytics Dashboard**: API 응답 크기 제한

**권장**: P0 이슈 해결 후 순차 배포
