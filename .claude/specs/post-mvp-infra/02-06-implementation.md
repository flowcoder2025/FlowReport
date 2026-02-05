# Phase 2-6: 커넥터 및 Export 구현

> Epic: [Post-MVP 백엔드 인프라](./README.md)
> 상태: ✅ 완료 | 업데이트: 2026-02-05

## Phase 2: GA4 커넥터 실제 연동

### 구현 내용

**파일:** `src/lib/connectors/ga4.ts`

```typescript
// 패키지: @google-analytics/data

testConnection()
// - BetaAnalyticsDataClient 사용
// - getMetadata API로 연결 검증

syncMetrics(startDate, endDate)
// - runReport API 호출
// - 메트릭: sessions, totalUsers, newUsers, screenPageViews,
//          averageSessionDuration, bounceRate, engagementRate, activeUsers
```

---

## Phase 3: PDF 생성 완성

### 구현 내용

**패키지:** `@react-pdf/renderer`

**파일:**
- `src/lib/export/pdf-components.tsx` - React-PDF 컴포넌트
- `src/lib/export/pdf-generator.ts` - 생성 로직
- `src/app/api/exports/pdf/route.ts` - API 라우트

**특징:**
- Noto Sans KR 한글 폰트 등록
- KPI, ChannelMix, SNS, Insights 섹션
- 실제 MetricSnapshot 데이터 조회

---

## Phase 4: CSV Upload API

### 구현 내용

**파일:** `src/app/api/csv/upload/route.ts`

```typescript
POST /api/csv/upload?workspaceId=xxx&channel=SMARTSTORE
// - FormData 파일 처리
// - 검증 (기존 upload-handler.ts 활용)
// - CsvUpload 레코드 생성
// - MetricSnapshot 저장

GET /api/csv/upload?channel=SMARTSTORE
// - 채널별 CSV 템플릿 다운로드
```

**파일:** `src/lib/services/csv-to-snapshot.ts`
- 채널별 CSV → MetricData 변환

---

## Phase 5: Meta/YouTube 커넥터

### Meta Connector

**파일:** `src/lib/connectors/meta.ts`

```typescript
syncMetrics()
// - Graph API insights 호출
// - 메트릭: impressions, reach, followers, engagement

syncContent()
// - Instagram: media 엔드포인트
// - Facebook: posts 엔드포인트
```

### YouTube Connector

**파일:** `src/lib/connectors/youtube.ts`

```typescript
syncMetrics()
// - YouTube Analytics API 호출
// - 메트릭: views, estimatedMinutesWatched, subscriberGained/Lost, likes, comments, shares

syncContent()
// - Data API video search
// - Shorts 판별 로직 포함
```

---

## Phase 6: SmartStore/Coupang 커넥터

### 구현 내용

**파일:**
- `src/lib/connectors/store-base.ts` - 베이스 클래스
- `src/lib/connectors/smartstore.ts` - 스마트스토어
- `src/lib/connectors/coupang.ts` - 쿠팡
- `src/lib/connectors/index.ts` - 팩토리 업데이트

**특징:**
- CSV 전용 (API 연동 없음)
- testConnection()은 항상 valid: true

---

## 변경된 파일 요약

| 파일 | 변경 유형 |
|------|-----------|
| `package.json` | 의존성 추가 |
| `src/lib/connectors/ga4.ts` | 수정 - 실제 API |
| `src/lib/connectors/meta.ts` | 수정 - 실제 API |
| `src/lib/connectors/youtube.ts` | 수정 - 실제 API |
| `src/lib/connectors/store-base.ts` | 추가 |
| `src/lib/connectors/smartstore.ts` | 추가 |
| `src/lib/connectors/coupang.ts` | 추가 |
| `src/lib/connectors/index.ts` | 수정 - 팩토리 |
| `src/lib/export/pdf-components.tsx` | 추가 |
| `src/lib/export/pdf-generator.ts` | 수정 |
| `src/app/api/exports/pdf/route.ts` | 수정 |
| `src/app/api/csv/upload/route.ts` | 추가 |
| `src/lib/services/csv-to-snapshot.ts` | 추가 |
