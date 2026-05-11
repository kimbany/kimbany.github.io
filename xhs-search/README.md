# 샤오홍슈 한국어 검색기

한국어 키워드 → 자동 중국어 번역 → 샤오홍슈 검색 → 같은 제품 골라서 다운로드.

## 사이트
배포 후: https://kimbany.github.io/xhs-search/

## 구조
- `index.html`, `app.js` — 프론트엔드 (GitHub Pages 정적 호스팅)
- `worker.js` — 백엔드 (Cloudflare Workers, 무료 한도 100k req/일)

## 진행 단계

### ✅ 1단계 (완료)
- [x] 검색 UI
- [x] 한→중 번역 (Google Translate 비공식 엔드포인트 → 폴백: MyMemory)
- [x] 추천 키워드 기본 칩 12개
- [x] "샤오홍슈에서 직접 보기" / "중국어 복사" 액션
- [x] 백엔드 Worker 코드 작성 (`worker.js`)
- [x] localStorage에 Worker URL 저장

### ⏭️ 2단계 — Worker 배포 (5~10분)
1. Cloudflare 무료 가입: https://dash.cloudflare.com/sign-up
2. Workers & Pages → Create Worker → 이름 정하기 (예: `xhs-proxy`) → Deploy
3. "Edit code" → 우리 저장소 `worker.js` 내용 복사·붙여넣기 → Save and Deploy
4. (선택) Settings → Variables → `OPENAI_API_KEY` 추가 (AI 키워드 추천용)
5. (필수) `XHS_COOKIE` 추가 — 본인 샤오홍슈 계정의 `web_session` 쿠키 값
   - 샤오홍슈 로그인 → F12 → Application → Cookies → `web_session` 값 복사
6. 배포된 Worker URL 복사 (예: `https://xhs-proxy.your-name.workers.dev`)
7. 프론트엔드 페이지 하단 "⚙️ 백엔드 설정" 펼쳐서 URL 붙여넣고 저장

### ⏭️ 3단계 — 샤오홍슈 검색 작동 확인 / 차단 우회 (시행착오)
샤오홍슈 비공식 API라 차단 자주 변경됨. 이슈 발생 시 `worker.js`의 헤더·서명 로직 수정.

### ⏭️ 4단계 — "같은 제품" 기능
- 선택한 제품 이미지 → OpenAI Vision 또는 CLIP 임베딩
- 다른 검색 결과들과 유사도 비교
- 사용자가 같은 제품 골라서 ZIP/엑셀 다운로드

## 한계 / 주의
- 샤오홍슈 자동 수집은 회색지대 — 대량 사용 시 IP/계정 차단 가능
- 본인 계정 쿠키 사용 — 노출 시 계정 위험. Worker는 본인만 쓰는 URL이라 안전 but URL 공유 금지
- 무료 한도 초과 시 호스팅 비용 발생 (보통 무시 가능)
