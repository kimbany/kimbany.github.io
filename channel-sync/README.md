# channel-sync

판매 채널의 **상품·옵션 목록**과 **주문(옵션 단위)** 을 각 채널 API로 당겨
하루 한 번 정규화 저장하고, 정적 페이지로 훑어보는 수집기입니다.
판매 반영(등록·수정·발송처리)은 하지 않습니다 — **읽기 전용**.

```
[수집기]  node src/run.js       →  data/daily/YYYY-MM-DD.json
 채널 어댑터 → 정규화 → 집계        data/latest.json
                                        ↓
                                   index.html (읽기만)
```

`sales-report/` 의 엑셀 업로드 대시보드와는 별개 프로젝트입니다.
정규화 스키마는 그쪽 `sales` 컬렉션과 같은 축(채널 · 상품 · 옵션 · 수량 · 금액 · 상태)을 쓰므로,
나중에 합칠 때 변환 없이 얹을 수 있습니다.

## 빠른 시작

```bash
cd channel-sync
npm install                       # 의존성은 bcryptjs 하나 (스마트스토어 서명용)
node src/run.js --mock            # 키 없이 파이프라인 점검
cp .env.example .env              # 채널 키 채우기
node src/run.js                   # 실제 수집 (기본: 어제~오늘)
node src/run.js --from 2026-08-01 --to 2026-08-24 --channel coupang,cafe24
```

뷰어는 정적 파일이라 아무 웹서버로 열면 됩니다 (`npx http-server . -p 8080`).
`file://` 로 직접 열면 fetch 가 막히니, 그때는 우상단 **다른 날짜 파일 열기** 로 JSON 을 집어넣으세요.

## 채널 연동 현황

| 채널 | 어댑터 | 상태 | 키 발급 |
|---|---|---|---|
| 쿠팡 | `adapters/coupang.js` | ✅ 구현 | WING > 판매자정보 > 오픈API — 즉시 |
| 스마트스토어 | `adapters/smartstore.js` | ✅ 구현 | 커머스API센터 > 애플리케이션 — 즉시 |
| 11번가 | `adapters/elevenst.js` | ⚠️ 구현 (경로 확인 필요) | 셀러오피스 > 오픈API — 즉시 |
| 자사몰(카페24) | `adapters/cafe24.js` | ✅ 구현 | 개발자센터 앱 > OAuth — 즉시 |
| 옥션 & 지마켓 | `adapters/esm.js` | ⬜ 자리만 | ESM+ 마스터ID → API 이용신청 |
| 토스쇼핑 | `adapters/toss.js` | ⬜ 자리만 | 셀러센터 > 내 연동 키 |

**어댑터가 아예 없는 채널** — API 직연동이 막혀 있어 당분간 엑셀 경로를 씁니다.

| 채널 | 사정 |
|---|---|
| SSG | 판매자 API 는 있으나 파트너오피스 신청·승인 건 |
| NS홈쇼핑 | 협력사 제휴 API(상품등록·배송 중심), `itcs@nsmall.com` 신청 |
| 카카오쇼핑(톡스토어) | Open API 가 전 판매자 대상이 아님 — 대형제휴사·솔루션사 심사 선정 |
| 알리익스프레스 | Open Platform 앱 심사 필요, 한국 셀러는 통상 솔루션사 경유 |

### 11번가 경로 확인

11번가 개발가이드가 셀러오피스 로그인 뒤에만 열려서, 엔드포인트를 코드에 박지 않고
`adapters/elevenst.js` 상단 `ENDPOINTS` 에 모아 두고 `.env` 로 덮어쓸 수 있게 했습니다.
연동 첫날 실제 경로를 한 번 맞춰 주세요.

```bash
ELEVENST_PRODUCT_PATH=/prodservices/...
ELEVENST_ORDER_PATH=/ordservices/...
```

XML 필드명도 버전마다 흔들려서 `pick(o, 'ordNo', 'orderNo')` 식으로 후보를 훑습니다.
`--no-raw` 없이 돌리면 원본 XML 이 `data/raw/` 에 남으니, 필드가 안 잡히면 그걸 보고 후보만 추가하면 됩니다.

## 운영 — 어디서 돌릴 것인가

**GitHub Actions 로는 안 됩니다.** 네이버 커머스API는 호출 IP 를 사전 등록해야 하고
(쿠팡·11번가도 IP 제한을 걸 수 있음), Actions 러너는 IP 가 매번 바뀝니다.
**고정 IP 가 나오는 곳**에서 cron 으로 돌리세요 — 소형 VM, 또는 고정 아웃바운드 IP 를 붙인 Cloud Run Job.

```cron
# 매일 07:10 KST
10 7 * * *  cd /srv/channel-sync && /usr/bin/node src/run.js >> /var/log/channel-sync.log 2>&1
```

수집기는 **채널이 하나라도 실패하면 종료코드 1** 을 냅니다(키 미설정은 제외). cron 알림을 여기 걸면 됩니다.

뷰어까지 웹에 올리려면 산출물 JSON 을 웹 경로로 복사하거나, 저장소에 커밋해 Pages 로 서빙하세요.
`data/` 는 기본적으로 `.gitignore` 되어 있습니다(`sample.json` 만 예외).

## 구조

```
src/
  run.js                 CLI — 인자 파싱, 채널 순회, 집계, 저장
  config.js              .env 로딩 / 채널별 키 확인
  core/
    http.js              재시도 · 타임아웃 · 채널별 호출 간격
    normalize.js         공통 스키마(product / option / orderLine) + 상태 5분류
    store.js             원본·일별·최신 저장, 옵션 단위 집계(rollup)
    xml.js               11번가용 최소 XML 파서 (의존성 없음)
  adapters/*.js          채널 하나 = 파일 하나
  mock/index.js          키 없이 돌려보는 가짜 결과
data/
  raw/<날짜>/<채널>.raw.json    원본 응답 (파싱이 틀렸을 때 재수집 없이 다시 돌리려고)
  daily/<날짜>.json             그날 집계 스냅샷
  latest.json                   뷰어가 읽는 파일
  sample.json                   목 데이터 (저장소에 커밋됨)
```

### 어댑터 추가하기

`collect({ from, to })` 하나만 구현해 `{ products, orders, raw }` 를 돌려주면 됩니다.
`products[]` 는 `normalize.product()`, `orders[]` 는 `normalize.orderLine()` 으로 만들고,
채널 고유 상태값은 `STATUS` 5분류(`ordered · shipping · done · canceled · returned`)로 접습니다.
그 다음 `adapters/index.js` 에 추가하면 집계·뷰어는 손댈 게 없습니다.

## 알아 둘 것

- **조회 구간 제한**: 쿠팡 발주서는 31일, 네이버 변경상태 조회는 24시간 단위(코드에서 하루씩 끊어 호출).
- **카페24 refresh_token 은 쓸 때마다 교체**되고 2주 뒤 만료됩니다. 갱신된 토큰을
  `data/.cafe24-token.json` 에 저장하므로 이 파일을 지우면 `.env` 값으로 되돌아갑니다 —
  2주 이상 안 돌리면 재인증이 필요합니다.
- **취소·반품은 음수로 세지 않고 따로 셉니다.** `amount` 는 양수 합계, `canceledAmount` 가 별도 항목입니다.
- 상품 옵션 조회는 쿠팡·스마트스토어가 **상품당 1회 추가 호출**이라 `maxProducts`(기본 500) 상한이 있습니다.
