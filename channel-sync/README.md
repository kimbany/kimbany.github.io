# 카페24 적립금 현황

카페24 적립금 내역을 매일 받아 DB(Firestore · monfruit-sales)에 쌓고,
**https://invedory.com/channel-sync/points.html** 에서 매출 리포트 비밀번호로 로그인해 봅니다.

- **전체 적립금** — 기간(년 · 월 · 최근 일주일 · 오늘 · 날짜) 합계, 리뷰 적립, 등급별, 지급 · 사용 사유, 일자/월별, 회원별(펼쳐서 내역)
- **관리 적립금** — 설정에 등록한 직원 · 관리 고객(회원코드 하나에 아이디 여러 개)의 적립금을
  🏢 회사 몫(회수 대상)과 👤 본인 몫으로 나눠 보고, 아이디별 회수 안내
- **⚙ 설정** — 관리 대상 등록, 나누는 기준

> 예전 '채널 일일 현황'(쿠팡 · 스마트스토어 등 주문 수집)은 쓰지 않아 지웠습니다. 필요하면 git 기록에서 되살릴 수 있습니다.

```
src/
  points.js            수집기 CLI — 카페24 적립금 → data/points/ + Firestore
  cafe24-auth.js       카페24 처음 연결(OAuth 동의) 도우미
  config.js            .env 읽기 · Firebase 접속값
  adapters/cafe24.js   카페24 토큰(PC 파일 + Firestore 공유) · API 호출
  core/points.js       적립금 정규화 · 집계 (수집기와 화면이 같이 씀)
  core/managed.js      관리 적립금 — 회사 몫 / 본인 몫 계산
  core/tiers.js        회원등급 · 리뷰 적립 정책
  core/firestore.js    Firestore REST (의존성 없음)
points.html            화면
적립금보기.bat          (윈도우) PC 에서 받아오기 + 화면 열기
.github/workflows/cafe24-points.yml   매일 07:10 KST 자동 수집 (저장소 루트)
```


`src/points.js` 가 카페24 Admin API 로 적립금 내역을 당겨 **Firestore(monfruit-sales)** 에 쌓고,
`points.html` 이 DB 에서 기간별로 읽어 보여줍니다 (지급 · 차감 · 순증 · 미가용, 일자별 / 사유별 / 회원별, 내역 검색).
**읽기 전용** — 카페24 쪽 적립금을 지급·차감하지 않습니다.

```
[카페24 API] ──points.js (매일 깃허브 / PC)──▶ [Firestore monfruit-sales]  ◀──읽기── invedory.com/channel-sync/points.html
                      └──▶ data/points/latest.json (PC 백업)                     (매출 리포트 비밀번호로 로그인)
```

```bash
node src/points.js --mock                      # 키 없이 점검 (가짜 데이터는 DB 에 안 넣음)
node src/points.js                             # 최근 30일 (POINTS_LOOKBACK_DAYS) → DB 저장
node src/points.js --from 2026-09-01 --to 2026-09-30
node src/points.js --member hong123            # 특정 회원만
node src/points.js --no-db                     # DB 저장 없이 JSON 만
```

### 회원등급 기준 (2026-10 현재)

| 단계 | 등급 | 구매 적립금 |
|---|---|---|
| 1 (최하위) | MonFruit | 0원 |
| 2 | SILVER | 1만원 이상 구매 시 1.5% |
| 3 | GOLD | 1만원 이상 구매 시 2% |
| 4 | DIAMOND | 1만원 이상 구매 시 2.5% |
| 5 | VIP | 1만원 이상 구매 시 3% |

**리뷰 적립 (자동지급, 등급과 무관)**

| 리뷰 종류 | 적립금 |
|---|---|
| 텍스트 리뷰 | 500원 |
| 사진 · 동영상 리뷰 | 1,000원 |

판매가 1,000원 미만 상품은 리뷰 적립금 지급 제외.

`src/core/tiers.js` 에 같은 값이 들어 있고, 뷰어의 **등급별** 표와 회원별 등급 칸이 이걸 씁니다.
등급은 카페24 내역의 `group_name` 으로 맞추므로, 카페24 회원등급 이름을 바꾸면 여기도 같이 바꿔 주세요.

### 윈도우에서 한 번에 보기

`적립금보기.bat` 을 더블클릭하면 ① 최근 내역 받아오기 ② 화면 서버 켜기 ③ 브라우저 열기를 한 번에 합니다.
서버 창은 화면을 보는 동안 켜 두고, 다 보면 닫으면 됩니다.

### DB 구조

| 컬렉션 | 문서 | 내용 |
|---|---|---|
| `cafe24Points` | 내역 1줄 = 1문서 | memberId · date(KST) · reason · increase · decrease · delta · balance … |
| `cafe24PointReports` | `{from}_{to}` | 그 기간 집계 + 카페24 report 합계 (회원별은 상위 300명) |

- 카페24 적립금 내역엔 고유번호가 없어 **내용으로 문서 id 를 만듭니다** — 같은 기간을 다시 돌려도 중복되지 않고 덮어씁니다.
  그래서 기간을 겹쳐서 매일 돌려도 됩니다.
- 뷰어는 고른 기간의 `cafe24Points` 를 읽어 브라우저에서 다시 집계합니다. 수집한 기간과 정확히 같으면 카페24 report 합계를,
  아니면 내역 합계를 타일에 씁니다 (상단에 "합계는 내역 기준" 표시). 한 번에 5,000건까지 읽습니다.

### 처음 설정

1. **카페24 권한** — 개발자센터 앱 권한에 **적립금 읽기(`mall.read_mileage`)** (+ 상품·주문 읽기) 추가.
2. **PC 에서 한 번 연결** — `node src/cafe24-auth.js` → 질문에 답 → 브라우저에서 동의 → 이동된 주소 붙여넣기.
3. **Firebase 보안 규칙** — 콘솔 > Firestore > 규칙에 아래 세 줄이 없으면 추가
   (이미 `match /{document=**} { allow read, write: if request.auth != null; }` 가 있으면 생략).

   ```
   match /cafe24Points/{id}       { allow read, write: if request.auth != null; }
   match /cafe24PointReports/{id} { allow read, write: if request.auth != null; }
   match /cafe24Auth/{id}         { allow read, write: if request.auth != null; }
   ```
4. **PC 에서 한 번 DB 로 올리기** — `node src/points.js --from 2026-07-01` 처럼 실행하면 매출 리포트 비밀번호 4자리를 물어봅니다
   (`.env` 의 `FIREBASE_PASSWORD=mf####` 로 저장). 이때 카페24 토큰도 Firestore `cafe24Auth/token` 에 올라가
   깃허브 자동 실행이 이어받습니다.
5. **깃허브 비밀값** — 저장소 Settings → Secrets and variables → Actions 에
   `CAFE24_CLIENT_ID`, `CAFE24_CLIENT_SECRET`, `FIREBASE_PASSWORD`(mf + 4자리) 등록.
   `.github/workflows/cafe24-points.yml` 이 매일 07:10 KST 에 최근 30일을 받아 DB 에 쌓습니다.
   Actions 탭 → "카페24 적립금 매일 수집" → Run workflow 로 기간을 지정해 바로 돌릴 수도 있습니다.

Firebase API 키는 공개용 웹 키라 `sales-report/index.html` 의 firebaseConfig 에서 자동으로 읽습니다.
카페24 refresh_token 은 쓸 때마다 바뀌므로 PC 파일과 Firestore 중 **더 최근에 발급된 쪽**을 쓰고 양쪽에 다시 저장합니다 —
PC 와 깃허브가 번갈아 돌아도 서로 토큰을 무효로 만들지 않습니다. 매일 돌면 2주 만료도 걱정 없습니다.
