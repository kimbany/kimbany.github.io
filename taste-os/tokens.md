# Taste OS — Design Tokens & Visual Language

> 토큰은 *결정의 단위* 입니다.
> 잘 만들어진 토큰 시스템은 *디자이너가 더 빠르게 일하게* 하지 않아요. *덜 잘못된 결정* 을 하게 합니다.

이 문서는 Taste OS 의 전체 시각 시스템을 *Tailwind 설정으로 직접 옮길 수 있는* 토큰으로 구체화합니다. `system.md` (개념), `motion.md` (모션), `voice.md` (한국어 보이스) 를 한 곳에서 *코드로 변환* 한 문서예요.

함께 읽기: `system.md` (디자인 시스템 개념), `motion.md` (모션 시스템), `landing-v2.md` (이번 토큰의 캐노니컬 팔레트가 정착된 곳).

---

## 목차

0. [철학 — 결정의 단위로서의 토큰](#0-철학--결정의-단위로서의-토큰)
1. [토큰 아키텍처 — 3층 구조](#1-토큰-아키텍처--3층-구조)
2. [Color — 따뜻한 어둠](#2-color--따뜻한-어둠)
3. [Typography — 세 가지 목소리](#3-typography--세-가지-목소리)
4. [Spacing — 호흡이 토큰이다](#4-spacing--호흡이-토큰이다)
5. [Surface — 표면의 결](#5-surface--표면의-결)
6. [Shadow & Glow — 따뜻한 깊이](#6-shadow--glow--따뜻한-깊이)
7. [Border & Radius — 절제된 가장자리](#7-border--radius--절제된-가장자리)
8. [Grain & Texture — 영화의 결](#8-grain--texture--영화의-결)
9. [Motion — 호흡 토큰](#9-motion--호흡-토큰)
10. [Component 토큰](#10-component-토큰)
11. [Dark Mode 철학](#11-dark-mode-철학)
12. [반응형 토큰](#12-반응형-토큰)
13. [완성된 Tailwind 설정](#13-완성된-tailwind-설정)
14. [CSS 변수 전체](#14-css-변수-전체)
15. [토큰이 *없는* 것들](#15-토큰이-없는-것들)

---

## 0. 철학 — 결정의 단위로서의 토큰

대부분의 디자인 시스템은 *재사용* 을 위해 토큰을 만들어요. Taste OS 의 토큰은 *재사용* 이 아니라 *방어* 를 위해 존재합니다.

- 디자이너가 `gray-500` 을 *임의로* 쓰지 *못하게*
- 엔지니어가 `border-radius: 8px` 를 *무심코* 쓰지 *못하게*
- 누군가가 `box-shadow: 0 4px 12px rgba(0,0,0,0.2)` 같은 *흔한 그림자* 를 추가하지 *못하게*

토큰은 *허용된 결정의 목록* 이에요. 목록에 없는 값을 쓰려면 *추가 이유* 가 필요하고, 추가는 *명시적인 논의* 를 거쳐야 해요. 이 규율이 *시각적 일관성* 보다 더 중요한 *시각적 정체성* 을 만듭니다.

### 한 줄 약속

> ***토큰 밖의 값을 쓰지 않는다.***

이 약속을 어기는 가장 흔한 핑계 — *"이번만 예외로"* — 는 모든 디자인 시스템을 죽인 핑계예요. Taste OS 의 토큰은 *예외 없이* 작동합니다. 예외가 필요한 결정은 *토큰을 늘리는* 결정이지 *임시 우회* 가 아니에요.

---

## 1. 토큰 아키텍처 — 3층 구조

```
                                                                  
  PRIMITIVE        — raw 값. 색은 hex, 시간은 초, 공간은 px       
  ─────────                                                       
   c-night         #0E0C0B                                        
   c-rose          #B07672                                        
   s-4             16px                                           
   t-base          0.6s                                           
                                                                  
       ▼                                                          
                                                                  
  SEMANTIC         — 명명된 사용처. 어디서 쓰일지가 이름에         
  ─────────                                                       
   --surface-bg              = var(--c-night)                     
   --text-primary            = var(--c-beige)                     
   --accent                  = var(--c-rose)                      
   --space-section           = 96px                               
   --duration-breath-in      = 0.9s                               
                                                                  
       ▼                                                          
                                                                  
  COMPONENT        — 개별 컴포넌트가 가진 토큰                     
  ─────────                                                       
   --beacon-border           = rgba(244,241,234,0.18)             
   --beacon-pulse-color      = var(--c-ember)                     
   --plate-bg                = var(--surface-1)                   
   --plate-padding           = var(--s-6)                         
                                                                  
```

### 규칙

- **컴포넌트 토큰은 primitive 를 *직접* 참조하지 *않습니다*.** 항상 semantic 을 거침.
- **semantic 은 *컴포넌트별 의견* 을 갖지 *않습니다*.** `--text-primary` 는 *모든* 본문에 쓰일 색이지, "버튼 안의 텍스트 색" 이 아님.
- **새 색이 필요하면 primitive 에 추가, *그 다음* semantic 에 노출.** 컴포넌트가 raw color 를 *바로* 가져가는 경우 없음.

---

## 2. Color — 따뜻한 어둠

### Primitive Colors

`landing-v2.md` 에서 정착된 *따뜻한 어둠* 팔레트가 캐노니컬입니다. 이전 `system.md` 의 `void` / `ink` 도 함께 유지하되 *기본은 따뜻한 톤*.

```ts
// tokens/colors.ts

export const primitive = {
  // === 어둠 (Dark) — 모두 미세하게 warm-tinted ===
  night:        '#0E0C0B',   // 주 배경. soft black + warm cast
  coal:         '#1A1714',   // surface 1. warm charcoal
  ash:          '#2A2622',   // surface 2. lifted charcoal
  bone:         '#443E37',   // hairlines, dividers, sparse text
  void:         '#0A0A0B',   // pure-cool dark (rare use, for high-drama only)
  ink:          '#111114',   // cool surface 1 (paired with void)
  umbra:        '#1A1A1E',   // cool surface 2

  // === 텍스트 (Text) ===
  mist:         '#9A8E81',   // warm secondary text
  sand:         '#C8B69B',   // mid-bright neutral
  beige:        '#D8C7AC',   // primary text — dusty beige
  pearl:        '#F4F1EA',   // pure-cool ivory (paired with void/ink)

  // === 액센트 (Accent) — rationed ===
  rose:         '#B07672',   // primary warm accent — dim dusty rose
  roseDeep:     '#8A5552',   // shadow tint of rose
  silverBlue:   '#8FA0AC',   // secondary cool accent — muted
  ember:        '#D9A66C',   // warm amber (older palette, used in landing v1)
  vermilion:    '#B2483D',   // reserved — Mirror flame moments
  seafoam:      '#7FA39A',   // reserved — quiet teal
  phosphor:     '#8FB3D4',   // reserved — Drift annotations, cool sci-fi
  peat:         '#6B5B47',   // wet earth, autumn ground
};
```

### Semantic Colors

```ts
// tokens/colors.semantic.ts

export const semantic = {
  // === 표면 (Surface) ===
  'surface-bg':      'var(--c-night)',
  'surface-1':       'var(--c-coal)',
  'surface-2':       'var(--c-ash)',
  'surface-3':       'var(--c-bone)',
  'surface-glass':   'rgba(26, 23, 20, 0.72)',  // ink at 72% for atmospheric glass

  // === 텍스트 (Text) ===
  'text-primary':    'var(--c-beige)',
  'text-secondary':  'var(--c-mist)',
  'text-quiet':      'rgba(154, 142, 129, 0.55)',   // mist at 55% — for footers, dates
  'text-display':    'var(--c-beige)',

  // === 라인 (Hairlines) ===
  'hairline':        'var(--c-bone)',
  'hairline-faint':  'rgba(68, 62, 55, 0.4)',

  // === 액센트 (Accent) ===
  accent:            'var(--c-rose)',          // primary
  'accent-cool':     'var(--c-silver-blue)',   // secondary

  // === 예약된 색 (Reserved) — 화면당 단 하나 ===
  'reveal-flame':    'var(--c-vermilion)',     // Mirror reveal moments
  'cool-thread':     'var(--c-phosphor)',      // Drift line annotations
  'ground':          'var(--c-peat)',          // earth tones

  // === 선택 (Selection) ===
  selection:         'rgba(176, 118, 114, 0.40)',
  'focus-ring':      'rgba(176, 118, 114, 0.55)',
};
```

### 색 사용 규칙 — *Rationing*

```
화면당 액센트 — 최대 한 가지가 *full strength*
                다른 모든 액센트는 ≤ 6% 의 tint 만

본문 — 항상 var(--text-primary). 예외 없음.
보조 — 항상 var(--text-secondary).
숫자 — 모노 색은 var(--c-mist) 의 55%.
```

### 액센트 *배급* 표

| 표면 | 주 액센트 | 보조 액센트 (≤ 6%) |
|---|---|---|
| Field (집) | none (pure night) | none |
| Genome (풍경) | rose | silver-blue 5% |
| Drift (변해온 결) | rose (warming) | silver-blue (early-year) |
| Atmosphere | silver-blue | rose 4% |
| Universe | seafoam | rose 3% |
| Mirror | vermilion | rose 5% |
| Sharing | rose | silver-blue 4% |

### 의미 색 (Semantic) — 절대 *없음*

```ts
// NEVER add these:
const FORBIDDEN_TOKENS = {
  success: '#00C853',  // ❌
  warning: '#FFB300',  // ❌
  error:   '#D32F2F',  // ❌
  info:    '#2196F3',  // ❌
};
```

이유 (`system.md` §9):
- Taste OS 에는 *경고할 것* 이 없음
- *축하할 것* 이 없음
- *에러* 가 발생해도 *문장* 으로 표현 (per `system.md` §14)

상태가 필요한 자리는 다음으로:
- 활성 / 비활성 → `opacity` 차이
- "이미 간직했어요" → `accent` 의 *약한* 채움
- 비활성화된 버튼 → 0.22 opacity

색은 *의미* 가 아니라 *분위기* 입니다.

---

## 3. Typography — 세 가지 목소리

세 패밀리, 영원히. *총 셋*. 블랙프라이데이에도 네 번째는 추가하지 않습니다.

### Font Stack

```ts
// tokens/typography.ts

export const fonts = {
  display: '"Cormorant Garamond", "Noto Serif KR", serif',
  text:    '"Inter", "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
};

// === Weights ===
export const weights = {
  display: [300, 400] as const,
  text:    [350, 400, 500] as const,
  mono:    [300] as const,
};
```

### Display Scale (serif, 시적 모먼트)

```ts
export const displayScale = {
  xl: {
    size: '120px',
    lineHeight: '0.83',
    letterSpacing: '-0.02em',
    use: 'Taste Name (의도된 한 화면당 한 번만)',
  },
  lg: {
    size: '72px',
    lineHeight: '1.0',
    letterSpacing: '-0.018em',
    use: 'Hero headlines',
  },
  md: {
    size: '52px',
    lineHeight: '1.15',
    letterSpacing: '-0.005em',
    use: 'Section openings, Mirror line',
  },
  sm: {
    size: '36px',
    lineHeight: '1.22',
    letterSpacing: '0',
    use: 'Sub headlines, atmosphere phrases',
  },
};
```

**모바일** (≤ 768px) — `clamp()` 으로 자동 축소:

```css
--display-xl: clamp(48px, 14vw, 120px);
--display-lg: clamp(36px, 8vw,  72px);
--display-md: clamp(28px, 5vw,  52px);
--display-sm: clamp(22px, 4vw,  36px);
```

### Text Scale (sans, 본문)

```ts
export const textScale = {
  lg: {
    size: '18px',
    lineHeight: '1.67',
    letterSpacing: '0.005em',
    use: '주요 단락 (Portrait, Reflection)',
  },
  md: {
    size: '15px',
    lineHeight: '1.73',
    letterSpacing: '0.01em',
    use: '기본 본문',
  },
  sm: {
    size: '13px',
    lineHeight: '1.69',
    letterSpacing: '0.02em',
    use: '캡션, 보조 설명',
  },
  xs: {
    size: '11px',
    lineHeight: '1.64',
    letterSpacing: '0.04em',
    use: '메타데이터, hint, footer',
  },
};
```

### Numeral Scale (mono, 메타데이터)

```ts
export const numeralScale = {
  md: {
    size: '13px',
    lineHeight: '1.23',
    letterSpacing: '0.06em',
    use: '시간, 인덱스, 축 판독',
  },
  sm: {
    size: '11px',
    lineHeight: '1.27',
    letterSpacing: '0.08em',
    use: '날짜, 작은 라벨, 카드 메타',
  },
};
```

### Italics — 예약됨

이탤릭은 *세 곳에만*:
- Mirror line
- 인용 (한 단락당 최대 하나)
- 시간선 표시 (e.g. *"늦은 오후"*)

`<em>` 도 같은 규칙. *볼드* 는 본문 안에서 *전혀* 사용 안 함.

### 한국어 처리

- **본문**: Inter + Pretendard fallback. 한글이 *조금 더 가벼운 톤* 으로 렌더링되도록.
- **디스플레이**: Cormorant Garamond + Noto Serif KR fallback. Cormorant 는 한글 없음 → Noto Serif KR Light 로.
- **줄 간격**: 한국어가 영문보다 *더 호흡* 이 필요. 본문 line-height 1.78 (영문 1.65 보다 큼).

```css
:lang(ko) {
  line-height: 1.78;
}

:lang(en) {
  line-height: 1.65;
}
```

### 활자 규율 — 다섯 가지

1. **문장체 일관.** ALL-CAPS 0개. Title Case 0개. `text-transform` 사용 *금지*.
2. **이탤릭 절제.** 위 세 자리만.
3. **본문 안 볼드 없음.** 강조는 *줄 바꿈* / *이탤릭* / *침묵*.
4. **숫자는 tabular.** `font-variant-numeric: tabular-nums slashed-zero;` body 에 항상.
5. **Pearl, never white.** 기본 텍스트 색은 `beige`. 순백 (`#FFFFFF`) 은 *진검정 위에서 인쇄 사고* 가 됩니다.

---

## 4. Spacing — 호흡이 토큰이다

두 개의 평행 척도. *리듬* (proximity) 과 *호흡* (narrative).

### Rhythmic Scale — 가까움

연관된 요소 사이의 거리. 4px 의 배수.

```ts
export const rhythmic = {
  's-1': '4px',
  's-2': '8px',
  's-3': '12px',
  's-4': '16px',
  's-5': '24px',
  's-6': '32px',
};
```

`s-6` 이 *최대*. 그 이상의 거리는 *호흡* 으로 전환해야 함.

### Narrative Scale — 호흡

섹션 사이의 거리. Fibonacci 인접 수치 — *둥근 수가 아닌* 의도된 비대칭.

```ts
export const breath = {
  'br-1': '64px',
  'br-2': '112px',
  'br-3': '176px',
  'br-4': '240px',
  'br-5': '320px',         // landing hero용
};
```

### 사용 규칙

```
- 라벨 ↔ 첫 콘텐츠           --br-1 (64px)
- 섹션 안 두 단락 사이        --s-5 (24px)
- 섹션 ↔ 섹션 (페이지 안)     --br-2 (112px)
- 페이지 진입 상단 padding    --br-3 (176px)
- Mirror line 좌우 padding   --br-3 (176px)
```

### 1/3 빈 공간 약속

```
모든 페이지의 *최소* 1/3 공간은 콘텐츠가 *없어야* 함.
QA 가 자동 검사: 모든 production 페이지의 빈 픽셀 ≥ 33%.
```

### Layout 토큰

```ts
export const layout = {
  'stage-max':       '1280px',   // hard cap, even 6K display 에서도
  'col-text':        '640px',    // prose 컬럼
  'col-visual':      '1080px',   // image-led 표면
  'rail-width':      '56px',     // 좌측 nav (Tuner)
  'margin-top-pocket': '96px',
  'margin-top-desk':   '128px',
  'margin-top-studio': '160px',
};
```

---

## 5. Surface — 표면의 결

Taste OS 의 표면은 세 z-축 평면만 가집니다 (`system.md` §4).

### Z 평면

```
z-0   Background       — void/night 자체
z-1   Surface          — coal, plates, cards
z-10  Light            — Sigil, Beacon, accents
```

`box-shadow` 기반 깊이는 *피함*. 깊이는 *색 온도 차이* 로 전달.

### Surface 토큰

```ts
export const surfaces = {
  // === 기본 표면 ===
  'bg':              'var(--c-night)',
  'surface-1':       'var(--c-coal)',
  'surface-2':       'var(--c-ash)',
  'surface-3':       'var(--c-bone)',

  // === 표면 tints (per-section 0.6% 그라데이션) ===
  'tint-genome':     'rgba(217, 166, 108, 0.06)',   // ember 6%
  'tint-drift':      'rgba(143, 179, 212, 0.04)',   // phosphor 4%
  'tint-atmosphere': 'rgba(244, 241, 234, 0.03)',   // pearl 3%
  'tint-universe':   'rgba(127, 163, 154, 0.05)',   // seafoam 5%
  'tint-mirror':     'rgba(178, 72, 61, 0.02)',     // vermilion 2%
};
```

### Atmospheric Glass — *반-glassmorphism*

`system.md` §5 의 핵심. 일반 glassmorphism 은 *밝은 blur + 밝은 색*. Taste OS 의 glass 는 *어둡게 함*.

```css
.atmospheric-glass {
  background: rgba(26, 23, 20, 0.72);                /* coal at 72% */
  backdrop-filter: blur(28px) saturate(108%) brightness(96%);
  -webkit-backdrop-filter: blur(28px) saturate(108%) brightness(96%);
  border: 1px solid rgba(216, 199, 172, 0.06);       /* hairline beige */
  box-shadow:
    inset 0 1px 0 rgba(216, 199, 172, 0.04),         /* 상단 빛 한 줄 */
    0 32px 80px -32px rgba(0, 0, 0, 0.6);            /* 긴 그림자 */
}
```

핵심:
- **`brightness(96%)`** — *어둡게 함*. 일반 glassmorphism 은 *밝게 함*.
- **`saturate(108%)`** — 미세한 색 강화.
- **inset 1px 4% 빛** — 유리의 *상단 가장자리* 가 잡는 단 한 줄의 빛.
- **긴 던지는 그림자** — 종이가 *떠 있는* 느낌.

사용처: Console (`⌘K`), Mirror "Ask" 입력기, Universe 확대 카드. *그 외 모든 곳에서는 atmospheric glass 사용 *금지*.*

### Glass fallback

`backdrop-filter` 미지원 또는 `prefers-reduced-transparency: reduce` 일 때:

```css
@supports not (backdrop-filter: blur(1px)) {
  .atmospheric-glass {
    background: rgba(26, 23, 20, 0.94);
    border: 1px solid rgba(216, 199, 172, 0.06);
  }
}
```

투명도 *없이* 만들지 *않습니다*. 효과의 *시도* 가 아닌 *명시적 대안*.

---

## 6. Shadow & Glow — 따뜻한 깊이

### 일반적인 그림자 — *없음*

Taste OS 는 *대부분의 표면* 에 그림자를 *사용하지 않습니다*. 깊이는 *색 온도 차이* 와 *atmospheric glass* 로 전달.

### 예외 1 — Atmospheric Glass 의 long-throw shadow

Console / Mirror composer 의 그림자만:

```css
--shadow-glass: 0 32px 80px -32px rgba(0, 0, 0, 0.6);
```

`-32px` offset spread — 그림자가 *작게 모이는* 효과. 그리고 long throw (80px blur) — *멀리 던짐*.

### 예외 2 — Universe 확대 카드의 warm glow

`field.md` §4 의 단 하나의 *드롭섀도우 같지 않은* 깊이 표현:

```css
--shadow-universe-zoom: 0 24px 80px -24px rgba(217, 166, 108, 0.18);
```

ember 색의 *따뜻한 후광* — 차가운 그림자 대신.

### Glow — Beacon, Mirror, Door

```ts
export const glows = {
  // Beacon 펄스 (펄스 애니메이션 안에서)
  'beacon-base':   '0 0 0 1px rgba(176, 118, 114, 0.0)',
  'beacon-peak':   '0 0 0 3px rgba(176, 118, 114, 0.10)',
  'beacon-hover':  '0 0 0 6px rgba(176, 118, 114, 0.20)',

  // Mirror line subtle glow (해당 영역의 ambient)
  'mirror-aura':   '0 0 80px rgba(176, 118, 114, 0.04)',

  // Door (final CTA section)
  'door-warm':     'radial-gradient(ellipse, rgba(176, 118, 114, 0.40) 0%, rgba(143, 160, 172, 0.12) 60%, transparent 100%)',

  // Selected card inner ring
  'select-ring':   'inset 0 0 0 1px rgba(216, 199, 172, 0.55)',
};
```

### Glow 사용 규칙

1. **하드 그림자 금지.** offset, blur, spread 모두 *0이거나 큰 음수 spread*.
2. **차가운 그림자 금지.** 모든 grey/black 그림자는 *warm tint* 가 들어가야 함 (e.g. `rgba(0,0,0,0.6)` 대신 `rgba(14,12,11,0.6)`).
3. **그림자 *길이* > *깊이*.** 80px blur 가 24px blur 보다 *훨씬* 자주 쓰임. *멀리 던지는 빛*.

---

## 7. Border & Radius — 절제된 가장자리

### Hairlines (1px)

Taste OS 의 UI 의 80% 는 *헤어라인* 이 *박스* 의 역할을 합니다. 박스 → 헤어라인.

```ts
export const hairlines = {
  faint:    '1px solid rgba(68, 62, 55, 0.32)',     // bone 32%
  base:     '1px solid rgba(68, 62, 55, 0.55)',     // bone 55%
  accent:   '1px solid rgba(176, 118, 114, 0.32)',  // rose 32%
};
```

### Radius — 최대 4px

```ts
export const radius = {
  none: '0',
  sm:   '2px',                  // 기본 (cards, buttons)
  md:   '4px',                  // 최대 (large pannels)
  full: '9999px',               // 매우 예외적 — 칩 (atmosphere chips)
};
```

원형은 *atmosphere chip* 에만 (호버 시 등장하는 라벨). 그 외 *어떤 UI 도 둥글지 않음*. 픽토그램 같지 않게.

### 가장자리 사용 가이드

| 컴포넌트 | radius |
|---|---|
| Plate (카드) | `2px` |
| Slab (큰 패널) | `2px` 또는 `4px` |
| Beacon (버튼) | `2px` |
| Input (텍스트 입력) | `0` (밑줄만, full border 없음) |
| Atmosphere chip | `9999px` |
| Image card | `2px` |
| Modal / Console | `4px` |

### 가장자리 *없는* 컴포넌트

- 본문 텍스트 박스 — *전혀 없음*. 본문은 가장자리 *없이* 페이지에 그대로 놓임
- 섹션 — 헤어라인 분할만, 박스로 감싸지 *않음*

---

## 8. Grain & Texture — 영화의 결

### Film Grain

모든 페이지에 *항상* 있는 단 하나의 텍스처.

```ts
export const grain = {
  url: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.28 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
  opacity: '0.055',                    // 5.5%
  blendMode: 'overlay',
  duration: '0.6s',                     // 4-step animation = ~8fps
  steps: 4,                             // stop-motion
};
```

```css
.grain {
  position: fixed;
  inset: -50%;
  width: 200%;
  height: 200%;
  background-image: var(--grain-url);
  opacity: 0.055;
  mix-blend-mode: overlay;
  animation: grain-shift 0.6s steps(4) infinite;
  pointer-events: none;
  z-index: 100;
}

@keyframes grain-shift {
  0%   { transform: translate(0,    0); }
  25%  { transform: translate(-5%,  4%); }
  50%  { transform: translate(5%,  -3%); }
  75%  { transform: translate(-3%, -5%); }
  100% { transform: translate(2%,   3%); }
}
```

### 왜 이 구현인가

- **SVG inline (`feTurbulence`)** — 외부 이미지 파일 0개. 페이지 무게 < 1KB 추가.
- **`steps(4)`** — *부드러운* shift 가 아닌 *stop-motion*. 8fps 가 *필름의 결*.
- **`mix-blend-mode: overlay`** — 검은 부분은 더 검게, 밝은 부분은 더 밝게. *실제 필름* 처럼.

### 추가 텍스처 — *없음*

- 종이 텍스처 (paper texture) — *quote card 안의 미세한 radial gradient* 로 *시사* 만 (`radial-gradient(ellipse at top left, rgba(244, 241, 234, 0.025), transparent 60%)`)
- Linen 텍스처 — *없음*
- Concrete 텍스처 — *없음*

Taste OS 의 *유일한* texture 는 *film grain*. 다른 모든 *결* 은 *색과 그라데이션* 으로 만듭니다.

---

## 9. Motion — 호흡 토큰

전체 세부는 `motion.md` 참조. 여기는 토큰만.

```ts
export const motion = {
  // === 시간 ===
  'duration-fast':         '0.20s',
  'duration-base':         '0.6s',
  'duration-breath-in':    '0.9s',
  'duration-hold':         '0.3s',
  'duration-breath-out':   '1.4s',
  'duration-reveal':       '1.6s',
  'duration-reveal-slow':  '1.8s',
  'duration-reveal-climax': '2.0s',
  'duration-cinematic':    '2.4s',

  // === 이징 ===
  'ease-breath-in':   'cubic-bezier(0.16, 1, 0.30, 1)',
  'ease-breath-out':  'cubic-bezier(0.70, 0, 0.84, 0)',
  'ease-settle':      'cubic-bezier(0.34, 1.18, 0.64, 1)',
  'ease-standard':    'cubic-bezier(0.4, 0, 0.2, 1)',
};
```

---

## 10. Component 토큰

### Beacon (CTA 버튼)

```ts
export const beacon = {
  border:        '1px solid rgba(216, 199, 172, 0.18)',
  'border-hover':'1px solid rgba(176, 118, 114, 0.50)',
  bg:            'transparent',
  'bg-hover':    'rgba(176, 118, 114, 0.06)',
  color:         'var(--c-beige)',
  'pad-x':       'var(--s-6)',
  'pad-y':       '13px',
  'font-size':   '13px',
  'letter-spacing': '0.04em',
  radius:        '2px',
  'dash-color':  'var(--c-mist)',
  'dash-opacity':'0.45',
  'pulse-color': 'rgba(176, 118, 114, 0.10)',
  'pulse-duration': '3.6s',
};
```

### Plate (기본 카드)

```ts
export const plate = {
  bg:          'var(--c-coal)',
  border:      '1px solid rgba(68, 62, 55, 0.55)',
  'border-hover': '1px solid rgba(176, 118, 114, 0.32)',
  radius:      '2px',
  padding:     'var(--s-6) var(--s-6) var(--s-5)',
  gap:         'var(--s-4)',
  'lift-hover':'-2px',
  'warm-shift-hover': 'brightness(1.04) saturate(1.04)',
};
```

### Quote Card (말 카드)

```ts
export const quoteCard = {
  bg:           'radial-gradient(ellipse at top left, rgba(244, 241, 234, 0.025), transparent 60%), var(--c-coal)',
  border:       '1px solid rgba(68, 62, 55, 0.55)',
  radius:       '2px',
  padding:      'var(--s-5) var(--s-6)',
  'text-font':  'var(--font-display)',
  'text-style': 'italic',
  'text-size':  '17px',
  'text-line-height': '1.55',
  'text-color': 'var(--c-beige)',
};
```

### Atmospheric Glass (Console, Mirror composer)

```ts
export const atmosphericGlass = {
  bg:           'rgba(26, 23, 20, 0.72)',
  'backdrop-filter': 'blur(28px) saturate(108%) brightness(96%)',
  border:       '1px solid rgba(216, 199, 172, 0.06)',
  'inner-highlight': 'inset 0 1px 0 rgba(216, 199, 172, 0.04)',
  shadow:       '0 32px 80px -32px rgba(0, 0, 0, 0.6)',
  radius:       '4px',
};
```

### Atmosphere Chip (호버 칩)

```ts
export const chip = {
  bg:           'rgba(26, 23, 20, 0.85)',
  'bg-selected':'rgba(176, 118, 114, 0.18)',
  border:       '1px solid rgba(68, 62, 55, 0.55)',
  'border-selected': '1px solid rgba(176, 118, 114, 0.7)',
  color:        'var(--c-mist)',
  'color-selected': 'var(--c-beige)',
  'font-size':  '10px',
  'letter-spacing': '0.04em',
  'pad-x':      '8px',
  'pad-y':      '3px',
  radius:       '9999px',
};
```

### Slider (Feeling 화면)

```ts
export const slider = {
  'track-height':     '40px',
  'line-bg':          'linear-gradient(90deg, rgba(143, 160, 172, 0.3) 0%, rgba(216, 199, 172, 0.4) 50%, rgba(176, 118, 114, 0.4) 100%)',
  'dot-size':         '12px',
  'dot-color':        'var(--c-beige)',
  'dot-glow':         '0 0 16px rgba(176, 118, 114, 0.40)',
  'dot-glow-hover':   '0 0 22px rgba(176, 118, 114, 0.55)',
  'dot-glow-grab':    '0 0 24px rgba(176, 118, 114, 0.70)',
};
```

### Sigil (좌상단 ensō 마크)

```ts
export const sigil = {
  size:         '22px',
  color:        'var(--c-mist)',
  'opacity-base':    '0.18',
  'opacity-peak':    '0.32',
  'breath-duration': '3.6s',
  'stroke-width': '1.2',
};
```

---

## 11. Dark Mode 철학

> Dark mode 는 *세팅* 이 아닙니다. *제품의 기질* 입니다.

### Dark-Only at Launch

`system.md` §4 의 약속:
- Light mode (가칭 *Linen*) 는 *기술적으로 가능* 하지만 launch 시점에 *OS 의 atmospheric identity 를 희석*
- 미래에 도착할 때 *준비됐을 때* 도착

### Dark 의 7가지 규율

1. **배경은 *순 검정* 이 아님.** `#0E0C0B` (warm) 또는 `#0A0A0B` (cool). 둘 다 *살짝 따뜻한 톤*.
2. **텍스트는 *순백* 이 아님.** `#D8C7AC` (beige) 또는 `#F4F1EA` (pearl). 둘 다 *ivory*, *white* 가 아님.
3. **그림자는 *배경보다 어두움*.** depth = *더 어두운 자리* 가 아님. *더 따뜻한 빛이 모이는* 자리.
4. **빛은 배급됨.** 하나의 Beacon, 하나의 Mirror 문장, 하나의 활성 Sigil. *방에 창이 하나*.
5. **Glow 는 warm.** attention 을 끄는 모든 빛은 *불의 방향* — 차가운 형광등 *없음*.
6. **System dark/light toggle 무시.** Taste OS 는 *항상* dark. OS preference 는 *reduced motion* 과 *increased contrast* 에만 적용.
7. **Increased contrast 모드에서**: `mist` → `pearl` 로 보조 텍스트 승격. 헤어라인 1px → 1.5px 두께.

### 왜 *light 도 같이 하지 않는가*

대부분의 dark mode 는 *light mode 의 색 반전* 입니다. Taste OS 의 dark 는 *원본* — *밝은 버전이 없는 영화* 처럼. 시각 정체성이 *어둠 안에서 태어났음* 을 명시적으로 합니다.

---

## 12. 반응형 토큰

세 룸 (per `system.md` §7).

```ts
export const breakpoints = {
  pocket: '0',           // 0–767
  desk:   '768px',       // 768–1279
  studio: '1280px',      // 1280+
};
```

### 룸별 토큰 차이

| 토큰 | Pocket | Desk | Studio |
|---|---|---|---|
| `--stage-max` | `100%` | `1080px` | `1280px` |
| `--margin-top` | `96px` | `128px` | `160px` |
| `--display-xl` | `clamp(48px, 14vw, 72px)` | `96px` | `120px` |
| `--display-lg` | `clamp(36px, 8vw, 56px)` | `64px` | `72px` |
| `--rail-width` | `0` (rail collapses to bottom) | `56px` | `56px` |

### 모바일 특수

- **Rail** 좌측 → *하단* 탭 으로 collapse
- **Orbs** 4 → 2 로 감소 (성능)
- **Drift small multiples** 14 axes → 6 strongest
- **Universe** 3D → 2D 별자리로 degrade

### 룸은 *브레이크포인트* 가 아닌 *자세*

- *Pocket* — 흘끗 보고 넣어두는 자세
- *Desk* — 잠시 앞으로 기우는 자세  
- *Studio* — 기대어 호흡하는 자세

같은 사용자가 *시간에 따라 다른 자세* 에 있을 수 있음. 토큰은 *지금 그 사용자가 어떤 자세인지* 에 따라 조정.

---

## 13. 완성된 Tailwind 설정

```ts
// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',                    // dark is always on; no class toggle for launch
  theme: {
    extend: {
      // === COLORS ===
      colors: {
        night:        '#0E0C0B',
        coal:         '#1A1714',
        ash:          '#2A2622',
        bone:         '#443E37',
        mist:         '#9A8E81',
        sand:         '#C8B69B',
        beige:        '#D8C7AC',
        rose:         '#B07672',
        'rose-deep':  '#8A5552',
        'silver-blue':'#8FA0AC',
        ember:        '#D9A66C',
        vermilion:    '#B2483D',
        seafoam:      '#7FA39A',
        phosphor:     '#8FB3D4',
        peat:         '#6B5B47',
        pearl:        '#F4F1EA',
        void:         '#0A0A0B',
        ink:          '#111114',
        umbra:        '#1A1A1E',
      },

      // === FONTS ===
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Noto Serif KR"', 'serif'],
        text:    ['"Inter"', '"Pretendard"', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },

      // === SIZES ===
      fontSize: {
        // Display
        'display-xl': ['clamp(48px, 14vw, 120px)', { lineHeight: '0.83', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(36px, 8vw,  72px)',  { lineHeight: '1.0',  letterSpacing: '-0.018em' }],
        'display-md': ['clamp(28px, 5vw,  52px)',  { lineHeight: '1.15', letterSpacing: '-0.005em' }],
        'display-sm': ['clamp(22px, 4vw,  36px)',  { lineHeight: '1.22', letterSpacing: '0' }],

        // Text
        'lg': ['18px', { lineHeight: '1.67', letterSpacing: '0.005em' }],
        'md': ['15px', { lineHeight: '1.73', letterSpacing: '0.01em' }],
        'sm': ['13px', { lineHeight: '1.69', letterSpacing: '0.02em' }],
        'xs': ['11px', { lineHeight: '1.64', letterSpacing: '0.04em' }],

        // Numeral
        'num-md': ['13px', { lineHeight: '1.23', letterSpacing: '0.06em' }],
        'num-sm': ['11px', { lineHeight: '1.27', letterSpacing: '0.08em' }],
      },

      // === SPACING ===
      spacing: {
        '1':  '4px',
        '2':  '8px',
        '3':  '12px',
        '4':  '16px',
        '5':  '24px',
        '6':  '32px',
        'br-1': '64px',
        'br-2': '112px',
        'br-3': '176px',
        'br-4': '240px',
        'br-5': '320px',
      },

      // === MAX WIDTHS ===
      maxWidth: {
        'stage':  '1280px',
        'visual': '1080px',
        'text':   '640px',
        'rail':    '56px',
      },

      // === RADIUS ===
      borderRadius: {
        'none': '0',
        'sm':   '2px',
        'md':   '4px',
        'full': '9999px',
      },

      // === DURATIONS ===
      transitionDuration: {
        fast:        '200ms',
        base:        '600ms',
        breathIn:    '900ms',
        breathOut:   '1400ms',
        reveal:      '1600ms',
        revealSlow:  '1800ms',
        revealClimax:'2000ms',
        cinematic:   '2400ms',
      },

      // === EASINGS ===
      transitionTimingFunction: {
        'breath-in':  'cubic-bezier(0.16, 1, 0.30, 1)',
        'breath-out': 'cubic-bezier(0.70, 0, 0.84, 0)',
        'settle':     'cubic-bezier(0.34, 1.18, 0.64, 1)',
        'standard':   'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // === SHADOWS ===
      boxShadow: {
        'glass':         '0 32px 80px -32px rgba(0, 0, 0, 0.6)',
        'universe-zoom': '0 24px 80px -24px rgba(217, 166, 108, 0.18)',
        'beacon-base':   '0 0 0 1px rgba(176, 118, 114, 0.0)',
        'beacon-peak':   '0 0 0 3px rgba(176, 118, 114, 0.10)',
        'beacon-hover':  '0 0 0 6px rgba(176, 118, 114, 0.20)',
        'select-ring':   'inset 0 0 0 1px rgba(216, 199, 172, 0.55)',
        'glass-inner':   'inset 0 1px 0 rgba(216, 199, 172, 0.04)',
      },

      // === BACKDROP BLUR ===
      backdropBlur: {
        'glass': '28px',
      },

      // === ANIMATIONS ===
      animation: {
        'orb-drift':    'orb-drift 42s ease-in-out infinite',
        'sigil-breath': 'sigil-breath 3.6s ease-in-out infinite',
        'grain-shift':  'grain-shift 0.6s steps(4) infinite',
        'beacon-pulse': 'beacon-pulse 3.6s ease-in-out infinite',
        'card-drift':   'card-drift 10s ease-in-out infinite',
        'disc-spin':    'disc-spin 14s linear infinite',
      },
      keyframes: {
        'orb-drift': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '33%':       { transform: 'translate(50px, -40px)' },
          '66%':       { transform: 'translate(-30px, 50px)' },
        },
        'sigil-breath': {
          '0%, 100%': { opacity: '0.18' },
          '50%':       { opacity: '0.32' },
        },
        'grain-shift': {
          '0%':   { transform: 'translate(0, 0)' },
          '25%':  { transform: 'translate(-5%, 4%)' },
          '50%':  { transform: 'translate(5%, -3%)' },
          '75%':  { transform: 'translate(-3%, -5%)' },
          '100%': { transform: 'translate(2%, 3%)' },
        },
        'beacon-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(176, 118, 114, 0.0)' },
          '50%':       { boxShadow: '0 0 0 3px rgba(176, 118, 114, 0.10)' },
        },
        'card-drift': {
          '0%, 100%': { transform: 'rotate(var(--tilt, 0deg)) translateY(0)' },
          '50%':       { transform: 'rotate(var(--tilt, 0deg)) translateY(-3px)' },
        },
        'disc-spin': {
          'to': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Example usage

```tsx
// Hero with token-only styling
<section className="min-h-screen flex items-center justify-center px-5 pt-[var(--margin-top-studio)]">
  <h1 className="font-display italic text-display-lg text-beige tracking-tight">
    옻칠한 황혼
  </h1>
</section>

// Beacon button
<button className="
  inline-flex items-center gap-3
  px-6 py-3
  border border-beige/[0.18] rounded-sm
  text-beige text-sm tracking-[0.04em]
  bg-transparent
  hover:border-rose/[0.50] hover:bg-rose/[0.06]
  transition-colors duration-base ease-breath-in
  relative
">
  <span className="text-mist/45 text-[10px]">─</span>
  <span>시작하기</span>
  <span className="text-mist/45 text-[10px]">─</span>
</button>
```

---

## 14. CSS 변수 전체

JSON 한 덩어리. `globals.css` 의 `:root` 에 직접 옮기세요.

```css
:root {
  /* === COLOR (Primitive) === */
  --c-night:        #0E0C0B;
  --c-coal:         #1A1714;
  --c-ash:          #2A2622;
  --c-bone:         #443E37;
  --c-mist:         #9A8E81;
  --c-sand:         #C8B69B;
  --c-beige:        #D8C7AC;
  --c-pearl:        #F4F1EA;
  --c-rose:         #B07672;
  --c-rose-deep:    #8A5552;
  --c-silver-blue:  #8FA0AC;
  --c-ember:        #D9A66C;
  --c-vermilion:    #B2483D;
  --c-seafoam:      #7FA39A;
  --c-phosphor:     #8FB3D4;
  --c-peat:         #6B5B47;
  --c-void:         #0A0A0B;
  --c-ink:          #111114;
  --c-umbra:        #1A1A1E;

  /* === COLOR (Semantic) === */
  --surface-bg:        var(--c-night);
  --surface-1:         var(--c-coal);
  --surface-2:         var(--c-ash);
  --surface-3:         var(--c-bone);
  --surface-glass:     rgba(26, 23, 20, 0.72);
  --text-primary:      var(--c-beige);
  --text-secondary:    var(--c-mist);
  --text-quiet:        rgba(154, 142, 129, 0.55);
  --hairline:          rgba(68, 62, 55, 0.55);
  --hairline-faint:    rgba(68, 62, 55, 0.32);
  --accent:            var(--c-rose);
  --accent-cool:       var(--c-silver-blue);
  --selection:         rgba(176, 118, 114, 0.40);
  --focus-ring:        rgba(176, 118, 114, 0.55);

  /* === TYPOGRAPHY === */
  --font-display: 'Cormorant Garamond', 'Noto Serif KR', serif;
  --font-text:    'Inter', 'Pretendard', -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;

  /* === SPACING === */
  --s-1: 4px;   --s-2: 8px;   --s-3: 12px;
  --s-4: 16px;  --s-5: 24px;  --s-6: 32px;
  --br-1: 64px; --br-2: 112px; --br-3: 176px;
  --br-4: 240px; --br-5: 320px;

  /* === LAYOUT === */
  --stage-max:   1280px;
  --col-visual:  1080px;
  --col-text:    640px;
  --rail-width:  56px;
  --margin-top-pocket: 96px;
  --margin-top-desk:   128px;
  --margin-top-studio: 160px;

  /* === RADIUS === */
  --r-sm: 2px;
  --r-md: 4px;
  --r-full: 9999px;

  /* === MOTION === */
  --t-fast:           0.20s;
  --t-base:           0.6s;
  --t-breath-in:      0.9s;
  --t-hold:           0.3s;
  --t-breath-out:     1.4s;
  --t-reveal:         1.6s;
  --t-reveal-slow:    1.8s;
  --t-reveal-climax:  2.0s;
  --t-cinematic:      2.4s;

  --e-breath-in:  cubic-bezier(0.16, 1, 0.30, 1);
  --e-breath-out: cubic-bezier(0.70, 0, 0.84, 0);
  --e-settle:     cubic-bezier(0.34, 1.18, 0.64, 1);
  --e-standard:   cubic-bezier(0.4, 0, 0.2, 1);

  /* === SHADOWS === */
  --shadow-glass:         0 32px 80px -32px rgba(0, 0, 0, 0.6);
  --shadow-universe-zoom: 0 24px 80px -24px rgba(217, 166, 108, 0.18);
  --glow-beacon-base:     0 0 0 1px rgba(176, 118, 114, 0.0);
  --glow-beacon-peak:     0 0 0 3px rgba(176, 118, 114, 0.10);
  --glow-beacon-hover:    0 0 0 6px rgba(176, 118, 114, 0.20);
  --glow-mirror-aura:     0 0 80px rgba(176, 118, 114, 0.04);
  --select-ring:          inset 0 0 0 1px rgba(216, 199, 172, 0.55);
  --glass-inner-highlight:inset 0 1px 0 rgba(216, 199, 172, 0.04);

  /* === GRAIN === */
  --grain-opacity: 0.055;
  --grain-blend:   overlay;
  --grain-duration:0.6s;

  /* === BORDER (composed) === */
  --border-hairline-faint:  1px solid var(--hairline-faint);
  --border-hairline:        1px solid var(--hairline);
  --border-accent:          1px solid rgba(176, 118, 114, 0.32);

  /* === Z-INDEX === */
  --z-bg:          0;
  --z-surface:     1;
  --z-content:     3;
  --z-rail:        50;
  --z-sigil:       50;
  --z-modal:       100;
  --z-grain:       100;
  --z-toast:       200;
}

/* Increased contrast — accessibility */
@media (prefers-contrast: more) {
  :root {
    --text-secondary: var(--c-beige);
    --hairline:       rgba(68, 62, 55, 0.85);
    --hairline-faint: rgba(68, 62, 55, 0.55);
  }
}

/* Reduced transparency — accessibility */
@media (prefers-reduced-transparency: reduce) {
  :root {
    --surface-glass: rgba(26, 23, 20, 0.94);
  }
}
```

---

## 15. 토큰이 *없는* 것들

영구 거부 목록.

### Color 토큰 — *없는* 것

| 토큰 | 거부 이유 |
|---|---|
| `--success`, `--warning`, `--error`, `--info` | OS 가 알람이 없음 |
| `--gray-50` ~ `--gray-900` | 회색 사다리는 *세련됨의 모방*. Taste OS 의 회색은 *오직* `mist`/`sand`/`bone` 셋. |
| `--brand-primary`, `--brand-secondary` | "brand" 자체가 *기업 어휘*. Taste OS 의 색은 *atmospheric* 이지 *brand* 가 아님. |
| `--rgb-primary` | CSS 변수 안에 RGB 분리. *불필요한 추상*. |
| Neon · saturated bright | 광고의 언어. |

### Typography — *없는* 것

| 토큰 | 거부 이유 |
|---|---|
| `font-weight-bold` 본문 안 사용 | 본문 강조는 italic 으로 |
| `text-uppercase` class | ALL-CAPS 금지 |
| `font-size: 9px` 이하 | 못 읽음, 권력 없음 |
| `letter-spacing: 0.5em+` | 디스플레이/장식이지 *시스템* 아님 |

### Spacing — *없는* 것

| 값 | 거부 이유 |
|---|---|
| 5px, 6px, 7px, 9px, 10px (4의 배수가 아닌) | 리듬 깨짐 |
| 48px, 80px (Fibonacci 인접 안 됨) | 호흡이 *기계 같음* |
| 100px (둥근 수) | 의도되지 않은 디자인의 시그니처 |

### Shadow — *없는* 것

| 그림자 | 거부 이유 |
|---|---|
| `0 2px 4px rgba(0,0,0,0.1)` | Material design 의 stock shadow. 흔함. |
| `0 0 0 3px rgba(0,123,255,0.4)` | "focus ring" 의 흔한 파랑. 우리는 rose. |
| Drop shadow on text | 1990년대 |
| Hard shadow (offset > blur) | 만화적 |

### 일반 — *없는* 것

- ▶ "play" 아이콘
- ❤️ "like" 아이콘  
- 🔔 "notification" 아이콘
- "X / Y" 진행률 카운터 변수
- "loading dots" 의 dot count

---

## 닫는 말

토큰 시스템의 진짜 목적은 *재사용* 이 아닙니다. *덜 잘못된 결정* 이에요.

엔지니어가 새 컴포넌트를 만들 때 *항상* 던질 질문:

> ***이 값이 토큰 안에 있나? 없다면, 토큰을 늘릴 만큼 *중요한* 결정인가?***

대부분 *아니오*. 그러면 *기존 토큰을 쓰거나, 만들 가치가 없는 디자인 결정* 입니다. 양쪽 모두 *덜 잘못된 결정* 으로 이끕니다.

이 문서가 잘 쓰인다면, 6개월 후의 Taste OS UI 는 *지금* 의 UI 와 *완전히 같은 정체성* 을 갖고 있을 거예요. 색이 흔들리지 않고, 폰트가 늘어나지 않고, 간격이 깨지지 않은 채로. 그게 *시각적 일관성* 이 아닌 *시각적 정체성* 이에요.
