# 쇼핑 인사이트 · 네이버 통합 대시보드

네이버 검색 API + 데이터랩 쇼핑인사이트를 한 화면에서 보는 대시보드 PWA.
상품·가격 / 판매처 분포 / 키워드 트렌드 / 연령·성별·기기까지 통합.

> 배포 경로: **https://kimbany.github.io/market-research/**

## 구성
- `index.html` — 대시보드 본체 (단일 HTML, Tailwind + Chart.js CDN)
- `worker.js` — Cloudflare Workers 프록시 (네이버 API CORS 우회)
- `manifest.json`, `sw.js` — PWA (홈 화면 설치·오프라인 셸)
- `CLAUDE.md` — 프로젝트 청사진 / 세션 연속성 문서

## 왜 프록시가 필요한가
네이버 오픈API는 브라우저에서 직접 호출이 막혀 있음(CORS + Client Secret 노출 방지).
GitHub Pages(정적)에서는 서버가 없으므로 Cloudflare Workers를 프록시로 둠.
**프록시 미설정 시 데모 데이터로 UI가 그대로 동작** → 먼저 화면 확인 후 연결 가능.

## 바로 써보기 (키 없이)
1. `market-research/index.html`을 브라우저로 열기 (또는 배포 URL 접속)
2. 키워드 검색 → 데모 데이터로 4개 탭 전부 동작 확인
3. 실데이터가 필요하면 아래 배포 순서 진행

## 배포 순서

### 1. 네이버 API 키 발급
1. developers.naver.com → 애플리케이션 등록
2. 사용 API: **검색** + **데이터랩(쇼핑인사이트)** 둘 다 체크
3. Client ID / Secret 확보

### 2. Cloudflare Workers 배포
1. dash.cloudflare.com → Workers & Pages → Create Worker
2. `worker.js` 내용 붙여넣기
3. Settings → Variables 에 환경변수 추가 (코드에 넣지 말 것):
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`
   - `ALLOWED_ORIGINS` = `https://kimbany.github.io`
4. Deploy → `https://xxx.workers.dev` 주소 확보

### 3. GitHub Pages 배포
1. 이 폴더(`market-research/`)가 저장소에 푸시되어 있으면 됨 (Pages는 저장소 루트 기준)
2. 접속: `https://kimbany.github.io/market-research/`
3. 우상단 ⚙ 버튼 → Workers 주소 입력 → 저장

## 데이터랩 카테고리
`index.html`의 `CATEGORY_MAP`에 반려동물 세부 카테고리 실제 코드가 매핑돼 있음.
- 트렌드 탭의 **카테고리 드롭다운**에서 직접 선택하거나,
- "카테고리 자동"으로 두면 검색어에 따라 적절한 코드를 자동 추정.
- 코드표는 `CLAUDE.md` 10번 섹션 참고.

## 실데이터 전환 요약
- 검색·트렌드: 프록시 연결 시 자동으로 실API 전환
- **연령·성별·기기**: `/datalab-age`, `/datalab-gender`, `/datalab-device` 3개를
  `Promise.all` 병렬 호출해 실데이터로 채움. 프록시 미설정이면 데모로 폴백.
  (응답의 `group` 키가 문서와 다르면 `index.html`의 `mapRatios()` 인자 조정)

## 아이콘
`icon-192.png`, `icon-512.png` 를 이 폴더에 추가하면 홈 화면 설치 아이콘 적용.
없어도 동작엔 지장 없음.
