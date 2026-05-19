# Taste OS — Images / 마음에 머문 장면들

> 업로드가 아닙니다. *수집* 입니다.
> 그리고 그 수집이 진행될수록 — *방의 온도가 따뜻해집니다*.

이 문서는 Taste OS 온보딩의 **이미지 선택 화면** 단독 사양입니다. `upload/` (전체 두기 시스템) 와 달리, 이 화면은 *오직 이미지* 에 집중하며, *사용자가 이미지를 추가할수록 페이지의 분위기가 점진적으로 따뜻해지는* 시각적 시그니처를 가집니다.

함께 읽기: `upload/` (전체 두기 시스템), `entry/` (온보딩 입구), `onboarding.md` (전체 7화면 흐름), `hero.md` / `motion.md` (모션 패턴).

구현: `taste-os/images/index.html` + `style.css` + `script.js`.

---

## 목차

0. [철학 — 수집은 자기 발견](#0-철학--수집은-자기-발견)
1. [세 가지 상태](#1-세-가지-상태)
2. [State A — Emotional Intro](#2-state-a--emotional-intro)
3. [State B — Floating Canvas](#3-state-b--floating-canvas)
4. [The Atmosphere Shift — 방이 따뜻해짐](#4-the-atmosphere-shift--방이-따뜻해짐)
5. [이미지 추가 — 세 가지 방법](#5-이미지-추가--세-가지-방법)
6. [Floating Image 카드](#6-floating-image-카드)
7. [State C — Forward Threshold Beat](#7-state-c--forward-threshold-beat)
8. [Next.js + Framer Motion 구현](#8-nextjs--framer-motion-구현)
9. [정적 미리보기](#9-정적-미리보기)

---

## 0. 철학 — 수집은 자기 발견

대부분의 업로드 UI 는 *파일 관리의 효율* 을 목표로 합니다 — 빠르게 많이, 폴더로 정리, 검색 가능. Taste OS Images 는 *완전히 다른 목표* 를 가져요:

> ***사용자가 이미지를 *모으면서* 자기 자신을 발견하게.***

이를 위한 세 가지 디자인 결정:

1. **이미지가 *둥둥 떠 있음*** — 그리드도 아니고 폴더도 아니에요. *공중에 놓인 카드* 처럼 부유.
2. **방이 *따뜻해짐*** — 0장 → 1장 → 3장 → 5장 → 8장 진행되면서 페이지의 색 온도가 점진적으로 *warm* 으로 이동.
3. **카운트 *없음*** — *"3 / 10"* 같은 진행률 *없음*. 대신 *"3장 두셨어요. 더 두어도 좋고요."*

이게 *수집의 시각화* — 진행률이 아닌 *분위기의 형성*.

### 한 줄 약속

> ***사용자가 *충분히 모았다* 고 *자기 결정* 하게.***

시스템이 *"X장 더 필요해요"* 라고 말하지 *않음*. 사용자가 *자기 안에서* 결정.

---

## 1. 세 가지 상태

```
                                                                            
   사용자 도착                                                              
       │                                                                    
       ▼                                                                    
   ─────────────────────────────────────────                                
   STATE A · Emotional Intro                ~6 초                           
   ─────────────────────────────────────────                                
                                                                            
   "괜히 자꾸 저장하게 되는 장면들이 있나요?"                                
                                                                            
   당신이 오래 바라본 이미지들 속에는                                       
   당신만의 분위기가 숨어 있습니다.                                          
                                                                            
   ──── 시작하기 ────                                                       
                                                                            
       │                                                                    
       │ (사용자 클릭, 1.4s fade)                                            
       ▼                                                                    
                                                                            
   ─────────────────────────────────────────                                
   STATE B · Floating Canvas                ∞                               
   ─────────────────────────────────────────                                
                                                                            
   괜히 자꾸 저장하게 되는 장면들이 있나요?  (상단 작게)                     
                                                                            
   ┌───────────────────────────────────────┐                                
   │                                       │                                
   │    [img]    [img]                     │                                
   │         [img]                         │                                
   │   [img]                               │  ← 이미지들이 천천히 떠다님    
   │                                       │                                
   │              [img]                    │                                
   │                                       │                                
   └───────────────────────────────────────┘                                
                                                                            
   3장 두셨어요. 더 두어도 좋고요.                                            
                                                                            
   + 두기                                                                   
                                                                            
   ──── 다음 분위기로 넘어가기 ────   (n ≥ 3 일 때 등장)                     
                                                                            
       │                                                                    
       │ (사용자 클릭)                                                       
       ▼                                                                    
                                                                            
   ─────────────────────────────────────────                                
   STATE C · Forward Threshold Beat          ~6 초                          
   ─────────────────────────────────────────                                
                                                                            
   여기까지 잘 두었어요.                                                    
                                                                            
   이제, 다음으로.                                                          
                                                                            
       → (real app: 음악 화면) (demo: State A 복귀)                          
                                                                            
```

---

## 2. State A — Emotional Intro

진입 시점의 6초 시퀀스.

### 시퀀스

```
t = 0.0s    검은 화면. ambient (orbs, grain, dust, sigil) fade in.
t = 1.5s    ★ Headline reveal blur (1.8s)
              "괜히 자꾸 저장하게 되는"
              "장면들이 있나요?"
t = 3.8s    Hairline draws (0.8s)
t = 4.4s    Sub copy 단계 reveal (각 800ms 간격)
              "당신이 오래 바라본 이미지들 속에는"
              "당신만의 분위기가 숨어 있습니다."
t = 6.4s    CTA Beacon + 펄스
              "──── 시작하기 ────"
```

### 카피

| 슬롯 | 한국어 |
|---|---|
| Headline | 괜히 자꾸 저장하게 되는<br>장면들이 있나요? |
| Sub line 1 | 당신이 오래 바라본 이미지들 속에는 |
| Sub line 2 | 당신만의 분위기가 숨어 있습니다. |
| CTA | ──── 시작하기 ──── |

### 활자

```
Headline:  Cormorant Garamond italic 300
           clamp(32px, 5.6vw, 56px)
           line-height 1.22, letter-spacing -0.012em
           color: beige

Sub copy:  Cormorant Garamond italic 300
           clamp(16px, 2.0vw, 20px)
           line-height 1.78
           color: mist
           max-width 480px, 2 lines
```

### CTA — *시작하기*

이 페이지에서만 사용되는 ceremonial Beacon. 클릭 시 *intro fade out (1.4s)* → State B 로 부드러운 전환.

`hero.md` 의 CTA 와 같은 *4-dash framing*: `──── 시작하기 ────`

---

## 3. State B — Floating Canvas

이미지가 *떠다니는* 자리. State A 가 끝나면 페이지 전체 레이아웃이 부드럽게 *재배치*.

### 구성

```
┌──────────────────────────────────────────────────────────────┐
│ ◌                                              + 두기        │
│                                                              │
│ ── 괜히 자꾸 저장하게 되는 장면들이 있나요?                    │  ← 작아진 prompt
│                                                              │
│                                                              │
│      [img]      [img]                                        │
│              [img]                                           │
│                                                              │
│    [img]                  [img]                              │
│              [img]                                           │
│                                                              │
│                                                              │
│                                                              │
│   3장 두셨어요. 더 두어도 좋고요.                              │
│                                                              │
│              ──── 다음 분위기로 넘어가기 ────                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 빈 상태 (n = 0)

처음 State B 진입 시 캔버스가 비어 있음.

```
                                                                            
       마음에 머문 장면들을 두어보세요.                                     
                                                                            
       어디든 드래그하거나, 클립보드에서 붙여넣거나,                        
       + 를 눌러요.                                                          
                                                                            
                                                                            
                          + 두기                                            
                                                                            
                                                                            
```

빈 상태 안내문 (display sm italic, mist 색) — 첫 이미지가 추가되면 *부드럽게 사라짐*.

### 카운터 — 강요 없는 *알아챔*

```
0 장:   (카운터 숨김; "두어보세요" 만 표시)
1 장:   1장 두셨어요. 더 두어도 좋고요.
2 장:   2장 두셨어요. 더 두어도 좋고요.
3 장:   3장 두셨어요. 충분해요. 더 두어도 좋고요.
5 장:   5장 두셨어요. 풍경이 모이고 있어요.
8 장:   8장 두셨어요. 당신의 결이 보여요.
12 장+: n장. 두고 싶은 만큼 두세요.
```

이게 *진행률 바* 와 결정적으로 다른 점. *목표 카운트가 없음*. 시스템은 *기뻐할 뿐*.

### 카운터 활자

```
font-family: var(--font-display)
font-style: italic
font-size: 15px
color: var(--c-mist)
opacity: 0.7
text-align: center
```

### 다음으로 CTA — *조건부 등장*

```
n < 3:   CTA 숨김
n ≥ 3:   CTA 부드럽게 fade in (1.0s)
```

*하지만 강요는 없음* — *"3장 더 필요해요"* 같은 메시지는 *없음*. CTA 가 등장한 후에도 사용자가 *원하는 만큼* 더 둘 수 있음.

CTA 카피: `──── 다음 분위기로 넘어가기 ────`

*"음악으로 넘어가기"* 가 아닌 *"다음 분위기로"* — 모달리티가 아닌 *결의 흐름*.

---

## 4. The Atmosphere Shift — 방이 따뜻해짐

**이 페이지의 시그니처 디자인.** 사용자가 이미지를 더할수록 페이지 전체의 *색 온도* 가 차가운 데서 따뜻한 데로 이동.

### 4 단계 atmosphere

```
                                                                  
   count: 0           count: 1-2        count: 3-5        count: 6+
   ─────────         ─────────         ─────────         ─────────
                                                                  
   Pure cold         Warming up        Warming           Warm
                                                                  
   Background:       + 미세 rose       + rose orb        + ember
   pure night        radial top        intensified       accent
                                                                  
   Orbs visible:     rose subdued      rose full         rose +
   silver-blue       silver still      silver still      ember
   dominant                                              both glow
                                                                  
   Vignette:         standard          warm edges        warm core
                                                                  
   Grain:            standard          standard          standard
                                                                  
```

### 구현 — `body` 클래스로 단계 전환

```ts
function updateAtmosphereTier(count: number) {
  const body = document.body;
  body.classList.remove('atmo-cold', 'atmo-warming', 'atmo-warm', 'atmo-glow');
  if (count === 0) body.classList.add('atmo-cold');
  else if (count <= 2) body.classList.add('atmo-warming');
  else if (count <= 5) body.classList.add('atmo-warm');
  else body.classList.add('atmo-glow');
}
```

### CSS — 단계별 변화

```css
/* 기본 (count 0) — cold */
body.atmo-cold .orb-1 { opacity: 0.7; }
body.atmo-cold .orb-2 { opacity: 1.0; }
body.atmo-cold .orb-3 { opacity: 0.5; }

/* count 1-2 — warming */
body.atmo-warming .orb-1 { opacity: 0.9; }
body.atmo-warming .orb-3 { opacity: 0.7; }
body.atmo-warming::before {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(176, 118, 114, 0.04), transparent 60%);
}

/* count 3-5 — warm */
body.atmo-warm .orb-1 { opacity: 1.0; }
body.atmo-warm .orb-3 { opacity: 0.9; }
body.atmo-warm .orb-4 { opacity: 0.85; }
body.atmo-warm::before {
  background: radial-gradient(ellipse at 50% 0%, rgba(176, 118, 114, 0.06), transparent 60%),
              radial-gradient(ellipse at 50% 100%, rgba(143, 160, 172, 0.04), transparent 50%);
}

/* count 6+ — full glow */
body.atmo-glow .orb-1 { opacity: 1.1; transform: scale(1.05); }
body.atmo-glow .orb-3 { opacity: 1.0; }
body.atmo-glow::before {
  background: radial-gradient(ellipse at 50% 0%, rgba(176, 118, 114, 0.08), transparent 55%),
              radial-gradient(ellipse at 50% 100%, rgba(217, 166, 108, 0.05), transparent 50%);
}

/* 모든 변화는 2초 transition */
body { transition: background-color 2s ease; }
.orb { transition: opacity 2s ease, transform 2s ease; }
body::before { transition: background 2s ease; }
```

### 왜 *2초 transition*

이 변화는 *사용자가 알아채면 안 됨*. *너무 빠르면 어색하고, 너무 느리면 효과 없음*. 2초 = *방의 온도가 천천히 변하는* 시간감.

### 변화 횟수 = 한 번씩

같은 이미지를 *추가 → 삭제 → 추가* 하면 한 번만 transition. 사용자가 시각적 *어지러움* 을 느끼지 않게.

---

## 5. 이미지 추가 — 세 가지 방법

`upload/` 와 같은 세 입력 경로:

### 5.1 드래그 드롭 — *전체 viewport*

점선 사각형 *없음*. 화면 전체가 droppable.

```ts
// Drag enter — 화면에 미세한 warm glow
window.addEventListener('dragenter', () => {
  document.body.classList.add('is-dragging');
});

// Drop — 이미지를 *드롭 위치 근처* 에 배치
window.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files).filter(f => /^image\//.test(f.type));
  files.forEach((f, i) => {
    setTimeout(() => addImage(f, { x: e.clientX, y: e.clientY }), i * 200);
  });
});
```

### 5.2 클립보드 붙여넣기

```ts
window.addEventListener('paste', (e) => {
  const items = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image'));
  items.forEach((item, i) => {
    setTimeout(() => addImage(item.getAsFile()), i * 200);
  });
});
```

스크린샷을 *복사한 직후 그대로 붙여넣기* — Mac 의 *5초 명상* 같은 경험.

### 5.3 *"+ 두기"* 버튼

화면 우상단 작은 텍스트 버튼:

```
+ 두기
```

클릭 시 hidden file input 트리거. 여러 파일 선택 가능. 각 파일이 200ms 간격으로 등장 — *우르르 아닌 한 장씩 떨어지는 종이*.

### 5.4 여러 장 동시 처리

3장을 동시에 드롭 → 200ms 간격으로 settle. *동시에 모두 등장하면 페이지 충격*.

---

## 6. Floating Image 카드

각 이미지는 *그리드 위치* 가 아닌 *공중의 자리* 에 둠.

### 위치 결정 — *Grid-with-jitter*

```ts
function calculatePosition(index: number, totalCount: number): { x, y, rotation } {
  // 4x4 invisible grid
  const col = index % 4;
  const row = Math.floor(index / 4) % 4;

  // Base position within canvas
  const baseX = 10 + col * 22 + Math.random() * 5;     // % within canvas
  const baseY = 10 + row * 22 + Math.random() * 5;

  // Random rotation -2 to +2 degrees
  const rotation = (Math.random() * 4 - 2).toFixed(2);

  return { x: baseX, y: baseY, rotation };
}
```

16장 이상이면 새 row 가 *어긋나게* 시작 — 그리드가 *보이지 않게*.

### 카드 시각

```css
.image-card {
  position: absolute;
  width: 200px;
  aspect-ratio: 4 / 5;
  border-radius: 2px;
  border: 1px solid rgba(68, 62, 55, 0.55);
  background-size: cover;
  background-position: center;
  filter: saturate(0.92);
  
  /* Settle physics on appear */
  transform: rotate(var(--tilt)) translateY(16px);
  opacity: 0;
  transition:
    opacity 1.0s ease,
    transform 1.4s cubic-bezier(0.34, 1.18, 0.64, 1),
    filter 0.6s ease;
  
  /* Idle drift (8s phase-staggered) */
  animation: card-drift 8s ease-in-out infinite;
  animation-delay: var(--drift);
}

.image-card.is-placed {
  opacity: 1;
  transform: rotate(var(--tilt)) translateY(0);
}

.image-card:hover {
  filter: saturate(1.05) brightness(1.04);
  transform: rotate(var(--tilt)) translateY(-3px);
  animation-play-state: paused;
  z-index: 10;
}

@keyframes card-drift {
  0%, 100% { transform: rotate(var(--tilt)) translateY(0); }
  50%      { transform: rotate(var(--tilt)) translateY(-3px); }
}
```

### Idle drift 의 *위상 분산*

각 카드의 `--drift` 가 다름:
- Card 0: 0s
- Card 1: 1.2s
- Card 2: 2.4s
- ...

모든 카드가 *동시에 같은 방향* 으로 움직이지 않게. *각자의 호흡*.

### 호버 시 *시간이 멈춤*

호버한 카드 위에 마우스가 있는 동안 — 그 카드의 drift 가 *paused*. 다른 카드는 계속 떠다님. *주의받는 자리는 정적*.

### Click — *부드러운 제거*

카드를 클릭하면 작은 *"내려놓기"* 어포던스가 우상단에 등장 (3초간만). 다시 클릭하면 카드가 *부드럽게 사라짐* (1.4s fade + scale 0.95). 

```ts
imageCard.addEventListener('click', () => {
  showReleaseAffordance(imageCard);
});

function release(card) {
  card.style.opacity = '0';
  card.style.transform += ' scale(0.95)';
  setTimeout(() => {
    card.remove();
    updateCount();
    updateAtmosphereTier(count);
  }, 1400);
}
```

7초 안에 *되돌리기* 가능 (per `upload.md` 의 패턴).

---

## 7. State C — Forward Threshold Beat

CTA *"다음 분위기로 넘어가기"* 클릭 후 6초 시퀀스.

### 시퀀스

```
t = 0.0s    CTA warm (0.5s)
t = 0.5s    페이지 전체 (canvas, images, counter, CTA) fade out (1.4s)
              orbs, grain, dust 는 유지
t = 2.0s    검은 정적 (0.4s)
t = 2.4s    첫 문장 reveal blur (1.6s)
              "여기까지 잘 두었어요."
t = 4.0s    hold (1.4s)
t = 5.4s    fade out (1.0s)
t = 6.4s    검은 정적 (0.4s)
t = 6.8s    두 번째 문장 reveal blur (1.6s)
              "이제, 다음으로."
t = 8.4s    hold (1.0s)
t = 9.4s    real app: 다음 화면으로 router push
            demo: State A 로 fade 복귀
```

### 두 문장의 무게

```
"여기까지 잘 두었어요."     — 사용자의 행위를 honoring (4 syllables in essence)
"이제, 다음으로."           — 다음 페이스 약속 (4 syllables)
```

`entry.md` 의 *"잠시, 숨" / "이제부터, 천천히"* 와 같은 두 박자 구조. *과거 honoring + 미래 약속*.

### Threshold beat 안의 마우스 시차 — OFF

State B 의 카드들은 *전체 페이지 마우스 시차* (`--parallax-x`, `--parallax-y`) 의 영향을 받음. Threshold beat 가 시작되면 *시차 OFF* — *호흡으로 돌아오는 정적*.

```js
function startThresholdBeat() {
  parallaxActive = false;
  document.body.setAttribute('data-threshold', 'active');
}
```

---

## 8. Next.js + Framer Motion 구현

### 8.1 디렉토리 구조

```
app/
  onboarding/
    images/
      page.tsx                    ← 이미지 선택 페이지
components/
  images/
    ImageCollection.tsx           ← 메인 컴포넌트 (3 상태)
    IntroState.tsx                ← State A
    CanvasState.tsx               ← State B
    ForwardBeat.tsx               ← State C
    FloatingImage.tsx             ← 단일 카드
    EmptyHint.tsx                 ← 빈 상태 안내
    Counter.tsx                   ← 카운터 문장
    AtmosphereLayer.tsx           ← 배경 분위기 단계 토글
hooks/
  useImageUpload.ts               ← FileReader + paste + drop
  useAtmosphereTier.ts            ← count → tier 매핑
```

### 8.2 `useImageUpload.ts`

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

export type UploadedImage = {
  id: string;
  dataUrl: string;
  tilt: number;       // -2 to +2
  driftDelay: number; // 0 to 8s
  position: { x: number; y: number };  // percent within canvas
};

export function useImageUpload() {
  const [images, setImages] = useState<UploadedImage[]>([]);

  const readFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  };

  const addImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await readFile(file);

    setImages((prev) => {
      const i = prev.length;
      const col = i % 4;
      const row = Math.floor(i / 4) % 4;
      return [
        ...prev,
        {
          id: `img-${Date.now()}-${Math.random()}`,
          dataUrl,
          tilt: +(Math.random() * 4 - 2).toFixed(2),
          driftDelay: +(Math.random() * 8).toFixed(2),
          position: {
            x: 10 + col * 22 + Math.random() * 5,
            y: 10 + row * 22 + Math.random() * 5,
          },
        },
      ];
    });
  }, []);

  const addMultiple = useCallback((files: File[]) => {
    files.forEach((f, i) => {
      setTimeout(() => addImage(f), i * 200);
    });
  }, [addImage]);

  const remove = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  // Setup drag-drop + paste at hook level
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      document.body.classList.remove('is-dragging');
      if (!e.dataTransfer) return;
      const files = Array.from(e.dataTransfer.files);
      addMultiple(files);
    };
    const onDragEnter = () => document.body.classList.add('is-dragging');
    const onDragLeave = () => document.body.classList.remove('is-dragging');
    const onPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter((i) => i.type.startsWith('image/'));
      const files = imageItems.map((i) => i.getAsFile()).filter(Boolean) as File[];
      addMultiple(files);
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('paste', onPaste);

    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('paste', onPaste);
    };
  }, [addMultiple]);

  return { images, addImage, addMultiple, remove };
}
```

### 8.3 `useAtmosphereTier.ts`

```tsx
'use client';

import { useEffect } from 'react';

export type AtmosphereTier = 'cold' | 'warming' | 'warm' | 'glow';

export function useAtmosphereTier(count: number): AtmosphereTier {
  const tier: AtmosphereTier =
    count === 0  ? 'cold' :
    count <= 2   ? 'warming' :
    count <= 5   ? 'warm' :
                   'glow';

  useEffect(() => {
    document.body.classList.remove('atmo-cold', 'atmo-warming', 'atmo-warm', 'atmo-glow');
    document.body.classList.add(`atmo-${tier}`);
  }, [tier]);

  return tier;
}
```

### 8.4 `ImageCollection.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAtmosphereTier } from '@/hooks/useAtmosphereTier';
import { LightOrbs } from '@/components/atmosphere/LightOrbs';
import { DustField } from '@/components/atmosphere/DustField';
import { Grain } from '@/components/atmosphere/Grain';
import { Sigil } from '@/components/atmosphere/Sigil';
import { IntroState } from './IntroState';
import { CanvasState } from './CanvasState';
import { ForwardBeat } from './ForwardBeat';

type Phase = 'intro' | 'canvas' | 'forward';

export function ImageCollection() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const { images, addMultiple, remove } = useImageUpload();
  useAtmosphereTier(images.length);

  return (
    <section className="relative min-h-screen overflow-hidden bg-night">
      <LightOrbs />
      <DustField />
      <Sigil />

      {phase === 'intro' && (
        <IntroState onStart={() => setPhase('canvas')} />
      )}

      {phase === 'canvas' && (
        <CanvasState
          images={images}
          onAdd={addMultiple}
          onRemove={remove}
          onForward={() => {
            setPhase('forward');
            setTimeout(() => router.push('/onboarding/sound'), 9400);
          }}
        />
      )}

      {phase === 'forward' && <ForwardBeat />}

      <Grain />
    </section>
  );
}
```

### 8.5 `FloatingImage.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { UploadedImage } from '@/hooks/useImageUpload';

export function FloatingImage({
  img,
  onRemove,
}: {
  img: UploadedImage;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{
        duration: 1.4,
        ease: [0.34, 1.18, 0.64, 1],  // settle
      }}
      onClick={onRemove}
      className="absolute w-[200px] aspect-[4/5] cursor-pointer"
      style={{
        left: `${img.position.x}%`,
        top: `${img.position.y}%`,
        backgroundImage: `url(${img.dataUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '2px',
        border: '1px solid rgba(68, 62, 55, 0.55)',
        filter: 'saturate(0.92)',
        transform: `rotate(${img.tilt}deg)`,
        animation: `card-drift 8s ease-in-out infinite`,
        animationDelay: `${img.driftDelay}s`,
        willChange: 'transform, filter',
      }}
      whileHover={{
        filter: 'saturate(1.05) brightness(1.04)',
        y: -3,
      }}
    />
  );
}
```

---

## 9. 정적 미리보기

```
taste-os/images/
├── index.html
├── style.css
└── script.js
```

머지 후 `kimbany.github.io/taste-os/images/` 에서:

1. **State A** — Intro 6초 시청
2. **"시작하기"** 클릭
3. **State B** — Canvas 모드. 이미지를:
   - 화면에 *드래그*
   - `Cmd+V` / `Ctrl+V` 로 *붙여넣기*
   - *"+ 두기"* 클릭하여 파일 선택
4. **사용자가 추가할 때마다 방의 색 온도가 점진적으로 따뜻해짐** — *눈으로 보임*
5. *"다음 분위기로 넘어가기"* (3장 이상 시 등장) 클릭
6. **State C** — Threshold Beat 6초 시청
7. (Demo: State A 로 복귀 / Real app: 음악 화면으로)

직접 이미지 3장을 드래그해보세요 — *페이지의 분위기가 변하는 것* 을 *눈으로 느낄 수 있어요*. 그게 이 화면의 *진짜 디자인*.

---

## 닫는 말

이 화면이 잘 만들어진다면, 사용자가 5장 째 이미지를 추가하는 순간 *생각해요*:

> ***"이 페이지가 나를 알아보네."***

진행률 바도, *"잘 하고 있어요"* 같은 격려도 *없습니다*. *오직 페이지의 분위기 자체가 따뜻해지는* 시각적 응답.

그게 *수집의 시각화* — 행위의 *진행* 이 아닌 *결의 형성*.

엔지니어가 이 화면을 빌드할 때 마지막 검사:

> ***이미지를 추가했을 때 *시각적 차이가 느껴지는가*?***

만약 *no* — atmosphere shift 의 강도를 *늘려야* 함. 만약 *너무 명확하게 yes* (사용자가 *놀랄 정도로*) — 강도를 *낮춰야* 함. 정답은 *알아채지만 의식적으로 알아채지 않는* 지점.

그 지점이 *수집이 자기 발견이 되는 자리* 입니다.
