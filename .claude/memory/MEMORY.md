# FlowReport Project Memory

> 마지막 업데이트: 2026-02-13

## 프로젝트 정보
- **이름**: FlowReport
- **유형**: ReportingOps SaaS
- **스택**: Next.js 14, Prisma, PostgreSQL (Supabase)
- **배포**: Vercel (Hobby 플랜)
- **운영 URL**: https://flowreport.vercel.app

## 완료된 Epics
- **SSOT 리팩토링**: 하드코딩 완전 제거 (2026-02-12 완료)
- **Epic A: 리포트 자동화** (2026-02-12 완료)
- **UI/UX 전면 개선**: 5부서 페르소나 리뷰 기반 33건 수정 (2026-02-13 완료)

## 아키텍처 결정
- **모듈 구조**: index.ts (Public API) + internal/ (Private)
- **SSOT 3파일 체제**: channels.ts (채널), metrics.ts (메트릭), colors.ts (UI 컬러)
- **하드코딩 금지**: 채널 라벨/컬러/메트릭/차트팔레트 모두 src/constants/ 참조 필수
- **포맷 유틸 통합**: `@/lib/utils/format.ts` 단일 파일 (formatNumber, formatValue, formatCurrency 등 9개 함수). 컴포넌트 내 로컬 정의 금지
- **에러 상태 통일**: `@/components/common/error-state.tsx` 공통 컴포넌트 사용. 인라인 에러 div 금지
- **KPI 카드 통합**: KPICardEnhanced가 유일한 KPI 카드. kpi-card.tsx는 deprecated re-export
- **채널명 표시**: API에서 `"플랫폼명 (계정명)"` 형식 + UI에서 CHANNEL_COLORS 컬러 dot
- **커머스 뷰**: CommerceDashboardView 사용 (CommerceView는 레거시, 사용 금지)
- **리스크 알림 컨텍스트**: RiskAlert에 currentValue/previousValue/dataSource 포함, "전기값→현기값(변화율%)" 표시
- **이메일**: Resend 사용
- **Cron**: Vercel Cron (Hobby: 하루 1회 제한)
- **Meta OAuth**: 장기 토큰 교환 + Page Access Token 우선 사용
- **Meta 앱 통합**: FlowReport_ins 앱 하나로 Facebook+Instagram 모두 처리

## 주의사항
- **React Hooks**: early return 전에 모든 hooks 호출 필수
- **useMemo에서 setState 금지**: useEffect 사용 (correlation-chart.tsx에서 수정됨)
- **Tooltip formatter**: `(value, name) => [formattedValue, name]` 형식 사용
- **Vercel Hobby 플랜**: cron은 하루 1회만 가능
- **커밋 전 확인**: 새 파일이 다른 파일에서 import되면 반드시 함께 커밋
- **GA4 자격증명**: serviceAccountJson (문자열), serviceAccount (객체) 혼동 주의
- **Google OAuth 앱**: 테스트 모드에서 refresh_token 7일 만료. 프로덕션 게시 필요
- **정렬 변경 시 페이지 리셋**: setCurrentPage(1) 필수 (data-explorer에서 수정됨)

## 환경변수
- ENCRYPTION_KEY, DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET ✅
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ✅
- META_APP_ID, META_APP_SECRET ✅ (FlowReport_ins 앱 - 907963014925273)
- CRON_SECRET ✅ (로컬), Vercel에도 설정 필요
- RESEND_API_KEY, EMAIL_FROM ❌ (Resend 대시보드 발급 필요)

## 채널 연동 상태 (2026-02-13)
| 채널 | 상태 | 비고 |
|------|------|------|
| GA4 | ✅ 코드 수정 완료 | 서비스 계정 JSON 필요 |
| YouTube | ⚠️ 토큰 만료 | 앱 게시 완료, 재연결 필요 |
| Instagram | ✅ 동작 | FlowReport_ins 앱 사용 |
| Facebook | ✅ 동작 | FlowReport_ins 앱 사용 (FlowCoder 페이지) |
| 스마트스토어 | ✅ CSV 전용 | |
| 쿠팡 | ✅ CSV 전용 | |
| 네이버 블로그 | ✅ CSV 전용 | |

## 미커밋 변경사항 (2026-02-13)
- **73개 파일, 1010줄 추가, 885줄 삭제** - 커밋+푸시 필요!
- 빌드+타입체크 통과 확인됨

## 다음 세션 할 일
1. **커밋+푸시** (73개 파일 미커밋 - 최우선!)
2. **YouTube 재연결** (앱 게시 완료 후 새 토큰 발급)
3. **팔로워 순증 표시 검토** (subscriberGained 합산 vs 총 구독자 혼란)

## 최근 작업
- 2026-02-13: 리스크 알림 컨텍스트 강화 - "전기값→현기값(변화율%)" + dataSource 표시 (5파일, 빌드 통과)
- 2026-02-13: UI/UX 전면 개선 - 5부서 페르소나 리뷰 후 33건 수정 (빌드 통과, 미커밋)
- 2026-02-13: 채널명 표시 개선 - "플랫폼명 (계정명)" + 컬러 dot
- 2026-02-13: YouTube 토큰 이슈 진단 - Google OAuth 앱 게시 완료
- 2026-02-12: SSOT 리팩토링 완료 (커밋 0d26f18)
- 2026-02-12: Meta 채널 연동 완료
