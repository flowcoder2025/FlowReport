# Epic: 대시보드 목적 기반 재구성

> 상태: **중단 - Critical 버그 발견** | 시작: 2026-02-10

## 개요

기존 탭 기반 구조(주간/월간 + 서브탭 10개)를 **목적 기반 4개 메뉴**로 재구성

```
현재: [주간/월간 탭] → [Overview|SNS|Store|Notes] 서브탭 + 사이드바
목표: [Overview|Performance|Content|Commerce] 메뉴 + 상단 필터 바
```

## Phase 목록

| Phase | 이름 | 상태 | 스펙 |
|-------|------|------|------|
| 1 | 기반 구조 | ✅ 완료 | [01-foundation.md](./01-foundation.md) |
| 2 | 차트 컴포넌트 | ✅ 완료 | [02-charts.md](./02-charts.md) |
| 3 | 카드/테이블 | ✅ 완료 | [03-cards-tables.md](./03-cards-tables.md) |
| 4 | 뷰 구현 | ✅ 완료 | [04-views.md](./04-views.md) |
| 5 | 정리 및 테스트 | ⏸️ 중단 | - |

## Critical Issues (2026-02-10 분석)

### 🔴 배포 차단 이슈

1. **채널 필터링 버그**
   - API가 channels 파라미터를 무시함
   - 모든 데이터가 필터링되지 않은 상태로 반환

2. **YouTube/Instagram 카드 누락**
   - Overview에서 상세 채널 카드가 사라짐
   - 마케터가 핵심 SNS 지표 확인 불가

3. **Performance 탭 가짜 데이터**
   - 시계열 차트가 하드코딩된 샘플 데이터 사용

### 권장 조치

1. **옵션 A: 롤백** - 기존 weekly/monthly 구조로 복원
2. **옵션 B: 긴급 수정** - Critical 버그 3개 수정 후 계속
3. **옵션 C: 재설계** - 분석 결과 반영하여 처음부터

## 기술 부채 (분석 결과)

| 항목 | 심각도 | 파일 수 |
|------|--------|--------|
| formatNumber() 중복 | 🔴 HIGH | 9개 |
| CHANNEL_DISPLAY_NAMES 중복 | 🟠 MED | 2개 |
| 미사용 코드 (weekly/monthly) | 🟠 MED | 7개 |
| KPI카드 중복 | 🟡 LOW | 2개 |
| YouTube카드 중복 | 🟡 LOW | 2개 |

## 관련 문서

- [결정: 4개 부서장 분석 결과](./decisions/2026-02-10-department-analysis.md)
