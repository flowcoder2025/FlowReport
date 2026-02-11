# Epic: 대시보드 페르소나별 분리 리팩토링

> 상태: ✅ P0/P1 해결완료 | 시작: 2026-02-10 | 예상완료: 2026-02-24

## 목표

FlowReport를 "다 보여주는 통합 대시보드"에서 **페르소나별 특화 대시보드**로 전환

### 핵심 가치
- 각 팀이 필요한 정보만 바로 접근
- 대시보드 진입 시간 3분 → 30초로 단축
- 새 페르소나 추가 시 확장 용이

## Phase 목록

| Phase | 이름 | 상태 | 스펙 문서 |
|-------|------|------|-----------|
| 0 | Critical 버그 수정 | ✅ 완료 | [00-critical-bugfix.md](./00-critical-bugfix.md) |
| 1 | 구조 설계 & 구현 | ✅ 완료 | [01-persona-implementation.md](./01-persona-implementation.md) |
| 2 | 페르소나 검토 | ✅ 완료 | [02-persona-review.md](./02-persona-review.md) |
| 3 | P0/P1 이슈 해결 | ✅ 완료 | [03-p0-p1-resolution.md](./03-p0-p1-resolution.md) |
| 4 | 라우팅 통합 | ⏳ 대기 | - |
| 5 | 프로덕션 배포 | ⏳ 대기 | - |

## 생성된 모듈

```
src/components/dashboard/
├── executive/    # 경영진용 (30초 전략 파악)
├── marketing/    # 마케팅팀용 (채널+콘텐츠)
├── commerce/     # 커머스팀용 (매출 중심)
└── analytics/    # 데이터팀용 (원본 데이터)
```

## 주요 결정

| 일자 | 결정 | 근거 |
|------|------|------|
| 2026-02-10 | Option A 선택 (페르소나별 완전 분리) | 점진적 개선보다 명확한 구분이 장기적으로 유리 |
| 2026-02-10 | 조건부 승인 | P0 이슈 해결 후 배포 |

## P0 이슈 (배포 전 필수) - ✅ 모두 해결

- [x] Executive: 목표값 → `constants/targets.ts` 분리
- [x] Marketing: 트렌드 → `useDashboardTrendData` 훅 연결
- [x] Commerce: 반품/취소 → `null` + "-" 표시
- [x] Analytics: API 크기 제한 → `maxRows` 파라미터

## P1 이슈 - ✅ 모두 해결

- [x] Export 버튼 maxRows 파라미터 전달 (10000개)
- [x] 데이터 잘림 경고 UI 추가
