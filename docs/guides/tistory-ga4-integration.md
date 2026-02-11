# 티스토리 블로그 GA4 연동 가이드

## 개요

### 티스토리 Open API 종료 안내

티스토리 Open API는 **2024년 2월에 완전 종료**되었습니다. 이에 따라 기존 티스토리 API를 통한 블로그 통계 수집이 더 이상 불가능합니다.

FlowReport에서 티스토리 블로그 통계를 수집하려면 **Google Analytics 4 (GA4)**를 통해 연동해야 합니다.

### GA4 연동의 장점

| 장점 | 설명 |
|------|------|
| **상세한 분석** | 페이지뷰, 세션, 사용자 행동 등 풍부한 데이터 |
| **실시간 데이터** | 방문자 현황을 실시간으로 확인 |
| **무료 사용** | Google Analytics는 무료로 제공 |
| **통합 관리** | FlowReport에서 다른 채널과 함께 통합 분석 |
| **안정적인 API** | Google의 공식 API로 안정적인 데이터 수집 |

---

## 1. 사전 준비

### 1.1 Google 계정 준비

- Google Analytics를 사용하려면 Google 계정이 필요합니다.
- 기존 Google 계정을 사용하거나 새로 생성하세요.

### 1.2 Google Analytics 계정 생성

1. [Google Analytics](https://analytics.google.com/)에 접속합니다.
2. Google 계정으로 로그인합니다.
3. "측정 시작" 버튼을 클릭합니다.
4. 계정 이름을 입력합니다 (예: "내 블로그 분석").

### 1.3 GA4 속성 생성

1. **속성 이름** 입력 (예: "티스토리 블로그")
2. **보고 시간대**: 대한민국 선택
3. **통화**: 한국 원(KRW) 선택
4. **비즈니스 정보** 입력:
   - 업종: 블로그/미디어
   - 비즈니스 규모 선택
5. **플랫폼 선택**: "웹" 선택
6. **웹사이트 URL** 입력: `https://yourname.tistory.com`
7. **스트림 이름** 입력 (예: "티스토리 메인")
8. "스트림 만들기" 클릭

### 1.4 측정 ID 확인

속성 생성 후 **측정 ID**를 확인합니다.

1. 관리 > 데이터 스트림 > 생성한 스트림 클릭
2. **측정 ID** 확인 (형식: `G-XXXXXXXXXX`)
3. 이 ID를 메모해둡니다.

> **참고**: 측정 ID는 `G-`로 시작하는 문자열입니다.

---

## 2. 티스토리 GA4 설정 방법

### 2.1 GA4 추적 코드 복사

1. Google Analytics 관리 페이지로 이동
2. **관리** > **데이터 스트림** > 해당 스트림 클릭
3. **태그 안내 보기** 클릭
4. **직접 설치** 탭 선택
5. 아래와 같은 추적 코드를 복사합니다:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XXXXXXXXXX');
</script>
```

> **중요**: `G-XXXXXXXXXX` 부분을 본인의 측정 ID로 교체하세요.

### 2.2 티스토리 관리 페이지 접속

1. 티스토리 블로그에 로그인합니다.
2. **관리** 페이지로 이동합니다.
3. 좌측 메뉴에서 **꾸미기** > **스킨 편집**을 클릭합니다.

### 2.3 HTML 편집

1. 스킨 편집 화면에서 **html 편집** 버튼을 클릭합니다.
2. **HTML** 탭을 선택합니다.
3. `<head>` 태그를 찾습니다.
4. `<head>` 태그 바로 아래에 GA4 추적 코드를 붙여넣습니다.

**예시:**
```html
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- 기존 head 내용... -->
<meta charset="utf-8">
...
</head>
```

### 2.4 저장 및 적용

1. **적용** 버튼을 클릭하여 변경사항을 저장합니다.
2. 블로그를 방문하여 정상 작동하는지 확인합니다.

### 2.5 데이터 수집 확인

1. Google Analytics **실시간** 보고서에 접속합니다.
2. 티스토리 블로그를 새 탭에서 방문합니다.
3. 실시간 보고서에서 방문자가 표시되면 설정 완료입니다.

---

## 3. FlowReport 연동 방법

FlowReport에서 GA4 데이터를 수집하려면 **Google Cloud 서비스 계정**이 필요합니다.

### 3.1 Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
3. 프로젝트 이름을 입력합니다 (예: "FlowReport Integration").

### 3.2 Google Analytics Data API 활성화

1. Google Cloud Console에서 **API 및 서비스** > **라이브러리**로 이동합니다.
2. "Google Analytics Data API"를 검색합니다.
3. **사용 설정** 버튼을 클릭합니다.

### 3.3 서비스 계정 생성

1. **API 및 서비스** > **사용자 인증 정보**로 이동합니다.
2. **사용자 인증 정보 만들기** > **서비스 계정**을 클릭합니다.
3. 서비스 계정 정보 입력:
   - **서비스 계정 이름**: `flowreport-ga4`
   - **서비스 계정 ID**: 자동 생성됨
4. **만들기 및 계속**을 클릭합니다.
5. 역할 부여는 건너뜁니다 (선택사항).
6. **완료**를 클릭합니다.

### 3.4 서비스 계정 키 생성

1. 생성된 서비스 계정을 클릭합니다.
2. **키** 탭으로 이동합니다.
3. **키 추가** > **새 키 만들기**를 클릭합니다.
4. **JSON** 형식을 선택하고 **만들기**를 클릭합니다.
5. JSON 키 파일이 자동으로 다운로드됩니다.

> **중요**: 이 JSON 파일은 안전하게 보관하세요. 분실 시 새로 생성해야 합니다.

### 3.5 GA4 속성에 서비스 계정 권한 부여

1. [Google Analytics](https://analytics.google.com/)로 이동합니다.
2. **관리** > **속성 액세스 관리**를 클릭합니다.
3. 우측 상단 **+** 버튼 > **사용자 추가**를 클릭합니다.
4. 서비스 계정 이메일 주소 입력:
   - 형식: `flowreport-ga4@프로젝트ID.iam.gserviceaccount.com`
   - JSON 파일의 `client_email` 값을 사용합니다.
5. **역할**: "뷰어" 선택 (읽기 전용)
6. **추가**를 클릭합니다.

### 3.6 GA4 Property ID 확인

1. Google Analytics **관리** 페이지로 이동합니다.
2. **속성 설정**을 클릭합니다.
3. **속성 ID**를 확인합니다 (숫자만 있는 ID, 예: `123456789`).

> **참고**: Property ID는 측정 ID(`G-XXXXXXXXXX`)와 다릅니다. 숫자로만 구성된 ID입니다.

### 3.7 FlowReport에서 GA4 채널 연결

1. FlowReport에 로그인합니다.
2. 워크스페이스 > **채널 연결**로 이동합니다.
3. **Google Analytics 4**를 선택합니다.
4. 입력 정보:
   - **Property ID**: 위에서 확인한 숫자 ID (예: `123456789`)
   - **서비스 계정 JSON**: 다운로드한 JSON 파일의 내용을 붙여넣기
5. **연결** 버튼을 클릭합니다.
6. 연결 성공 메시지가 표시되면 완료입니다.

---

## 4. 데이터 확인

### 4.1 데이터 수집 대기

- GA4 설정 후 **24-48시간** 정도 지나야 데이터가 충분히 수집됩니다.
- 실시간 데이터는 즉시 확인 가능하지만, 과거 데이터는 소급 적용되지 않습니다.

### 4.2 FlowReport 대시보드에서 확인

연동 후 FlowReport 대시보드에서 다음 지표를 확인할 수 있습니다:

| 지표 | 설명 |
|------|------|
| **세션 (Sessions)** | 방문 횟수 |
| **사용자 (Users)** | 순 방문자 수 |
| **신규 사용자** | 처음 방문한 사용자 수 |
| **페이지뷰** | 페이지 조회 수 |
| **평균 세션 시간** | 평균 체류 시간 |
| **이탈률** | 한 페이지만 보고 나간 비율 |
| **참여율** | 적극적으로 사이트를 탐색한 비율 |

---

## 5. 문제 해결

### 5.1 GA4 실시간 데이터가 안 보여요

1. 추적 코드가 `<head>` 태그 내에 올바르게 삽입되었는지 확인합니다.
2. 측정 ID가 정확한지 확인합니다.
3. 브라우저 캐시를 삭제하고 다시 방문합니다.
4. 광고 차단 확장 프로그램을 비활성화합니다.

### 5.2 FlowReport 연결 실패

| 오류 메시지 | 원인 | 해결 방법 |
|-------------|------|----------|
| `Permission denied` | 서비스 계정에 권한이 없음 | GA4 속성에 서비스 계정 이메일 추가 |
| `Property not found` | Property ID가 잘못됨 | 숫자로만 된 Property ID 확인 |
| `Invalid service account JSON` | JSON 형식 오류 | JSON 파일 전체 내용 복사 확인 |
| `Invalid property ID format` | 측정 ID를 입력함 | `G-`로 시작하지 않는 숫자 ID 입력 |

### 5.3 서비스 계정 이메일 확인 방법

다운로드한 JSON 파일을 열어 `client_email` 값을 확인합니다:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "flowreport-ga4@your-project-id.iam.gserviceaccount.com",
  ...
}
```

---

## 6. 요약

| 단계 | 작업 |
|------|------|
| 1 | Google Analytics 계정 및 GA4 속성 생성 |
| 2 | 측정 ID 확인 (`G-XXXXXXXXXX`) |
| 3 | 티스토리 스킨 편집 > HTML에 추적 코드 삽입 |
| 4 | Google Cloud에서 서비스 계정 생성 및 JSON 키 다운로드 |
| 5 | GA4 속성에 서비스 계정 권한(뷰어) 부여 |
| 6 | Property ID 확인 (숫자만) |
| 7 | FlowReport에서 GA4 채널 연결 |

---

## 참고 자료

- [Google Analytics 4 시작하기](https://support.google.com/analytics/answer/9304153)
- [GA4 Data API 문서](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [티스토리 스킨 편집 가이드](https://tistory.github.io/document-tistory-skin/)
