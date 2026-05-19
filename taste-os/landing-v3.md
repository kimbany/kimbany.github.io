# Taste OS — Landing Page v3 (Full · Canonical)

> 일곱 막의 영화. 한 사람이 *호기심* 에서 *조용한 갈망* 으로 흘러가는 여정.

이 문서는 Taste OS 의 **캐노니컬 전체 랜딩 페이지** 사양입니다. `landing-v2` 의 6막 구조를 기반으로:

1. **새 섹션 추가**: *Emotional Reflection* — AI 내레이션 샘플을 보여주는 4번째 막
2. **마우스 시차 통합**: `hero.md` 의 damped lerp 시차가 *전체 페이지* 에서 작동
3. **감정의 호 (Emotional Arc)** 가 분명: 호기심 → 알아봄 → 자기 반영 → 몰입 → 조용한 갈망 → 부드러운 초대

함께 읽기: `landing-v2.md` (이전 버전), `hero.md` (parallax 시스템), `motion.md`, `tokens.md`.

구현: `taste-os/landing-v3/index.html` + `style.css` + `script.js`.

이 문서는 `landing-v2.md` 를 *대체* — 새 프로젝트는 v3 를 기본으로.

---

## 목차

0. [감정의 호 (Emotional Arc)](#0-감정의-호-emotional-arc)
1. [일곱 막의 구조](#1-일곱-막의-구조)
2. [Act 1 — Hero](#2-act-1--hero)
3. [Act 2 — Atmosphere Philosophy](#3-act-2--atmosphere-philosophy)
4. [Act 3 — Taste Genome Preview](#4-act-3--taste-genome-preview)
5. [Act 4 — Emotional Reflection (NEW)](#5-act-4--emotional-reflection-new)
6. [Act 5 — Identity Evolution Preview](#6-act-5--identity-evolution-preview)
7. [Act 6 — Sharing Experience Preview](#7-act-6--sharing-experience-preview)
8. [Act 7 — Final Atmospheric CTA](#8-act-7--final-atmospheric-cta)
9. [전역 시스템 — Parallax · Orbs · Dust](#9-전역-시스템--parallax--orbs--dust)
10. [스크롤 안무](#10-스크롤-안무)
11. [구현 노트](#11-구현-노트)

---

## 0. 감정의 호 (Emotional Arc)

대부분의 랜딩은 *정보의 호* 를 따릅니다 — features → benefits → pricing → signup. Taste OS 랜딩은 *감정의 호* 를 따라요.

```
                                                                            
   Act 1 Hero                  →  호기심 (curiosity)                       
        "당신은 계속 변하고 있습니다."                                       
                                                                            
   Act 2 Atmosphere Philosophy →  알아봄 (recognition)                     
        "당신이 모은 것들에는 패턴이 있어요."                                
                                                                            
   Act 3 Taste Genome           →  자기 반영 (self-reflection)              
        4 장의 카드 — 풍경은 사람마다 다릅니다                                
                                                                            
   Act 4 Emotional Reflection   →  몰입 (immersion)                        
        "예전보다 조금 더 따뜻한 것들에 마음이 머물고 있어요."                
                                                                            
   Act 5 Identity Evolution     →  조용한 갈망 (quiet longing)              
        시간이 지나면, 풍경도 함께 움직여요                                  
                                                                            
   Act 6 Sharing Preview        →  의도된 정적 (intentional pause)         
        카드는 다른 사람의 피드에 들어가지 않아요                            
                                                                            
   Act 7 Final CTA              →  부드러운 초대 (soft invitation)         
        "조금 더 나다운 방향으로."                                            
                                                                            
```

### 핵심 — 감정은 *말하지 않고 옮긴다*

각 막은 *다음 감정으로의 다리* 입니다. 사용자가 *왜 다음을 봐야 하는지* 를 명시적으로 말하지 *않아요*. 시각과 카피가 *자연스러운 흐름* 을 만들 뿐.

---

## 1. 일곱 막의 구조

```
                                                                            
                                                          ▼ 스크롤           
                                                                            
   ┌──────────────────────────────────────────────────────────┐             
   │ Act 1  · HERO                            1 viewport       │             
   │      · 9초 시네마틱 진입 + 마우스 시차                      │             
   ├──────────────────────────────────────────────────────────┤             
   │ Act 2  · ATMOSPHERE PHILOSOPHY          3 viewports        │             
   │      · 세 가지 관찰 — 모음 · 공기 · 변화                    │             
   ├──────────────────────────────────────────────────────────┤             
   │ Act 3  · TASTE GENOME PREVIEW           ~ 1.5 viewports    │             
   │      · 4 장의 카드 + honesty signal                        │             
   ├──────────────────────────────────────────────────────────┤             
   │ Act 4  · EMOTIONAL REFLECTION (NEW)     ~ 1.2 viewports    │             
   │      · 4 개의 AI 내레이션 발췌                              │             
   ├──────────────────────────────────────────────────────────┤             
   │ Act 5  · IDENTITY EVOLUTION              ~ 1.5 viewports   │             
   │      · 3 챕터 — 봄, 여름, 가을                              │             
   ├──────────────────────────────────────────────────────────┤             
   │ Act 6  · SHARING PREVIEW                 ~ 1.2 viewports   │             
   │      · 3 카드 + "피드가 아니라, 방"                         │             
   ├──────────────────────────────────────────────────────────┤             
   │ Act 7  · FINAL CTA                       1 viewport        │             
   │      · door of light + "조금 더 나다운 방향으로"            │             
   └──────────────────────────────────────────────────────────┘             
                                                                            
   전체: 약 10–12 viewports                                                  
                                                                            
```

### 전역 레이어 (모든 막에 걸쳐)

- 빛 구체 4개 — 페이지 전체에 떠다님, 마우스 시차로 미세하게 따라옴
- 먼지 입자 24개 — Desktop only, 위로 흐름
- 그레인 5.5% — 8fps stop-motion
- Sigil 좌상단 — 항상 고정, 호흡

---

## 2. Act 1 — Hero

`hero.md` 의 디자인 그대로. 하지만 한 가지 변형:

### v3 에서의 변경

| | hero.md (standalone) | landing-v3 (Act 1) |
|---|---|---|
| 페이지 길이 | 100vh, no scroll | 100vh, scroll 가능 |
| Wordmark 위치 | 가운데 하단 | 같음 |
| 스크롤 hint | 없음 | **있음** — *"↓ 천천히 내려가요"* (t = 8.6s 등장) |
| 진입 시간 | 9.0s | 동일 |
| 마우스 시차 | full strength | 동일 |

스크롤 힌트는 9초의 진입 안무 *끝* 에 등장 — 사용자가 *명상의 자리* 를 충분히 가진 후에 *부드러운 다음 안내*.

```html
<p class="scroll-hint" data-reveal="hint">↓ 천천히 내려가요</p>
```

### 첫 스크롤이 일어나는 순간

```
스크롤 1px 발생
  ↓
배경 그라데이션이 *살짝 따뜻해짐* (rose 0% → 4%)
  ↓
헤드라인이 위로 살짝 페이드 (parallax 가 아닌 scroll-driven)
  ↓
Act 2 가 viewport 진입 시작
```

이 *첫 스크롤의 반응* 이 *시네마틱 시청 경험* 을 강화. 사용자는 *영화가 자기 스크롤에 반응한다* 고 무의식적으로 느낍니다.

---

## 3. Act 2 — Atmosphere Philosophy

세 가지 관찰. 각각 한 viewport.

### 3.1 구조 — 한 viewport 한 메시지

```
                                                                          
   ─ 하나                                                                  
                                                                          
                                                                          
   당신이 모은 것들에는                                                    
   패턴이 있어요.                                                           
                                                                          
   사진, 음악, 단어, 마음이 머문 자리 — 그것들 모두 당신입니다.            
                                                                          
                                                                          
                                                                          
```

### 3.2 세 가지 관찰

**ⅰ. 하나 — 모음 (Collection)**

```
당신이 모은 것들에는 패턴이 있어요.

사진, 음악, 단어, 마음이 머문 자리 — 그것들 모두 당신입니다.
```

배경: pure night, orb 시차 활성

**ⅱ. 둘 — 공기 (Atmosphere)**

```
그 패턴에는 분위기가 있고요.

어떤 빛, 어떤 시간, 어떤 온도. 당신만의 공기입니다.
```

배경: night + ember 2% radial 좌상단

**ⅲ. 셋 — 변화 (Evolution)**

```
그리고 그 분위기는 천천히 변해갑니다.

당신의 마음이 그러는 것처럼.
```

배경: night + silver-blue 2% radial 우하단

### 3.3 진입 모션 — 각 관찰

```
1. 섹션이 viewport 30% 진입 시 → 라벨 fade in (─ 하나)
2. 200ms 후 → lead 문장 reveal blur (1.6s)
3. 900ms 후 → 헤어라인 draws in (1.0s)
4. 1.1s 후 → trail 문장 fade in (1.0s)
5. (영문 mirror 문장이 있다면) 1.4s 후 fade in mist 색
```

총 reveal 시간: 약 3.5초. 사용자가 *충분히 머무를 시간*.

### 3.4 영문 보조

각 관찰의 한국어 trail 문장 아래에 *작은 mist 색* 으로 영문 한 줄. *번역이 아닌 sibling utterance* (per `voice.md`):

```
ⅰ. you are someone who collects what matters. none of it was random.
ⅱ. what you have collected has an atmosphere. a light, an hour, a temperature.
ⅲ. and it changes, slowly. as you do.
```

---

## 4. Act 3 — Taste Genome Preview

`landing-v2` 와 동일. 4 장의 카드.

### 4 카드

| Card | KR | Atmosphere | Mirror Line |
|---|---|---|---|
| Quiet Warmth | 조용한 따뜻함 | 늦은 오후 · 단일 광원 · 린넨 | 큰 빛보다, 작은 빛이 오래 가는 걸 알아요. |
| Urban Nostalgia | 도시의 향수 | 자정 · 도시 · 비 온 직후 | 사람들로 가득한 곳에서 가장 자기 자신이에요. |
| Emotional Minimalism | 감정의 미니멀리즘 | 정오 · 단일 색 · 여백 | 조용한 것이 깊을 수 있다는 걸, 일찍부터 알았어요. |
| Warm Futurism | 따뜻한 미래 | 새벽 · 빛 · 부드러운 금속 | 내일도 다정할 수 있다고 믿어요. |

### Honesty signal

카드 아래:

```
당신의 풍경은 이 넷 중 하나가 아닐 거예요.
완전히 다른 무언가일 가능성이 더 큽니다.
```

이게 *마케팅 거짓말* 의 정반대. 샘플을 보여주되 *샘플이 아닐 가능성* 을 명시.

---

## 5. Act 4 — Emotional Reflection (NEW)

**이 막이 v3 의 새로움.** AI 내레이션의 *실제 모습* 을 4 개의 짧은 인용으로 보여줌.

### 5.1 구조

```
                                                                            
   ─ AI 가 당신에 대해 적는 글                                              
                                                                            
                                                                            
   분석이 아니라, 알아봄.                                                   
                                                                            
                                                                            
   ──────                                                                  
                                                                            
                                                                            
   "예전보다 조금 더 따뜻한 것들에                                          
    마음이 머물고 있어요."                                                  
                                                                            
                                                                            
   ──────                                                                  
                                                                            
                                                                            
   "완벽함보다 인간적인 흔적에                                              
    오래 시선이 머물기 시작했어요."                                          
                                                                            
                                                                            
   ──────                                                                  
                                                                            
                                                                            
   "낮 시간보다 늦은 오후에                                                 
    두는 것이 많아졌어요."                                                  
                                                                            
                                                                            
   ──────                                                                  
                                                                            
                                                                            
   "사람들로 가득한 곳에서                                                  
    가장 자기 자신이 되는 사람이에요."                                       
                                                                            
                                                                            
                                                                            
   대부분의 AI 는 당신을 분류해요.                                          
   Taste OS 는 당신을 알아봐요.                                              
                                                                            
                                                                            
```

### 5.2 각 인용의 시각

- 폰트: Cormorant Garamond italic 300, clamp(22px, 2.8vw, 30px)
- 색: `beige` 95%
- 본문 폭: 540px
- 정렬: 가운데
- 따옴표 *없음* (인용 카드 자체가 인용이라는 뜻)
- 인용 사이 헤어라인 — 32px wide, bone 35%

### 5.3 모션 — 순차 reveal

```
섹션 viewport 30% 진입 시:
  → 라벨 fade in (─ AI 가 당신에 대해 적는 글)
  → 200ms: subtext fade in
  → 800ms: 첫 헤어라인 draws in
  → 1.0s: 첫 인용 reveal blur (1.6s)
  → 2.4s: 두 번째 헤어라인
  → 2.6s: 두 번째 인용 reveal blur
  → ... (각 인용 사이 1.6s 간격)
  → 마지막 인용 후 generous gap → 닫는 한 줄 fade in
```

총 reveal 시간: 약 8초. 사용자가 각 인용을 *읽을 시간* 을 가짐.

### 5.4 닫는 한 줄

```
대부분의 AI 는 당신을 분류해요.
Taste OS 는 당신을 알아봐요.
```

이 한 줄이 **이 막의 정서적 절정**. 사용자가 *이미 4 인용을 읽었으므로* 이 진술은 *주장* 이 아니라 *결론* 처럼 느껴짐.

영문 sibling:

```
most AI sorts you.
Taste OS notices you.
```

### 5.5 왜 이 막이 가장 중요한가

다른 모든 막은 *시각 / 카피 / 모션* 으로 *감정* 을 전달해요. 이 막은 *제품의 핵심 주장* 을 *말합니다* — 다만 *광고처럼 말하지 않고*, *발견처럼 말함*.

사용자가 이 막을 끝낼 때:

> ***"이 AI 는 다른 AI 와 다르네."*** 

이 직감이 *purchasing intent* 로 직결됩니다. *기능 비교* 없이.

---

## 6. Act 5 — Identity Evolution Preview

`landing-v2` 와 거의 동일. 3 챕터 + 닫는 italic 인용.

### 3 챕터

| 계절 | 이름 | 관찰 |
|---|---|---|
| 봄 | 북쪽의 린넨 | 처음 만나는 것들에 자주 멈춰 섰어요. |
| 여름 | 짠 바다의 모더니즘 | 조금 더 멀리, 자주 나갔어요. |
| 가을 | 옻칠한 황혼 | 다시 한 방, 한 창, 한 사람으로 좁아졌어요. |

### 배경 그라데이션 마이그레이션

왼쪽 (봄) → 오른쪽 (가을) 으로 *눈에 보이는 색의 이동*:

```css
.evolution::before {
  background: linear-gradient(
    90deg,
    rgba(143, 160, 172, 0.05) 0%,    /* spring — cool */
    rgba(217, 166, 108, 0.04) 50%,   /* summer — warm */
    rgba(176, 118, 114, 0.06) 100%   /* autumn — rose */
  );
}
```

### 닫는 italic 인용

```
"2026년, 차가운 완벽함에서 천천히 멀어졌어요.
 대신 따뜻함 쪽으로 가까워졌어요. 천천히, 모르는 사이에."
```

---

## 7. Act 6 — Sharing Experience Preview

`landing-v2` 와 동일. 3 sample card + 카피 *"카드는 다른 사람의 피드에 들어가지 않아요"*.

### 시각

3 카드가 약간 기울어 floating, 호버 시 idle drift 정지.

### 닫는 카피

```
카드는 다른 사람의 피드에 들어가지 않아요.
필요한 사람에게, 직접 가요.
```

이 *문장의 무게* — 사용자가 *공유 = 광고에 노출* 의 가정에서 벗어남.

---

## 8. Act 7 — Final Atmospheric CTA

`landing-v2` 의 final 과 동일.

### 시각

- 한 가운데 *Door* — 따뜻한 빛의 수직 사각형
- Door 마우스 시차 — 부드러운 cursor follow
- 닫는 헤드라인: *"조금 더 나다운 방향으로."*
- CTA: *"─── Taste OS 시작하기 ───"*
- whisper: *"어디서든, 잠시 머물러도 좋아요."*

### Door 마우스 시차 — Act 7 의 특수 모션

다른 막의 시차보다 *더 강함* (±14px) — 사용자가 *방의 입구에 가까이 다가가는* 느낌:

```ts
finalSection.addEventListener('mousemove', (e) => {
  const rect = finalSection.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  targetX = ((e.clientX - cx) / rect.width) * 14;
  targetY = ((e.clientY - cy) / rect.height) * 10;
});
```

door 가 *살짝 사용자를 따라* — 영혼에 가까이 갈수록 *방이 그를 보고 있음*.

### Footer

```
taste.os · 2026 · 개인정보 · 문의
```

11px, mist 40%, 매우 작게.

---

## 9. 전역 시스템 — Parallax · Orbs · Dust

### 9.1 마우스 시차 — 전 페이지

`hero.md` §3 의 시스템을 *전체 페이지* 에 확장.

```ts
// 페이지 전체에 적용되는 글로벌 시차
function setupGlobalParallax() {
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function tick() {
    currentX += (targetX - currentX) * 0.04;  // slightly slower for scroll page
    currentY += (targetY - currentY) * 0.04;
    document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
    document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```

### 9.2 깊이별 시차 — 막 별로 다름

```
Act 1 (Hero):  headline ±4px, orbs ±12/8/10/4
Act 2-6:       콘텐츠 ±2px (스크롤 중이라 더 작게), orbs ±8/6/8/3
Act 7 (CTA):   door ±14px (가장 강함)
```

### 9.3 빛 구체 (Orbs) — `position: fixed`

페이지가 스크롤되어도 orbs 는 *viewport 에 고정* — 시각의 *상수*.

```css
.orb {
  position: fixed;
  z-index: 1;
  /* drifts via animation + responds to mouse */
}
```

각 orb 의 시차 깊이:

```css
.orb-1 { --depth: 12px; /* rose, foreground */ }
.orb-2 { --depth: 8px;  /* silver-blue */ }
.orb-3 { --depth: 10px; /* rose, mid */ }
.orb-4 { --depth: 4px;  /* sand, background */ }
```

### 9.4 먼지 입자 — Desktop only

24 입자, 위로 흐름. Pocket 에서는 0개 (성능 + 시각 정리).

```js
const dustCount = window.innerWidth < 768 ? 0 : 
                  window.innerWidth < 1280 ? 18 : 24;
```

### 9.5 그레인 — 페이지 전역

`position: fixed; z-index: 100;` — 모든 콘텐츠 *위* 에 미세한 떨림. 사용자는 *알아채지 못함*.

---

## 10. 스크롤 안무

### 10.1 IntersectionObserver — 각 막의 진입

```ts
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const section = entry.target;
      section.classList.add('is-in-view');

      // 자식 reveal 요소들에 staggered class 추가
      section.querySelectorAll('[data-reveal]').forEach((el) => {
        const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(() => el.classList.add('is-revealed'), delay);
      });

      observer.unobserve(section);
    });
  },
  {
    threshold: 0.25,
    rootMargin: '0px 0px -8% 0px',
  }
);

document.querySelectorAll('[data-section]').forEach((s) => observer.observe(s));
```

### 10.2 스크롤 속도 인식

빠르게 스크롤하면 reveal 가 *압축* 됨 — staggered delay 가 *최소* 로:

```ts
let lastScrollY = 0;
let scrollSpeed = 0;

window.addEventListener('scroll', () => {
  const now = window.scrollY;
  scrollSpeed = Math.abs(now - lastScrollY);
  lastScrollY = now;
}, { passive: true });

// reveal 안에서:
const isRushing = scrollSpeed > 50;
const delay = isRushing ? Math.min(originalDelay, 200) : originalDelay;
```

천천히 스크롤하는 사용자는 *완전한 시네마틱 경험*. 빠르게 스크롤하는 사용자도 *답답하지 않음*.

### 10.3 막 사이의 호흡 — `min-height: 100vh`

각 막은 *최소 한 viewport* 의 높이를 가짐. 사용자가 *한 막을 충분히 머무를* 가능성을 디자인적으로 보장.

예외:
- Act 1 (Hero): 정확히 100vh
- Act 7 (CTA): 정확히 100vh
- 나머지 막: 콘텐츠가 더 길면 자연스럽게 늘어남

---

## 11. 구현 노트

### 11.1 정적 미리보기 (이 저장소)

```
taste-os/landing-v3/
├── index.html      ← 7 막 전체
├── style.css       ← 모든 스타일
└── script.js       ← 시차 + 스크롤 reveal + 먼지
```

### 11.2 Next.js 실제 프로젝트

```
app/
  page.tsx                      ← Landing 페이지
components/
  hero/                          ← `hero.md` 의 컴포넌트들 그대로
  sections/
    AtmospherePhilosophy.tsx
    TasteGenomePreview.tsx
    EmotionalReflection.tsx     ← NEW
    IdentityEvolution.tsx
    SharingPreview.tsx
    FinalCTA.tsx
  atmosphere/
    GlobalParallax.tsx           ← 전 페이지에 시차 적용
    LightOrbs.tsx                ← position: fixed
    DustField.tsx
    Grain.tsx
    Sigil.tsx
hooks/
  useGlobalParallax.ts
  useScrollSpeed.ts
```

### 11.3 Emotional Reflection 컴포넌트 (NEW)

```tsx
'use client';

import { motion } from 'framer-motion';

const reflections = [
  '예전보다 조금 더 따뜻한 것들에\n마음이 머물고 있어요.',
  '완벽함보다 인간적인 흔적에\n오래 시선이 머물기 시작했어요.',
  '낮 시간보다 늦은 오후에\n두는 것이 많아졌어요.',
  '사람들로 가득한 곳에서\n가장 자기 자신이 되는 사람이에요.',
];

export function EmotionalReflection() {
  return (
    <section className="
      min-h-screen
      flex flex-col items-center justify-center
      px-5 py-32
      max-w-text mx-auto
      text-center
    ">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.0 }}
        className="text-mist text-xs tracking-[0.08em] lowercase opacity-65 mb-4"
      >
        ─ AI 가 당신에 대해 적는 글
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, delay: 0.4 }}
        className="text-mist text-sm tracking-wide mb-24"
      >
        분석이 아니라, 알아봄.
      </motion.p>

      <div className="flex flex-col items-center gap-16">
        {reflections.map((text, i) => (
          <div key={i} className="flex flex-col items-center gap-8">
            <motion.hr
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-8 h-px bg-bone opacity-35 border-0"
              style={{ transformOrigin: 'center' }}
            />

            <motion.blockquote
              initial={{ opacity: 0, filter: 'blur(14px)', letterSpacing: '0.10em' }}
              whileInView={{ opacity: 1, filter: 'blur(0)', letterSpacing: '-0.005em' }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.30, 1] }}
              className="
                font-display italic font-light
                text-[clamp(22px,2.8vw,30px)]
                leading-[1.45]
                text-beige
                max-w-[540px]
                whitespace-pre-line
              "
            >
              {text}
            </motion.blockquote>
          </div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.6, delay: 0.8 }}
        className="
          font-display italic font-light
          text-[clamp(18px,2.2vw,22px)]
          leading-[1.55]
          text-beige
          mt-32
          max-w-[480px]
        "
      >
        대부분의 AI 는 당신을 분류해요.<br/>
        Taste OS 는 당신을 알아봐요.
      </motion.p>
    </section>
  );
}
```

---

## 닫는 말

이 일곱 막은 *기능 비교 표* 의 정반대예요. 사용자는 *제품이 무엇을 하는지* 학습하지 않고, *제품과 함께 있을 때 어떻게 느낄지* 를 *미리 살아봄*.

엔지니어가 이 페이지를 빌드할 때 마지막 검사:

> ***사용자가 이 페이지를 떠나는 순간 — 한 문장을 *기억* 할 것인가?***

기억할 수 있는 문장 후보:
- *"당신은 계속 변하고 있습니다."* (Hero)
- *"분석이 아니라, 알아봄."* (Reflection)
- *"대부분의 AI 는 당신을 분류해요. Taste OS 는 당신을 알아봐요."* (Reflection 닫기)
- *"조금 더 나다운 방향으로."* (Final CTA)

이 네 문장 중 *적어도 하나* 가 사용자의 메모리에 남는다면 — 페이지는 성공이에요. *전환* 은 *부수적*. *기억* 이 주.
