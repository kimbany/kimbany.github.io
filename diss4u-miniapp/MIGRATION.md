# 친놀송 앱인토스 미니앱 — 이식 현황

인수인계 문서(`APPS_IN_TOSS_HANDOFF.md`)의 5번 함정을 먼저 코드로 확인하고,
1~3단계 골격을 세운 결과다.

---

## 1. 5번 함정 검증 결과

| # | 문서 주장 | 실제 코드 확인 |
|---|---|---|
| 5-1 | 인스타 영상 기능 미검증 | ✅ 사실. `index.html:3629-3790` 에 `canvas.captureStream(30)` + `createMediaStreamDestination()` + `MediaRecorder`. **실기기 확인 전까지 이식 보류** |
| 5-2 | 비속어 필터 약함 | ✅ 사실. `maskProfanity` 는 정규식 2개 + 16단어. → 재작성함 |
| 5-3 | 외부 이탈 금지 | 대체로 양호했으나 **제거 대상 3종 발견**: 쿠팡 파트너스 배너 2곳, 하단 인스타/틱톡/유튜브 계정 링크, AdSense |
| 5-4 | 결제·광고 시 음악 일시정지 | ⚠️ **실제 누락**. `showScreen()` 은 결과화면 이탈 시만 정지(`:2683`). `chargeModal` 은 결과화면에 머문 채 열려서(`:1600`) 노래가 계속 재생됨 |
| 5-5 | eval·히스토리 조작 금지 | `eval` 없음(양호). `history.pushState` 는 화면전환에 사용 중(`:2705`) |
| 5-6 | 약관 불일치 | ✅ 사실. 제13조 "신용카드 단건", 제14조 "환불은 신용카드로만". `privacy.html` 에 국외이전 조항 **없음** |
| 5-7 | 수수료 79.5% | 코드 무관 · 정책 |

### 인수인계 문서에서 바로잡을 것

1. **운영 프록시 위치.** 문서는 "운영본은 `kimbany.github.io` 의 `proxy/`" 라고 했지만,
   그쪽은 **24KB 옛 사본**이다. 정본은 `diss4u/proxy/server.js`(165KB).

2. **이미지 5.4MB → 실제 4.83MB, 그중 쓰는 건 2개뿐.**
   `index.html` 이 참조하는 이미지는 `logo1.png`(36KB), `simple.png`(1.03MB) 둘뿐이고
   나머지 3.8MB(`logo.png` 1.7MB, `mascot.png` 640KB, `wordmark.png` 707KB 등)는
   어디서도 참조되지 않는다. 번들 문제는 문서가 걱정한 것보다 훨씬 작다.

3. **라이트 모드는 강제 사항이다.** 체크리스트 원문:
   `"미니앱 테마는 라이트 모드로 구현돼 있어요."`
   현재 앱은 `--bg:#0d0d10` 전면 다크라 **테마를 통째로 뒤집어야 한다**(이번에 함).

4. **히스토리 규칙은 문서보다 좁다.** 체크리스트 원문은
   `"브라우저 히스토리를 조작해서 자사 사이트로 이동시키는 방식은 사용할 수 없어요."`
   내부 화면전환용 `pushState` 자체는 금지 대상이 아니다. (그래도 이번 이식에서는
   웹뷰 뒤로가기와 얽히지 않도록 내부 스택으로 바꿨다.)

5. **비속어 조항의 사정거리.** 원문은 `"미니앱 문구에 비속어…"` 로 **UI 문구**를 겨냥한다.
   생성 가사는 이 조항이 아니라 일반 콘텐츠 정책으로 걸린다. 둘 다 대비했다.

6. **SDK deprecated 3건.** 인수인계 문서가 권한 API 중 셋이 3.0.2 에서 deprecated 다.
   - `appLogin()` → `TossAuth.login()`
   - `getTossShareLink()` → `Share.createLink({ path, ogImageUrl })`
   - `saveBase64Data()` → `File.saveBase64()`

7. **`Share.sendMessage` 는 `{ message: string }` 만 받는다.** 인스타·틱톡·유튜브를
   개별로 겨냥하는 API 는 없다. 네이티브 공유 시트에서 사용자가 앱을 고르는 방식뿐이다.

8. **영상 대안이 이미 절반 있다.** 서버에 `ffmpeg-static` 이 이미 붙어 있고
   `POST /transcode-video`(`server.js:3200`)가 돌고 있다. 5-1 이 실패해도 문서가 말한
   "서버 렌더링 개발 2~3주"보다는 짧다.

---

## 2. 만든 것

```
diss4u-miniapp/
├─ apps-in-toss.config.ts    appName='diss4u' (콘솔 등록값, 변경 불가)
├─ index.html                셸. 확대축소 비활성 · color-scheme:light 고정
├─ src/
│  ├─ main.js                진입점. safe-area → 화면 등록 → 인증 구독
│  ├─ config.js              프록시 URL · Firebase · SKU · 광고그룹 ID
│  ├─ state.js               화면 간 공유 상태
│  ├─ data.js                장르·목소리·관계 선택지 (원본 값 그대로)
│  ├─ styles/                theme(라이트) · base · components
│  ├─ lib/
│  │  ├─ audio.js            ★ 전역 오디오 + 결제·광고용 suspend 게이트
│  │  ├─ nav.js              ★ 화면 스택 (history 미사용)
│  │  ├─ auth.js             TossAuth.login → /toss/login → signInWithCustomToken
│  │  ├─ iap.js              결제 + 미지급 주문 복구
│  │  ├─ ads.js              전면광고 (사전로딩 · 오디오 연동)
│  │  ├─ share.js            Share.createLink / sendMessage
│  │  ├─ files.js            File.saveBase64 (MP3 저장)
│  │  ├─ storage.js          Storage API (localStorage 폴백)
│  │  ├─ deeplink.js         진입 URL 파싱 (초대 ref · 공유 곡 id)
│  │  ├─ api.js              Render 프록시 클라이언트
│  │  ├─ songs.js            Firestore (스키마 무변경)
│  │  └─ firebase.js
│  ├─ screens/               input · loading · result · mylist
│  │                         legal · settings · credits · invite
│  ├─ ui/                    dom · toast · modal
│  │                         charge(결제) · coupon(쿠폰) · withdraw(탈퇴)
│  └─ legal/docs.js          미니앱용 약관·방침 (교정본)
├─ server-patch/             proxy/server.js 에 드롭인
│  ├─ toss-auth.js           POST /toss/login
│  ├─ toss-iap.js            POST /toss/iap/verify (mTLS)
│  ├─ profanity.js           비속어 필터 재작성
│  └─ README.md              붙이는 방법 · 환경변수
└─ test/
   ├─ profanity.test.js     비속어 45개 케이스
   └─ toss-decrypt.test.js  복호화 왕복·변조검출
```

빌드 결과: **`diss4u.ait` 143KB** (dist 448KB, JS gzip 133KB — 대부분 Firebase).
100MB 제한에 한참 못 미친다.

### 함정별 대응

- **5-2** `server-patch/profanity.js` — 자모 분해 평면에서 매칭한다.
  `씨 발` `씨-발` `시1발` `씨이발` `ㅅㅂ` `ㅄ` `ㅈㄴ` `ＦＵＣＫ` 를 잡는다.
  오탐 방지가 절반인데, `늦잠`·`봅시다`·`사방`·`십분`·`굽신` 같은 게 실제로 걸렸었다.
  → 모음 없는 매칭(초성 약어)은 **원문에서도 낱자였을 때만** 인정하도록 했다.
- **5-3** 쿠팡 배너·SNS 계정 링크·AdSense·외부 약관 링크 전부 뺐다.
  약관·방침·환불정책은 `screens/legal.js` 로 **앱 안에서** 본다.
- **5-4** `lib/audio.js` 의 `suspend()` 로 결제·광고 구간을 감쌌다.
  참조 카운트라 광고 위에 결제가 겹쳐도 어긋나지 않고, 구간 진입 시
  재생 중이었을 때만 복귀 재생한다.
- **5-5** `history` 대신 `lib/nav.js` 내부 스택. 확대축소는 viewport meta +
  `touch-action`(iOS 는 meta 를 무시한다). 라이트 모드 고정.
- **5-6** `src/legal/docs.js` 에서 제13·14조와 환불정책 3항을 인앱결제 기준으로 고치고,
  개인정보처리방침에 **국외 이전(8항)을 신설**했다.

---

## 3. 남은 일

### 최우선 — 실기기 확인이 있어야 진행 가능

- [ ] **진단 미니앱을 샌드박스에서 실행** → 영상 생성 가부 확정 (5-1)
  - 되면 `src/screens/video.js` 추가 후 결과 화면에 버튼만 연결
  - 안 되면 서버 렌더링. `/transcode-video` 가 이미 있어 착수점이 있다
- [x] ~~`TOSS_LOGIN_DECRYPT_AAD` 실제 값 확인~~ → **`TOSS`** 로 확인됨.
      복호화 키 발급 메일에 함께 온다. 상수라 코드 기본값으로 박았고,
      구현은 왕복 테스트로 검증했다(`test/toss-decrypt.test.js`)
- [ ] 토큰 발급 API 의 client id/secret **헤더 이름** 대조 —
      여기가 틀리면 토큰 교환에서 401 이 난다

### 콘솔 작업

- [ ] 인앱 상품 3개 등록 → `src/config.js` 의 `CREDIT_PACKS.sku` 를 실제 값으로
- [ ] mTLS 인증서 발급 → Render 환경변수
- [ ] 광고 지면 생성 → `src/config.js` 의 `AD_GROUP_ID`
      (비어 있으면 광고 기능은 꺼진 채로 정상 동작한다)
- [ ] 아이콘·스플래시

### 서버

- [ ] `server-patch/` 3개 파일을 `diss4u/proxy/` 로 복사하고 README 대로 연결
- [ ] 기존 `maskProfanity`/`maskResult` 정의 삭제(이름 충돌)

### 아직 이식 안 한 화면·기능

원본에 있고 미니앱에 아직 없는 것들이다.

- [x] ~~크레딧 사용내역~~ → `screens/credits.js` (무료/충전 풀 분리 표시)
- [x] ~~추천인 코드 / 친구 초대~~ → `screens/invite.js`
      웹의 `diss4u.com/?ref=CODE` 를 `Share.createLink` 의 `intoss://diss4u?ref=CODE` 로 바꿨다.
      진입 URL 파싱은 `lib/deeplink.js`(`Environment.initialURL`), 귀속은 로그인 직후 자동.
      토스 연락처 초대(`Promotion.openContactsInvite`)는 콘솔 공유 리워드 moduleId 가
      있어야 해서 아직 안 붙였다 — 지금은 일반 공유 시트로 동작한다.
- [x] ~~회원 탈퇴~~ → `ui/withdraw.js` (소멸 크레딧 명시 + 동의 체크 + 탈퇴 후 로그아웃)
- [x] ~~쿠폰 등록~~ → `ui/coupon.js` (서버와 같은 `[A-Z2-9-]` 문자셋으로 입력 정규화)
- [x] ~~설정 화면~~ → `screens/settings.js`
      웹은 `settingsModal` 하나에 다 넣었는데, 바텀시트 안에서 또 바텀시트를 열면
      뒤로가기가 꼬여서 화면으로 뺐다. 웹에 있던 워커 URL 직접 입력 칸은 뺐다.
- [ ] 곡 신고 (`/report-song`) — API 래퍼(`api.reportSong`)는 있고 UI 만 없다
- [ ] 충전 포인트 소멸 임박 안내 (`expiringSoon`)
- [ ] 공유 듣기 페이지(`share.html`) 대응 — `lib/deeplink.js` 의 `songId()` 는 준비됐고,
      진입 시 해당 곡 화면으로 보내는 라우팅만 남았다
- [ ] 가사 싱크(`timestampedLyrics`) — 저장은 하고 있으나 표시 안 함
- [ ] 클립보드 권한 — `Clipboard.setText` 가 권한을 요구하면 `permissions` 에 추가해야 한다.
      지금은 실패 시 `navigator.clipboard` 로 떨어지게 해뒀다

### 가격 정책 (5-7)

`src/config.js` 의 팩은 **웹과 같은 값**으로 맞춰뒀다. 웹 실물은
`proxy/server.js:45` 의 `CREDIT_PACKS` 이고, 프론트는 `/packs` 로 받아 쓴다.

| 팩 | 결제액 | 곡당 단가 |
|---|---|---|
| 1곡 | ₩1,000 | 1,000원 |
| 6곡 (5+1) | ₩4,900 | 817원 |
| 12곡 (10+2) | ₩8,900 | 742원 |

> 인수인계 문서에 적힌 `₩990 단건`, `₩9,900=15곡` 은 실제 값이 아니다.
> 실물은 위 표대로다. 사다리(단가가 내려가는 구조)는 이미 정상이라 손댈 게 없었다.

문제는 가격이 아니라 **정산율**이다. 웹은 PortOne 영세라 99%를 받는데
앱인토스는 iOS 79.5% / Android 80.9% 다(공식 문서 예시: ₩11,000 → ₩8,745 / ₩8,895).
수수료 구조는 앱마켓 15% + 토스 5% + 각각의 부가세.

곡당 변동원가 170원 기준 순이익(iOS):

| 팩 | 웹 | 미니앱 | 30% 인상 시 |
|---|---|---|---|
| 1곡 | 820원 | **625원** | 475원 |
| 6곡 | 3,831원 | **2,876원** | 2,141원 |
| 12곡 | 6,771원 | **5,036원** | 3,701원 |

같은 값에 팔면 팩당 순이익이 24~26% 줄어든다. 손익분기(고정비 11,000원/월,
6곡팩 기준)는 웹 3팩 → 미니앱 4팩 → 앱마켓 30% 시 6팩.

공식 문서에 `"총 수익이 늘어나면 30%로 변경될 수 있어요"` 라고 명시돼 있다.

- [ ] **미니앱 가격을 웹보다 올릴지 결정** — 안 올리면 위 감소를 그대로 감수하는 것

### 심사 전 점검

- [ ] UI 문구에서 '디스', '욕', '까기' 잔재 확인 (현재 코드에는 없다)
- [ ] 약관·방침 **법률 검토** — 특히 국외이전 항목의 수탁자·보유기간을 실제 계약과 대조
- [ ] 체크리스트 70여 항목 자체 점검
- [ ] 콘솔 업로드 → 실기기 테스트(1회 이상 필수) → 검토 요청(영업일 최대 3일)

---

## 4. 개발

```bash
cd diss4u-miniapp
npm install
npm run dev      # 브라우저 미리보기 (토스 SDK 는 폴백 동작)
npm run build    # vite build + ait build → diss4u.ait
npm test         # 비속어 필터 테스트
npm run deploy   # 콘솔 업로드
```

브라우저에서 열면 토스 브리지가 없어 로그인·결제·광고는 동작하지 않는다.
`lib/env.js` 가 이를 감지하고, 각 모듈은 조용히 비활성으로 떨어진다.
결제·광고 확인은 반드시 샌드박스 앱이나 토스 앱에서 해야 한다.
