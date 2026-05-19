# Taste OS — Quotes / 마음에 머문 문장들

> 노트 앱이 아닙니다. *내면의 언어* 를 *듣는 자리*.
> 사용자가 문장을 더할수록 — 페이지가 *공책처럼 따뜻해집니다*.

이 문서는 Taste OS 온보딩의 **문장 반영 화면** 단독 사양입니다. `images/` / `music/` 의 *3-상태 구조* 와 *atmosphere shift* 를 그대로 따르되, 문장만의 *시그니처 시각* 이 두 가지:

1. **순수 떠다니는 italic 텍스트** — 카드 박스 *없음*. 글자가 *그대로 공중에*.
2. **Paper-line 텍스처** — 사용자가 문장을 더할수록 *공책 같은* 미세한 가로줄이 *나타남*.

함께 읽기: `images.md`, `music.md` (자매 화면), `voice.md` (한국어 보이스 — 인용 처리), `tokens.md` / `motion.md`.

구현: `taste-os/quotes/index.html` + `style.css` + `script.js`.

---

## 목차

0. [철학 — 인용은 자기 발견의 가장 친밀한 형태](#0-철학--인용은-자기-발견의-가장-친밀한-형태)
1. [세 가지 상태](#1-세-가지-상태)
2. [State A — Emotional Intro](#2-state-a--emotional-intro)
3. [State B — Floating Language Canvas](#3-state-b--floating-language-canvas)
4. [Quote Fragment — *카드 없는* 텍스트](#4-quote-fragment--카드-없는-텍스트)
5. [Paper-Line Texture — 시그니처 시각](#5-paper-line-texture--시그니처-시각)
6. [Atmosphere Resonance — 4 단계](#6-atmosphere-resonance--4-단계)
7. [Focus Dimming — *한 목소리만* 듣기](#7-focus-dimming--한-목소리만-듣기)
8. [Add Panel — 세 필드](#8-add-panel--세-필드)
9. [State C — Forward Threshold Beat](#9-state-c--forward-threshold-beat)
10. [Next.js + Framer Motion 구현](#10-nextjs--framer-motion-구현)
11. [정적 미리보기](#11-정적-미리보기)

---

## 0. 철학 — 인용은 자기 발견의 가장 친밀한 형태

이미지와 음악은 *시각*·*청각* 의 기억. 인용은 *언어* 의 기억 — 그래서 *가장 사적*. 한 문장이 *나에게 머무는* 이유는 *그 문장이 나의 어떤 부분과 호응* 했기 때문이에요.

> ***사용자가 인용을 모으면서 *자기 내면의 언어* 를 발견하게.***

이를 위한 세 가지 디자인 결정:

1. **카드 박스 *없음*.** 음악은 disc + box, 이미지는 image + box. 인용은 *카드 박스 없이 순수 italic 타이포만* — 문장의 *섬세함* 을 보호.
2. **Paper-line 텍스처 — 공책의 비주얼.** 사용자가 문장을 더할수록 *공책 같은 미세한 가로줄* 이 등장. 페이지가 *써내려가지는 공책* 처럼.
3. **Focus dimming — 한 목소리만 들리기.** 한 인용에 호버하면 다른 인용들이 *살짝 흐려짐*. *한 번에 한 목소리만 듣는* 독서의 시각화.

### 한 줄 약속

> ***인용은 *나의 다른 부분이 나에게 하는 말* 이다.***

이 페이지가 잘 만들어진다면 사용자는 6개 째 인용을 두는 순간 — *"이 문장들이 결국 내 내면의 목소리들이구나"* 라고 느낍니다.

---

## 1. 세 가지 상태

`images/` / `music/` 와 같은 3-상태:

```
                                                                            
   STATE A · Emotional Intro                    ~6 초                       
   ─────────────────────────────────────                                    
                                                                            
   "오래 마음속에 남아 있던 문장들이 있나요?"                                
                                                                            
   자꾸 다시 읽게 되는 문장들 속에는                                         
   당신만의 감정과 세계관이 담겨 있습니다.                                   
                                                                            
   ──── 시작하기 ────                                                       
                                                                            
       │                                                                    
       ▼                                                                    
                                                                            
   STATE B · Floating Language Canvas              ∞                       
   ─────────────────────────────────────                                    
                                                                            
   오래 마음속에 남아 있던 문장들이 있나요?  (상단 작게)                     
                                                                            
                                                                            
       잠시, 머물러도 좋아요.                                                
       ─── Rumi                                                            
       매일 아침 떠올라요.                                                  
                                                                            
                                                                            
           별을 보려면                                                       
           어둠이 필요해요.                                                  
           ─── M.L. King Jr.                                                
                                                                            
                                                                            
                  인생에서 가장 중요한 것은                                  
                  어디로 향하고 있는지다.                                    
                  ─── Goethe                                                
                                                                            
                                                                            
   3개 두셨어요. 더 두어도 좋고요.                                            
                                                                            
   + 문장 두기                                                              
                                                                            
   ──── 다음 분위기로 이어가기 ────  (n ≥ 3 등장)                            
                                                                            
       │                                                                    
       ▼                                                                    
                                                                            
   STATE C · Forward Threshold Beat                ~8 초                   
   ─────────────────────────────────────                                    
                                                                            
   "여기까지 머문 문장들을 잘 두었어요."                                     
                                                                            
   "이제, 다음 분위기로."                                                    
                                                                            
```

---

## 2. State A — Emotional Intro

```
t = 0.0s    검은 화면. ambient (orbs, grain, sigil) fade in
t = 1.5s    ★ Headline reveal blur (1.8s)
              "오래 마음속에 남아 있던"
              "문장들이 있나요?"
t = 3.8s    Hairline draws
t = 4.4s    Sub copy staggered reveal:
              "자꾸 다시 읽게 되는 문장들 속에는"
              "당신만의 감정과 세계관이 담겨 있습니다."
t = 6.4s    CTA: "──── 시작하기 ────"
```

---

## 3. State B — Floating Language Canvas

### 빈 상태 (n = 0)

```
       마음에 남은 문장들을 두어보세요.                                     
                                                                            
       자꾸 떠오르는 한 줄, 책에서 옮겨두고 싶은 말,                         
       당신만 아는 어떤 문장.                                                
                                                                            
                          + 문장 두기                                       
                                                                            
```

### 카운터 — 문장 전용 카피

```
0:    (카운터 숨김; "두어보세요" 만)
1:    1개 두셨어요. 더 두어도 좋고요.
2:    2개 두셨어요. 더 두어도 좋고요.
3:    3개 두셨어요. 충분해요. 더 두어도 좋고요.
4:    4개. 결이 모이고 있어요.
5:    5개. 당신의 언어가 보여요.
8:    8개 두셨어요. 당신의 세계관이 들려요.
12+:  n개. 두고 싶은 만큼 두세요.
```

*"당신의 언어가 보여요"*, *"당신의 세계관이 들려요"* — 음악의 *"감정의 리듬"* 과는 다른 *언어의 깊이* 톤.

### CTA — 조건부 등장 (n ≥ 3)

CTA 카피: **`──── 다음 분위기로 이어가기 ────`** (브리프 명시)

---

## 4. Quote Fragment — *카드 없는* 텍스트

이 페이지의 가장 결정적인 디자인 결정. **카드 박스가 *없음*.** 인용은 *그대로 공중에 떠 있는 italic 텍스트*.

### 시각 — 세 부분

```
                                                                            
                                                                            
             별을 보려면                                                    
             어둠이 필요해요.                                                
             ─── M.L. King Jr.                                              
                                                                            
             불안한 밤마다 떠올랐어요.                                       
                                                                            
                                                                            
```

세 요소:
1. **인용 본문** — Cormorant Garamond italic 300, 크기는 *길이에 따라 자동 조정*
2. **출처 (선택)** — mono 11px, lowercase, ─── 글리프와 함께
3. **기억 노트 (선택)** — italic 13px, mist 색

**카드 보더 *없음*. 배경 *없음*. 글자만.**

### 활자 — 길이 기반 자동 크기

```ts
function getQuoteSize(text: string): 'lg' | 'md' | 'sm' {
  const len = text.length;
  if (len <= 30) return 'lg';     // 한 줄 짧은 문장
  if (len <= 80) return 'md';     // 두 줄 정도
  return 'sm';                     // 긴 문장
}
```

크기별 활자:

```css
.q-lg {
  font-size: clamp(24px, 3.0vw, 32px);
  line-height: 1.35;
  letter-spacing: -0.012em;
  max-width: 380px;
}

.q-md {
  font-size: clamp(19px, 2.4vw, 24px);
  line-height: 1.5;
  letter-spacing: -0.005em;
  max-width: 400px;
}

.q-sm {
  font-size: clamp(15px, 1.8vw, 18px);
  line-height: 1.75;
  letter-spacing: 0;
  max-width: 360px;
}
```

이 변화가 *시각의 깊이* 를 만들어요 — 어떤 인용은 *가까이*, 어떤 인용은 *멀리*.

### 위치 — Grid-with-jitter (음악과 동일)

```ts
function calculatePosition(index: number) {
  const col = index % 4;
  const row = Math.floor(index / 4) % 4;
  const baseX = 12 + col * 22 + Math.random() * 4 - 2;
  const baseY = 10 + row * 22 + Math.random() * 4 - 2;
  return { x: baseX, y: baseY };
}
```

각 인용은 *절대 위치* 로 배치. 무작위 tilt -2 ~ +2도. Idle drift 8초 (위상 분산).

### Hover — *문장이 살짝 깨어남*

```css
.quote-fragment:hover {
  filter: brightness(1.08);
  /* letter-spacing 미세 확장 */
}

.quote-fragment:hover .q-body {
  letter-spacing: -0.005em;       /* 미세하게 더 열림 */
  transition: letter-spacing 0.8s ease;
}
```

### 따옴표 *없음*

```
✗ "별을 보려면 어둠이 필요해요."
✓ 별을 보려면 어둠이 필요해요.
```

`voice.md` 의 약속 — *italic 자체가 인용 표시*. 따옴표는 *과잉*.

### 출처 표시

```
─── M.L. King Jr.
─── Rumi
─── 박완서
─── (or blank — sometimes you don't know)
```

3-dash 글리프로 시작. mono lowercase. 사용자가 *모르거나 안 적어도* 괜찮음.

---

## 5. Paper-Line Texture — 시그니처 시각

이 페이지의 *진짜 시그니처*. 사용자가 문장을 추가할수록 페이지 배경에 *공책의 가로줄 같은* 미세한 lines 가 나타남.

### 시각

```
                                                                            
   ─────────────────────────────────────────────────────────────────────  
                                                                            
   ─────────────────────────────────────────────────────────────────────  
                                                                            
   ─────────────────────────────────────────────────────────────────────  
                                                                            
   ─────────────────────────────────────────────────────────────────────  
                                                                            
   ─────────────────────────────────────────────────────────────────────  
                                                                            
   ─────────────────────────────────────────────────────────────────────  
                                                                            
```

32px 간격의 *매우 흐린* 가로줄. 평소엔 *안 보이고*, 인용이 많아질수록 *조금씩 보임*.

### CSS

```css
body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 31px,
    rgba(216, 199, 172, 0.0) 31px,
    rgba(216, 199, 172, 0.0) 32px
  );
  transition: background-image 2s ease;
}

body.quotes-mid::after {
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 31px,
    rgba(216, 199, 172, 0.015) 31px,
    rgba(216, 199, 172, 0.015) 32px
  );
}

body.quotes-full::after {
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 31px,
    rgba(216, 199, 172, 0.025) 31px,
    rgba(216, 199, 172, 0.025) 32px
  );
}
```

### 왜 *32px* 간격인가

32px ≈ *영어 본문의 baseline grid* (text-lg + line-height 1.65). 사용자의 *문장* 이 그 *라인 위에 쓰여진* 듯한 *공책 같은* 느낌.

### Reduced motion 에서

`prefers-reduced-motion: reduce` — paper-line texture 의 transition 만 제거. 라인 자체는 *그대로* 보임 (시각 정보 손실 없음).

---

## 6. Atmosphere Resonance — 4 단계

```
                                                                  
   count: 0          count: 1-2       count: 3-5       count: 6+ 
   ──────────       ──────────       ──────────       ──────────
                                                                  
   silent           subtle           paper            rich paper 
                    warmth           emerges                     
                                                                  
   orbs:            orbs: 약간       orbs: rose       orbs: rose 
   silver           rose 강화        강화 + sand      + ember    
   dominant                          glow             glow       
                                                                  
   bg::before:      미세한 rose      pearl 3%         pearl 5%   
   투명             radial top                                   
                                                                  
   paper-lines:     안 보임          0.015 opacity    0.025      
   안 보임                          (눈에 살짝)       (확실히)   
                                                                  
   focus dimming:   비활성           활성             활성       
                                                                  
```

### Tier 클래스

```ts
function updateQuotesTier(count: number) {
  const body = document.body;
  body.classList.remove('quotes-silent', 'quotes-low', 'quotes-mid', 'quotes-full');
  if (count === 0)      body.classList.add('quotes-silent');
  else if (count <= 2)  body.classList.add('quotes-low');
  else if (count <= 5)  body.classList.add('quotes-mid');
  else                  body.classList.add('quotes-full');
}
```

### 변화는 2초 transition

```css
body { transition: background-color 2s ease; }
.orb { transition: opacity 2s ease; }
body::after { transition: background-image 2s ease; }
body::before { transition: background 2s ease; }
```

모든 변화가 *천천히* — 사용자가 *알아채지만 의식적으로 알아채지 않게*.

---

## 7. Focus Dimming — *한 목소리만* 듣기

이 페이지만의 또 다른 시그니처. 한 인용에 호버하면 *다른 모든 인용이 살짝 흐려짐* — *한 번에 한 목소리만 듣는* 독서의 시각화.

### CSS

```css
.quotes-canvas:hover .quote-fragment:not(:hover) {
  opacity: 0.32;
  filter: blur(1px);
  transition:
    opacity 0.8s ease,
    filter 0.8s ease;
}

.quote-fragment:hover {
  opacity: 1;
  filter: none;
  transition:
    opacity 0.4s ease,
    filter 0.4s ease;
}
```

### 효과

- 평소: 모든 인용이 *동등하게* 떠 있음
- 한 인용에 호버: *그 인용만 또렷*, 다른 모든 인용이 *0.32 + blur(1px)*
- 마우스 이동: 새 인용이 또렷해지고, 이전 인용은 다시 흐려짐
- 마우스 이탈: 모든 인용이 *다시 동등*

### 왜 이게 *시각의 시* 인가

이 인터랙션이 *"한 문장에 집중할 때 다른 문장들이 멀어지는"* 독서 경험을 시각화. 의도되지 않은 *몰입의 미학*.

### Reduced motion 에서

filter 효과는 제거, opacity 만 (0.32 → 0.5 로 약화). 사용자가 어지러움을 느끼지 않게.

---

## 8. Add Panel — 세 필드

`music/` 의 add panel 과 유사한 구조, 필드 셋.

### 패널 구조

```
                                                                            
   ╔═══════════════════════════════════════════════════════════════╗      
   ║                                                               ║      
   ║   마음에 남은 한 줄.                                            ║      
   ║                                                               ║      
   ║   ┌─────────────────────────────────────────────────────┐    ║      
   ║   │ 별을 보려면 어둠이 필요해요.                            │    ║      
   ║   └─────────────────────────────────────────────────────┘    ║      
   ║                                                               ║      
   ║   ─ 출처 (선택)                                                ║      
   ║   ┌─────────────────────────────────────────────────────┐    ║      
   ║   │ M.L. King Jr.                                        │    ║      
   ║   └─────────────────────────────────────────────────────┘    ║      
   ║                                                               ║      
   ║   ─ 이 문장이 머무는 자리 (선택)                                ║      
   ║   ┌─────────────────────────────────────────────────────┐    ║      
   ║   │ 불안한 밤마다 떠올랐어요.                              │    ║      
   ║   └─────────────────────────────────────────────────────┘    ║      
   ║                                                               ║      
   ║                  ──── 두기 ────                                ║      
   ║                                                               ║      
   ║                       취소                                     ║      
   ║                                                               ║      
   ╚═══════════════════════════════════════════════════════════════╝      
                                                                            
```

### 세 필드

1. **본문** — 필수
   - `<textarea>` (multi-line)
   - max 280 chars
   - placeholder: *"별을 보려면 어둠이 필요해요."*

2. **출처** — 선택
   - 한 줄 input
   - max 60 chars
   - placeholder: *"M.L. King Jr."* / *"박완서"* / *"내가 자주 하는 말"*

3. **기억 노트** — 선택
   - 한 줄 input
   - max 60 chars
   - placeholder: *"불안한 밤마다 떠올랐어요."*

### 키보드

- `Cmd/Ctrl + Enter` → confirm
- `Escape` → close
- `Tab` → 다음 필드

### 클립보드 자동 감지 — *없음*

`music/` 은 Spotify URL 자동 감지가 유용하지만, *플레인 텍스트 paste* 마다 panel 이 열리면 *방해됨*. 그래서 quotes 페이지는 자동 paste 감지 *없음*. 사용자가 *명시적으로* "+ 문장 두기" 를 눌러야 panel 열림.

---

## 9. State C — Forward Threshold Beat

`images/` / `music/` State C 와 같은 패턴, 다른 카피.

### 시퀀스 (8초)

```
t = 0.0s    CTA warm
t = 0.5s    Canvas + 인용들 fade out (1.4s)
              + paper-lines fade out
              orbs, grain 유지
t = 2.0s    검은 정적 + backdrop blur
t = 2.4s    첫 문장 reveal blur (1.6s)
              "여기까지 머문 문장들을 잘 두었어요."
t = 4.0s    hold + fade
t = 6.0s    두 번째 문장 reveal blur
              "이제, 다음 분위기로."
t = 8.4s    real app: 다음 화면 / demo: Intro 복귀
```

### 두 문장의 무게

| | 의미 |
|---|---|
| *"여기까지 머문 문장들을 잘 두었어요."* | *머무름* 의 honoring — 사용자가 *기억해 둔* 행위에 대한 인정 |
| *"이제, 다음 분위기로."* | 다음 페이스 약속 |

*"문장을 잘 모았어요"* 가 아닌 *"머문 문장들을"* — 사용자가 *능동적 수집가* 가 아닌 *부드러운 기억자* 임을 honoring.

---

## 10. Next.js + Framer Motion 구현

### 10.1 디렉토리 구조

```
app/
  onboarding/
    quotes/
      page.tsx                    ← 인용 페이지
components/
  quotes/
    QuoteReflection.tsx           ← 메인 (3 상태)
    IntroState.tsx
    LanguageCanvas.tsx            ← State B
    ForwardBeat.tsx
    QuoteFragment.tsx             ← 단일 floating 인용 (카드 없음)
    AddPanel.tsx                  ← 세 필드 panel
    PaperLines.tsx                ← (CSS-only, 별도 컴포넌트 불필요)
hooks/
  useQuotes.ts
  useQuotesTier.ts
```

### 10.2 `hooks/useQuotes.ts`

```tsx
'use client';

import { useState, useCallback } from 'react';

export type Quote = {
  id: string;
  body: string;
  attribution: string;       // optional
  memory: string;             // optional
  size: 'lg' | 'md' | 'sm';
  tilt: number;
  drift: number;
  position: { x: number; y: number };
};

function getSize(text: string): 'lg' | 'md' | 'sm' {
  const len = text.length;
  if (len <= 30) return 'lg';
  if (len <= 80) return 'md';
  return 'sm';
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const add = useCallback((body: string, attribution: string = '', memory: string = '') => {
    if (!body.trim()) return;

    setQuotes((prev) => {
      const i = prev.length;
      const col = i % 4;
      const row = Math.floor(i / 4) % 4;
      return [
        ...prev,
        {
          id: 'q-' + Date.now() + Math.random().toString(36).slice(2, 6),
          body: body.trim(),
          attribution: attribution.trim(),
          memory: memory.trim(),
          size: getSize(body.trim()),
          tilt: +(Math.random() * 4 - 2).toFixed(2),
          drift: +(Math.random() * 8).toFixed(2),
          position: {
            x: 12 + col * 22 + Math.random() * 4 - 2,
            y: 10 + row * 22 + Math.random() * 4 - 2,
          },
        },
      ];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  return { quotes, add, remove };
}
```

### 10.3 `components/quotes/QuoteFragment.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { Quote } from '@/hooks/useQuotes';

export function QuoteFragment({ quote, onRemove }: { quote: Quote; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.30, 1] }}
      onClick={onRemove}
      style={{
        position: 'absolute',
        left: `${quote.position.x}%`,
        top: `${quote.position.y}%`,
        transform: `rotate(${quote.tilt}deg)`,
      }}
      className={`quote-fragment q-${quote.size} cursor-pointer`}
    >
      <p className="q-body">{quote.body}</p>
      {quote.attribution && (
        <p className="q-attribution">─── {quote.attribution}</p>
      )}
      {quote.memory && (
        <p className="q-memory">{quote.memory}</p>
      )}
    </motion.div>
  );
}
```

### 10.4 `components/quotes/LanguageCanvas.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useQuotes } from '@/hooks/useQuotes';
import { useQuotesTier } from '@/hooks/useQuotesTier';
import { QuoteFragment } from './QuoteFragment';
import { AddPanel } from './AddPanel';

export function LanguageCanvas({ onForward }: { onForward: () => void }) {
  const { quotes, add, remove } = useQuotes();
  const [panelOpen, setPanelOpen] = useState(false);
  useQuotesTier(quotes.length);

  return (
    <main className="canvas-state">
      <header>
        <p className="canvas-prompt">오래 마음속에 남아 있던 문장들이 있나요?</p>
        <button onClick={() => setPanelOpen(true)}>+ 문장 두기</button>
      </header>

      <div className="quotes-canvas">
        {quotes.length === 0 && (
          <p className="empty-hint">
            마음에 남은 문장들을 두어보세요.<br/>
            자꾸 떠오르는 한 줄, 책에서 옮겨두고 싶은 말, 당신만 아는 어떤 문장.
          </p>
        )}
        {quotes.map((q) => (
          <QuoteFragment key={q.id} quote={q} onRemove={() => remove(q.id)} />
        ))}
      </div>

      <footer>
        <Counter count={quotes.length} />
        {quotes.length >= 3 && (
          <button onClick={onForward}>──── 다음 분위기로 이어가기 ────</button>
        )}
      </footer>

      <AddPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onAdd={(body, attribution, memory) => {
          add(body, attribution, memory);
          setPanelOpen(false);
        }}
      />
    </main>
  );
}
```

---

## 11. 정적 미리보기

```
taste-os/quotes/
├── index.html
├── style.css
└── script.js
```

머지 후 `kimbany.github.io/taste-os/quotes/` 에서:

1. **State A** — Intro 6초 시청
2. **"시작하기"** 클릭
3. **State B** — Canvas. 인용을 추가하는 세 방법:
   - **+ 문장 두기** 버튼 → panel 에서 본문 입력 (+ 출처 + 기억 노트)
4. **3개 추가하면서 페이지 변화 관찰**:
   - 페이지 배경에 *paper-line* 이 *서서히 등장*
   - 빛 구체 색이 *조금 따뜻해짐*
5. **하나의 인용에 호버해보세요**:
   - 다른 모든 인용이 *살짝 흐려지며* 한 인용만 또렷
   - 마우스 이동 시 새로 또렷해지는 인용 변화
6. **"다음 분위기로 이어가기"** (3개 이상 시) 클릭
7. **State C** — Threshold Beat 8초

특히 6개 째 추가한 후 — 페이지 배경에 *공책의 가로줄* 이 *희미하게* 보이기 시작합니다. 그게 *공책처럼 따뜻해진* 페이지.

---

## 닫는 말

이 페이지의 진짜 디자인 의도:

> ***사용자가 6개 째 인용을 두는 순간 — "이 문장들이 결국 내 내면의 목소리들이구나" 라고 느끼는 것.***

이를 위해:
- 인용을 *카드 없이* 두어 *섬세함을 보호*
- 한 인용에 호버하면 다른 인용이 *흐려져서* — 한 목소리만 듣게
- Paper-line 텍스처로 — 페이지가 *공책처럼* 따뜻해짐
- 카운터 카피가 *"당신의 언어가 보여요"* / *"당신의 세계관이 들려요"* 로 *언어의 깊이* 인식

엔지니어가 이 화면을 빌드할 때 마지막 검사:

> ***한 인용에 호버할 때 *다른 모든 인용이 살짝 흐려지는* 효과가 *작동하는가*?***

만약 *no* — 그건 이 페이지의 *시그니처 인터랙션* 이 빠진 것. 빌드를 다시 시작해야 함. *이 한 인터랙션* 이 *수십 가지 다른 요소* 보다 *경험을 결정* 합니다.
