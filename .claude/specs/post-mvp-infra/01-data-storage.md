# Phase 1: 데이터 저장 인프라

> Epic: [Post-MVP 백엔드 인프라](./README.md)
> 상태: ✅ 완료 | 업데이트: 2026-02-05

## 목표

모든 기능의 기반이 되는 MetricSnapshot 저장 로직 완성

## Task 목록

- [x] Task 1.1: MetricSnapshot 저장 서비스
- [x] Task 1.2: Cron sync 라우트 완성

## 구현 상세

### Task 1.1: MetricSnapshot 저장 서비스

**파일:** `src/lib/services/metric-snapshot.ts` (신규)

**구현 함수:**
```typescript
upsertDailySnapshots(params, metrics[])
// - 일별 메트릭 upsert
// - 기존 데이터 병합 로직

upsertContentItems(workspaceId, connectionId, channel, items[])
// - ContentItem upsert
// - externalId + channel 조합 중복 체크

aggregateMonthlySnapshot(workspaceId, connectionId, year, month)
// - 일별 → 월별 집계
// - SUM/AVG 메트릭 구분 처리
```

### Task 1.2: Cron sync 라우트 완성

**파일:** `src/app/api/cron/sync/route.ts` (수정)

**변경사항:**
- TODO 주석 → 실제 저장 로직
- `upsertDailySnapshots()` 호출 추가
- `upsertContentItems()` 호출 추가

## 변경된 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/lib/services/metric-snapshot.ts` | 추가 | 저장 서비스 |
| `src/app/api/cron/sync/route.ts` | 수정 | 저장 로직 연결 |

## 검증 방법

```bash
curl -X GET "http://localhost:3000/api/cron/sync" -H "Authorization: Bearer $CRON_SECRET"
```
