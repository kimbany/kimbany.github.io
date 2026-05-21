# Taste OS — Entry / 들어가는 자리

> 두 개의 시네마틱 순간. *문턱 앞* 과 *문턱 위*.
> 사용자가 *시작하기로 마음먹은 순간* 의 무게를 honoring 하는 한 화면.

이 문서는 Taste OS 의 **온보딩 입구** — 사용자가 클릭으로 진입하는 *첫 번째 화면* 의 사양입니다. 기존 `onboarding/` 의 7막 흐름의 *Act 1* 을 독립적이고 더 시네마틱하게 재구성한 버전이에요.

함께 읽기: `onboarding.md` (전체 7 화면 흐름), `hero.md` (이 페이지의 디자인적 형제), `voice.md` (한국어 보이스), `motion.md`.

구현: `taste-os/entry/index.html` + `style.css` + `script.js`.

---

## 목차

0. [철학 — 문턱의 무게](#0-철학--문턱의-무게)
1. [두 시네마틱 순간](#1-두-시네마틱-순간)
2. [Moment 1 — 진입 시퀀스 (12초)](#2-moment-1--진입-시퀀스-12초)
3. [Moment 2 — Threshold Beat (CTA 후 8초)](#3-moment-2--threshold-beat-cta-후-8초)
4. [Sub copy 단계 reveal](#4-sub-copy-단계-reveal)
5. [마우스 시차](#5-마우스-시차)
6. [반응형](#6-반응형)
7. [Next.js + Framer Motion 구현](#7-nextjs--framer-motion-구현)
8. [정적 미리보기](#8-정적-미리보기)

---

## 0. 철학 — 문턱의 무게

대부분의 앱은 *사용자가 시작하기로 결정한 순간* 을 *효율의 순간* 으로 다뤄요. 사인업 양식을 *최소 마찰* 로 통과시키기 위한 디자인.

Taste OS 의 *Entry* 는 *반대로 디자인*. *시작하기로 결정한 순간* 을 *honoring 의 순간* 으로 다룹니다. 사용자가 *천천히* 들어오게, *준비된 채로* 들어오게.

### 두 가지 다른 시네마틱

1. **문턱 앞 (Before)** — 사용자가 *결정하지 않은* 상태. 페이지가 *제안* 하지만 *강요하지 않음*.
2. **문턱 위 (Threshold Beat)** — 사용자가 *결정한* 상태. 페이지가 *그 결정을 honoring* 하는 8초의 정적.

대부분의 디자인은 *문턱 앞* 만 디자인하고, *문턱 위* 는 *navigation* 으로 다룹니다. Taste OS 는 *문턱 위* 도 *디자인된 순간*.

### 한 줄 약속

> ***사용자가 "들어가야 한다"고 느끼게 만들지 않습니다.***
> ***"들어가고 싶다"고 느끼게 만들어요.***

이 차이가 *데이터 입력 양식* 과 *명상의 자리* 를 나눕니다.

---

## 1. 두 시네마틱 순간

```
                                                                            
   사용자 도착                                                              
       │                                                                    
       ▼                                                                    
   ─────────────────────────────────────────────────────                    
   MOMENT 1 · 문턱 앞                            ~12 초                     
   ─────────────────────────────────────────────────────                    
                                                                            
   t = 0   검은 화면                                                        
       │   ambient 레이어 fade in (orbs, grain, sigil, dust)                
       │                                                                    
   t = 2   pre-line 등장: "─ 시작 전에"                                     
       │                                                                    
   t = 4   ★ 메인 헤드라인 reveal blur (2.2s)                              
       │      "우리는 자꾸 마음이 머무는 것들을 닮아갑니다."                  
       │                                                                    
   t = 7   hairline draws                                                   
       │                                                                    
   t = 7.5 sub copy 단계 등장 (3 줄, 800ms 간격)                            
       │                                                                    
   t = 10  CTA Beacon 등장 + 펄스                                           
       │      "──── 나의 분위기 들여다보기 ────"                            
       │                                                                    
   t = 11  info 한 줄 등장 (faint): "약 7분이에요. 천천히 가요."             
       │                                                                    
       ─────  ambient state  ─────                                          
       │                                                                    
       │  (사용자가 클릭하기 전까지 머묾)                                    
       │                                                                    
       ▼                                                                    
                                                                            
   ─────────────────────────────────────────────────────                    
   MOMENT 2 · Threshold Beat                    ~8 초                       
   ─────────────────────────────────────────────────────                    
                                                                            
   CTA 클릭                                                                 
       │                                                                    
   t = 0   Beacon warm                                                      
       │                                                                    
   t = 0.5 페이지 전체 fade to black (1.4s)                                 
       │                                                                    
   t = 2   첫 문장 reveal blur                                              
       │      "잠시, 숨."                                                   
       │                                                                    
   t = 3.6 문장 hold (1.4s)                                                 
       │                                                                    
   t = 5.0 첫 문장 fade out (1.4s)                                          
       │                                                                    
   t = 5.4 잠시 검은 정적 (0.4s)                                            
       │                                                                    
   t = 5.8 두 번째 문장 reveal blur (1.6s)                                  
       │      "이제부터, 천천히."                                            
       │                                                                    
   t = 7.4 hold (1.4s)                                                      
       │                                                                    
   t = 8.8 fade to black 후 → 다음 화면 (실제 앱)                            
       │                                  → 페이드 인 (데모)                
       ▼                                                                    
                                                                            
```

총 시간 (도착 → 다음 화면): 약 21초.

---

## 2. Moment 1 — 진입 시퀀스 (12초)

### 시퀀스 절대 시간

```
t = 0.0s    검은 화면. 모든 요소 opacity 0.
t = 0.4s    Grain fade in (1.4s)
t = 0.6s    Orb 1 fade in (2.4s)
t = 0.9s    Orb 2 fade in
t = 1.2s    Sigil fade in (1.4s)
t = 1.5s    Orb 3, 4 fade in. Dust 시작.
t = 2.0s    ★ Pre-line 페이드 인 (1.0s)
              "─ 시작 전에"
t = 4.0s    Pre-line fade out (0.8s)
t = 4.0s    ★ 메인 헤드라인 reveal blur (2.2s — 가장 느린 reveal)
              "우리는 자꾸"
              "마음이 머무는 것들을"
              "닮아갑니다."
              (3 줄, blur 16px → 0, letter-spacing 0.12em → -0.018em)
t = 6.8s    Hairline draws in (1.0s)
t = 7.5s    Sub copy 첫 줄 페이드 인 (1.2s)
              "당신이 오래 바라본 장면들,"
t = 8.3s    Sub copy 두 번째 줄
              "자꾸 저장하게 되는 분위기들 속에는"
t = 9.1s    Sub copy 세 번째 줄
              "당신이라는 사람의 결이 담겨 있습니다."
t = 10.0s   CTA Beacon fade in (1.0s) + 펄스 시작
              "──── 나의 분위기 들여다보기 ────"
t = 11.5s   Info 페이드 인 (1.0s, mist 50%)
              "약 7분이에요. 천천히 가요."
t = 12.0s   ─ ambient state ─
```

### 헤드라인 — 가장 무거운 reveal

`hero.md` 의 헤드라인은 2.0s reveal — 이 페이지는 **2.2s** (더 느림).

이유: 이 문장은 *발견의 무게* 를 가집니다.

> *"우리는 자꾸 마음이 머무는 것들을 닮아갑니다."*

이 문장이 *진실* 처럼 느껴지려면 — *광고 카피* 처럼이 아닌 — 사용자가 *읽으면서 동의할 시간* 이 필요해요. 2.2s 가 그 시간.

### 활자 사양

```
Pre-line:    Inter 350, 12px, mist 65%, letter-spacing 0.08em, lowercase
              "─ 시작 전에"

Headline:    Cormorant Garamond italic 300
              clamp(36px, 5.6vw, 64px)
              line-height 1.18, letter-spacing -0.018em
              color: beige
              3-line display

Hairline:    32px wide, 1px, bone 40%

Sub copy:    Cormorant Garamond italic 300 (변경 — text 보다 더 부드러움)
              clamp(17px, 2.2vw, 22px)
              line-height 1.78
              color: mist
              max-width 480px
              3 lines, each fading in 800ms apart

Beacon:      Inter 400, 13px, lowercase
              "나의 분위기 들여다보기"
              border-radius 2px, hairline border

Info:        Inter 350, 11px, mist 50%
              "약 7분이에요. 천천히 가요."
              positioned below Beacon with var(--s-5) gap
```

---

## 3. Moment 2 — Threshold Beat (CTA 후 8초)

사용자가 *시작하기로 결정한 순간* 의 8초 명상. 이게 *Taste OS Entry 의 진짜 시그니처*.

### 시퀀스

```
사용자 CTA 클릭
   │
t = 0.0s    Beacon이 0.5s 동안 rose 톤으로 warm
   │           border-color: rgba(176, 118, 114, 0.65)
   │           background: rgba(176, 118, 114, 0.10)
t = 0.5s    페이지 전체 (헤드라인, sub, CTA, info, hairline, pre-line)
             1.4s fade to opacity 0
             (orbs, grain, dust 는 *유지* — 페이지가 *비워지지만 살아 있음*)
t = 2.0s    검은 정적 (0.4s)
t = 2.4s    ★ 첫 threshold 문장 reveal blur (1.6s)
             "잠시, 숨."
             font-size: clamp(28px, 4vw, 44px)
             color: beige, italic
             style 자간 0.12em → -0.005em
             filter blur(14px) → 0
t = 4.0s    문장 hold (1.4s)
t = 5.4s    첫 문장 fade out (1.4s)
t = 5.8s    검은 정적 (0.4s)
t = 6.2s    ★ 두 번째 threshold 문장 reveal blur (1.6s)
             "이제부터, 천천히."
t = 7.8s    hold (1.4s)
t = 9.2s    fade out (1.4s)
t = 10.6s   ─ 다음 화면으로 전환 (real app: router push)
                              (데모: 부드럽게 페이드 인하여 entry 페이지로 복귀)
```

### 두 문장의 *무게*

**"잠시, 숨."** — 3 음절. 사용자가 *몸의 호흡으로 돌아오게* 만드는 문장.

**"이제부터, 천천히."** — 7 음절. *시작* 의 페이스 약속.

이 두 문장은 *명령이 아닌 초대*. 사용자가 *해야 하는* 것이 아니라 *함께 하자고 제안되는* 것.

### Threshold 문장의 활자

```
font-family:  Cormorant Garamond italic 300
font-size:    clamp(28px, 4vw, 44px)
line-height:  1.2
letter-spacing: -0.005em
color:        var(--c-beige)
text-align:   center
max-width:    540px
```

### 왜 *문장 둘* 인가

한 문장이면 *짧음*. 세 문장이면 *읽기 부담*. 두 문장은 — 첫 문장이 *현재로 돌아오게 하고*, 두 번째 문장이 *앞으로의 페이스를 약속*. 이 두 무게의 *균형*.

### *건너뛰기 없음*

이 8초는 *건너뛸 수 없습니다*. ESC 가 *작동하지 않음*. 사용자가 *시작하기를 결정* 한 순간 — 그 결정을 *우리는 honoring*. 짧지만 *완전히 honoring*.

(단, 페이지 뒤로 가기 버튼은 항상 작동. *escape* 가 아닌 *exit* 의 차이.)

---

## 4. Sub copy 단계 reveal

세 줄이 800ms 간격으로 등장. 사용자가 *한 줄씩 흡수* 할 시간.

### 단계 reveal 의 카피

```
Line 1 (t=7.5s):   당신이 오래 바라본 장면들,
Line 2 (t=8.3s):   자꾸 저장하게 되는 분위기들 속에는
Line 3 (t=9.1s):   당신이라는 사람의 결이 담겨 있습니다.
```

### 한 줄씩 reveal 의 시각적 의미

세 줄이 *함께* 등장하면 *블록 텍스트*. 한 줄씩 등장하면 *생각의 흐름*.

```
한 번에 모두:
                           [한 덩어리 텍스트가 등장]
                                ↓
                          "정보의 단위"


한 줄씩 단계 등장:
   당신이 오래 바라본 장면들,
                          (잠시)
   자꾸 저장하게 되는 분위기들 속에는
                          (잠시)
   당신이라는 사람의 결이 담겨 있습니다.
                                ↓
                          "사고의 흐름"
```

후자가 사용자에게 *읽는 경험* 이 아닌 *듣는 경험* 을 만듭니다.

### Framer Motion 변형

```tsx
const subCopyVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.30, 1],
      delay: 7.5 + i * 0.8,
    },
  }),
};
```

---

## 5. 마우스 시차

`hero.md` 의 시스템과 동일. damped lerp 0.05 factor.

### 깊이별 시차

```
Pre-line             ±2px
Headline             ±4px
Hairline             0
Sub copy (line 1)    ±3px
Sub copy (line 2)    ±2.5px
Sub copy (line 3)    ±2px
Beacon               0 (행동 점)
Info                 ±1px
Orb 1 (front)        ±12px
Orb 2                ±8px
Orb 3                ±10px
Orb 4 (back)         ±4px
Sigil                0
```

### Threshold Beat 안의 시차

Moment 2 (CTA 후) 에서는 *시차 OFF*. 그 8초는 *완전히 정적* — 사용자가 *호흡* 에 집중하도록.

```js
function startThresholdBeat() {
  // disable parallax during threshold
  document.documentElement.classList.add('threshold-active');
  // (CSS rule: .threshold-active * { transform: none !important; })
}
```

이게 *Moment 1* 과 *Moment 2* 의 결정적 시각 차이. Moment 1 은 *부드럽게 살아 있고*, Moment 2 는 *완전히 정적*.

---

## 6. 반응형

### Studio (≥ 1280px)

- 헤드라인 64px
- Sub copy 22px
- 본문 폭 540px
- 패딩 상하 var(--br-3)
- 빛 구체 4개
- 먼지 24개
- 마우스 시차 풀

### Desk (768–1279px)

- 헤드라인 48px
- Sub copy 19px
- 본문 폭 480px
- 패딩 var(--br-2)
- 빛 구체 4개
- 먼지 18개
- 마우스 시차 중간

### Pocket (≤ 767px)

- 헤드라인 clamp(28px, 8vw, 40px)
- Sub copy 16px
- 본문 폭 100% with 24px padding
- 패딩 var(--br-1)
- 빛 구체 2개 (orb-1, orb-2 만)
- 먼지 0
- 마우스 시차 OFF (터치 디바이스)
- 디바이스 시차 옵션 (iOS 권한 후)

모든 룸 공통:
- Threshold Beat 의 8초는 *동일* — 사용자 디바이스와 무관하게
- Sigil 위치만 조정 (top 32 → 20px)

---

## 7. Next.js + Framer Motion 구현

### 7.1 디렉토리 구조

```
app/
  onboarding/
    page.tsx                  ← Entry 페이지
components/
  entry/
    Entry.tsx                 ← 메인 컴포넌트
    PreLine.tsx
    Headline.tsx
    SubCopy.tsx               ← 단계 reveal
    StartBeacon.tsx           ← CTA + 펄스
    Info.tsx
    ThresholdBeat.tsx         ← Moment 2 시퀀스
  atmosphere/                 ← hero.md 와 동일한 컴포넌트들
    LightOrbs.tsx
    DustField.tsx
    Grain.tsx
    Sigil.tsx
```

### 7.2 `app/onboarding/page.tsx`

```tsx
import { Entry } from '@/components/entry/Entry';

export default function OnboardingPage() {
  return <Entry />;
}
```

### 7.3 `components/entry/Entry.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParallax } from '@/hooks/useParallax';
import { LightOrbs } from '@/components/atmosphere/LightOrbs';
import { DustField } from '@/components/atmosphere/DustField';
import { Grain } from '@/components/atmosphere/Grain';
import { Sigil } from '@/components/atmosphere/Sigil';
import { PreLine } from './PreLine';
import { Headline } from './Headline';
import { SubCopy } from './SubCopy';
import { StartBeacon } from './StartBeacon';
import { Info } from './Info';
import { ThresholdBeat } from './ThresholdBeat';

export function Entry() {
  const router = useRouter();
  const [thresholdActive, setThresholdActive] = useState(false);

  useParallax({ enabled: !thresholdActive });

  function handleStart() {
    setThresholdActive(true);
    // After 10.6s, navigate to next step
    setTimeout(() => {
      router.push('/onboarding/images');
    }, 10600);
  }

  return (
    <section className={`
      relative min-h-screen
      flex flex-col items-center justify-center
      px-6 md:px-12 py-24 md:py-40
      overflow-hidden
      bg-night
      ${thresholdActive ? 'threshold-active' : ''}
    `}>
      <LightOrbs />
      <DustField />
      <Sigil />

      {!thresholdActive && (
        <div className="relative z-10 w-full max-w-text flex flex-col items-center text-center gap-10">
          <PreLine />
          <Headline />
          <hr className="w-8 h-px bg-bone opacity-40 border-0" data-reveal />
          <SubCopy />
          <StartBeacon onClick={handleStart} />
          <Info />
        </div>
      )}

      {thresholdActive && <ThresholdBeat />}

      <Grain />
    </section>
  );
}
```

### 7.4 `components/entry/Headline.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

export function Headline() {
  return (
    <motion.h1
      initial={{ opacity: 0, filter: 'blur(16px)', letterSpacing: '0.12em' }}
      animate={{ opacity: 1, filter: 'blur(0px)', letterSpacing: '-0.018em' }}
      transition={{ duration: 2.2, ease: [0.16, 1, 0.30, 1], delay: 4.0 }}
      className="
        font-display italic font-light
        text-[clamp(36px,5.6vw,64px)]
        leading-[1.18]
        text-beige
      "
      style={{
        transform: 'translate(calc(var(--parallax-x, 0) * 4px), calc(var(--parallax-y, 0) * 3px))',
        transition: 'transform 0.08s linear',
      }}
    >
      우리는 자꾸<br />
      마음이 머무는 것들을<br />
      닮아갑니다.
    </motion.h1>
  );
}
```

### 7.5 `components/entry/SubCopy.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

const lines = [
  '당신이 오래 바라본 장면들,',
  '자꾸 저장하게 되는 분위기들 속에는',
  '당신이라는 사람의 결이 담겨 있습니다.',
];

export function SubCopy() {
  return (
    <div className="flex flex-col gap-2 max-w-[480px]">
      {lines.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.30, 1],
            delay: 7.5 + i * 0.8,
          }}
          className="
            font-display italic font-light
            text-[clamp(17px,2.2vw,22px)]
            leading-[1.78]
            text-mist
          "
          style={{
            transform: `translate(calc(var(--parallax-x, 0) * ${3 - i * 0.5}px), calc(var(--parallax-y, 0) * ${2 - i * 0.3}px))`,
          }}
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}
```

### 7.6 `components/entry/StartBeacon.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

export function StartBeacon({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.30, 1], delay: 10.0 }}
      className="
        relative
        inline-flex items-center gap-3
        px-8 py-3
        border border-beige/[0.20]
        rounded-sm
        text-beige text-[13px] tracking-[0.04em]
        bg-transparent
        hover:border-rose/[0.55]
        hover:bg-rose/[0.07]
        transition-colors duration-700
        active:translate-y-[1px]
      "
    >
      <span className="text-mist/45 text-[10px]">────</span>
      <span className="px-1">나의 분위기 들여다보기</span>
      <span className="text-mist/45 text-[10px]">────</span>

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

### 7.7 `components/entry/ThresholdBeat.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const phases = [
  { text: '잠시, 숨.',         delay: 2400,  duration: 4400 },
  { text: '이제부터, 천천히.', delay: 6200, duration: 4400 },
];

export function ThresholdBeat() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 5800);
    return () => clearTimeout(timer1);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.30, 1] }}
      className="absolute inset-0 flex items-center justify-center px-6"
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, filter: 'blur(14px)', letterSpacing: '0.10em' }}
          animate={{ opacity: 1, filter: 'blur(0px)', letterSpacing: '-0.005em' }}
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{
            opacity: { duration: 1.6, ease: [0.16, 1, 0.30, 1] },
            filter:  { duration: 1.6, ease: [0.16, 1, 0.30, 1] },
            letterSpacing: { duration: 1.6 },
          }}
          className="
            font-display italic font-light
            text-[clamp(28px,4vw,44px)]
            leading-[1.2]
            text-beige
            text-center
            max-w-[540px]
          "
        >
          {phases[phase].text}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
```

### 7.8 CSS — threshold-active 클래스

```css
/* parallax 완전 정지 during threshold beat */
.threshold-active * {
  transform: none !important;
  transition-property: opacity, filter, letter-spacing !important;
}
```

---

## 8. 정적 미리보기

```
taste-os/entry/
├── index.html      ← Entry + Threshold Beat 통합
├── style.css       ← 모든 스타일
└── script.js       ── 시차 + entry 시퀀스 + threshold beat
```

머지 후 `kimbany.github.io/taste-os/entry/` 에서:
1. 12초 진입 시퀀스 시청
2. *"나의 분위기 들여다보기"* 클릭
3. 8초 Threshold Beat 시청
4. (실제 앱에서는 다음 단계로 navigation; 데모에서는 entry 페이지로 부드럽게 복귀)

직접 만져보시면 — *문턱 앞* 의 부드러운 살아있음과 *문턱 위* 의 *완전한 정적* 의 차이를 *몸으로* 느낄 수 있어요. 그게 이 페이지의 *진짜 디자인*.

---

## 닫는 말

이 페이지가 잘 만들어진다면, 사용자가 *"나의 분위기 들여다보기"* 를 클릭한 직후 — 8초 동안 *세상이 잠시 멈춰서* — *호흡으로 돌아오는* 경험을 합니다.

그게 *사인업 양식* 과 *명상의 자리* 의 차이.

대부분의 앱은 사용자가 *클릭하자마자* 다음 화면으로 *끌고 갑니다*. Taste OS 는 사용자가 *클릭한 후* 8초의 *호흡* 을 *선물* 합니다.

이 8초가 *경제적 낭비* 처럼 보일 수 있어요. 효율성의 관점에서는 *제거* 해야 할 8초. 하지만 *경험* 의 관점에서는 — 사용자가 *시작하기로 결정한 순간의 무게* 를 *honoring* 하는 8초. *그 8초가 모든 것을 다르게 만듭니다*.

엔지니어가 이 Entry 를 빌드할 때 마지막 검사:

> ***Threshold Beat 의 8초를 제거하고 싶은가?***

만약 *yes* — 빌드하지 *마세요*. 이 8초가 *없으면* 그저 *또 하나의 사인업 페이지*. 8초가 *있으면* — *명상의 자리* 입니다.
