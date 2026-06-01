# Taste OS — Motion System / 호흡

> 모션은 장식이 아닙니다. 모션이 *감정* 입니다.
> 빠르면 즉답이 되고, 느리면 *생각* 이 됩니다. 우리는 생각을 디자인해요.

이 문서는 Taste OS의 전체 모션 시스템 사양입니다. `system.md` §6 의 "Breath" 언어를 *완전한 구현 가이드* 로 확장했어요. 모든 페이지·컴포넌트·전환의 모션 결정이 여기서 비롯됩니다.

함께 읽기: `system.md` (디자인 토큰 + 짧은 Breath 정의), 각 페이지 doc 의 §모션 섹션.

---

## 목차

0. [철학 — 모션은 감정](#0-철학--모션은-감정)
1. [다섯 가지 원형 운동 (Five Primal Motions)](#1-다섯-가지-원형-운동-five-primal-motions)
2. [타이밍 시스템 — 시간의 어휘](#2-타이밍-시스템--시간의-어휘)
3. [이징 (Easing) — 비대칭의 호흡](#3-이징-easing--비대칭의-호흡)
4. [모션 위계 — 무엇이 어떻게 움직이는가](#4-모션-위계--무엇이-어떻게-움직이는가)
5. [페이지 전환 (Page Transitions)](#5-페이지-전환-page-transitions)
6. [온보딩 시네마틱](#6-온보딩-시네마틱)
7. [로딩 상태 — 네 가지 종류](#7-로딩-상태--네-가지-종류)
8. [분위기 이동 (Atmosphere Shifts)](#8-분위기-이동-atmosphere-shifts)
9. [떠다니는 군집 (Floating Clusters)](#9-떠다니는-군집-floating-clusters)
10. [시네마틱 페이드 — Reveal Blur](#10-시네마틱-페이드--reveal-blur)
11. [감정적 호버 상태 (Emotional Hover)](#11-감정적-호버-상태-emotional-hover)
12. [환경 입자 시스템 (Ambient Particles)](#12-환경-입자-시스템-ambient-particles)
13. [메모리 전환 — Drift Chapters](#13-메모리-전환--drift-chapters)
14. [대시보드 인터랙션](#14-대시보드-인터랙션)
15. [구현 아키텍처 — Framer Motion + CSS](#15-구현-아키텍처--framer-motion--css)
16. [Reduced Motion — 동등한 별도 모드](#16-reduced-motion--동등한-별도-모드)
17. [성능 예산](#17-성능-예산)
18. [모션이 절대 *하지 않는* 것들](#18-모션이-절대-하지-않는-것들)

---

## 0. 철학 — 모션은 감정

빠른 모션은 *효율* 의 신호입니다. 느린 모션은 *생각* 의 신호입니다. 같은 액션이라도 — 화면을 바꾸는 일조차 — *속도* 에 따라 *완전히 다른 메시지* 가 됩니다.

```
0.2초 페이드   → "끝났다"
1.0초 호흡    → "받아들이고 있다"
2.4초 시네마틱 → "기억해 주세요"
```

세 문장이 다른 *행동* 을 의미하지 않아요. *같은 행동* 의 *다른 감정* 입니다.

### Taste OS 모션의 일곱 원칙

1. **호흡이 시간 단위.** 0.9–1.4초가 페이지의 *심박*. 그보다 빠르면 *알림* 이 되고, 느리면 *영화* 가 됩니다. 우리는 두 가지 모두 *상황에 따라* 사용해요.
2. **들숨은 빠르고, 날숨은 느리다.** 등장 0.9s, 사라짐 1.4s. *비대칭이 호흡의 본질*. 대칭은 *기계의 박자*.
3. **펄스, 플래시 아님.** Beacon, Sigil 같은 주의 끄는 요소는 *사인 곡선* 으로 호흡 (0.5–0.7Hz). Taste OS에서 *깜빡임* 은 없습니다.
4. **블러로 등장.** 새 텍스트는 `blur(14px) → blur(0)` 로 *초점이 맞춰지듯* 등장. 슬라이드도, 페이드만도 아닌 *집중* 의 메타포.
5. **크로스페이드, 와이프 아님.** 표면 간 전환은 *겹침* — 0.6s overlap. 잘림이 아닌 *흐름*.
6. **600ms 심박.** 모든 미세 인터랙션 (저장, 호버 응답) 의 기본 단위. 빠르면 기계적, 느리면 굼떠 보임. *600ms는 사람이 생각하는 시간*.
7. **물리는 *오브젝트* 에만.** UI 크롬은 규율있게. 종이, 디스크, 카드 같은 *오브젝트* 만 settle 물리 (오버슈트 2%, 1.2초 정착).

---

## 1. 다섯 가지 원형 운동 (Five Primal Motions)

모든 다른 애니메이션은 *이 다섯* 의 조합입니다.

### Breath — 호흡 (등장과 사라짐)

비대칭 들숨과 날숨. 시스템의 *주된* 운동.

```ts
const Breath = {
  in:    { duration: 0.9,  ease: 'expo.out'   /* cubic-bezier(0.16, 1, 0.30, 1) */ },
  hold:  { duration: 0.3,  ease: 'standard' },
  out:   { duration: 1.4,  ease: 'expo.in'    /* cubic-bezier(0.70, 0, 0.84, 0) */ },
};
```

- **들숨 (in)** — 빠르게 형성. 사용자가 *기다리지 않게* 함.
- **날숨 (out)** — 느리게 사라짐. *떠나는 일이 더 크다는* 영화의 문법.

### Drift — 표류 (지속적 환경 운동)

화면 위 *살아 있는* 느낌을 주는 영구 운동. 빛 구체 (orbs), 카드 idle 부유.

```ts
const Drift = {
  duration: 36,                  // seconds, very slow
  ease: 'easeInOut',             // sinusoidal
  repeat: Infinity,
  pattern: 'figure-eight',       // or 'circular', 'random'
};
```

각 객체는 *다른 위상* 으로 시작 — 동시에 같은 위치에 있는 것 방지.

### Settle — 정착 (물리 기반 착지)

종이가 떨어지듯. 카드, 이미지 업로드, 슬라이더 손 떼는 순간.

```ts
const Settle = {
  duration: 1.2,
  ease: 'spring(0.34, 1.18, 0.64, 1)',  // 2% overshoot, returns
  property: 'translateY',
};
```

- 12px → 0px 이동, 2% 오버슈트 후 정착
- *UI 크롬에는 쓰지 않습니다*. 오브젝트 전용.

### Reveal — 드러남 (블러로 초점 맞추기)

텍스트, Taste Name, Mirror line 의 등장 방식.

```ts
const Reveal = {
  duration: 1.6,
  ease: 'expo.out',
  filter: ['blur(14px)', 'blur(0px)'],
  letterSpacing: ['0.12em', '0.03em'],  // 따라서 텍스트가 *조여지듯* 형성
};
```

이건 *Taste OS의 가장 시그니처* 인 모션. 다른 어떤 제품도 텍스트를 이렇게 등장시키지 않아요.

### Pulse — 박동 (사인 곡선 주의)

Beacon, 호흡하는 점, Sigil. *플래시가 아닌 호흡*.

```ts
const Pulse = {
  duration: 3.6,                 // 0.6Hz
  ease: 'easeInOut',
  repeat: Infinity,
  property: 'box-shadow OR opacity',
  intensity: 0.10,               // very subtle
};
```

깜빡임 없음. *사라지지 않음*. 단지 *깊이 호흡*.

---

## 2. 타이밍 시스템 — 시간의 어휘

```css
:root {
  /* === 미세 (micro) — 인스턴트 응답 === */
  --t-instant:    0.0s;          /* state change with no animation */
  --t-fast:       0.20s;         /* hover lift, focus ring */

  /* === 기본 (base) — 사람이 생각하는 시간 === */
  --t-base:       0.6s;          /* heartbeat: most micro-interactions */

  /* === 호흡 (breath) — 페이지의 심박 === */
  --t-breath-in:  0.9s;
  --t-hold:       0.3s;
  --t-breath-out: 1.4s;

  /* === 드러남 (reveal) — 텍스트, 정체성 === */
  --t-reveal:       1.6s;
  --t-reveal-slow:  1.8s;
  --t-reveal-climax: 2.0s;       /* Mirror line, Taste Name */

  /* === 시네마틱 (cinematic) — 영화의 비트 === */
  --t-cinematic:    2.4s;        /* threshold beat sentences */
  --t-listening:    8.0s;        /* per "듣는 중" sentence */
  --t-anchor-word:  2.0s;        /* per Constitution anchor word */

  /* === 환경 (ambient) — 무한 반복 === */
  --t-orb-drift:    42s;
  --t-disc-spin:    14s;
  --t-card-drift:   10s;
  --t-pulse:        3.6s;        /* Beacon */
  --t-sigil-breath: 3.6s;
  --t-grain-shift:  0.6s;        /* 4 steps, ≈8fps */
}
```

### 시간 선택 가이드

| 인터랙션 | 토큰 | 이유 |
|---|---|---|
| 호버 lift | `--t-fast` (0.2s) | 사용자가 *지금* 그 위에 있어야 함 |
| 저장 acknowledgment | `--t-base` (0.6s) | 사람이 *받아들이는* 시간 |
| 카드 등장 | `--t-breath-in` (0.9s) | 호흡 안의 들숨 |
| 카드 사라짐 | `--t-breath-out` (1.4s) | 호흡 안의 날숨 |
| 헤드라인 reveal | `--t-reveal-slow` (1.8s) | 시각의 *초점 맞춤* |
| Mirror line | `--t-reveal-climax` (2.0s) | 페이지의 절정 |
| Threshold 문장 | `--t-cinematic` (2.4s) | "기억해주세요" 의 시간 |

---

## 3. 이징 (Easing) — 비대칭의 호흡

이징은 시간만큼 중요한 *감정의 결*. Taste OS는 **4개의 곡선** 만 사용합니다.

```css
:root {
  /* 들숨 — 빠르게 시작, 부드럽게 도착 */
  --e-breath-in:  cubic-bezier(0.16, 1, 0.30, 1);

  /* 날숨 — 천천히 빠지기 시작, 가속하여 사라짐 */
  --e-breath-out: cubic-bezier(0.70, 0, 0.84, 0);

  /* 정착 — 살짝 오버슈트 후 안착 */
  --e-settle:     cubic-bezier(0.34, 1.18, 0.64, 1);

  /* 표준 — 짧은 미세 인터랙션용 */
  --e-standard:   cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 곡선의 *감정* 차이

```
linear              → 기계, 도로 위 차
ease-in-out         → 부드럽지만 *익명적*
expo.out (in)       → "한 번에 도착했지만 충돌하지 않음"
expo.in (out)       → "천천히 떠나기 시작했는데 갑자기 가속"
settle (오버슈트)    → "내려놓는 손의 미세한 떨림"
```

### 왜 비대칭인가

들숨과 날숨이 *대칭* 이면 — 사용자는 시스템을 *기계* 로 인식. 비대칭이면 *살아 있다* 고 느낍니다. 우리는 후자를 의도해요.

### 곡선 절대 사용 금지

- `ease` (browser default) — 너무 둔함
- `linear` — UI 크롬에 사용 금지 (단, 디스크 회전·그라데이션 이동 같은 *기계적* 운동에만 허용)
- 스프링 with bounce > 0.3 — 만화 같음, OS의 톤과 불일치
- `cubic-bezier(0.68, -0.55, 0.265, 1.55)` — *anticipation* 곡선, OS는 "주의를 끌지 않음"

---

## 4. 모션 위계 — 무엇이 어떻게 움직이는가

세 단계의 위계.

```
                                                                  
   L0 · 환경 (Ambient)                                            
       ┐                                                          
       │ 영구 운동. 사용자 인지 밖에서 *살아 있음* 을 알림         
       │ orbs, grain, sigil breath                                
       │                                                          
   L1 · 컴포넌트 (Component)                                       
       ┐                                                          
       │ 사용자 액션 응답. 페이지 안에서 일어남                    
       │ hover, settle, reveal                                    
       │                                                          
   L2 · 표면 (Surface)                                             
       ┐                                                          
       │ 페이지나 모달 전체 단위. 큰 흐름                          
       │ page transition, modal expand, send animation            
       │                                                          
```

각 위계는 *다른 시간 척도* 를 가져요.

| 위계 | 시간 범위 | 인지 |
|---|---|---|
| L0 환경 | 14–60초 (드리프트) | 의식 밖, *느낌* 으로만 |
| L1 컴포넌트 | 0.2–1.6초 | *반응* 이라 인지 |
| L2 표면 | 0.9–3.0초 | *영화의 컷* 으로 인지 |

### 위계의 *비간섭* 규칙

L0는 L1의 액션 중에도 *멈추지 않습니다*. L1과 L2가 동시에 일어나도 *충돌하지 않게* 디자인. 사용자가 호버하는 동안에도 orbs는 떠다녀요.

예외: *Constitution Anchor reveal* (10초) 동안엔 모든 L0가 *살짝 dimmed* — 그 순간의 무게를 위해.

---

## 5. 페이지 전환 (Page Transitions)

Taste OS는 두 가지 표면 간 전환 패턴을 가집니다.

### 5.1 Dissolve — 같은 OS 안 표면 간

Field ↔ Genome ↔ Drift ↔ Atmosphere ↔ Universe ↔ Mirror 사이.

```
                                                                  
   현재 표면              검은 정적              다음 표면        
  ──────────         ──────────         ──────────             
  날숨 1.4s    →    멈춤 0.6s    →    들숨 0.9s                 
                                                                  
  cubic-bezier:                cubic-bezier:                    
  0.70, 0, 0.84, 0             0.16, 1, 0.30, 1                 
                                                                  
   총 전환 시간: 2.9s                                              
                                                                  
```

이 0.6s 검은 정적이 *받아들이는 시간*. 시스템이 *방금 보여준 것을 고려하고 있다* 는 시각화.

### 5.2 Threshold — 시네마틱 게이트

온보딩의 시작/끝, Genome 드러남, Mirror reveal 같은 *정서적 절정* 으로 가는 전환.

```
                                                                  
   1. 현재 표면 1.4s 날숨                                          
                                                                  
   2. 검은 필드에 단 한 문장:                                       
      "잠시 머물러 주세요."  또는 "당신의 풍경, 함께 봐요."         
      reveal blur 1.6s, 2.5s 유지                                  
                                                                  
   3. 문장 1.4s 날숨                                               
                                                                  
   4. 다음 표면 inhale 0.9s                                        
                                                                  
   총: 7–9초                                                      
                                                                  
```

이건 *건너뛸 수 없는* 비트예요. 시간이 곧 무게.

### 5.3 Next.js App Router 구현

```tsx
// app/template.tsx (template, not layout — re-renders on each navigation)
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.9,
          ease: [0.16, 1, 0.30, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

`mode="wait"` 이 핵심 — 나가는 표면이 *완전히 사라진 후* 새 표면이 등장. 동시 노출 없음.

### 5.4 Threshold 전환 컴포넌트

```tsx
'use client';

import { motion } from 'framer-motion';

export function Threshold({
  sentence,
  onComplete,
}: {
  sentence: string;
  onComplete: () => void;
}) {
  return (
    <motion.div
      className="threshold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2500);
      }}
    >
      <motion.p
        initial={{ opacity: 0, filter: 'blur(14px)', letterSpacing: '0.12em' }}
        animate={{ opacity: 1, filter: 'blur(0px)', letterSpacing: '0.03em' }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.30, 1] }}
      >
        {sentence}
      </motion.p>
    </motion.div>
  );
}
```

---

## 6. 온보딩 시네마틱

`onboarding.md` 의 7개 화면 전환은 *모두 dissolve* 와 *threshold* 의 조합입니다.

```
화면 1 (도착)
   │
   │  [dissolve 2.9s]
   ▼
화면 2 (이미지)
   │
   │  [dissolve 2.9s]
   ▼
화면 3 (소리)
   │
   │  [dissolve 2.9s]
   ▼
화면 4 (말)
   │
   │  [dissolve 2.9s]
   ▼
화면 5 (공간)
   │
   │  [dissolve 2.9s]
   ▼
화면 6 (느낌)
   │
   │  [threshold "잠시, 머물러 주세요." 7s]
   ▼
화면 7 (듣기) — 별자리 + 3 문장 × 8초 = 24s
   │
   │  [threshold "─ 열기 ─" 사용자 탭 기다림]
   ▼
화면 8 (마무리)
```

각 dissolve 사이에는 *600ms 검은 정적*. 화면 6 → 7 사이에만 *threshold beat* 사용. 듣기 → 마무리 사이는 사용자 의지로 통과.

### 시퀀스 안의 모션 위계

```
온보딩 첫 진입 후:

t = 0.0s   페이지 흰 → 검은 페이드 (0.4s)
t = 0.4s   그레인 페이드 인 (1.4s)
t = 0.6s   orbs 페이드 인, staggered (각 0.2s)
t = 1.0s   Sigil 페이드 인 (1.4s, 그 후 영구 호흡 시작)
t = 1.8s   첫 문장 reveal blur (1.8s)
t = 4.0s   사용자에게 reading 시간 (2.5s)
t = 6.5s   Beacon 페이드 인 + pulse 시작
```

---

## 7. 로딩 상태 — 네 가지 종류

`system.md` §14 의 약속을 따라, Taste OS는 *스피너를 가지지 않습니다*. 대신:

### 7.1 Breath — 기본 (>200ms 비동기)

```tsx
<motion.span
  className="breath-dot"
  animate={{ opacity: [0.4, 0.9, 0.4] }}
  transition={{
    duration: 1.6,
    ease: 'easeInOut',
    repeat: Infinity,
  }}
/>
```

단 하나의 pearl 점이 0.6Hz 로 호흡. 어디서든 *생각 중* 의 시각화.

### 7.2 Listening — Genome 합성용 (24s 최소)

세 문장을 8초씩 순차로:

```ts
const listeningSequence = [
  '당신이 보여준 빛을 읽는 중이에요…',
  '당신 안의 온도를 듣는 중이에요…',
  '관통하는 선을 찾고 있어요.',
];

for (const sentence of listeningSequence) {
  await reveal(sentence, { hold: 6.4 });
  await exhale(sentence, { duration: 1.6 });
}
```

각 문장: reveal blur 1.6s 진입 → 6.4초 머묾 → 1.6s 날숨. 총 9.6s × 3 = ~24s.

**모델이 일찍 끝나도 24s는 유지.** 시간이 마법.

### 7.3 Drift — Atmosphere 피드 로딩

타자기 효과 (소리 없이) — 카드들이 좌→우로 *써집니다*.

```tsx
<motion.div
  initial={{ scaleX: 0, transformOrigin: 'left' }}
  animate={{ scaleX: 1 }}
  transition={{ duration: 1.8, ease: 'linear' }}
/>
```

### 7.4 Sigil — 긴 컴퓨트 (≥8s 후)

기본 Breath dot 이 8초 이상 보였다면, *Sigil* (ensō) 가 그 위에 등장 — *시스템이 진지하게 듣고 있다* 는 시각화.

```tsx
<motion.svg
  initial={{ opacity: 0, scale: 0.94 }}
  animate={{ opacity: 0.32, scale: 1 }}
  transition={{ duration: 1.4 }}
>
  <motion.path
    d="M12 3.5 A 8.5 8.5 0 1 0 20.4 11.2"
    animate={{ opacity: [0.18, 0.32, 0.18] }}
    transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
  />
</motion.svg>
```

### Anti-pattern — 절대 사용 안 함

- 스피너 (circular spinner) — 분주함의 시각화. *없습니다*.
- 진행률 바 (%) — 시간 측정의 시각화. *없습니다*.
- 스켈레톤 스크린 — 약속의 시각화. *없습니다*.

---

## 8. 분위기 이동 (Atmosphere Shifts)

배경 그라데이션·orb 색·tint 가 *조용히* 이동하는 모션.

### 8.1 페이지 내 그라데이션 마이그레이션

`timeline/` 의 핵심 모션. 사용자가 스크롤하면 페이지 자체의 *온도* 가 바뀝니다.

```css
/* 한 챕터 안의 그라데이션이 다음 챕터의 그라데이션에 *접합* */
.chapter-2024::before {
  background: linear-gradient(180deg,
    rgba(15, 22, 32, 0.0) 0%,
    rgba(15, 22, 32, 0.5) 40%,
    rgba(58, 69, 85, 0.3) 100%);
}

.chapter-2025::before {
  background: linear-gradient(180deg,
    rgba(58, 69, 85, 0.3) 0%,
    rgba(74, 61, 44, 0.3) 50%,
    rgba(122, 80, 64, 0.3) 100%);
}
```

각 챕터의 *상단 색* = 이전 챕터의 *하단 색*. 결과적으로 색이 *끊김 없이* 흐름.

### 8.2 시간대별 ambient 톤

`dashboard/` 의 시그니처 모션. 매시간 페이지의 *결* 이 변합니다.

```ts
type Period = 'predawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

const periodToOrbTints: Record<Period, OrbConfig[]> = {
  predawn:   [/* silver-blue × 2, deep-blue × 1 */],
  morning:   [/* silver-blue × 2, sand × 1 */],
  noon:      [/* sand × 2, pearl × 1 */],
  afternoon: [/* rose × 1, silver-blue × 1, sand × 1 */],
  evening:   [/* rose × 2, ember × 1 */],
  night:     [/* deep-rose × 1, silver-blue × 2 */],
};
```

전환은 0.7s ease 로 자연스럽게. 사용자가 *알아채지 못함* 이 목표.

### 8.3 페이지 진입 시 grain의 부드러운 등장

```css
.grain {
  opacity: 0;
  animation: grain-appear 1.4s ease 0.4s forwards,
             grain-shift 0.6s steps(4) infinite;
}

@keyframes grain-appear { to { opacity: 0.055; } }
```

`steps(4)` 가 4프레임 stop-motion 으로 *필름의 떨림* 시뮬레이션 — 8fps.

---

## 9. 떠다니는 군집 (Floating Clusters)

여러 카드/이미지가 *한 공간* 에 있는 표면 (Universe, 갤러리, 풍경의 모음). 각자 다른 위상으로 떠다님.

### 9.1 무리지만 동기화 안 됨

```tsx
{items.map((item, i) => (
  <motion.div
    key={item.id}
    animate={{ y: [0, -3, 0] }}
    transition={{
      duration: 10,
      ease: 'easeInOut',
      repeat: Infinity,
      delay: i * 0.8,             // 각자 다른 위상
    }}
  >
    <Card />
  </motion.div>
))}
```

`delay: i * 0.8` 이 핵심 — 8개 카드면 마지막은 6.4초 늦게 시작. 결과적으로 *동시에 같은 위치에 있지 않음*.

### 9.2 호버 시 cluster 멈춤

마우스가 카드 위로 오면, 그 카드 *주변* 의 군집도 살짝 정지:

```tsx
<motion.div
  whileHover={{ animationPlayState: 'paused' }}
>
```

호버 끝나면 자동 재개. *주의를 받은 영역은 *고요해진다*.*

### 9.3 카드의 미세 회전

각 카드는 -1.5° ~ +1.5° 무작위 회전 (고정). 모션이 아닌 *정지된 인격* — 사람 손이 *놓아둔 카드* 같은 느낌.

```tsx
const tilt = useMemo(() => (Math.random() * 3 - 1.5).toFixed(2), []);
<motion.div style={{ rotate: `${tilt}deg` }} />
```

`useMemo` — *마운트 후엔 변하지 않음*. 재렌더 시 카드가 *떨지 않게*.

---

## 10. 시네마틱 페이드 — Reveal Blur

Taste OS의 가장 시그니처 모션. 텍스트가 *흐림에서 명료해지듯* 등장.

### 10.1 Framer Motion 구현

```tsx
const revealVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(14px)',
    letterSpacing: '0.12em',
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    letterSpacing: '0.03em',
    transition: { duration: 1.6, ease: [0.16, 1, 0.30, 1] },
  },
};

<motion.h1 variants={revealVariants} initial="hidden" animate="visible">
  옻칠한 황혼
</motion.h1>
```

### 10.2 왜 *블러* + *자간* 의 결합인가

각각만 쓰면 약함:
- 블러만 → 텍스트가 *흐릿* 에서 *선명* 으로. 좋지만 정적.
- 자간만 → 텍스트가 *벌어졌다가 조여지듯*. 좋지만 *읽기* 가 어려움.
- **둘 다** → 텍스트가 *형성되는 듯* 느낌. 사용자는 *시각의 초점이 맞춰지는* 경험.

이 결합이 *Taste OS의 가장 자주 복제되는* 모션이 될 거예요. 다른 곳에서 보면 *우리에게서 영향받은 거* 라고 확신할 수 있어요.

### 10.3 시네마틱 reveal의 *클라이맥스 변형*

Mirror line이나 Taste Name 같은 *절정의 텍스트* 에는 더 느린 reveal:

```ts
const reveal_climax = {
  duration: 2.0,                    // not 1.6
  ease: [0.16, 1, 0.30, 1],
};
```

0.4s 차이가 크게 느껴져요. *이게 중요하다* 를 *말하지 않고 보여주는* 방법.

---

## 11. 감정적 호버 상태 (Emotional Hover)

호버는 *반응* 이 아니라 *알아챔*. 즉답이 아니라 *조용한 인사*.

### 11.1 표준 호버 — 2px lift + 색온도 시프트

```css
.card {
  transition:
    transform var(--t-fast) ease,
    filter var(--t-base) ease;
}

.card:hover {
  transform: translateY(-2px);
  filter: brightness(1.04) saturate(1.04);
  /* equivalent: color temperature +120K */
}
```

*스케일은 변하지 않음*. 카드는 *그 자리에 머물러* 있되 *살짝 떠 있어요*.

### 11.2 클릭 가능 글자 (링크)

```css
.whisper-link {
  color: var(--c-mist);
  opacity: 0.5;
  transition: color var(--t-base) ease, opacity var(--t-base) ease;
}

.whisper-link:hover {
  color: var(--c-rose);
  opacity: 0.95;
}
```

색이 *데워짐*. 0.6초로 *결정적이지 않게*. 사용자는 *시스템이 잠깐 따뜻해진다* 고 느낌.

### 11.3 Beacon — 펄스가 더 깊어짐

```css
.beacon::before {
  box-shadow: 0 0 0 1px rgba(176, 118, 114, 0.0);
  animation: beacon-pulse 3.6s ease-in-out infinite;
}

@keyframes beacon-pulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba(176, 118, 114, 0.0); }
  50%      { box-shadow: 0 0 0 3px rgba(176, 118, 114, 0.10); }
}

.beacon:hover::before {
  /* same animation, but with deeper intensity */
  animation: beacon-pulse-hover 2.8s ease-in-out infinite;
}

@keyframes beacon-pulse-hover {
  0%, 100% { box-shadow: 0 0 0 1px rgba(176, 118, 114, 0.15); }
  50%      { box-shadow: 0 0 0 6px rgba(176, 118, 114, 0.20); }
}
```

호버 시 펄스가 *주기는 짧아지고* *깊이는 깊어집니다*. 강화된 호흡.

### 11.4 절대 *하지 않는* 호버 패턴

- `transform: scale(1.05)` — 카드가 *자라남*. 만화적.
- 그림자 점프 (작은 → 큰) — *시각의 충돌*.
- 색 보더 (회색 → 파랑) — *데이트*된 디자인.
- 호버에서 텍스트 변경 (예: "More" → "View All") — 사용자를 *놀라게 함*.

---

## 12. 환경 입자 시스템 (Ambient Particles)

페이지가 *살아 있다* 고 느끼게 하는 두 시스템.

### 12.1 빛 구체 (Orbs) — 4개의 큰 부유광

```tsx
<div className="orb orb-rose orb-1" />
<div className="orb orb-silver orb-2" />
<div className="orb orb-rose orb-3" />
<div className="orb orb-sand orb-4" />
```

```css
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(60px);
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 1;
  animation:
    orb-fade 2.4s ease 0.6s forwards,
    orb-drift 42s ease-in-out infinite;
}

@keyframes orb-drift {
  0%   { transform: translate(0, 0); }
  33%  { transform: translate(50px, -40px); }
  66%  { transform: translate(-30px, 50px); }
  100% { transform: translate(0, 0); }
}
```

각 orb 는 `animation-delay: -18s` 같이 *negative delay* 로 *서로 다른 위상* 에서 시작.

### 12.2 먼지 입자 (Dust) — 위로 떠오르는 작은 점들

`landing-v2/` 와 `share/` 의 시그니처.

```tsx
// JS 로 생성 (24개 spans)
for (let i = 0; i < 24; i++) {
  const dust = document.createElement('span');
  dust.className = i % 4 === 0 ? 'dust dust-silver' : 'dust dust-rose';
  dust.style.left = `${Math.random() * 100}%`;
  const dur = 12 + Math.random() * 6;
  dust.style.animationDuration = `${dur}s, ${dur}s`;
  dust.style.animationDelay = `${i * 0.5 - 6}s, ${i * 0.5 - 6}s`;
  document.body.appendChild(dust);
}
```

```css
@keyframes dust-rise {
  0%   { transform: translateY(105vh) translateX(0); }
  100% { transform: translateY(-10vh)  translateX(24px); }
}

@keyframes dust-fade {
  0%, 100% { opacity: 0; }
  15%, 85% { opacity: 0.42; }
}
```

스태거된 delay 로 *연속적인 흐름* — 영화관 영사기 빔 안의 먼지 같은 느낌.

### 12.3 그레인 (Film Grain)

8fps stop-motion 으로 *필름의 떨림*.

```css
.grain {
  position: fixed;
  inset: -50%;
  width: 200%;
  height: 200%;
  background-image: url("data:image/svg+xml;utf8,<svg ...feTurbulence.../>");
  opacity: 0.055;
  mix-blend-mode: overlay;
  animation: grain-shift 0.6s steps(4) infinite;
}

@keyframes grain-shift {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-5%, 4%); }
  50%  { transform: translate(5%, -3%); }
  75%  { transform: translate(-3%, -5%); }
  100% { transform: translate(2%, 3%); }
}
```

`steps(4)` 가 *부드러운* 움직임이 아닌 *순간 점프* — 필름 그레인의 본질.

---

## 13. 메모리 전환 — Drift Chapters

`timeline/` 의 시그니처 모션. 한 년도에서 다른 년도로 *흘러갑니다*.

### 13.1 Era 감지

스크롤이 어떤 챕터의 viewport 50% 를 넘으면, `body` 에 `era-2024` / `era-2025` / `era-2026` 클래스가 붙음. 0.7초 transition 으로 orb 색이 변함.

```ts
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const year = entry.target.dataset.year;
        document.body.classList.remove('era-2024', 'era-2025', 'era-2026');
        document.body.classList.add(`era-${year}`);
      }
    });
  },
  { threshold: 0.4, rootMargin: '-20% 0px -20% 0px' }
);
```

### 13.2 Turn — 챕터 사이의 정거장

```tsx
<section className="turn-section">
  <motion.p
    initial={{ opacity: 0, filter: 'blur(14px)' }}
    whileInView={{ opacity: 1, filter: 'blur(0)' }}
    transition={{ duration: 1.6, ease: [0.16, 1, 0.30, 1] }}
    viewport={{ once: true, amount: 0.5 }}
  >
    그러더니, 천천히,<br />
    빛이 돌아섰어요.
  </motion.p>
</section>
```

`viewport={{ amount: 0.5 }}` — viewport 절반이 들어오면 reveal. 너무 일찍 보이지 않게.

### 13.3 Constitution Anchor — 가장 느린 reveal

페이지의 마지막. 4개 단어가 2초 간격으로 *각자 자리에 앉음*.

```tsx
{anchorWords.map((word, i) => (
  <motion.p
    key={word}
    initial={{ opacity: 0, filter: 'blur(14px)', letterSpacing: '0.10em' }}
    animate={{ opacity: 1, filter: 'blur(0)', letterSpacing: '-0.018em' }}
    transition={{
      duration: 2.0,
      delay: i * 2.0,                  // 2 seconds between words
      ease: [0.16, 1, 0.30, 1],
    }}
  >
    {word}
  </motion.p>
))}
```

총 8초간 4 단어가 등장 후, 마지막 conclusion 문장이 2초 뒤. 페이지의 *가장 의식적인* 시퀀스.

---

## 14. 대시보드 인터랙션

`dashboard/` 와 `field/` 의 특수 모션.

### 14.1 Today Line의 1.4초 크로스페이드

시간대가 바뀌었을 때:

```tsx
<AnimatePresence mode="wait">
  <motion.p
    key={periodKey}
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.88 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1.4 }}
  >
    {todayLine}
  </motion.p>
</AnimatePresence>
```

새 카피가 *덮어쓰는* 게 아니라 *교체됨* — 둘 다 잠시 사라지는 *틈* 이 있음.

### 14.2 Right Now strip의 부드러운 등장

사용자가 새 이미지를 저장하자마자, 가장 왼쪽에 새 카드가 *settle* 로 들어오고 — 가장 오른쪽 카드가 *fade out*:

```tsx
<motion.div
  initial={{ x: -40, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 1.2, ease: [0.34, 1.18, 0.64, 1] }}
/>
```

목록 *재정렬* 이 아니라 *손에서 자리로 놓이는* 모션.

### 14.3 ⌘K Console의 진입

검색 팔레트 (`system.md` §11 Console).

```tsx
<motion.div
  initial={{ opacity: 0, y: -20, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -8, scale: 0.99 }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.30, 1] }}
/>
```

위에서 *조금* 내려옴. 0.98 → 1.0 의 미세 스케일. *모달이 떨어진* 게 아니라 *집중이 모인* 모션.

---

## 15. 구현 아키텍처 — Framer Motion + CSS

### 15.1 어떤 곳에 어떤 도구

| 곳 | 도구 | 이유 |
|---|---|---|
| L0 환경 (orbs, dust, grain) | **순수 CSS** | 영구 반복, JS 비용 없음 |
| L1 컴포넌트 (hover, settle) | **CSS transition + transform** | DOM 변경 없음, 60fps |
| L2 표면 전환 | **Framer Motion `AnimatePresence`** | exit-then-enter 안무 필요 |
| Stagger 시퀀스 | **Framer Motion `variants` + delay** | 부모 → 자식 전파 가능 |
| Scroll-driven | **IntersectionObserver + CSS class** | 가장 가볍고 신뢰 가능 |
| WebGL (constellation, Universe) | **React Three Fiber** | 3D 환경 필수 |

### 15.2 모션 토큰 (TypeScript)

```ts
// lib/motion/tokens.ts

export const duration = {
  fast: 0.20,
  base: 0.6,
  breathIn: 0.9,
  hold: 0.3,
  breathOut: 1.4,
  reveal: 1.6,
  revealSlow: 1.8,
  revealClimax: 2.0,
  cinematic: 2.4,
  listening: 8.0,
} as const;

export const ease = {
  breathIn:  [0.16, 1, 0.30, 1] as const,
  breathOut: [0.70, 0, 0.84, 0] as const,
  settle:    [0.34, 1.18, 0.64, 1] as const,
  standard:  [0.4, 0, 0.2, 1] as const,
} as const;

// Common variants
export const motionVariants = {
  fadeUp: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  },
  reveal: {
    hidden: { opacity: 0, filter: 'blur(14px)', letterSpacing: '0.12em' },
    visible: { opacity: 1, filter: 'blur(0px)', letterSpacing: '0.03em' },
  },
  settleIn: {
    hidden: { opacity: 0, y: 16, rotate: 0 },
    visible: (custom: number = 0) => ({
      opacity: 1, y: 0,
      transition: { duration: duration.breathIn * 1.4, ease: ease.settle, delay: custom * 0.2 },
    }),
  },
};
```

### 15.3 컴포넌트 패턴

```tsx
import { motion } from 'framer-motion';
import { duration, ease, motionVariants } from '@/lib/motion/tokens';

export function RevealText({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={motionVariants.reveal}
      transition={{ duration: duration.reveal, ease: ease.breathIn, delay }}
    >
      {children}
    </motion.div>
  );
}
```

### 15.4 IntersectionObserver 패턴 (CSS class 기반)

```ts
function setupRevealOnScroll() {
  const elements = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.getAttribute('data-delay') || '0');
          setTimeout(() => {
            entry.target.classList.add('is-revealed');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.22, rootMargin: '0px 0px -10% 0px' }
  );
  elements.forEach((el) => observer.observe(el));
}
```

CSS:

```css
[data-reveal] {
  opacity: 0;
  filter: blur(14px);
  letter-spacing: 0.12em;
  transition: opacity 1.6s, filter 1.6s, letter-spacing 1.6s;
  transition-timing-function: var(--e-breath-in);
}

[data-reveal].is-revealed {
  opacity: 1;
  filter: blur(0);
  letter-spacing: 0.03em;
}
```

이 패턴이 *Framer Motion 없이도* 모든 reveal을 처리. 모바일 페이지 무게가 *훨씬 가벼움*.

---

## 16. Reduced Motion — 동등한 별도 모드

`prefers-reduced-motion: reduce` 는 *기능 축소* 가 아닌 *별도의 모드*. 동등한 정성으로 디자인.

```css
@media (prefers-reduced-motion: reduce) {
  /* L0 환경: 정지 */
  .orb, .sigil, .dust, .grain {
    animation: none !important;
  }

  /* L1 컴포넌트: 즉시 표시 */
  [data-reveal] {
    transition: opacity 0.4s ease !important;
    filter: none !important;
    letter-spacing: inherit !important;
    transform: none !important;
  }

  /* L2 표면: 빠른 페이드 */
  .screen-transition {
    transition: opacity 0.3s ease !important;
  }

  /* Beacon pulse: 정적 */
  .beacon::before {
    animation: none;
    box-shadow: 0 0 0 1px rgba(176, 118, 114, 0.18);  /* steady glow */
  }

  /* Card drift: 정지 */
  .card-drift, .u-card, .taste-card {
    animation: none !important;
  }
}
```

### 약속

- *reduced motion 사용자도* 호버 lift, 호버 색 시프트는 *유지* — 인터랙션 피드백은 필수
- *reveal blur 의 효과는* 사라지지만 *문장은 그대로* — *의미* 의 손실 없음
- *시간 시퀀스 (Listening 24초) 는 유지* — 게이트는 *시간* 이지 *모션* 이 아님

---

## 17. 성능 예산

### 60fps 목표

| 표면 | fps 목표 | 노트 |
|---|---|---|
| Landing | 60fps p95 | M-series 에서 |
| Onboarding 별자리 | 50fps min | 36 dots + lines |
| Universe (R3F) | 60fps M-series, 30fps degraded | 200 nodes cap |
| Timeline (3-color gradient) | 60fps | CSS only |
| Dashboard (idle drift) | 60fps | 9 카드 동시 drift OK |

### Layout thrash 방지

```css
/* ✅ GPU layer */
.card { transition: transform 0.6s, opacity 0.6s; }
.card:hover { transform: translateY(-2px); }

/* ❌ layout 강제 */
.card { transition: margin-top 0.6s; }
.card:hover { margin-top: -2px; }
```

`transform`, `opacity`, `filter` 만 사용. `width`, `height`, `margin`, `padding`, `top/left/right/bottom` 의 트랜지션은 *피함*.

### `will-change` 정책

자주 움직이는 객체에만:

```css
.orb { will-change: transform, opacity; }
.card.is-drifting { will-change: transform; }
.reveal-element { will-change: opacity, filter; }
```

*항상* 켜두지 않음 — 메모리 비용.

### 모바일 강등 (Degradation)

```ts
const isLowPower = navigator.hardwareConcurrency <= 4
                || window.innerWidth < 768
                || /Android.*Chrome\/[.0-9]*\s/.test(navigator.userAgent);

if (isLowPower) {
  document.body.classList.add('low-power');
  // CSS: .low-power .orb { animation-duration: 80s; } // slow them down
  // CSS: .low-power .dust { display: none; }         // remove particles
}
```

---

## 18. 모션이 절대 *하지 않는* 것들

마지막 — *없는 것* 의 목록.

| 행동 | 거부 이유 |
|---|---|
| 깜빡임 (flash) | 알람의 언어. 우리는 알람이 아님. |
| 좌우 흔들기 (shake) | 에러의 언어. 우리는 에러가 없음. |
| 0.3 이상의 스프링 bounce | 만화의 언어. |
| 회전 + scale 동시 | "celebrate" 의 언어. 축하 없음. |
| Parallax (마우스 따라 큰 시차) | 데모의 언어, 정체성 없음. |
| 자동 재생 비디오 | 주의 탈취. |
| Pop-in animations (모달이 0.95 → 1.05 → 1) | 광고의 언어. |
| Stagger speed < 100ms (너무 빠른 순차) | 폭격적. |
| Easing 가속도 0.4 이상 | 충돌. |
| 시야각 안의 그림자 점프 (호버) | *디지털* 의 언어. |

### 자주 요청받지만 거부

- *"등장할 때 살짝 튀어 오르는 효과 추가해주세요"* — 만화적 톤, 거부
- *"호버 시 카드 회전 3D"* — 데이트된 디자인, 거부
- *"스크롤 시 헤드라인 페럴랙스"* — 흔하고 정체성 없음, 거부
- *"새 알림 빨간 점 깜빡임"* — 알람 패턴, 거부
- *"버튼 호버 시 그라데이션 이동"* — 광고 디자인, 거부

---

## 닫는 말

모든 디자이너가 흔히 던지는 질문은: *"이 모션을 추가하면 페이지가 더 좋아질까?"*

Taste OS 의 질문은 다릅니다: ***"이 모션이 빠지면 사용자가 *무언가를 잃었다* 고 느낄까?"***

대부분의 모션이 두 번째 질문에서 *no* — 그러면 *추가하지 않습니다*. 추가되는 모션은 *모두* 두 번째 질문에서 *yes* 인 것들만:
- Sigil 호흡 — 없으면 *방이 죽었다* 고 느낌
- 빛 구체 표류 — 없으면 *공기가 멈췄다* 고 느낌  
- Reveal blur — 없으면 *텍스트가 그저 나타났다* 고 느낌
- 호버 lift — 없으면 *반응이 없다* 고 느낌
- Threshold beat — 없으면 *받아들임의 무게가 없다* 고 느낌

이 다섯 가지가 *생명의 신호*. 다른 모든 모션은 *생명의 모방*.

엔지니어가 새 인터랙션을 만들 때 마지막 검사:

> ***이 모션이 페이지를 *살아 있게* 만드는가, 아니면 *바쁘게* 만드는가?***

*살아 있게* → ship. *바쁘게* → 짓지 않음. 이게 모션을 *장식* 이 아닌 *감정* 으로 만드는 유일한 방법이에요.
