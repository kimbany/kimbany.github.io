# CLAUDE.md — 마켓 문의(CS) 통합 수집·답변 시스템

> Claude Code 세션 연속성을 위한 프로젝트 컨텍스트 파일.
> 새 세션 시작 시 이 파일을 먼저 읽고 작업할 것.

---

## 0. 프로젝트 한 줄 요약

스마트스토어 · 11번가 · 쿠팡 **3개 마켓의 게시판형 상품문의/CS문의를 단일 대시보드로 통합 수집**하고, **LLM으로 답변 초안을 자동 생성**하며, 최종적으로 **각 마켓 API로 답변을 재등록**하는 셀러용 CS 자동화 툴.

---

## 1. 기술 스택 (기존 컨벤션 유지)

- **프런트**: 단일 HTML 파일 + Tailwind CSS (CDN). 프레임워크·번들러 없음.
- **API 프록시**: Cloudflare Workers (마켓 API의 CORS·인증·서명 처리를 여기서 담당)
- **데이터 저장**: Firebase Firestore (문의 캐시, 답변 이력, 처리상태)
- **배포**: GitHub Pages (프런트) + Cloudflare Workers (백엔드)
- **주기 실행**: Cloudflare Workers Cron Triggers (문의 폴링)
- **코드 규약**: 한국어 주석·함수명 사용. 직접적이고 타깃된 구현 우선.

---

## 2. 핵심 개념 — 문의는 "게시판형"만 다룬다

이 프로젝트가 다루는 것과 다루지 않는 것을 명확히 구분한다.

| 구분 | 다룸? | 이유 |
|---|---|---|
| 게시판형 상품문의 / CS문의 (비동기 게시글) | ✅ | 조회 API로 폴링 가능, 답변 API로 등록 가능 |
| 실시간 채팅상담 (네이버 톡톡, 카카오 상담톡) | ❌ | 웹훅 기반 챗봇 영역. 별도 프로젝트. 절대 이 프로젝트에 섞지 말 것 |

> **주의**: 네이버 커머스API는 **리뷰·톡톡 상담 데이터 수집을 지원하지 않는다.** 게시판형 문의만 가능. 이 제약을 전제로 설계할 것.

---

## 3. 대상 마켓 & API 스펙 (검증된 사실)

### 3-1. 스마트스토어 (네이버 커머스API)

- **인증**: OAuth2.0 `client_credentials` 방식. `client_secret`을 bcrypt 전자서명(signature)하여 토큰 발급. 토큰 유효시간 관리 필요.
- **문의 조회**: `pay-user` 경로 계열 — 지정 기간 내 고객 문의건 조회.
- **문의 답변 등록/수정**: `pay-merchant` 경로 계열.
  - ⚠️ **조회와 답변의 API 경로 접두어가 다르다**(pay-user vs pay-merchant). 혼동 주의.
- **애플리케이션 권한**: 커머스API센터에서 앱 등록 시 **"문의" API 그룹**을 반드시 추가.
- **Rate limit**: 내스토어 애플리케이션 기준 **초당 2회(2/s)**.
- **답변 제약** (실무 필수):
  - 2026-05-21부터 **하나의 문의에 답변 1회만** 전송 가능. (수정 불가 전제로 설계)
  - 답변 총 글자수 **1,000자 초과 시 전송 실패**. 초안 생성 시 1,000자 하드 리밋.
- **IP 등록**: 커머스API센터에 호출 IP 등록 필요 → Cloudflare Workers 고정 출구 IP 이슈 확인할 것.

### 3-2. 11번가 (셀러 OpenAPI)

- **인증**: 셀러오피스에서 발급한 OpenAPI KEY (API Key 방식).
- **사전 조건**: 셀러오피스에서 **Seller 전환** + API키 **승인** + **서버 IP 등록** 필요.
- **문의**: 상품문의/고객문의 조회·답변 API 존재 (주문 API와 동일 OpenAPI 체계).
- 응답 포맷: 전통적으로 XML 응답 가능성 높음 → 파서 준비.

### 3-3. 쿠팡 (WING 오픈API) — 스펙 가장 명확

- **인증**: HMAC-SHA256 서명. `ACCESS_KEY` + `SECRET_KEY` + `VENDOR_ID`(업체코드). 서명에 요청시각 포함(만료 있음 → "signature is expired" 에러 주의).
- **호출 IP 등록**: WING > 판매자정보 > 추가판매정보 > API Key 발급 시 IP 등록. **정보수정 주 10회 제한**.
- **Base URL**: `https://api-gateway.coupang.com`

쿠팡 문의는 **두 종류**로 나뉨 (둘 다 구현):

**(A) 상품별 고객문의** (상품 상세페이지 Q&A)
- 조회: 상품별 고객문의 조회
- 답변: 상품별 고객문의 답변 (`update_customer_service_request`)

**(B) 쿠팡 고객센터(CS) 문의** (콜센터 이관 건)
- 조회: `GET /v2/providers/openapi/apis/api/v5/vendors/{vendorId}/callCenterInquiries`
  - 쿼리: `inquiryStartAt`, `inquiryEndAt`(최대 7일), `partnerCounselingStatus=NO_ANSWER`, `pageSize`, `pageNum`
- 단건 조회: callCenterInquiries 단건
- 답변: `POST /v2/providers/openapi/apis/api/v4/vendors/{vendorId}/callCenterInquiries/{inquiryId}/replies`
  - body: `{ vendorId, inquiryId, content, replyBy, parentAnswerId }`
  - 미답변(`inquiryStatus:progress`, `partnerTransferStatus:requestAnswer`) 상태에서만 가능
  - **중복 답변 시 에러**. 답변 전 상태 재확인 필수.
- 문의확인: `POST .../callCenterInquiries/{inquiryId}/confirms` — body `{ confirmBy }`
- ⚠️ **24시간 내 미답변 시 쿠팡이 자동 답변완료 처리** → 그 뒤엔 API 답변 불가. **폴링·알림 우선순위 최상위**.
- 줄바꿈은 `\n`, `\r`만 지원.

---

## 4. 데이터 모델 (Firestore)

컬렉션 `inquiries` — 마켓 무관 통합 스키마로 정규화한다.

```
inquiries/{docId}
  market:        "smartstore" | "11st" | "coupang"
  marketType:    "product" | "cs"          // 상품문의 vs 고객센터문의
  marketInquiryId: string                   // 마켓 원본 문의 ID (중복수집 방지 키)
  productName:   string
  productId:     string | null
  question:      string
  customerName:  string | null
  createdAt:     timestamp                   // 마켓 기준 문의 등록일
  status:        "unanswered" | "draft_ready" | "answered" | "expired"
  draftAnswer:   string | null               // LLM 생성 초안
  finalAnswer:   string | null               // 실제 전송한 답변
  answeredAt:    timestamp | null
  deadline:      timestamp | null            // 쿠팡 CS는 24h 데드라인 계산해서 저장
  raw:           map                         // 마켓 원본 응답 (디버깅용)
```

**중복수집 방지**: `market + marketInquiryId` 조합을 문서 ID로 사용하거나 유니크 체크.

---

## 5. 아키텍처 & 폴더 구조

```
/
├── CLAUDE.md                 (이 파일)
├── INITIAL_PROMPT.md         (첫 세션 부트스트랩 지시)
├── index.html                (대시보드 단일 HTML)
├── workers/
│   ├── poller.js             (Cron: 3사 문의 폴링 → Firestore 저장)
│   ├── smartstore.js         (네이버 인증·조회·답변)
│   ├── 11st.js               (11번가 인증·조회·답변)
│   ├── coupang.js            (쿠팡 HMAC·조회·답변)
│   ├── draft.js              (LLM 답변 초안 생성)
│   └── reply.js              (승인된 답변을 각 마켓 API로 전송)
├── wrangler.toml             (Workers 설정, Cron·시크릿 바인딩)
└── firebase-config.js        (Firestore 초기화)
```

---

## 6. 작업 단계 (이 순서로 진행)

### ✅ 1단계 — 게시판형 문의 통합 수집 + 답변 초안 (MVP)

목표: 3사 미답변 문의를 한 화면에 모으고, LLM 초안을 붙인다. **여기까지가 투자 대비 효과 최대.**

- [x] 1-1. Cloudflare Workers 프로젝트 스캐폴딩 (wrangler.toml, 시크릿 바인딩) — `market-cs/`
- [x] 1-2. `coupang.js` — HMAC 서명 유틸 + CS문의(callCenterInquiries) 조회 구현 (구조검증 24/24 통과, 실호출은 키 발급 후)
- [ ] 1-3. `coupang.js` — 상품별 고객문의 조회 추가
- [ ] 1-4. `smartstore.js` — OAuth2 토큰 발급(전자서명) + pay-user 문의 조회
- [ ] 1-5. `11st.js` — API키 인증 + 문의 조회 (XML 파싱)
- [ ] 1-6. `poller.js` — 3사 조회 결과를 통합 스키마로 정규화 → Firestore 저장 (중복 방지). Cron 15분 간격.
- [ ] 1-7. `draft.js` — 문의 텍스트 → LLM 답변 초안 생성. **1,000자 하드 리밋**. 상품 컨텍스트(브랜드: ZEAL/Ziwi/아첨간식) 주입.
- [ ] 1-8. `index.html` — 통합 대시보드: 마켓별 필터, 미답변/데드라인 정렬, 초안 표시·수정. 쿠팡 CS **24h 데드라인 임박 건 상단 강조**.

### ✅ 2단계 — 답변 재등록 (반자동 → 자동)

목표: 대시보드에서 검토·수정한 답변을 각 마켓 API로 전송.

- [ ] 2-1. `reply.js` — 쿠팡 답변 전송 (replies 엔드포인트). 전송 전 상태 재확인(중복답변 에러 방지).
- [ ] 2-2. `reply.js` — 스마트스토어 답변 전송 (pay-merchant). **1회 제한** 전송 후 상태 잠금 처리.
- [ ] 2-3. `reply.js` — 11번가 답변 전송.
- [ ] 2-4. 대시보드에 "승인→전송" 버튼. 전송 결과·에러 핸들링. 전송 성공 시 status=answered.
- [ ] 2-5. (선택) 초안 자동전송 옵션 — 신뢰도 임계치 이상만 자동, 나머지는 수동 검토 큐.

---

## 7. 검증된 함정 / 주의사항 (재발 방지)

- **경로 접두어**: 네이버 문의 조회(pay-user) ≠ 답변(pay-merchant). 섞으면 실패.
- **쿠팡 서명 만료**: HMAC 서명에 시각 포함, 만료 짧음. 요청 직전 서명 생성.
- **쿠팡 24h 데드라인**: 지나면 API 답변 불가. 폴링·알림에서 최우선.
- **네이버 답변 1회 제한**(2026-05-21~): 재전송·수정 불가. UI에서 전송 전 확인 모달.
- **네이버 1,000자 제한**: 초과 시 전송 실패. 초안 생성 단계에서 자름.
- **IP 등록**: 3사 모두 호출 IP 등록 요구. Cloudflare Workers 출구 IP가 유동적일 수 있음 → 고정 방법(예: 고정 IP 프록시) 또는 각 마켓 IP 정책 확인 필요. **1단계 착수 전 이 이슈부터 점검.**
- **Cloudflare/한국 IP 차단 이력**: 과거 OpenAI API가 Korean/Cloudflare IP를 403 차단한 사례 있음. LLM 초안 생성에 쓸 provider의 IP 정책 사전 확인.
- **11번가 응답 XML**: JSON 아닐 수 있음. 파서 분기.

---

## 8. 시크릿 / 환경변수 (wrangler secret 으로 관리, 코드에 하드코딩 금지)

```
# 스마트스토어
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
# 11번가
ST11_API_KEY
# 쿠팡
COUPANG_ACCESS_KEY
COUPANG_SECRET_KEY
COUPANG_VENDOR_ID
# LLM (초안 생성)
LLM_API_KEY
# Firebase
FIREBASE_CONFIG (JSON)
```

---

## 9. 다음 세션이 바로 시작할 것

→ **INITIAL_PROMPT.md** 를 실행. 1단계 1-1 ~ 1-2 (Workers 스캐폴딩 + 쿠팡 CS문의 조회)부터 착수.
