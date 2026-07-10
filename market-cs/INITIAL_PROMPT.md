# INITIAL_PROMPT.md — 첫 세션 부트스트랩

이 프로젝트를 처음 시작하는 Claude Code에게 주는 지시.

---

## 먼저 읽어라

1. **CLAUDE.md 전체를 먼저 읽어라.** 프로젝트 목표·스택·API 스펙·함정이 모두 거기 있다.
2. 이 프로젝트는 기존 컨벤션을 따른다: 단일 HTML + Tailwind CDN + Cloudflare Workers + Firebase Firestore + GitHub Pages. 한국어 주석·함수명. 프레임워크·번들러 없음.

## 이번 세션의 범위 (딱 여기까지만)

**1단계 MVP의 착수 부분 = 쿠팡 CS문의 조회까지 동작 확인.**

과욕 금지. 3사 전부 한 번에 짜지 말 것. 쿠팡이 스펙이 가장 명확하니 여기서 뼈대를 잡고, 나머지는 다음 세션에서 붙인다.

### 이번 세션 체크리스트

- [ ] **A. 사전 점검 먼저 (코드 짜기 전에 나에게 질문)**
  - Cloudflare Workers의 출구 IP 이슈: 3사 모두 호출 IP 등록을 요구한다. Workers 고정 IP를 어떻게 확보할지(고정 IP 프록시 필요 여부)를 나에게 확인하고 넘어가라. 이게 안 풀리면 폴링 자체가 막힌다.
  - 쿠팡 ACCESS_KEY / SECRET_KEY / VENDOR_ID 발급 여부 확인.

- [ ] **B. 프로젝트 스캐폴딩**
  - `wrangler.toml` 생성. Cron Trigger(15분), 시크릿 바인딩 자리 잡기.
  - 폴더 구조는 CLAUDE.md 5장 그대로.

- [ ] **C. 쿠팡 모듈 (`workers/coupang.js`)**
  - HMAC-SHA256 서명 생성 유틸부터. (요청 직전 서명 생성 — 만료 짧음)
  - CS문의 조회: `GET /v2/providers/openapi/apis/api/v5/vendors/{vendorId}/callCenterInquiries`
    쿼리 `inquiryStartAt`, `inquiryEndAt`(최대 7일), `partnerCounselingStatus=NO_ANSWER`, `pageSize`, `pageNum`.
  - 응답을 CLAUDE.md 4장 통합 스키마(`market:"coupang"`, `marketType:"cs"`)로 정규화하는 매퍼.
  - 쿠팡 CS는 **24h 데드라인**을 `createdAt` 기준으로 계산해 `deadline` 필드에 저장.

- [ ] **D. 로컬 검증**
  - 실제 호출 1회 성공(또는 인증 단계까지) 확인. 미답변 건 콘솔 출력.

### 이번 세션에서 하지 말 것

- 스마트스토어·11번가 모듈 (다음 세션)
- 답변 전송(reply.js) — 2단계
- 대시보드 UI 세부 — 조회 파이프라인 확정 후
- LLM 초안 — 수집 확정 후

## 작업 방식

- 막히거나 스펙이 불확실하면 추측하지 말고 나에게 물어라. (특히 IP 등록·인증)
- 검증 안 된 API 엔드포인트를 지어내지 말 것. 불확실하면 표시하고 확인 요청.
- 한 번에 한 파일씩, 동작 확인하며 진행.

## 완료 시

- CLAUDE.md 6장 체크리스트에서 완료 항목 체크.
- 다음 세션이 이어받을 수 있게 진행상황·미해결 이슈를 CLAUDE.md 하단이나 별도 PROGRESS 메모에 남겨라.
