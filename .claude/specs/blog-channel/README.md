# Epic: Blog 채널 추가

> 상태: 🔄 진행중 (Phase 1 완료) | 시작일: 2026-02-11

## 목표

블로그 채널 데이터 수집 및 분석 강화
- 네이버 블로그 CSV 업로드 고도화
- 블로그 지표 확장 (구독자, 댓글, 유입경로 등)
- 티스토리 API 연동 (Phase 2)

## 배경

- 현재 `NAVER_BLOG` enum만 존재, API 커넥터 미구현
- CSV 업로드만 가능 (4개 필드: posts_count, visitors, pageviews, avg_duration)
- 네이버 공식 통계 API 없음 → CSV 방식 유지

## Phase 구성

| Phase | 이름 | 상태 | 예상 기간 |
|-------|------|------|-----------|
| 1 | [네이버 블로그 CSV 고도화](./01-naver-blog-csv.md) | ✅ 완료 | 1일 |
| 2 | 티스토리 API 연동 | ⏸️ 대기 | TBD |

## Phase 1: 네이버 블로그 CSV 고도화

### 스코프
1. blogMetricSchema 확장 (10+ 필드)
   - subscribers, comments, likes
   - search_visitors, direct_visitors, referral_visitors
   - top_keywords, bounce_rate
2. CSV 템플릿 다운로드 기능
3. 블로그 대시보드 뷰 구현/강화

### 배포 일정
- **시작**: 2026-02-11
- **완료 목표**: 2026-02-18 (월)

## 부서별 의견 (2026-02-11)

| 부서 | 우선순위 | 핵심 의견 |
|------|---------|----------|
| 마케팅팀 | P0-P1 | 네이버+티스토리, 구독자/댓글/유입경로 지표 추가 |
| 커머스팀 | 중상 | UTM 전환 추적 필수 (조건부 찬성) |
| 데이터팀 | P1 | CSV 유지 권장 (API 없음), 스키마 확장 |
| 경영진 | P0 | ROI 500%, 경쟁사 대비 약점 |

## 기술 결정

### 네이버 블로그 API
- **공식 통계 API**: 없음
- **권장 방식**: CSV 업로드 (현행 유지)
- **대안**: 크롤링 (TOS 위반 리스크로 권장하지 않음)

### 티스토리
- **Open API**: 존재 (OAuth 인증)
- **구현**: Phase 2에서 자동 동기화

## 관련 파일

| 파일 | 설명 |
|------|------|
| `prisma/schema.prisma` | NAVER_BLOG enum |
| `src/lib/csv/schemas.ts` | blogMetricSchema |
| `src/lib/connectors/index.ts` | getCsvOnlyConnectors() |
| `src/components/dashboard/csv-upload.tsx` | 업로드 UI |

## 승인 이력

- **CTO 기술 리뷰**: ✅ 승인 (2026-02-11)
- **공동창업자 최종 승인**: ✅ 승인 (2026-02-11)
