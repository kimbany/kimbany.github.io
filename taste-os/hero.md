# Taste OS — Hero Section

> 단 하나의 장면. 9초의 시네마틱 호흡.
> *전체 페이지가 아니라, 그 한 모먼트.*

이 문서는 **Taste OS 랜딩의 Hero 섹션만** 정의합니다. 나머지 섹션은 의도적으로 *없음* — 사용자가 *그 한 장면을 끝까지 살게* 하는 것이 목표예요.

이 Hero 는 `landing-v2.md` 의 Hero 와 같은 카피를 쓰지만, 다음이 *다릅니다*:

1. **단독 페이지** — 아래로 스크롤할 콘텐츠 없음. *이게 끝*.
2. **마우스 시차 (Mouse parallax)** — 헤드라인과 빛 구체가 커서 따라 미세하게 이동
3. **더 느린 진입** — 9초의 등장 안무 (landing-v2 는 7초)
4. **vignette** — 화면 가장자리의 미세한 어두움 (영화 프레임의 결)
5. **Next.js + Framer Motion** 레퍼런스 코드 포함

함께 읽기: `landing-v2.md`, `motion.md`, `tokens.md`, `voice.md`.

구현:
- **정적 미리보기**: `taste-os/hero/index.html` + `style.css` + `script.js`
- **Next.js 코드**: 본 문서 §6 에 인라인 (실제 프로젝트에 그대로 옮길 수 있음)

---

## 목차

0. [철학 — 한 장면](#0-철학--한-장면)
1. [시각 사양](#1-시각-사양)
2. [9초 진입 시퀀스](#2-9초-진입-시퀀스)
3. [마우스 시차 — 미세한 알아챔](#3-마우스-시차--미세한-알아챔)
4. [반응형 행동](#4-반응형-행동)
5. [Reduced motion](#5-reduced-motion)
6. [Next.js + Framer Motion 구현](#6-nextjs--framer-motion-구현)
7. [정적 미리보기 노트](#7-정적-미리보기-노트)

---

## 0. 철학 — 한 장면

대부분의 랜딩 페이지는 *스크롤* 을 가정합니다. 사용자가 *위에서 아래로 흐르며 점점 더 많은 것을 보는* 페이지.

이 Hero 는 *그 가정을 거부* 합니다.

```
                                                                
   사용자가 도착해요.                                            
                                                                
   첫 9초 동안 — 한 문장이 등장하고,                              
                미세한 진동만 있는 어둠 안에서,                  
                한 문장이 그를 알아봐 줍니다.                    
                                                                
   "당신은 계속 변하고 있습니다."                                
                                                                
   사용자는 그 다음 페이지가 없다는 걸 알아챕니다.                
                                                                
   그가 떠나거나 — 머무릅니다.                                   
                                                                
   머무르면 — 그게 *답* 입니다.                                  
                                                                
```

스크롤이 없다는 사실이 *제약* 이 아니라 *디자인* 입니다. 페이지가 *덜 가져* 있어서, *덜 묻고* — 더 *조용히* 만나요.

### 사용자가 9초 후에 가질 수 있는 행동

1. **CTA 클릭** — *"나의 분위기 탐색하기"* (이게 다음 단계)
2. **그대로 떠남** — 9초의 명상으로 충분
3. **새로고침** — 그 한 문장을 다시 보고 싶음
4. **스크린샷** — 가장 *맛있는* 행동

페이지는 위 *네 가지를 다 받아들임*. *하나만* 이 정답이라고 *말하지 않음*.

---

## 1. 시각 사양

### 레이아웃 (1280px 기준)

```
                                                                          
   ◌                                                                       
   (Sigil, top-left)                                                       
                                                                          
                                                                          
                                                                          
                                                                          
                                                                          
                                                                          
                                                                          
                    당신은 계속                                            
                    변하고 있습니다.                                       
                                                                          
                                                                          
                    ─────                                                  
                                                                          
                                                                          
                    취향은 단순한 선호가 아니라,                           
                    당신이라는 사람의 분위기입니다.                        
                                                                          
                                                                          
                    ─── 나의 분위기 탐색하기 ───                           
                                                                          
                                                                          
                                                                          
                                                                          
                       Taste OS                                            
                                                                          
                                                                          
                                                                          
                                                                          
   (subtle vignette around all edges)                                      
                                                                          
```

### 6개의 시각 레이어 (z-order)

```
z = 100  ─  Grain (5.5% film grain, 8fps stop-motion)
z = 50   ─  Sigil (top-left ensō, 22px, mist 22%)
z = 10   ─  Vignette (corner darkening, edge radial gradient)
z = 5    ─  Content (headline, sub, CTA, wordmark)
z = 3    ─  Dust particles (24 small spans, drifting upward)
z = 1    ─  Light orbs (4 orbs, rose + silver-blue + sand)
z = 0    ─  Background (night #0E0C0B)
```

### 색

`tokens.md` §2 의 캐노니컬 팔레트:

```
배경:     night (#0E0C0B)
텍스트:   beige (#D8C7AC) — 헤드라인
          mist (#9A8E81) — sub
          mist 65% — wordmark
액센트:   rose (#B07672) — Beacon glow, vignette warm
보조:     silver-blue (#8FA0AC) — orbs
```

### 활자

- **Headline**: Cormorant Garamond italic 300, `clamp(40px, 6.4vw, 72px)`, line-height 1.14, letter-spacing -0.018em, color `beige`
- **Sub**: Cormorant Garamond italic 300, `clamp(18px, 2.2vw, 26px)`, line-height 1.55, color `mist`
- **CTA label**: Inter 400, 13px, letter-spacing 0.04em, lowercase, color `beige`
- **Wordmark**: Cormorant Garamond italic 300, 14px, letter-spacing 0.32em, lowercase, color `mist` at 65%

---

## 2. 9초 진입 시퀀스

전체 호흡 안무. 절대 시간 (초 단위).

```
t = 0.0s    검은 화면. 모든 요소 opacity 0.

t = 0.4s    Grain fade in (1.4s 진행) → 5.5%

t = 0.6s    Orb 1 (rose, top-left) fade in (2.4s 진행)
t = 0.9s    Orb 2 (silver-blue, mid-right) fade in
t = 1.2s    Orb 3 (rose, bottom-left) fade in
            Sigil fade in (1.4s) → opacity 0.22

t = 1.5s    Orb 4 (sand, bottom-right) fade in
            Dust particles 등장 시작 (24개, 200ms 간격)

t = 2.0s    Vignette fade in (1.6s)

t = 2.0s    ★ Headline reveal blur 시작
              "당신은 계속"
              "변하고 있습니다."
              duration: 2.0s (climax reveal)
              blur(16px) → blur(0)
              letter-spacing 0.12em → -0.018em

t = 4.4s    Hairline (32px wide) draws in
              scaleX 0 → 1, 1.0s

t = 5.0s    ★ Sub headline fade in (1.4s)
              "취향은 단순한 선호가 아니라,"
              "당신이라는 사람의 분위기입니다."

t = 6.6s    ★ CTA Beacon fade in (1.0s) + 첫 펄스
              border, 펄스 애니메이션 시작

t = 8.2s    Wordmark "Taste OS" fade in (1.0s)
            mist 65% opacity 도달

t = 9.0s    Sigil 호흡 시작 (3.6s 사인 곡선)
            모든 진입 완료
            ─ ambient state ─
```

### 사용자가 일찍 클릭하려 할 때

CTA 가 등장 (t=6.6s) 전에는 hover 가능 영역 *없음*. CTA 가 등장하기 시작하면 즉시 interactive — 펄스가 시작되기 전이라도 클릭 가능.

스크롤이나 키보드 입력이 있으면 진입 안무 *압축* — 모든 요소가 즉시 final state 로:

```ts
function compressEntry() {
  // 모든 요소에 .is-revealed 클래스 즉시 추가
  document.querySelectorAll('[data-reveal]')
    .forEach(el => el.classList.add('is-revealed'));
}

window.addEventListener('scroll', compressEntry, { once: true });
window.addEventListener('keydown', compressEntry, { once: true });
```

---

## 3. 마우스 시차 — 미세한 알아챔

이 Hero 의 *시그니처* 모션. landing-v2 에 *없는* 것.

### 동작 원칙

- **damped lerp** (0.05 factor) — *매우 느린* 따라옴
- **최대 이동량 작게** — 헤드라인 ±4px, 빛 구체 ±6~12px
- **사용자가 *알아채지 못함* 이 목표** — 마우스를 *움직이지 않으면 정지*, 움직이면 *방이 살짝 따라옴*

### 깊이별 시차 강도

```
요소           최대 시차       이유
─────         ─────────       ────────────────────────────
Headline       ±4px           가장 가까운 객체 (foreground)
Sub headline   ±2px           조금 더 멀리
Hairline       0              완전히 고정 — 시각의 anchor
CTA Beacon     0              사용자 행동 점 — 흔들리지 않음
Wordmark       ±1px           멀리 있는 것 — 미세 흔들림
Orb 1 (front)  ±12px          가장 깊은 시차 (depth 차이로 공간감)
Orb 2          ±8px
Orb 3          ±10px
Orb 4 (back)   ±4px           멀리 있는 작은 광원
Sigil          0              위치 anchor — 흔들리지 않음
```

### 구현 — requestAnimationFrame + lerp

```ts
let targetX = 0, targetY = 0;
let currentX = 0, currentY = 0;

window.addEventListener('mousemove', (e) => {
  // 화면 중앙 기준 ±1 범위로 정규화
  targetX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

function tick() {
  // damped lerp
  currentX += (targetX - currentX) * 0.05;
  currentY += (targetY - currentY) * 0.05;

  // apply to elements
  document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
  document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
```

CSS:

```css
.headline {
  transform:
    translate(
      calc(var(--parallax-x, 0) * 4px),
      calc(var(--parallax-y, 0) * 3px)
    );
}

.orb-1 { transform: translate(calc(var(--parallax-x, 0) * 12px), calc(var(--parallax-y, 0) * 8px)); }
.orb-2 { transform: translate(calc(var(--parallax-x, 0) * 8px),  calc(var(--parallax-y, 0) * 6px)); }
.orb-3 { transform: translate(calc(var(--parallax-x, 0) * 10px), calc(var(--parallax-y, 0) * 7px)); }
.orb-4 { transform: translate(calc(var(--parallax-x, 0) * 4px),  calc(var(--parallax-y, 0) * 3px)); }
```

### 모바일 — Device Orientation

데스크톱 마우스 대신, *디바이스 방향* 으로 시차:

```ts
if ('DeviceOrientationEvent' in window) {
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma === null || e.beta === null) return;
    // gamma: -90 ~ 90 (좌우 기울임), beta: -180 ~ 180 (앞뒤)
    targetX = (e.gamma ?? 0) / 30;   // ±3 → ±1 정규화
    targetY = ((e.beta ?? 0) - 30) / 30;
  });
}
```

iOS 13+ 는 권한 요청 필요 — Hero 가 사용자 행동 (탭) 이후에 *자동 활성화*. 혹은 *그냥 없이* 도 페이지 작동하니 fallback 자동.

### Reduced motion 에서는 시차 *완전히 꺼짐*

```ts
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) {
  // mousemove 리스너 자체를 추가하지 않음
  return;
}
```

---

## 4. 반응형 행동

### Studio (≥ 1280px)

```
콘텐츠 가로 폭:  640px (text column)
패딩 (상단):    160px
헤드라인:       72px
빛 구체:        4개 (전체 크기 400px+)
먼지 입자:      24개
마우스 시차:    풀 강도 (±4px headline)
Vignette:       강 (가장자리 더 어둠)
```

### Desk (768–1279px)

```
콘텐츠 폭:      560px
패딩:           128px
헤드라인:       56px
빛 구체:        4개 (작은 크기)
먼지 입자:      18개
마우스 시차:    중간 (±2px headline)
```

### Pocket (≤ 767px)

```
콘텐츠 폭:      100%, 좌우 24px padding
패딩:           96px
헤드라인:       clamp(32px, 8vw, 44px)
빛 구체:        2개 (성능)
먼지 입자:      0개 (성능 + 시각 정리)
마우스 시차:    OFF (터치 디바이스)
디바이스 시차:  옵션 (iOS 권한 후만)
Vignette:       약
```

### 모든 룸 공통

- Sigil 위치: top 32px (Studio/Desk), top 20px (Pocket); left 동일
- 색 토큰: 동일
- 활자 패밀리: 동일
- 진입 안무: 9s 동일

---

## 5. Reduced motion

`prefers-reduced-motion: reduce` 시:

```
✗  마우스/디바이스 시차      → 0 (정적)
✗  빛 구체 드리프트          → 정지 (페이드 인만)
✗  먼지 입자 위로 흐름       → 0개 표시 안 함
✗  Sigil 호흡               → 정적 (0.22 opacity 고정)
✗  Beacon 펄스              → 정적 (보더만)
✗  Grain shift             → 정지 (한 프레임 고정)
✗  Reveal blur              → opacity 페이드만 (0.4s)
✗  Hairline draw            → 즉시 표시 (scaleX 1)

✓  Vignette                 → 정적 표시
✓  레이아웃 / 활자 / 색      → 동일
✓  CTA 호버                 → 활성 (사용자 인터랙션은 유지)
```

축소된 경험은 *기능 축소* 가 아니라 *별도의 모드*. 동등한 정성으로 디자인.

---

## 6. Next.js + Framer Motion 구현

실제 Next.js App Router 프로젝트에 그대로 옮길 수 있는 코드. 각 파일을 *복사-붙여넣기* 로 사용.

### 6.1 디렉토리 구조

```
app/
  page.tsx                  ← 랜딩 (Hero 만 보여줌)
  layout.tsx                ← 루트 레이아웃 (font, metadata)
  globals.css               ← Tailwind + CSS 변수
components/
  hero/
    Hero.tsx                ← 메인 컴포넌트
    Headline.tsx            ← 헤드라인 + 시차
    SubHeadline.tsx
    Beacon.tsx              ← CTA 버튼
    Wordmark.tsx
    Hairline.tsx
  atmosphere/
    LightOrbs.tsx           ← 4개 빛 구체
    DustField.tsx           ← 24개 먼지 입자
    Grain.tsx               ← 그레인 오버레이
    Sigil.tsx               ← ensō 글리프
    Vignette.tsx            ← 가장자리 어두움
hooks/
  useParallax.ts            ← 마우스/디바이스 시차
  useReducedMotion.ts
lib/
  motion/tokens.ts          ← 호흡 토큰
```

### 6.2 `app/page.tsx`

```tsx
import { Hero } from '@/components/hero/Hero';

export default function HomePage() {
  return <Hero />;
}
```

### 6.3 `app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taste OS — 당신은 계속 변하고 있습니다',
  description: '취향은 단순한 선호가 아니라, 당신이라는 사람의 분위기입니다.',
  themeColor: '#0E0C0B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="bg-night text-beige">
      <body className="font-text antialiased">
        {children}
      </body>
    </html>
  );
}
```

### 6.4 `lib/motion/tokens.ts`

```ts
export const duration = {
  fast:        0.20,
  base:        0.6,
  breathIn:    0.9,
  breathOut:   1.4,
  reveal:      1.6,
  revealSlow:  1.8,
  revealClimax:2.0,
} as const;

export const ease = {
  breathIn:  [0.16, 1, 0.30, 1] as const,
  breathOut: [0.70, 0, 0.84, 0] as const,
  settle:    [0.34, 1.18, 0.64, 1] as const,
} as const;

export const reveal = {
  hidden: {
    opacity: 0,
    filter: 'blur(16px)',
    letterSpacing: '0.12em',
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    letterSpacing: '-0.018em',
  },
};
```

### 6.5 `hooks/useReducedMotion.ts`

```ts
'use client';

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
```

### 6.6 `hooks/useParallax.ts`

```ts
'use client';

import { useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useParallax() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      targetX = (e.gamma ?? 0) / 30;
      targetY = ((e.beta ?? 0) - 30) / 30;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove);
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', onDeviceOrientation);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
    };
  }, [reduced]);
}
```

### 6.7 `components/hero/Hero.tsx`

```tsx
'use client';

import { useParallax } from '@/hooks/useParallax';
import { LightOrbs } from '@/components/atmosphere/LightOrbs';
import { DustField } from '@/components/atmosphere/DustField';
import { Grain } from '@/components/atmosphere/Grain';
import { Sigil } from '@/components/atmosphere/Sigil';
import { Vignette } from '@/components/atmosphere/Vignette';
import { Headline } from './Headline';
import { SubHeadline } from './SubHeadline';
import { Beacon } from './Beacon';
import { Wordmark } from './Wordmark';
import { Hairline } from './Hairline';

export function Hero() {
  useParallax();

  return (
    <section className="
      relative
      min-h-screen
      flex flex-col items-center justify-center
      px-6 md:px-12
      pt-24 md:pt-40 pb-24
      overflow-hidden
      bg-night
    ">
      {/* Ambient layers (z-1, z-3) */}
      <LightOrbs />
      <DustField />

      {/* Static anchors (z-50) */}
      <Sigil />

      {/* Content (z-5) */}
      <div className="
        relative z-10
        w-full max-w-text
        flex flex-col items-center
        text-center
        gap-12 md:gap-16
      ">
        <Headline />
        <Hairline />
        <SubHeadline />
        <Beacon />
        <Wordmark />
      </div>

      {/* Edge effects (z-10, z-100) */}
      <Vignette />
      <Grain />
    </section>
  );
}
```

### 6.8 `components/hero/Headline.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { duration, ease, reveal } from '@/lib/motion/tokens';

export function Headline() {
  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      variants={reveal}
      transition={{
        duration: duration.revealClimax,
        ease: ease.breathIn,
        delay: 2.0,
      }}
      className="
        font-display italic font-light
        text-[clamp(40px,6.4vw,72px)]
        leading-[1.14]
        tracking-[-0.018em]
        text-beige
      "
      style={{
        transform: 'translate(calc(var(--parallax-x, 0) * 4px), calc(var(--parallax-y, 0) * 3px))',
        transition: 'transform 0.05s linear',
      }}
    >
      당신은 계속<br />
      변하고 있습니다.
    </motion.h1>
  );
}
```

### 6.9 `components/hero/Hairline.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

export function Hairline() {
  return (
    <motion.hr
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 0.4 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.30, 1], delay: 4.4 }}
      style={{ transformOrigin: 'center' }}
      className="
        w-8 h-px
        bg-bone
        border-0
      "
    />
  );
}
```

### 6.10 `components/hero/SubHeadline.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { duration, ease } from '@/lib/motion/tokens';

export function SubHeadline() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.4, ease: ease.breathIn, delay: 5.0 }}
      className="
        font-display italic font-light
        text-[clamp(18px,2.2vw,26px)]
        leading-[1.55]
        text-mist
        max-w-[600px]
      "
      style={{
        transform: 'translate(calc(var(--parallax-x, 0) * 2px), calc(var(--parallax-y, 0) * 1.5px))',
        transition: 'transform 0.05s linear',
      }}
    >
      취향은 단순한 선호가 아니라,<br />
      당신이라는 사람의 분위기입니다.
    </motion.p>
  );
}
```

### 6.11 `components/hero/Beacon.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

export function Beacon() {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.30, 1], delay: 6.6 }}
      onClick={() => {/* navigate to onboarding */}}
      className="
        relative
        inline-flex items-center gap-3
        px-7 py-3
        border border-beige/[0.20]
        rounded-sm
        text-beige text-[13px] tracking-[0.04em]
        bg-transparent
        hover:border-rose/[0.50]
        hover:bg-rose/[0.06]
        transition-colors duration-700 ease-out
        active:translate-y-[1px]
        group
      "
    >
      <span className="text-mist/45 text-[10px]">───</span>
      <span className="px-1">나의 분위기 탐색하기</span>
      <span className="text-mist/45 text-[10px]">───</span>

      {/* Pulse ring */}
      <motion.span
        aria-hidden
        animate={{
          boxShadow: [
            '0 0 0 1px rgba(176,118,114,0)',
            '0 0 0 3px rgba(176,118,114,0.10)',
            '0 0 0 1px rgba(176,118,114,0)',
          ],
        }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-[3px] rounded-md pointer-events-none"
      />
    </motion.button>
  );
}
```

### 6.12 `components/hero/Wordmark.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

export function Wordmark() {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.65 }}
      transition={{ duration: 1.0, ease: 'easeOut', delay: 8.2 }}
      style={{
        transform: 'translate(calc(var(--parallax-x, 0) * 1px), 0)',
      }}
      className="
        mt-16 md:mt-24
        font-display italic font-light
        text-[14px] tracking-[0.32em] lowercase
        text-mist
      "
    >
      Taste OS
    </motion.p>
  );
}
```

### 6.13 `components/atmosphere/LightOrbs.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

const orbConfigs = [
  { className: 'orb-1', delay: 0.6, color: 'rose',         pos: 'top-[6%] left-[4%]',   size: 'w-[420px] h-[420px]', depth: 12 },
  { className: 'orb-2', delay: 0.9, color: 'silver-blue',  pos: 'top-[44%] left-[74%]', size: 'w-[360px] h-[360px]', depth: 8 },
  { className: 'orb-3', delay: 1.2, color: 'rose',         pos: 'top-[62%] left-[14%]', size: 'w-[400px] h-[400px]', depth: 10 },
  { className: 'orb-4', delay: 1.5, color: 'sand',         pos: 'top-[82%] left-[68%]', size: 'w-[320px] h-[320px]', depth: 4 },
];

const colorClass = {
  rose: 'radial-gradient(circle, rgba(176,118,114,0.20), transparent 70%)',
  'silver-blue': 'radial-gradient(circle, rgba(143,160,172,0.16), transparent 70%)',
  sand: 'radial-gradient(circle, rgba(216,199,172,0.12), transparent 70%)',
};

export function LightOrbs() {
  return (
    <>
      {orbConfigs.map((orb) => (
        <motion.div
          key={orb.className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.4, ease: 'easeOut', delay: orb.delay }}
          className={`
            ${orb.pos} ${orb.size}
            absolute
            rounded-full
            pointer-events-none
            mix-blend-screen
            -z-0
          `}
          style={{
            background: colorClass[orb.color as keyof typeof colorClass],
            filter: 'blur(60px)',
            transform: `translate(calc(var(--parallax-x, 0) * ${orb.depth}px), calc(var(--parallax-y, 0) * ${orb.depth * 0.7}px))`,
            transition: 'transform 0.05s linear',
            animation: `orb-drift-${orb.className} 56s ease-in-out infinite`,
            animationDelay: `${-orb.delay * 10}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes orb-drift-orb-1 {
          0%, 100% { translate: 0 0; }
          33%      { translate: 50px -40px; }
          66%      { translate: -30px 50px; }
        }
        @keyframes orb-drift-orb-2 {
          0%, 100% { translate: 0 0; }
          33%      { translate: -40px 30px; }
          66%      { translate: 40px -20px; }
        }
        @keyframes orb-drift-orb-3 {
          0%, 100% { translate: 0 0; }
          33%      { translate: 60px 30px; }
          66%      { translate: -40px -50px; }
        }
        @keyframes orb-drift-orb-4 {
          0%, 100% { translate: 0 0; }
          33%      { translate: -30px -40px; }
          66%      { translate: 50px 30px; }
        }
      `}</style>
    </>
  );
}
```

### 6.14 `components/atmosphere/Sigil.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

export function Sigil() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.22 }}
      transition={{ duration: 1.4, ease: 'easeOut', delay: 1.2 }}
      className="fixed top-5 md:top-8 left-5 md:left-8 z-50 text-mist"
      aria-hidden
    >
      <motion.svg
        width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 9 }}
      >
        <path d="M12 3.5 A 8.5 8.5 0 1 0 20.4 11.2" />
      </motion.svg>
    </motion.div>
  );
}
```

### 6.15 `components/atmosphere/Grain.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

const grainSvg = `data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.28 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`;

export function Grain() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.055 }}
      transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
      className="
        fixed
        -inset-[50%] w-[200%] h-[200%]
        pointer-events-none
        z-[100]
        mix-blend-overlay
      "
      style={{
        backgroundImage: `url("${grainSvg}")`,
        animation: 'grain-shift 0.6s steps(4) infinite',
      }}
      aria-hidden
    />
  );
}
```

### 6.16 `components/atmosphere/Vignette.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

export function Vignette() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6, ease: 'easeOut', delay: 2.0 }}
      className="
        absolute inset-0
        pointer-events-none
        z-[10]
      "
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 50%, transparent 50%, rgba(14, 12, 11, 0.6) 100%),
          radial-gradient(ellipse at 50% 0%, rgba(176, 118, 114, 0.04) 0%, transparent 50%)
        `,
      }}
      aria-hidden
    />
  );
}
```

### 6.17 `components/atmosphere/DustField.tsx`

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function DustField() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !ref.current) return;

    const count = window.innerWidth < 768 ? 0 : (window.innerWidth < 1280 ? 18 : 24);

    for (let i = 0; i < count; i++) {
      const dust = document.createElement('span');
      const isRose = i % 4 !== 0;
      dust.style.cssText = `
        position: absolute;
        width: ${1.5 + Math.random() * 1.5}px;
        height: ${1.5 + Math.random() * 1.5}px;
        border-radius: 50%;
        background: ${isRose ? 'rgba(176, 118, 114, 0.4)' : 'rgba(143, 160, 172, 0.3)'};
        filter: blur(0.5px);
        left: ${Math.random() * 100}%;
        animation:
          dust-rise ${14 + Math.random() * 6}s linear infinite,
          dust-fade ${14 + Math.random() * 6}s ease-in-out infinite;
        animation-delay: ${i * 0.5 - 6}s;
        pointer-events: none;
      `;
      ref.current.appendChild(dust);
    }

    return () => {
      if (ref.current) ref.current.innerHTML = '';
    };
  }, [reduced]);

  return (
    <div ref={ref} className="fixed inset-0 z-[3] pointer-events-none" aria-hidden />
  );
}
```

### 6.18 `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --c-night: #0E0C0B;
    --c-coal: #1A1714;
    --c-bone: #443E37;
    --c-mist: #9A8E81;
    --c-beige: #D8C7AC;
    --c-rose: #B07672;
    --c-silver-blue: #8FA0AC;
    --c-sand: #C8B69B;

    --parallax-x: 0;
    --parallax-y: 0;
  }

  html, body {
    background: var(--c-night);
    color: var(--c-beige);
    font-feature-settings: 'tnum', 'lnum';
  }
}

@keyframes grain-shift {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-5%, 4%); }
  50%  { transform: translate(5%, -3%); }
  75%  { transform: translate(-3%, -5%); }
  100% { transform: translate(2%, 3%); }
}

@keyframes dust-rise {
  0%   { transform: translateY(105vh) translateX(0); }
  100% { transform: translateY(-10vh)  translateX(24px); }
}

@keyframes dust-fade {
  0%, 100% { opacity: 0; }
  15%, 85% { opacity: 0.42; }
}
```

### 6.19 `tailwind.config.ts` (snippet)

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0E0C0B',
        coal: '#1A1714',
        bone: '#443E37',
        mist: '#9A8E81',
        beige: '#D8C7AC',
        rose: '#B07672',
        'silver-blue': '#8FA0AC',
        sand: '#C8B69B',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Noto Serif KR"', 'serif'],
        text:    ['"Inter"', '"Pretendard"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        text: '640px',
      },
    },
  },
};

export default config;
```

---

## 7. 정적 미리보기 노트

GitHub Pages 에서 보는 정적 버전:

```
taste-os/hero/
├── index.html       ← 단일 페이지 (Hero only)
├── style.css        ← 모든 스타일
└── script.js        ← 시차 + 진입 안무
```

머지 후 `kimbany.github.io/taste-os/hero/` 에서 직접 만져볼 수 있어요. 마우스를 화면 위에서 천천히 움직여보면 헤드라인과 빛 구체가 *알아채지 못할 정도로* 따라오는 게 보일 거예요.

---

## 닫는 말

Hero 한 장면이 *전체 페이지를 대체할 수 있는가* 가 이 디자인의 진짜 도전이에요.

대부분의 랜딩은 *위에서 아래로 점점 더 설득* 합니다 — feature grid, testimonial, pricing, FAQ. Taste OS 의 Hero 는 *반대* 의 도전을 받아요: **한 문장으로 모든 것을 말하고, 사용자가 그 한 문장으로 *충분* 하다고 느끼게 만들기**.

> *"당신은 계속 변하고 있습니다."*

이 한 문장이 9초의 시네마틱 호흡 안에서 등장한 뒤 — 사용자가 그대로 머무르거나, 떠나거나, 클릭하거나 — *모두 좋은 답*. 페이지는 *답을 강요하지 않습니다*.

엔지니어가 이 Hero 를 빌드할 때 마지막 검사:

> ***이 Hero 가 끝났을 때, 사용자는 *그 한 문장을 다시 보고 싶어할 것인가*?***

그게 *yes* 면 — 다른 모든 것은 부수적이에요.
