# 비밀 번호 쟁탈전 — 프로젝트 컨텍스트

> 세션 간 컨텍스트 보존용. 이 폴더에서 작업을 이어갈 때 먼저 읽으세요.

## 프로젝트 개요

오프라인에서 번호가 붙은 피규어(랜덤박스 등)를 나눌 때 쓰는 **파티게임형 웹앱**입니다.
참가자들이 기기 하나를 돌려가며 원하는 번호를 **비밀리에** 고르고, 선택이 끝나면 겹친 번호를
미니게임으로 쟁탈합니다.

- 배포 위치: `invedory.com/number-battle/` (저장소 루트 `CNAME` 의 커스텀 도메인)
- 실물 피규어의 내용물은 앱이 절대 알지 못합니다. 앱은 "누가 몇 번을 가져가는가"만 정합니다.

## 기술 스택 / 컨벤션

- 순수 **HTML + CSS + Vanilla JS (ES modules)**. 번들러·프레임워크·TypeScript 없음
- 외부 의존성은 **Google Fonts(Black Han Sans, Jua)만**. 없어도 폴백 폰트로 정상 동작
- `package.json` 은 **오직 node 로 로직 테스트를 돌리기 위한 것** (`"type": "module"`). 설치할 의존성 없음
- 게임 로직(`js/engine.js`)에는 **DOM 참조가 하나도 없어야** 합니다. 그래야 node 로 테스트할 수 있습니다

## 파일 구조

```
number-battle/
├── index.html            # 셸 (topbar / #screen / #overlay-root / #confetti)
├── styles.css            # 전체 스타일 (아케이드/네온 톤)
├── js/
│   ├── app.js            # 컨트롤러: 라우팅, 액션, 진행자 드로어, 부팅/복구
│   ├── engine.js         # ★ 순수 게임 로직. 상태 전이 + 무결성 검사
│   ├── ranking.js        # 순위 결정기 (동점자 재대결 일반화)
│   ├── store.js          # localStorage 영속화 + 구독 (롤백 지원)
│   ├── screens.js        # 단계별 화면 렌더러
│   ├── ui.js             # 모달/카운트다운/토스트/색종이/공용 마크업
│   ├── util.js           # uid, shuffle, escapeHtml 등
│   └── games/
│       ├── registry.js   # 미니게임 등록소
│       ├── luckyTiming.js# 기본 1차 쟁탈전
│       └── fateCards.js  # 기본 FINAL 순위 결정전
├── tests/
│   ├── engine.test.mjs   # CASE A~H + 경계 + 무작위 400회
│   ├── harness.mjs       # DOM 없이 엔진을 끝까지 돌리는 드라이버
│   └── layout.mjs        # 여러 폭에서 가로 넘침 회귀 검사 (Playwright)
└── package.json
```

## 게임 단계 (state.phase)

```
SETUP → SECRET_SELECTION → REVEAL → (BATTLE → KEEP_PASS)* → FINAL_BATTLE → FINAL_SELECTION → RESULT
```
- 중복 그룹이 0개면 REVEAL 다음이 바로 RESULT
- 미확정자가 0명이면 FINAL 단계를 건너뜀 / 1명이면 FINAL 미니게임 없이 바로 번호 선택

## 핵심 불변식 ⚠️

N = 전체 번호, P = 참가자 수 (P ≤ N). 임의 시점에서

```
Pool(빈 번호) = (N - P) + U(미확정자) + Σ_pending (k_g - 1)
```
`k_g` 는 아직 처리 안 된 중복 그룹의 남은 인원. `k_g ≥ 2` 이므로

- 그룹에 2명 이상 남아 있으면 **빈 번호가 반드시 1개 이상** 있다 → "PASS 했는데 고를 번호가 없다"는 구조적으로 불가능
- 마지막 1명은 자동 KEEP 이라 PASS 를 묻지 않는다
- FINAL 진입 시 Pool ≥ U → 미확정자 전원이 번호를 받는다
- 게임 종료 시 남는 번호는 정확히 N - P 개

로직을 고칠 때 이 식이 깨지지 않는지 먼저 확인하세요. `engine.checkIntegrity()` 가 최종 검증을 합니다.

## 미니게임 추가하는 법

`js/games/` 에 모듈을 만들고 `registry.js` 에 등록하면 끝입니다. 동점 처리는 `ranking.js` 가
대신 해주므로 **한 라운드의 결과를 tier 배열로 돌려주기만** 하면 됩니다.

```js
export const myGame = {
  id, name, icon, tagline, howto,
  createRound(playerIds, rng) -> roundState,   // JSON 직렬화 가능해야 함 (새로고침 복구)
  isComplete(round) -> boolean,
  getTiers(round) -> [[id], [id, id], [id]],   // 순위 높은 순. 같은 배열 = 동점 → 자동 재대결
  summary(round, getName) -> { headline:{label,value}, rows:[{name,value,note}] },
  mount(el, round, api) -> cleanupFn,          // api = { getName, fast, commit, finish }
};
```

`mount` 안에서 `round` 를 직접 수정한 뒤 `api.commit()` 을 부르면 저장됩니다.
플레이가 끝나면 `api.finish()` 를 부릅니다.

후보 미니게임: 폭탄 타이머 · 슬롯머신 · 하이카드 · 랜덤박스 · 가위바위보 · 룰렛

## 테스트

```bash
node tests/engine.test.mjs      # 로직 (CASE A~H, 경계, 무작위 400회)

# 반응형 회귀 검사 — 저장소 루트에서 정적 서버를 띄운 뒤
npx http-server -p 8899 -s .
node tests/layout.mjs           # 320/360/375/390/430/768px 에서 전 화면 가로 넘침 검사
```
`layout.mjs` 는 게임을 끝까지 진행하면서 매 화면의 `scrollWidth` 를 확인하고,
`<select>` 는 "가장 긴 option 텍스트" 기준으로 별도 검사합니다(아래 iOS 항목 참고).

## 주의사항

- **비밀 유지**: 선택 종료 전에는 번호 상태를 건드리지 않습니다(`addParticipant` 는 `numbers` 를 수정하지 않음).
  진행자 드로어도 이름만 보여줍니다. localStorage 는 `NB1:` 접두사 + XOR/base64 로 가볍게 인코딩합니다(암호화 아님, 실수로 엿보기 방지용).
- **핸드오프**: 비밀 선택 중인 이름/번호는 `app.js` 의 `ui.selection` (휘발성)에만 둡니다.
  `ui.selection` 은 **통째로 재할당하지 말고** `resetSelection()` 으로 제자리 초기화하세요.
  (렌더된 화면의 이벤트 핸들러가 그 객체를 붙잡고 있어서, 교체하면 입력이 유실됩니다.)
- `store.update()` 안에서 예외가 나면 상태를 롤백합니다. 상태 변경은 반드시 이 함수를 통해서 하세요.
- **iOS WebKit 주의** (실제로 화면이 깨졌던 사례):
  - `<select>` 는 **가장 긴 `<option>` 텍스트보다 좁아지지 않습니다.** `width:100%` 를 줘도 소용없습니다.
    긴 설명을 option 에 넣으면 문서가 가로로 넘치고 브라우저가 **페이지 전체를 축소**해 버립니다.
    → option 에는 짧은 이름만 넣고 설명은 `.picker-note` 캡션으로 뺍니다. `min-width: 0` 도 함께 겁니다.
  - `select` 는 `appearance: none` 없이는 `background`/`color` 가 무시되어 다크 테마가 깨집니다.
    단, 이 선언을 `input` 전체에 걸면 **체크박스가 사라지므로** 텍스트 입력에만 한정하세요.
  - `backdrop-filter` 는 `-webkit-` 접두사가 필요합니다.
  - 새 화면·컴포넌트를 추가하면 `tests/layout.mjs` 를 꼭 돌려보세요.
