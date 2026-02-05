# Epic: Post-MVP 백엔드 인프라

> 상태: ✅ 완료 | 시작: 2026-02-05 | 완료: 2026-02-05

## 목표

MVP에서 placeholder로 남겨둔 백엔드 인프라를 실제 구현하여 데이터 수집/저장/출력 파이프라인 완성.

## 원칙

**기반 인프라 → 기존 기능 완성 → 신규 기능**

## Phase 구성

| Phase | 이름 | 상태 | 설명 |
|-------|------|------|------|
| 1 | [데이터 저장 인프라](./01-data-storage.md) | ✅ | MetricSnapshot 저장 서비스 |
| 2 | [GA4 커넥터 연동](./02-ga4-connector.md) | ✅ | 실제 API 호출 구현 |
| 3 | [PDF 생성](./03-pdf-generation.md) | ✅ | React-PDF 한글 지원 |
| 4 | [CSV Upload API](./04-csv-upload.md) | ✅ | 업로드 엔드포인트 |
| 5 | [Meta/YouTube 커넥터](./05-social-connectors.md) | ✅ | OAuth 기반 API 연동 |
| 6 | [Store 커넥터](./06-store-connectors.md) | ✅ | CSV 전용 커넥터 |

## 기술 스택 추가

- `@google-analytics/data` - GA4 Data API
- `@react-pdf/renderer` - PDF 생성
- Noto Sans KR 웹폰트 - 한글 지원

## 커밋

- `5cf3293` - feat: Post-MVP 백엔드 인프라 구현

## 다음 Epic

대시보드 데이터 연동 (Mock → Real Data)
