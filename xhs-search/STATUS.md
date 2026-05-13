# 샤오홍슈 한국어 검색기 — 진행 상황 문서

마지막 업데이트: 2026-05-13

## 한 줄 요약
한국어로 검색하면 자동 중국어 번역 후 샤오홍슈 결과를 우리 사이트에 띄우는 도구. **번역·UI·YouTube 발견은 동작, 샤오홍슈 결과 표시는 차단으로 미완성.**

---

## 만든 것

### ✅ 1. 검색 UI / 번역 / 추천 키워드
- 한국어 입력 → Google Translate(무료) 또는 MyMemory로 자동 중국어 번역
- "🔗 샤오홍슈에서 직접 보기" 버튼 → 본인 브라우저 새 탭으로 진짜 샤오홍슈 결과 페이지 열기
- "📋 중국어 복사" → 클립보드 복사
- 추천 키워드 칩 12개 (입력어 기반 색상·스타일·계절 변형)

### ✅ 2. YouTube 발견 모듈
- "쿠팡추천템", "다이소인기템" 등 한국어 키워드 → YouTube 인기 영상 검색
- Piped 공개 API (7개 인스턴스 폴백) + Jina Reader 폴백
- 영상 카드 클릭 → 모달로 영상 설명 + 자동 추출된 제품 키워드 칩
- 칩 클릭 → 자동으로 메인 샤오홍슈 검색으로 연결
- 진행률 바 (단계별 %)

### ✅ 3. 크롬 확장프로그램 헬퍼 (v1.0.3)
- Manifest V3, `cookies/storage/tabs/scripting` 권한
- `xiaohongshu.com` / `xhscdn.com` 호스트 권한
- 두 가지 검색 방법:
  - **직접 fetch** — 빠르지만 XHS가 `/search_result` URL을 차단
  - **탭 기반** — 백그라운드 탭으로 진짜 페이지 로드 후 `__INITIAL_STATE__` 추출
- 진단 버튼으로 어디서 막히는지 한눈에 확인

### ❌ 4. 샤오홍슈 결과 표시 (미완성)
지금 막혀있는 부분. 아래 "샤오홍슈 차단" 섹션 참고.

---

## 샤오홍슈 차단 — 지금까지 시도한 것

| # | 방법 | 결과 |
|---|------|------|
| 1 | 브라우저에서 직접 fetch | CORS 차단 |
| 2 | 공용 CORS 프록시 (`corsproxy.io`, `allorigins` 등 5개) | 모두 `Host not in allowlist` (네이버·XHS 도메인 차단) |
| 3 | Jina AI Reader | XHS가 봇 탐지 → 검색 결과 대신 홈페이지(인기 게시물) 반환 |
| 4 | 확장 직접 fetch `/search_result` | `Failed to fetch` (XHS가 검색 URL만 핀포인트 차단) |
| 5 | 확장 직접 fetch 홈/explore | ✅ 작동 (각 ~630KB) |
| 6 | 확장 탭 모드로 `/search_result` 열기 | 페이지는 로드되지만 `__INITIAL_STATE__`가 9613자 (검색 데이터 비어있음) |

### 마지막 단서
- `state` 키 19개: `global, user, board, UserFileStore, login, feed, layout, aiAbExp, search, conversation, traceSourceStore, AiGuideWords, AiSugDataForChat, activity, note, nioStore, liveList, liveAbExp, notification`
- `state.search`는 존재하지만 검색 결과 노트는 들어있지 않음
- 추정: XHS는 SPA에서 search 결과를 별도 XHR로 로드 (`__INITIAL_STATE__`에는 안 들어옴)

---

## 다음 단계 옵션

### 옵션 A. 현재 상태로 사용 (실용적)
- "🔗 샤오홍슈에서 직접 보기" 버튼으로 본인 브라우저에서 결과 확인
- 한국어 번역 + YouTube 발견 + 키워드 추천은 사이트에서 그대로 사용
- 샤오홍슈 검색만 새 탭으로

### 옵션 B. 탭 모드 고도화
- 백그라운드 탭에서 페이지 로드 + **SPA가 검색 XHR 호출할 때까지 더 길게 대기**
- 또는 콘텐츠 스크립트가 DOM에서 직접 노트 카드 element 긁기 (`<section class="note-item">` 등)
- 위험: XHS가 DOM 구조를 자주 바꿈

### 옵션 C. XHR 인터셉트
- 콘텐츠 스크립트가 XHS 페이지의 `fetch`/`XMLHttpRequest`를 가로채서 검색 API 응답 복사
- 가장 신뢰성 높지만 코드 복잡도 ↑
- 또한 XHS의 검색 API는 `x-s`, `x-t` 서명 헤더 필요 (브라우저가 자동 생성하므로 인터셉트로 우회 가능)

### 옵션 D. 백엔드 (Cloudflare Worker)
- 본인 샤오홍슈 쿠키를 Worker 환경변수로 저장
- Worker가 적절한 헤더로 검색 호출
- 가장 안정적, 다른 PC에서도 동작
- 단점: Cloudflare 가입 + 쿠키 추출 필요

### 옵션 E. 다른 방향 (제품 탐색)
- 샤오홍슈는 자동 수집을 막는 게 회사 정책
- 대신 가능한 도메인:
  - 알리익스프레스 (공식 Affiliate API 있음)
  - 타오바오 (제한적이지만 일부 페이지 접근 가능)
  - 1688.com (도매)

---

## 동작 중인 기능 사용 가이드

### URL
- 사이트: https://invedory.com/xhs-search/

### 흐름 (현재 가능)
1. **YouTube 영감 찾기** (선택)
   - 상단 빨간 카드에서 "쿠팡추천템" 등 칩 클릭 또는 직접 입력
   - 인기 영상 12개에서 마음에 드는 영상 클릭
   - 모달에서 자동 추출된 제품 키워드 칩 클릭 → 자동으로 샤오홍슈 검색 흐름

2. **한국어로 직접 검색**
   - 검색창에 한국어 입력 (예: "조리도구 받침대")
   - 🔍 검색 클릭
   - 한국어 → 중국어 자동 번역 표시 (예: `炊具架`)
   - **🔗 샤오홍슈에서 직접 보기** 클릭 → 본인 브라우저로 진짜 결과 페이지

3. **추천 키워드**
   - 칩 클릭 → 자동 검색
   - 입력어 기반 색상·스타일·계절 변형

### 확장 (선택, 안정성 향상용)
- 진단 버튼으로 동작 여부 확인 가능
- 직접 검색은 아직 결과 0개 (위 "샤오홍슈 차단" 참고)

---

## 코드 위치

```
xhs-search/
├── index.html          # UI
├── app.js              # 프론트엔드 로직
├── worker.js           # Cloudflare Worker 백엔드 (옵션 D용, 배포 전)
├── README.md           # 사용 가이드
├── STATUS.md           # 이 문서
└── extension/
    ├── manifest.json   # 확장 매니페스트 v1.0.3
    ├── background.js   # 서비스 워커 (fetch + 탭 검색)
    ├── content.js      # 우리 사이트용 브리지
    ├── xhs-page-main.js    # XHS 페이지 MAIN world 스크립트
    ├── xhs-page-bridge.js  # XHS 페이지 ISOLATED 브리지
    └── README.md       # 확장 설치 가이드
```

---

## 의사결정 필요

다음 중 어느 옵션으로 진행할지:

- [ ] **A. 현재 상태로 만족** — 새 탭 열어 보는 방식으로 사용. 추가 작업 없음
- [ ] **B. 탭 모드 + DOM 긁기** — 1~2시간 추가 작업, 성공 가능성 60%
- [ ] **C. XHR 인터셉트** — 3~4시간, 성공 가능성 85% (XHS 봇 정책 따라 변동)
- [ ] **D. Cloudflare Worker** — 1시간 + 본인 쿠키 추출, 성공 가능성 90%
- [ ] **E. 다른 플랫폼** — 알리/타오바오 등으로 방향 전환

선택하시면 그쪽으로 진행합니다.
