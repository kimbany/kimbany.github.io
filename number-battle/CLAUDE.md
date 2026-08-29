# 파티 박스 — 프로젝트 컨텍스트

> 세션 간 컨텍스트 보존용. 이 폴더에서 작업을 이어갈 때 먼저 읽으세요.

## 프로젝트 개요

오프라인에서 번호가 붙은 피규어(랜덤박스 등)를 나눌 때 쓰는 **파티게임형 웹앱**입니다.
대메뉴가 두 개이고, 홈에서 골라 들어갑니다.

- **🎯 번호 쟁탈전** — 원하는 번호를 비밀리에 고르고, 겹치면 미니게임으로 쟁탈
- **🎰 가챠 뽑기** — 캡슐을 돌려 숫자를 하나씩. 중복 없이 균등 확률

- 배포 위치: `invedory.com/number-battle/` (저장소 루트 `CNAME` 의 커스텀 도메인)
  - 폴더 이름은 쟁탈전만 있던 시절의 흔적입니다. 사용자가 쓰던 링크를 깨지 않으려고 그대로 둡니다.
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
├── styles.css            # 전체 스타일 (아케이드/네온 톤 + 가챠 기계)
├── js/
│   ├── main.js           # ★ 셸 + 라우터. 대메뉴를 mount/unmount 로 갈아끼운다
│   ├── home.js           # 홈 대메뉴 화면
│   ├── store.js          # localStorage 영속화 + 구독 (키 주입식, 롤백 지원)
│   ├── ui.js             # 모달/카운트다운/토스트/색종이/공용 마크업
│   ├── util.js           # uid, shuffle, escapeHtml 등
│   │
│   ├── app.js            # [번호 쟁탈전] 컨트롤러 · 진행자 드로어 · mount/unmount
│   ├── engine.js         # [번호 쟁탈전] ★ 순수 로직. 상태 전이 + 무결성 검사
│   ├── ranking.js        # [번호 쟁탈전] 순위 결정기 (동점자 재대결 일반화)
│   ├── screens.js        # [번호 쟁탈전] 단계별 화면 렌더러
│   ├── games/
│   │   ├── registry.js   # 미니게임 등록소
│   │   ├── luckyTiming.js# 기본 1차 쟁탈전
│   │   └── fateCards.js  # 기본 FINAL 순위 결정전
│   └── gacha/
│       ├── engine.js     # [가챠] ★ 순수 로직. 비복원 균등 추출 + 무결성 검사
│       └── app.js        # [가챠] 화면 · 기계 연출 · 진행자 드로어 · mount/unmount
├── tests/
│   ├── engine.test.mjs   # 쟁탈전: CASE A~H + 경계 + 무작위 400회
│   ├── gacha.test.mjs    # 가챠: 중복 없음 + 확률 균등(χ²) + 복구
│   ├── harness.mjs       # DOM 없이 엔진을 끝까지 돌리는 드라이버 (+ seededRng)
│   └── layout.mjs        # 여러 폭에서 가로 넘침 회귀 검사 (Playwright)
└── package.json
```

## 대메뉴 구조 (main.js)

각 대메뉴는 `mount(shell)` / `unmount()` 를 export 하는 모듈이고, **동시에 하나만** 떠 있습니다.
`shell` 은 `{ root, setChip(text, live), setHostMenu(handler|null) }` 입니다.

- 현재 위치는 주소 해시(`#battle`, `#gacha`)로 유지 → 새로고침·뒤로가기가 자연스럽게 동작
- 홈에는 각 메뉴의 진행 상황이 표시됩니다 (`battleStatusLine()` / `gachaStatusLine()`)
- 두 메뉴는 **localStorage 키가 다릅니다** (`numberBattle.state.v1` / `numberBattle.gacha.v1`).
  서로 영향 없이 각자 저장/복구됩니다.
- 대메뉴를 하나 더 붙이려면: 모듈에 `mount`/`unmount`/상태줄 함수를 만들고 `main.js` 의 `MENUS` 에 추가.

## [번호 쟁탈전] 게임 단계 (state.phase)

```
SETUP → SECRET_SELECTION → REVEAL → (BATTLE → KEEP_PASS)* → FINAL_BATTLE → FINAL_SELECTION → RESULT
```
- 중복 그룹이 0개면 REVEAL 다음이 바로 RESULT
- 미확정자가 0명이면 FINAL 단계를 건너뜀 / 1명이면 FINAL 미니게임 없이 바로 번호 선택

## [번호 쟁탈전] 핵심 불변식 ⚠️

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

## [번호 쟁탈전] 미니게임 추가하는 법

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

## [가챠] 확률 설계 ⚠️

```js
const index = Math.floor(rng() * state.remaining.length);
const [number] = state.remaining.splice(index, 1);
```

- **비복원 추출**: 뽑은 숫자를 `remaining` 에서 빼므로 중복이 원천적으로 불가능
- **균등**: 매번 남은 것 전체에서 균등하게 고르므로 모든 배출 순서가 같은 확률.
  따라서 "숫자 X 가 k번째로 나올 확률" 도 전부 동일하다. (`gacha.test.mjs` 에서 χ² 로 검증)
- **`remaining` 을 미리 섞어두지 않는다.** 섞어서 저장하면 localStorage 를 열어
  다음에 나올 순서를 볼 수 있다. 항상 정렬 상태로만 저장한다.
- 상태를 바꾸는 함수마다 `assertGachaIntegrity()` 로 검사한다
  (중복 배출 / 총합 불일치 / 순번 어긋남).

## 테스트

```bash
node tests/engine.test.mjs      # 쟁탈전 로직 (CASE A~H, 경계, 무작위 400회)
node tests/gacha.test.mjs       # 가챠 로직 (중복 없음, 확률 균등 χ², 복구)
npm test                        # 위 둘 다

# 반응형 회귀 검사 — 저장소 루트에서 정적 서버를 띄운 뒤
npx http-server -p 8899 -s .
node tests/layout.mjs           # 320/360/375/390/430/768px 에서 전 화면 가로 넘침 검사
```
`layout.mjs` 는 홈 → 가챠 → 쟁탈전을 끝까지 진행하면서 매 화면의 `scrollWidth` 를 확인하고,
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
- **애니메이션 오버플로**: `transform: scale()/rotate()` 는 `getBoundingClientRect` 에 반영되어
  가로 스크롤을 만들 수 있습니다. 블록 요소를 확대하면 컨테이너 폭 전체가 커지므로
  `display: inline-block` 으로 콘텐츠 폭만 차지하게 하세요.
  절대배치 요소를 움직일 때는 **회전으로 커지는 바운딩 박스(약 17px)까지** 여유를 잡아야
  이웃 텍스트를 덮지 않습니다 (`.capsule-open` 참고).
- **위치 흩뿌리기**: `(i * a) % m` 로 좌표를 만들 때 `a` 와 `m` 이 서로소가 아니면 주기가 짧아
  같은 자리에 겹칩니다. (`(i*37)%74` 는 주기가 2였습니다)
