# PROGRESS.md — 진행상황 / 미해결 이슈

> 다음 세션이 이어받는 메모. CLAUDE.md 6장 체크리스트와 함께 볼 것.

## ✅ 이번 세션에 한 것 (1단계 착수: 쿠팡 CS문의 조회)

- **B. 스캐폴딩**
  - `wrangler.toml` — Cron 15분, 시크릿 바인딩 자리(주석), COUPANG_BASE/ALLOWED_ORIGINS vars.
  - 폴더: `market-cs/`(이 멀티프로젝트 레포 관례상 루트가 아닌 서브폴더에 배치), `workers/`.
- **C. `workers/coupang.js`**
  - `쿠팡시각` / `쿠팡서명` — HMAC-SHA256(hex) CEA 서명. 요청 직전 서명 생성(만료 대비).
  - `조회구간` — 최대 7일 하드캡. `kst문의시각` KST 포맷.
  - `CS문의조회` — `GET .../v5/vendors/{vendorId}/callCenterInquiries`,
    쿼리 `inquiryStartAt/inquiryEndAt/partnerCounselingStatus=NO_ANSWER/pageSize/pageNum`.
  - `cs문의정규화` — 통합 스키마(CLAUDE.md 4장), `market:"coupang"`, `marketType:"cs"`,
    **24h 데드라인** = createdAt + 24h. `문서ID` = `market_marketInquiryId`(중복수집 방지 키).
- **D. 로컬 검증**
  - `workers/coupang.selftest.mjs` — 키 없이 서명 포맷·7일 캡·정규화·데드라인·fetch 목킹 파이프라인 검증. **24/24 통과.**
- `workers/poller.js` — Workers 엔트리(수동 `GET /coupang/cs` + Cron). Firestore 저장은 TODO.

## ⛔ 미해결 / 사전 점검 결과 (사용자 확인)

1. **출구 IP** — 사용자 결정: *"일단 코드만, IP 나중에"*. 3사 모두 호출 IP 등록 요구,
   Workers 출구 IP 유동적 → **배포·폴링 전 고정 IP 확보(고정 IP 프록시 등) 반드시 선행.** 미해결.
2. **쿠팡 인증키** — 사용자 결정: *"아직 없음, 코드만"*. ACCESS_KEY/SECRET_KEY/VENDOR_ID 미발급.
   → **실호출 검증(D 실호출)은 키 발급 후.** 현재는 목킹 구조검증까지만.

## ⚠️ 실호출 시 확정해야 할 것 (지어내지 않고 방어적으로 둔 부분)

- `callCenterInquiries` **응답 필드명**: 작성일(inquiryAt?)·상품명·고객명 등 실응답으로 확정.
  `cs문의정규화`는 후보 필드명 fallback + `raw` 원본 보존 중. 실응답 오면 필드명 고정할 것.
- `inquiryStartAt/inquiryEndAt` **포맷**: 현재 KST `yyyy-MM-ddTHH:mm:ss`. 실호출로 확인 후 조정.

## → 다음 세션 (CLAUDE.md 1-3 이후)

- 1-3. `coupang.js` 상품별 고객문의 조회 추가.
- 1-4. `smartstore.js` OAuth2(전자서명) + pay-user 조회.
- 1-5. `11st.js` API키 + 조회(XML 파싱).
- 1-6. `poller.js` Firestore upsert(중복 방지) + 3사 병합.
