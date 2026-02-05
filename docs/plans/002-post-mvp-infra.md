# FlowReport Post-MVP 구현 계획

## 개요

안정성 우선순위에 따른 Post-MVP 작업 구현 계획입니다.

**원칙**: 기반 인프라 → 기존 기능 완성 → 신규 기능

---

## Phase 1: 데이터 저장 인프라 (최우선)

> 모든 기능의 기반이 되는 MetricSnapshot 저장 로직 완성

### Task 1.1: MetricSnapshot 저장 서비스
**파일**: `src/lib/services/metric-snapshot.ts` (신규)

```typescript
// 구현할 함수:
- upsertDailySnapshots(workspaceId, connectionId, metrics[])
- upsertContentItems(workspaceId, connectionId, contentItems[])
```

### Task 1.2: Cron sync 라우트 완성
**파일**: `src/app/api/cron/sync/route.ts`
**수정 위치**: 57행 TODO 주석

- MetricSnapshot upsert 로직 추가
- ContentItem upsert 로직 추가

---

## Phase 2: GA4 커넥터 실제 연동

> 서비스 계정 기반 가장 안정적인 커넥터부터 완성

### Task 2.1: 패키지 설치
```bash
npm install @google-analytics/data
```

### Task 2.2: testConnection 실제 API 구현
**파일**: `src/lib/connectors/ga4.ts` (24-63행)

- BetaAnalyticsDataClient 사용
- getMetadata API로 연결 검증

### Task 2.3: syncMetrics 실제 API 구현
**파일**: `src/lib/connectors/ga4.ts` (65-102행)

- runReport API 호출
- 메트릭: sessions, totalUsers, newUsers, screenPageViews, averageSessionDuration, bounceRate

---

## Phase 3: PDF 생성 완성

> 핵심 기능인 리포트 출력 완성

### Task 3.1: 패키지 설치
```bash
npm install @react-pdf/renderer
```

### Task 3.2: PDF 컴포넌트 작성
**파일**: `src/lib/export/pdf-components.tsx` (신규)

- 한글 폰트 등록 (Noto Sans KR)
- MonthlyReportDocument 컴포넌트
- KPI, ChannelMix, SNS, Insights 섹션

### Task 3.3: generateMonthlyPDF 구현
**파일**: `src/lib/export/pdf-generator.ts`

- placeholder → 실제 PDF 생성

### Task 3.4: API 라우트 데이터 쿼리
**파일**: `src/app/api/exports/pdf/route.ts` (47-92행)

- MetricSnapshot 실제 쿼리
- InsightNote 쿼리
- reportData 변환

---

## Phase 4: CSV Upload API

> 수동 데이터 입력 경로 완성

### Task 4.1: CSV Upload 라우트
**파일**: `src/app/api/csv/upload/route.ts` (신규)

- FormData 파일 처리
- 검증 (기존 upload-handler.ts 활용)
- CsvUpload 레코드 생성
- MetricSnapshot 저장

### Task 4.2: CSV to Snapshot 변환
**파일**: `src/lib/services/csv-to-snapshot.ts` (신규)

- 채널별 데이터 매핑
- upsert 로직

---

## Phase 5: Meta/YouTube 커넥터 완성

> OAuth 기반 커넥터 완성

### Task 5.1: Meta syncMetrics/syncContent
**파일**: `src/lib/connectors/meta.ts` (64-142행)

- Graph API insights 호출
- media 엔드포인트 호출

### Task 5.2: YouTube syncMetrics/syncContent
**파일**: `src/lib/connectors/youtube.ts` (69-140행)

- YouTube Analytics API 호출
- Data API video search

---

## Phase 6: SmartStore/Coupang 커넥터

> CSV 전용 커넥터 추가

### Task 6.1: Store 베이스 클래스
**파일**: `src/lib/connectors/store-base.ts` (신규)

### Task 6.2: 개별 커넥터
**파일**: `src/lib/connectors/smartstore.ts` (신규)
**파일**: `src/lib/connectors/coupang.ts` (신규)

### Task 6.3: 팩토리 업데이트
**파일**: `src/lib/connectors/index.ts`

---

## 검증 방법

### Phase 1
```bash
# Cron 수동 실행
curl -X GET "http://localhost:3000/api/cron/sync" -H "Authorization: Bearer $CRON_SECRET"

# DB 확인
SELECT COUNT(*) FROM "MetricSnapshot" WHERE "createdAt" > NOW() - INTERVAL '1 hour';
```

### Phase 2
- UI에서 GA4 연결 추가 → Test Connection 클릭
- Cron 실행 후 MetricSnapshot 데이터 확인

### Phase 3
```bash
# PDF 다운로드
curl -o test.pdf "http://localhost:3000/api/exports/pdf?workspaceId=xxx&period=2024-01"
# 한글 렌더링 확인
```

### Phase 4
```bash
# CSV 업로드
curl -X POST "http://localhost:3000/api/csv/upload?workspaceId=xxx&channel=SMARTSTORE" -F "file=@test.csv"
```

---

## 재사용할 기존 코드

| 파일 | 함수/클래스 | 용도 |
|------|------------|------|
| `src/lib/connectors/base.ts` | BaseConnector | 커넥터 확장 |
| `src/lib/crypto/credentials.ts` | decryptCredentials | 자격증명 복호화 |
| `src/lib/permissions/workspace-middleware.ts` | requireWorkspaceEditor | 권한 검증 |
| `src/lib/csv/upload-handler.ts` | processCsvUpload | CSV 검증 |
| `src/lib/csv/schemas.ts` | channelSchemas | 채널별 스키마 |

---

## 예상 작업량

| Phase | 작업 | 복잡도 |
|-------|------|--------|
| 1 | 데이터 저장 인프라 | 중 |
| 2 | GA4 커넥터 | 중-고 |
| 3 | PDF 생성 | 고 |
| 4 | CSV Upload | 중 |
| 5 | Meta/YouTube | 중-고 |
| 6 | SmartStore/Coupang | 저 |

---

## 의존성 순서

```
Phase 1 (필수 기반)
    │
    ├──► Phase 2 (GA4)
    │
    ├──► Phase 3 (PDF) ◄── Phase 1 데이터 필요
    │
    └──► Phase 4 (CSV) ◄── Phase 1 저장 로직 재사용
              │
              ▼
         Phase 5 (Meta/YouTube)
              │
              ▼
         Phase 6 (SmartStore/Coupang)
```
