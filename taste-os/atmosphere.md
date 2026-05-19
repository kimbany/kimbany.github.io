# Taste OS — Atmosphere / 마음이 머무는 공기

> 카테고리 선택이 아닙니다. *세계를 합성* 하는 자리.
> 사용자가 분위기를 고를 때마다 — *페이지의 조명이 그 세계와 섞입니다*.

이 문서는 Taste OS 온보딩의 **분위기 선택 화면** 단독 사양입니다. 이전 화면들 (`images/`, `music/`, `quotes/`) 과 같은 3-상태 구조를 따르되, *이 화면이 온보딩의 마지막 선택 단계* — 따라서:

1. **8 개의 큐레이션된 분위기 *세계*** — 자유 입력이 아닌 *선택*
2. **선택이 *페이지의 ambient 조명* 을 만듦** — 사용자가 *자기 세계를 합성*
3. **Forward CTA가 *분석으로의 전환*** — *"이제 당신의 분위기를 이해해볼게요"*

함께 읽기: `images.md`, `music.md`, `quotes.md` (자매 화면들), `system.md` §3 (색 토큰), `voice.md`.

구현: `taste-os/atmosphere/index.html` + `style.css` + `script.js`.

---

## 목차

0. [철학 — 선택이 곧 합성](#0-철학--선택이-곧-합성)
1. [세 가지 상태](#1-세-가지-상태)
2. [State A — Emotional Intro](#2-state-a--emotional-intro)
3. [State B — Atmosphere Worlds](#3-state-b--atmosphere-worlds)
4. [8 개의 분위기 세계 — 색과 분위기](#4-8-개의-분위기-세계--색과-분위기)
5. [Ambient Blending — 시그니처 시각](#5-ambient-blending--시그니처-시각)
6. [Hover Preview — 한 세계를 *입어보기*](#6-hover-preview--한-세계를-입어보기)
7. [State C — *분석으로의 전환*](#7-state-c--분석으로의-전환)
8. [Next.js + Framer Motion 구현](#8-nextjs--framer-motion-구현)
9. [정적 미리보기](#9-정적-미리보기)

---

## 0. 철학 — 선택이 곧 합성

전형적인 *선호 선택 UI* — 체크박스, 태그, 카테고리. 사용자가 *고르고*, 시스템이 *분류*. *사용자는 도구의 입력값*.

Taste OS 의 Atmosphere 는 *완전히 반대* 의 디자인:

> ***사용자가 분위기를 고를 때마다, 페이지 자체가 그 분위기로 변해간다.***

선택이 *데이터로 저장* 되는 것이 *아니라* — *지금 그 자리에서* 페이지가 사용자가 선택한 분위기들의 *조합* 으로 *변신*. 8 개 중 3 개를 골랐다면 — 그 3 개의 색·조명·공기가 *지금 보고 있는 페이지에 합쳐져* 사용자만의 *고유한 세계* 가 만들어짐.

이것이 *카테고리 선택* 과 *세계 합성* 의 차이.

### 한 줄 약속

> ***당신이 고른 분위기들이 *바로 지금* 당신의 화면을 만듭니다.***

이게 잘 작동한다면, 사용자가 *3 개 째* 분위기를 고를 때:

> *"이게 *내 세계* 야."*

라고 *눈으로 보면서* 인지하게 됨.

---

## 1. 세 가지 상태

```
                                                                            
   STATE A · Emotional Intro                    ~6 초                       
   ─────────────────────────────────────                                    
                                                                            
   "당신은 어떤 분위기 속에서                                                
    가장 오래 머무르나요?"                                                  
                                                                            
   사람은 자신이 사랑하는                                                    
   공기의 결을 닮아갑니다.                                                   
                                                                            
   ──── 시작하기 ────                                                       
                                                                            
       │                                                                    
       ▼                                                                    
                                                                            
   STATE B · Atmosphere Worlds                    ∞                       
   ─────────────────────────────────────                                    
                                                                            
   당신은 어떤 분위기에 가장 오래 머무르나요?  (상단 작게)                   
                                                                            
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                          
   │        │  │        │  │        │  │        │                          
   │ 새벽   │  │ 비 오는 │  │ 따뜻한  │  │ 조용한  │                          
   │ 도시   │  │ 창가   │  │ 필름톤  │  │ 미래감  │                          
   │        │  │        │  │        │  │        │                          
   │ ▮▮▮▮  │  │ ▮▮▮▮  │  │ ▮▮▮▮  │  │ ▮▮▮▮  │                          
   └────────┘  └────────┘  └────────┘  └────────┘                          
                                                                            
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                          
   │ 인간적 │  │ 차가운 │  │ 아날로그│  │ 느린   │                          
   │  인    │  │  고독  │  │  온기  │  │ 밤공기 │                          
   │ 흔적   │  │  감    │  │        │  │        │                          
   │        │  │        │  │        │  │        │                          
   │ ▮▮▮▮  │  │ ▮▮▮▮  │  │ ▮▮▮▮  │  │ ▮▮▮▮  │                          
   └────────┘  └────────┘  └────────┘  └────────┘                          
                                                                            
   3곳에 머무셨어요. 당신의 공기가 보여요.                                    
                                                                            
   ──── 이제 당신의 분위기를 이해해볼게요 ────                                
                                                                            
       │                                                                    
       ▼                                                                    
                                                                            
   STATE C · Transition to Analysis              ~8 초                     
   ─────────────────────────────────────                                    
                                                                            
   "여기까지 함께 와 주셔서 고마워요."                                       
                                                                            
   "이제, 당신의 풍경을 만들어볼게요."                                       
                                                                            
       → (real app: AI 분석 화면)                                            
                                                                            
```

---

## 2. State A — Emotional Intro

`images/` / `music/` / `quotes/` 의 State A 와 같은 6초 시퀀스, 카피만 다름.

### 시퀀스

```
t = 0.0s    검은 화면. ambient 페이드 인
t = 1.5s    ★ Headline reveal blur (1.8s)
              "당신은 어떤 분위기 속에서"
              "가장 오래 머무르나요?"
t = 3.8s    Hairline draws
t = 4.4s    Sub copy 단일 줄 reveal (자매 화면들과 다름 — 한 줄):
              "사람은 자신이 사랑하는 공기의 결을 닮아갑니다."
t = 6.4s    CTA: "──── 시작하기 ────"
```

### 카피

| 슬롯 | 한국어 |
|---|---|
| Headline | 당신은 어떤 분위기 속에서<br/>가장 오래 머무르나요? |
| Sub | 사람은 자신이 사랑하는<br/>공기의 결을 닮아갑니다. |
| CTA | ──── 시작하기 ──── |

### Sub copy 차이

자매 화면들은 *2 줄 단계 reveal*. 이 화면은 *2 줄 함께* — 한 *문장 의 단일 진실*. *"사람은 자신이 사랑하는 공기의 결을 닮아갑니다."* 자체가 *완결된 시*.

---

## 3. State B — Atmosphere Worlds

### 레이아웃 — 2×4 grid (Desktop) / 1×8 stack (Mobile)

```
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│            │  │            │  │            │  │            │
│   새벽     │  │  비 오는   │  │   따뜻한   │  │   조용한   │
│   도시     │  │   창가     │  │   필름톤   │  │   미래감   │
│            │  │            │  │            │  │            │
│            │  │            │  │            │  │            │
│ ▮ ▮ ▮ ▮   │  │ ▮ ▮ ▮ ▮   │  │ ▮ ▮ ▮ ▮   │  │ ▮ ▮ ▮ ▮   │
└────────────┘  └────────────┘  └────────────┘  └────────────┘

┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│            │  │            │  │            │  │            │
│  인간적인  │  │  차가운    │  │  아날로그  │  │   느린     │
│   흔적     │  │   고독감   │  │   온기     │  │  밤공기    │
│            │  │            │  │            │  │            │
│            │  │            │  │            │  │            │
│ ▮ ▮ ▮ ▮   │  │ ▮ ▮ ▮ ▮   │  │ ▮ ▮ ▮ ▮   │  │ ▮ ▮ ▮ ▮   │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
```

### 카드 사양

- **종횡비**: 3:4 portrait
- **크기**: clamp(180px, 18vw, 240px) wide
- **배경**: 그 분위기의 *그라데이션* (4-color gradient)
- **이름**: 카드 안에 italic display serif, 두 줄 배치
- **팔레트**: 카드 하단에 4 swatch (10×10 dots)
- **호버**: 미세 expand + 페이지 atmosphere preview
- **선택**: 1px rose 보더 + 우상단 ◆ 글리프

### 카드 안 활자

```css
.world-name {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 300;
  font-size: clamp(22px, 2.4vw, 28px);
  line-height: 1.15;
  letter-spacing: -0.008em;
  color: var(--c-beige);
}
```

### 카드 hover/selection — 상태 표현

```
default:    border: 1px solid rgba(68, 62, 55, 0.45);
            scale: 1;
            saturation: 0.85;

hover:      border: 1px solid rgba(216, 199, 172, 0.32);
            scale: 1.03;
            saturation: 1.0;
            + 페이지 ambient preview

selected:   border: 1px solid rgba(176, 118, 114, 0.55);
            scale: 1.02;
            saturation: 1.0;
            ◆ glyph (우상단)
```

### 카운터 카피 — *세계 합성* 톤

```
0:    (카운터 숨김; "마음에 머무는 공기를 골라보세요" 만)
1:    1곳에 머무셨어요.
2:    2곳에 머무셨어요. 더 머물러도 좋아요.
3:    3곳. 당신의 공기가 보여요.
4:    4곳. 풍부한 결이 보여요.
5+:   n곳에 머무셨어요. 당신만의 세계가 만들어지고 있어요.
```

*"머무름"* — *"선택" / "체크" 가 아닌*. 사용자가 *그 자리에 잠시 머문 사람* 으로.

### Forward CTA — *조건부* + *분석 톤*

```
n < 2:   CTA 숨김
n ≥ 2:   CTA fade in
```

CTA 카피: **`──── 이제 당신의 분위기를 이해해볼게요 ────`** (브리프 명시)

다른 화면들의 *"다음 분위기로 이어가기"* 와 결정적으로 다른 톤. 이건 *온보딩의 마지막 단계로 가는* 전환 — *분석* 으로의 *전환*.

---

## 4. 8 개의 분위기 세계 — 색과 분위기

### Atmosphere 1 — 새벽 도시 (Dawn City)

```
이름:    새벽 도시
영문:    Dawn City
팔레트:  #0F1620  #2A3540  #5A6878  #8FA0AC  #C8B69B
         night    slate    steel    silver   sand

분위기 톤:
  silent · urban · early · liminal

카드 배경:
  linear-gradient(165deg,
    #0F1620 0%,
    #2A3540 35%,
    #5A6878 70%,
    #8FA0AC 100%)

ambient 기여:
  rgba(143, 160, 172, 0.10)  cool silver-blue radial top
```

### Atmosphere 2 — 비 오는 창가 (Rainy Window)

```
이름:    비 오는 창가
영문:    Rainy Window
팔레트:  #1A2030  #3A4555  #6B7888  #A8B0BC  #D8DDE2
         storm    cool     muted    light    pearl

분위기 톤:
  melancholic · contemplative · cool · peaceful

카드 배경:
  linear-gradient(180deg,
    #1A2030 0%,
    #3A4555 40%,
    #6B7888 75%,
    #A8B0BC 100%)

ambient 기여:
  rgba(107, 120, 136, 0.10)  cool muted radial mid-left
```

### Atmosphere 3 — 따뜻한 필름톤 (Warm Film Tone)

```
이름:    따뜻한 필름톤
영문:    Warm Film
팔레트:  #2A1F18  #4A2620  #7A4030  #B07672  #D9A66C
         deep     red-deep brown    rose     ember

분위기 톤:
  nostalgic · analog · warm · gentle

카드 배경:
  linear-gradient(155deg,
    #2A1F18 0%,
    #4A2620 35%,
    #7A4030 65%,
    #D9A66C 100%)

ambient 기여:
  rgba(217, 166, 108, 0.10)  ember radial top-right
```

### Atmosphere 4 — 조용한 미래감 (Quiet Future)

```
이름:    조용한 미래감
영문:    Quiet Future
팔레트:  #0E1418  #1A2030  #3A4555  #8FA0AC  #C8D2DC
         void     deep     steel    silver   pale

분위기 톤:
  minimalist · futuristic · still · cold

카드 배경:
  linear-gradient(180deg,
    #0E1418 0%,
    #1A2030 35%,
    #3A4555 65%,
    #C8D2DC 100%)

ambient 기여:
  rgba(200, 210, 220, 0.08)  pale cool radial top
```

### Atmosphere 5 — 인간적인 흔적 (Human Traces)

```
이름:    인간적인 흔적
영문:    Human Traces
팔레트:  #1A0F08  #3A2620  #7A5040  #C8B69B  #D8C7AC
         coal     brown    wood     sand     beige

분위기 톤:
  lived-in · tender · warm · imperfect

카드 배경:
  linear-gradient(170deg,
    #1A0F08 0%,
    #3A2620 35%,
    #7A5040 65%,
    #D8C7AC 100%)

ambient 기여:
  rgba(122, 80, 64, 0.10)  warm brown radial center
```

### Atmosphere 6 — 차가운 고독감 (Cold Solitude)

```
이름:    차가운 고독감
영문:    Cold Solitude
팔레트:  #0A0A0B  #1A1F28  #3A4555  #6B7888  #8FA0AC
         pure     deep     steel    muted    silver

분위기 톤:
  still · silent · lonely · introspective

카드 배경:
  linear-gradient(170deg,
    #0A0A0B 0%,
    #1A1F28 40%,
    #3A4555 75%,
    #8FA0AC 100%)

ambient 기여:
  rgba(58, 69, 85, 0.10)  cold slate radial bottom
```

### Atmosphere 7 — 아날로그 온기 (Analog Warmth)

```
이름:    아날로그 온기
영문:    Analog Warmth
팔레트:  #2A1F18  #5A3D25  #9A7060  #C8B69B  #D9A66C
         deep     amber    warm     sand     ember

분위기 톤:
  cozy · vintage · gentle · golden

카드 배경:
  linear-gradient(160deg,
    #2A1F18 0%,
    #5A3D25 35%,
    #9A7060 65%,
    #D9A66C 100%)

ambient 기여:
  rgba(217, 166, 108, 0.12)  ember radial mid-right
```

### Atmosphere 8 — 느린 밤공기 (Slow Night Air)

```
이름:    느린 밤공기
영문:    Slow Night
팔레트:  #0E0C0B  #2A1F28  #4A2540  #7A5060  #B07672
         void     deep-v   wine     muted-r  rose

분위기 톤:
  nocturnal · slow · intimate · dim

카드 배경:
  linear-gradient(175deg,
    #0E0C0B 0%,
    #2A1F28 40%,
    #4A2540 70%,
    #B07672 100%)

ambient 기여:
  rgba(176, 118, 114, 0.10)  dim rose radial bottom-right
```

---

## 5. Ambient Blending — 시그니처 시각

**이 페이지의 진짜 시그니처.** 사용자가 atmosphere world를 선택할 때마다 — *그 world의 ambient 기여가 페이지의 *고정* 배경에 합쳐짐*.

### 구현 — 다중 radial gradient 합성

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: var(--atmosphere-blend, transparent);
  transition: background 2s ease;
}
```

JavaScript 가 선택된 atmospheres 의 ambient 기여를 *합쳐서* `--atmosphere-blend` 변수에 설정:

```js
function rebuildAtmosphereBlend() {
  const selectedAmbients = selected.map(a => a.ambientGradient);
  // 각 ambient는 다른 위치에 — top, mid-left, top-right, center, bottom, etc.
  const composite = selectedAmbients.join(', ');
  document.documentElement.style.setProperty('--atmosphere-blend', composite);
}
```

### 8 개 ambient 의 위치 — *서로 다른 곳에*

각 atmosphere 의 radial 이 *겹치지 않는* 위치에 배치되어, 여러 개 선택 시 *시각적 합성* 이 됨:

```
새벽 도시:        top center
비 오는 창가:     mid left
따뜻한 필름톤:    top right
조용한 미래감:    top
인간적인 흔적:    center
차가운 고독감:    bottom
아날로그 온기:    mid right
느린 밤공기:      bottom right
```

3 개 선택 시 — 페이지에 *3 개의 ambient radial gradient* 가 *동시에* 존재. 시각의 *복잡함* 이 아닌 *깊이*.

### 4 단계 tier — atmosphere 도 *축적적*

```
count: 0           pure night
count: 1           single ambient (one radial)
count: 2-3         multi-ambient blend (composing)
count: 4+          full atmospheric layered (4+ radials)
```

### 빛 구체도 *함께 변화*

선택된 atmosphere 의 색이 빛 구체 색에도 영향:

```css
body[data-atmosphere-warm] .orb-1 {
  background: radial-gradient(circle, rgba(217, 166, 108, 0.20), transparent 70%);
}

body[data-atmosphere-cool] .orb-2 {
  background: radial-gradient(circle, rgba(143, 160, 172, 0.18), transparent 70%);
}
```

선택된 atmospheres 의 *주된 톤* (warm vs cool vs neutral) 이 *orb 색* 에 부드럽게 반영.

---

## 6. Hover Preview — 한 세계를 *입어보기*

사용자가 카드에 호버하면 — *그 atmosphere 의 ambient 가 페이지에 *임시로* 합쳐짐*. *입어보기* 의 시각화.

### 동작

```
hover 카드:
  1. 카드 자체: scale(1.03), saturation 1.0
  2. 페이지: 그 atmosphere 의 ambient 가 *추가로* (기존 선택과 함께) 표시됨
  3. 호버 해제: 페이지가 *선택된 상태로* 부드럽게 복귀

선택된 카드:
  hover 시 페이지는 *변하지 않음* (이미 선택됨)
```

### 구현

```js
card.addEventListener('mouseenter', () => {
  if (!card.classList.contains('is-selected')) {
    addPreviewAmbient(atmosphereId);
  }
});

card.addEventListener('mouseleave', () => {
  if (!card.classList.contains('is-selected')) {
    removePreviewAmbient(atmosphereId);
  }
});

function addPreviewAmbient(id) {
  // Add atmosphere ambient temporarily to body
  document.documentElement.style.setProperty('--preview-blend', atmospheres[id].ambient);
}
```

CSS:

```css
body::after {
  /* preview layer — separate from selected blend */
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: var(--preview-blend, transparent);
  transition: background 1.4s ease;
  opacity: 0.6;
}
```

### 효과

사용자가 *체크박스를 누르는* 게 아니라 — *마우스를 그 위에 둘 때마다* 페이지가 *그 분위기로 변하면서* 사용자가 *입어보고 떠나도 됨*.

이게 *카테고리 선택* 과 *세계 산책* 의 결정적 차이.

---

## 7. State C — *분석으로의 전환*

이 forward beat 은 다른 자매 화면들과 *결정적으로 다름*:

```
images/forward:  "여기까지 잘 두었어요. / 이제, 다음으로."
music/forward:   "여기까지 들은 결을 잘 두었어요. / 이제, 다음 감정으로."
quotes/forward:  "여기까지 머문 문장들을 잘 두었어요. / 이제, 다음 분위기로."

atmosphere/forward:  ← 분석으로의 전환
  "여기까지 함께 와 주셔서 고마워요."
  "이제, 당신의 풍경을 만들어볼게요."
```

다른 화면들의 *"이제, 다음 ___ 로"* 는 *수평 이동*. atmosphere 의 *"풍경을 만들어볼게요"* 는 *수직 이동* — 분석으로의 *상승*.

### 시퀀스 (8초)

```
t = 0.0s    CTA warm
t = 0.5s    Canvas + 카드들 + ambient blend 모두 fade out (1.4s)
              orbs, grain 유지
t = 2.0s    검은 정적 + backdrop blur
t = 2.4s    첫 문장 reveal blur (1.6s)
              "여기까지 함께 와 주셔서 고마워요."
t = 4.0s    hold + fade
t = 6.0s    두 번째 문장 reveal blur
              "이제, 당신의 풍경을 만들어볼게요."
t = 8.4s    real app: AI 분석 화면으로 / demo: Intro 복귀
```

### 두 문장의 무게

| | 의미 |
|---|---|
| *"여기까지 함께 와 주셔서 고마워요."* | 사용자의 *전체 여정* 에 대한 honoring (이미지·소리·말·공간) |
| *"이제, 당신의 풍경을 만들어볼게요."* | *분석을 향한 약속* — 시스템이 사용자의 *풍경* 을 만들어낼 것 |

*"이해해볼게요"* 가 아닌 *"만들어볼게요"* — *분석* 이 아닌 *건축*. *사용자의 데이터로 무언가를 짓는다* 는 약속.

---

## 8. Next.js + Framer Motion 구현

### 8.1 디렉토리 구조

```
app/
  onboarding/
    atmosphere/
      page.tsx                    ← 분위기 선택 페이지
components/
  atmosphere/
    AtmosphereSelection.tsx       ← 메인 (3 상태)
    IntroState.tsx
    WorldsGrid.tsx                ← State B
    ForwardBeat.tsx
    WorldCard.tsx                 ← 단일 atmosphere 카드
hooks/
  useAtmospheres.ts               ← 선택 관리 + ambient blend 계산
data/
  atmospheres.ts                  ← 8 개 atmosphere 데이터
```

### 8.2 `data/atmospheres.ts`

```ts
export type Atmosphere = {
  id: string;
  name: string;
  nameEn: string;
  palette: string[];
  cardBg: string;          // linear-gradient
  ambient: string;         // radial-gradient (single)
  ambientPosition: string; // "top-center", "mid-left", etc.
  tone: 'warm' | 'cool' | 'neutral';
};

export const ATMOSPHERES: Atmosphere[] = [
  {
    id: 'dawn-city',
    name: '새벽 도시',
    nameEn: 'Dawn City',
    palette: ['#0F1620', '#2A3540', '#5A6878', '#8FA0AC', '#C8B69B'],
    cardBg: 'linear-gradient(165deg, #0F1620 0%, #2A3540 35%, #5A6878 70%, #8FA0AC 100%)',
    ambient: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(143, 160, 172, 0.10), transparent 60%)',
    ambientPosition: 'top-center',
    tone: 'cool',
  },
  {
    id: 'rainy-window',
    name: '비 오는 창가',
    nameEn: 'Rainy Window',
    palette: ['#1A2030', '#3A4555', '#6B7888', '#A8B0BC', '#D8DDE2'],
    cardBg: 'linear-gradient(180deg, #1A2030 0%, #3A4555 40%, #6B7888 75%, #A8B0BC 100%)',
    ambient: 'radial-gradient(ellipse 60% 50% at 0% 50%, rgba(107, 120, 136, 0.10), transparent 60%)',
    ambientPosition: 'mid-left',
    tone: 'cool',
  },
  // ... 6 more
];
```

### 8.3 `hooks/useAtmospheres.ts`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ATMOSPHERES, Atmosphere } from '@/data/atmospheres';

export function useAtmospheres() {
  const [selected, setSelected] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Compose ambient blend on body
  useEffect(() => {
    const selectedAmbients = selected
      .map((id) => ATMOSPHERES.find((a) => a.id === id)?.ambient)
      .filter(Boolean);
    document.documentElement.style.setProperty(
      '--atmosphere-blend',
      selectedAmbients.join(', ') || 'transparent'
    );

    // tier
    const body = document.body;
    body.classList.remove('atm-zero', 'atm-low', 'atm-mid', 'atm-full');
    if (selected.length === 0) body.classList.add('atm-zero');
    else if (selected.length === 1) body.classList.add('atm-low');
    else if (selected.length <= 3) body.classList.add('atm-mid');
    else body.classList.add('atm-full');

    // dominant tone
    const tones = selected
      .map((id) => ATMOSPHERES.find((a) => a.id === id)?.tone)
      .filter(Boolean);
    const warmCount = tones.filter((t) => t === 'warm').length;
    const coolCount = tones.filter((t) => t === 'cool').length;
    if (warmCount > coolCount) {
      body.setAttribute('data-dominant-tone', 'warm');
    } else if (coolCount > warmCount) {
      body.setAttribute('data-dominant-tone', 'cool');
    } else {
      body.removeAttribute('data-dominant-tone');
    }
  }, [selected]);

  // Preview ambient on hover
  useEffect(() => {
    if (previewing) {
      const atm = ATMOSPHERES.find((a) => a.id === previewing);
      if (atm) {
        document.documentElement.style.setProperty('--preview-blend', atm.ambient);
      }
    } else {
      document.documentElement.style.setProperty('--preview-blend', 'transparent');
    }
  }, [previewing]);

  return { atmospheres: ATMOSPHERES, selected, toggle, previewing, setPreviewing };
}
```

### 8.4 `components/atmosphere/WorldCard.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { Atmosphere } from '@/data/atmospheres';

export function WorldCard({
  atmosphere,
  selected,
  onToggle,
  onPreviewStart,
  onPreviewEnd,
}: {
  atmosphere: Atmosphere;
  selected: boolean;
  onToggle: () => void;
  onPreviewStart: () => void;
  onPreviewEnd: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      onMouseEnter={onPreviewStart}
      onMouseLeave={onPreviewEnd}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative
        aspect-[3/4]
        rounded-sm
        cursor-pointer
        flex flex-col justify-between
        p-5 pt-7
        text-left
        overflow-hidden
        transition-all duration-700
        ${selected
          ? 'border border-rose/[0.55] saturate-100'
          : 'border border-bone/[0.35] saturate-[0.85] hover:border-beige/[0.32]'}
      `}
      style={{ background: atmosphere.cardBg }}
    >
      {selected && (
        <span className="absolute top-3 right-3 text-rose text-[10px]">◆</span>
      )}

      <h3 className="
        font-display italic font-light
        text-[clamp(22px,2.4vw,28px)]
        leading-[1.15]
        text-beige
        tracking-tight
        relative z-10
      ">
        {atmosphere.name}
      </h3>

      <div className="flex gap-1 mt-auto relative z-10">
        {atmosphere.palette.slice(0, 4).map((color, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: color }}
          />
        ))}
      </div>
    </motion.button>
  );
}
```

---

## 9. 정적 미리보기

```
taste-os/atmosphere/
├── index.html
├── style.css
└── script.js
```

머지 후 `kimbany.github.io/taste-os/atmosphere/`:

1. **State A** — Intro 6초
2. ***"시작하기"*** 클릭
3. **State B** — 8 개 분위기 세계 등장:
   - **각 카드 위에 마우스 올리기** — 페이지의 ambient 가 *그 atmosphere 로 변함* (preview)
   - **클릭** — 그 atmosphere 가 *선택됨* (◆ 표시), ambient 가 *계속 유지*
   - 여러 개 선택 → ambient 가 *합쳐짐*
4. **2-4 개 선택 후 페이지 관찰**:
   - 빛 구체가 *주된 톤* 으로 변함 (warm/cool)
   - 배경 ambient 가 *여러 atmosphere 의 합성*
5. ***"이제 당신의 분위기를 이해해볼게요"*** 클릭
6. **State C** — *분석 톤* 의 Threshold Beat (8초)

특히 *Cold Solitude → Warm Film Tone → Slow Night Air* 순으로 호버해보세요. 페이지의 분위기가 *cool → warm → 다시 dim warm* 으로 *실시간으로* 변하는 것을 *몸으로* 느낄 수 있어요.

---

## 닫는 말

이 페이지의 진짜 디자인 의도:

> ***사용자가 *체크박스를 누르고 있다* 고 느끼지 않고,***  
> ***자기 *세계를 만들고 있다* 고 느끼게.***

이를 위해:
- 카드 위에 마우스를 올릴 때마다 *페이지가 그 분위기로 변함* (preview)
- 클릭하면 *그 변화가 머무름* (selection)
- 여러 카드를 선택하면 *여러 분위기가 합쳐져* — 사용자만의 *고유한 세계*
- 카운터가 *"머무름" + "당신의 공기" + "당신만의 세계"* 톤

엔지니어가 이 화면을 빌드할 때 마지막 검사:

> ***카드에 호버할 때 페이지의 ambient 가 *실시간으로 변하는가*?***

만약 *no* — 그건 *시그니처가 빠진* 것. 호버 preview 없이는 *체크박스 UI* 와 다를 바 없음.

이 *호버 preview* 가 작동할 때 — 이 페이지는 *분위기 선택 화면* 이 아닌 *세계 합성 자리* 가 됩니다.
