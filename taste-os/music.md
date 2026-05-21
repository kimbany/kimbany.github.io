# Taste OS — Music / 마음을 닮은 소리

> 음악 플레이어가 아닙니다. *내면의 소리* 를 *듣는 자리*.
> 그리고 사용자가 음악을 더할수록 — *페이지에서 소리가 들리기 시작합니다*.

이 문서는 Taste OS 온보딩의 **음악 반영 화면** 단독 사양입니다. `images/` 의 *3-상태 구조* 와 *atmosphere shift* 를 그대로 따르되, 음악만의 *시그니처 시각 요소* 가 두 가지 추가됩니다:

1. **각 음악 카드에서 *퍼져 나가는 echo 링*** — 사용자가 *눈으로* 음악을 *느낌*
2. **페이지 하단의 *ambient sound wave*** — 음악 수가 늘수록 *깊어짐*

함께 읽기: `images.md` (자매 화면 — 같은 3-상태 패턴), `upload/` (음악 카드 시각 원형), `motion.md` / `tokens.md`.

구현: `taste-os/music/index.html` + `style.css` + `script.js`.

---

## 목차

0. [철학 — 소리는 자기 발견](#0-철학--소리는-자기-발견)
1. [세 가지 상태](#1-세-가지-상태)
2. [State A — Emotional Intro](#2-state-a--emotional-intro)
3. [State B — Floating Sonic Canvas](#3-state-b--floating-sonic-canvas)
4. [음악 카드 — Echo Disc](#4-음악-카드--echo-disc)
5. [Ambient Sound Wave — 시그니처 시각](#5-ambient-sound-wave--시그니처-시각)
6. [Atmosphere Resonance — 4 단계](#6-atmosphere-resonance--4-단계)
7. [음악 추가 — Input Panel](#7-음악-추가--input-panel)
8. [State C — Forward Threshold Beat](#8-state-c--forward-threshold-beat)
9. [Next.js + Framer Motion 구현](#9-nextjs--framer-motion-구현)
10. [정적 미리보기](#10-정적-미리보기)

---

## 0. 철학 — 소리는 자기 발견

대부분의 음악 앱은 *오디오 재생의 효율* 을 목표로 합니다 — 빠른 검색, 추천 알고리즘, 무한 플레이리스트. Taste OS Music 은 *완전히 다른 목표*:

> ***사용자가 음악을 *기억하면서* 자기 자신을 발견하게.***

여기서 *재생* 은 일어나지 *않습니다*. 사용자가 *기억* 으로만 음악을 둡니다 — 곡명과 아티스트, 또는 Spotify/Apple Music 링크. 시스템은 *오디오를 추출하지 않음*. *사용자의 기억* 만 저장.

이를 위한 세 가지 디자인 결정:

1. **음악 카드가 *둥둥 떠 있음*** — `images/` 와 같은 floating canvas
2. **각 카드에서 *Echo 가 퍼져 나옴*** — 음악이 *살아 있다* 는 시각적 약속
3. **페이지 하단에 *Ambient Wave*** — 사용자가 음악을 더할수록 wave 가 *깊어짐*

### 한 줄 약속

> ***재생되지 않는 음악도 *방의 분위기* 가 될 수 있다.***

이게 *Spotify 임베드* 와 결정적으로 다른 점. 우리는 *오디오* 가 아닌 *기억* 을 다룹니다.

---

## 1. 세 가지 상태

```
                                                                            
   사용자 도착                                                              
       │                                                                    
       ▼                                                                    
   ─────────────────────────────────────────                                
   STATE A · Emotional Intro                ~6 초                           
   ─────────────────────────────────────────                                
                                                                            
   "당신의 내면은 어떤 소리를 닮아 있나요?"                                  
                                                                            
   오래 반복해서 듣게 되는 음악들 속에는                                     
   당신의 감정 리듬이 담겨 있습니다.                                          
                                                                            
   ──── 시작하기 ────                                                       
                                                                            
       │                                                                    
       │ (사용자 클릭, 1.4s fade)                                            
       ▼                                                                    
                                                                            
   ─────────────────────────────────────────                                
   STATE B · Floating Sonic Canvas          ∞                               
   ─────────────────────────────────────────                                
                                                                            
   당신의 내면은 어떤 소리를 닮아 있나요?  (상단 작게)                       
                                                                            
   ┌──────────────────────────────────────────────────┐                    
   │                                                  │                    
   │    [♪ Glósóli]                                   │                    
   │       ··· 어느 비 오는 일요일 오후에                │                    
   │                                                  │                    
   │              [♪ Petals]                          │                    
   │                                                  │                    
   │   [♪ Nuvole Bianche]                             │                    
   │                                                  │                    
   └──────────────────────────────────────────────────┘                    
                                                                            
   3곡 들으셨어요. 더 두어도 좋고요.                                          
                                                                            
   + 노래 두기                                                              
                                                                            
   ──── 다음 감정으로 이어가기 ────  (n ≥ 3 일 때 등장)                      
                                                                            
   ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿  ← Ambient Wave (counts up)                   
                                                                            
       │                                                                    
       ▼                                                                    
                                                                            
   ─────────────────────────────────────────                                
   STATE C · Forward Threshold Beat          ~8 초                          
   ─────────────────────────────────────────                                
                                                                            
   "여기까지 들은 결을 잘 두었어요."                                          
                                                                            
   "이제, 다음 감정으로."                                                    
                                                                            
       → (real app: 다음 화면)  → demo: State A 복귀                          
                                                                            
```

---

## 2. State A — Emotional Intro

`images/` State A 와 같은 6초 시퀀스, 카피만 다름.

### 시퀀스

```
t = 0.0s    검은 화면. ambient (orbs, grain, sigil) fade in
t = 1.5s    ★ Headline reveal blur (1.8s)
              "당신의 내면은"
              "어떤 소리를 닮아 있나요?"
t = 3.8s    Hairline draws (0.8s)
t = 4.4s    Sub copy 단계 reveal:
              "오래 반복해서 듣게 되는 음악들 속에는"
              "당신의 감정 리듬이 담겨 있습니다."
t = 6.4s    CTA "──── 시작하기 ────"
```

### 카피

| 슬롯 | 한국어 |
|---|---|
| Headline | 당신의 내면은<br>어떤 소리를 닮아 있나요? |
| Sub line 1 | 오래 반복해서 듣게 되는 음악들 속에는 |
| Sub line 2 | 당신의 감정 리듬이 담겨 있습니다. |
| CTA | ──── 시작하기 ──── |

---

## 3. State B — Floating Sonic Canvas

`images/` State B 와 같은 구조 + 음악 카드 + ambient wave.

### 빈 상태 (n = 0)

```
                                                                            
       마음에 머무는 소리들을 두어보세요.                                   
                                                                            
       곡 이름, Spotify 링크, 또는 그저 떠오르는 음악.                      
                                                                            
                                                                            
                          + 노래 두기                                       
                                                                            
                                                                            
```

### 카운터 — 음악 전용 카피

```
0 곡:   (카운터 숨김; "들어보세요" 만)
1 곡:   1곡 들으셨어요. 더 두어도 좋고요.
2 곡:   2곡 들으셨어요. 더 두어도 좋고요.
3 곡:   3곡 들으셨어요. 충분해요. 더 두어도 좋고요.
4 곡:   4곡. 결이 들리기 시작해요.
5 곡:   5곡. 감정의 리듬이 모이고 있어요.
8 곡:   8곡 들으셨어요. 당신의 소리가 보여요.
12+:    n곡. 두고 싶은 만큼 두세요.
```

### CTA 등장 — 조건부

```
n < 3:   CTA 숨김
n ≥ 3:   CTA 부드럽게 fade in
```

CTA 카피: **`──── 다음 감정으로 이어가기 ────`** (브리프 명시)

---

## 4. 음악 카드 — Echo Disc

`images/` 의 floating image 카드와 같은 위치 알고리즘 (4x4 grid + jitter), 다른 시각.

### 카드 구성

```
┌──────────────────────────┐
│  ◌                       │  ← Sigil mini, top-left
│                          │
│      ◯ ◯ ◯              │  ← Concentric disc (rotates 12s)
│       ·                  │
│      ◯ ◯ ◯              │
│                          │
│                          │
│  Glósóli                 │  ← Title (display italic, 17px)
│  Sigur Rós               │  ← Artist (mono 10px)
│                          │
│  ─────                   │  ← micro rule
│                          │
│  비 오는 일요일             │  ← Memory note (optional, italic)
│  오후에                    │
│                          │
└──────────────────────────┘

      ◯ ◯  ◯ ◯               ← Echo rings emanating from card
   ◯ ◯ ◯ ◯ ◯ ◯  ◯ ◯
                              every 4 seconds, expand and fade
```

### Echo Rings — 시그니처 시각

각 카드에서 *4초마다* 동심원 ring 이 *cards 전체 영역에서* 퍼져 나옴.

```css
.music-card::before,
.music-card::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  height: 80%;
  border: 1px solid rgba(176, 118, 114, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.4);
  opacity: 0;
  pointer-events: none;
  animation: echo-pulse 6s ease-out infinite;
}

.music-card::after {
  animation-delay: 3s;       /* 두 ring 이 번갈아 */
}

@keyframes echo-pulse {
  0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
  20%  { opacity: 0.55; }
  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
}
```

각 카드마다 *다른 위상* (random delay 0-3s) — 모든 echo 가 *동시에* 퍼지지 않음.

### Hover — Echo 가속

호버 시 echo 주기가 *6s → 3s* 로 빨라짐. *카드가 더 듣고 싶다* 는 시각 응답.

```css
.music-card:hover::before,
.music-card:hover::after {
  animation-duration: 3s;
}
```

### 디스크 그래픽 — 12s 회전

```css
.disc {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, rgba(176, 118, 114, 0.12) 0%, transparent 18%),
    repeating-radial-gradient(circle at 50% 50%,
      rgba(216, 199, 172, 0.04) 0px,
      rgba(216, 199, 172, 0.04) 4px,
      rgba(176, 118, 114, 0.08) 5px,
      rgba(176, 118, 114, 0.08) 6px),
    var(--c-night);
  border: 1px solid rgba(176, 118, 114, 0.18);
  position: relative;
  animation: disc-spin 12s linear infinite;
}

.disc::after {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--c-rose);
  transform: translate(-50%, -50%);
  opacity: 0.5;
}

@keyframes disc-spin {
  to { transform: rotate(360deg); }
}
```

### Memory Note — Optional Field

각 음악 카드는 *기억 노트* 를 가질 수 있음. 입력 패널에서 별도 필드. 예시:

- *"비 오는 일요일 오후에"*
- *"논문 쓰는 새벽 내내"*  
- *"이별 직후 한 달 내내"*
- (또는 비워둘 수 있음)

활자: Cormorant Garamond italic 13px, color mist, max 60 chars.

---

## 5. Ambient Sound Wave — 시그니처 시각

이 페이지의 *진짜 시그니처*. 화면 *하단* 에 SVG 기반의 *부드러운 wave* 가 출렁임.

### 시각

```
                                                                            
                                                                            
                                                                            
                                                                            
                                                                            
   ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿       
   ∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼       
                                                                            
```

두 줄의 wave path. 각자 다른 위상 + 주기로 출렁임.

### SVG 구조

```html
<svg class="ambient-wave" viewBox="0 0 1200 80" preserveAspectRatio="none">
  <path class="wave wave-1"
    d="M0,40 Q150,20 300,40 T600,40 T900,40 T1200,40"
    stroke="rgba(176, 118, 114, 0.4)"
    stroke-width="1" fill="none" />
  <path class="wave wave-2"
    d="M0,40 Q150,55 300,40 T600,40 T900,40 T1200,40"
    stroke="rgba(143, 160, 172, 0.3)"
    stroke-width="1" fill="none" />
</svg>
```

### Wave 애니메이션 — 두 가지 방법

**방법 1 — CSS transform 으로 좌우 시프트 + scale-Y 변화**

```css
.wave {
  transform-origin: 50% 50%;
  animation: wave-undulate 12s ease-in-out infinite;
}

.wave-2 { animation-duration: 16s; animation-delay: -4s; }

@keyframes wave-undulate {
  0%, 100% { transform: scaleY(1)   translateX(0); }
  25%      { transform: scaleY(1.3) translateX(-30px); }
  50%      { transform: scaleY(0.7) translateX(20px); }
  75%      { transform: scaleY(1.2) translateX(-10px); }
}
```

**방법 2 — SVG `<animate>` 로 `d` interpolation**

더 자연스럽지만 복잡. CSS 방식 (1) 이 충분히 우아.

### 음악 수에 따른 강도

```css
/* 0 곡 — wave 거의 안 보임 */
.ambient-wave { opacity: 0; transition: opacity 2s ease; }

/* 1-2 곡 — 미약 */
body.has-music-low .ambient-wave { opacity: 0.3; }

/* 3-5 곡 — 보임 */
body.has-music-mid .ambient-wave { opacity: 0.7; }

/* 6+ 곡 — 충만 */
body.has-music-full .ambient-wave { opacity: 1; }
```

추가로, 곡 수가 늘수록 wave 의 *amplitude (출렁임 크기)* 도 증가:

```css
body.has-music-mid .wave { animation-duration: 10s; }    /* 더 활발 */
body.has-music-full .wave { animation-duration: 8s; transform-origin: center; }
```

### 왜 *하단* 에 wave 인가

- *위* 의 wave 는 *알람* 의 시각 (소셜 앱의 액티비티 바)
- *하단* 의 wave 는 *바닥 깊은 곳에서 들리는 음악* — 더 *내면* 적
- 사용자의 시야에서 *주변시야* 에 머묾 — *알아채지만 의식적으로 알아채지 않음*

### Reduced motion 에서

`prefers-reduced-motion: reduce` 에서는 wave 가 *정적 그래픽* 으로 — 출렁이지 않고 그저 *놓여 있음*.

---

## 6. Atmosphere Resonance — 4 단계

`images/` 의 *atmosphere tier* 와 같은 구조. *body 클래스* 토글 + 2s transition.

```ts
function updateMusicTier(count: number) {
  const body = document.body;
  body.classList.remove('music-silent', 'music-low', 'music-mid', 'music-full');
  if (count === 0) body.classList.add('music-silent');
  else if (count <= 2) body.classList.add('music-low');
  else if (count <= 5) body.classList.add('music-mid');
  else body.classList.add('music-full');
}
```

### 4 단계 영향

```
                                                                  
   count: 0          count: 1-2       count: 3-5       count: 6+
   ──────────       ──────────       ──────────       ──────────
                                                                  
   silent           low resonance    mid resonance    full sonic
                                                                  
   wave: hidden     wave: 0.3        wave: 0.7        wave: 1.0
                                                                  
   orbs: still      orbs: subtle     orbs: visible    orbs: pulse
                    drift faster     pulse begins     in unison
                                                                  
   page bg:         + rose 3%        + rose 5%        + rose 8%
   pure night       low radial       + silver 3%      + silver 5%
                                                                  
   echo on cards:   echo subdued     echo full        echo enhanced
                                                                  
```

### Orb Pulse — 음악이 *많을수록* 빛 구체가 *호흡*

```css
body.music-full .orb-1,
body.music-full .orb-3 {
  animation: orb-drift-1 56s ease-in-out infinite,
             orb-pulse 6s ease-in-out infinite;
}

@keyframes orb-pulse {
  0%, 100% { transform: scale(1) translate(...); }
  50%      { transform: scale(1.08) translate(...); }
}
```

이게 *visual rhythm* — 페이지 *전체* 가 *맥박* 을 가지기 시작.

---

## 7. 음악 추가 — Input Panel

`upload/` 의 input panel 과 같은 패턴 — 하단에서 슬라이드 업.

### 패널 구조

```
                                                                            
   ╔═══════════════════════════════════════════════════════════════╗      
   ║                                                               ║      
   ║   곡 이름, Spotify 링크, 무엇이든.                              ║      
   ║                                                               ║      
   ║   ┌─────────────────────────────────────────────────────┐    ║      
   ║   │ Sigur Rós - Glósóli                                  │    ║      
   ║   └─────────────────────────────────────────────────────┘    ║      
   ║                                                               ║      
   ║   ─ 이 노래가 머무는 자리 (선택)                                ║      
   ║   ┌─────────────────────────────────────────────────────┐    ║      
   ║   │ 비 오는 일요일 오후                                   │    ║      
   ║   └─────────────────────────────────────────────────────┘    ║      
   ║                                                               ║      
   ║                  ──── 두기 ────                                ║      
   ║                                                               ║      
   ║                       취소                                     ║      
   ║                                                               ║      
   ╚═══════════════════════════════════════════════════════════════╝      
                                                                            
```

### 두 필드

1. **음악 텍스트 / URL** — 필수
   - placeholder: *"Sigur Rós — Glósóli"*
   - 한 줄
   - URL 자동 감지: `spotify.com`, `music.apple.com`, `youtube.com`

2. **기억 노트** — 선택
   - placeholder: *"이 노래가 머무는 자리"* 또는 *"비 오는 일요일 오후"*
   - 최대 60자
   - 비어 있을 수 있음

### URL Parser

```ts
function parseSource(text: string): { source: string, display: string, sub?: string } {
  const trimmed = text.trim();

  if (/spotify\.com/.test(trimmed)) return { source: 'spotify', display: trimmed.replace(/^https?:\/\//, ''), sub: 'spotify' };
  if (/music\.apple/.test(trimmed)) return { source: 'apple', display: trimmed.replace(/^https?:\/\//, ''), sub: 'apple music' };
  if (/youtube\.com|youtu\.be/.test(trimmed)) return { source: 'youtube', display: trimmed.replace(/^https?:\/\//, ''), sub: 'youtube' };
  if (/^https?:\/\//.test(trimmed)) return { source: 'url', display: trimmed.replace(/^https?:\/\//, ''), sub: 'link' };

  // Parse "Title - Artist" or "Artist - Title"
  const parts = trimmed.split(/\s+[—–-]\s+/);
  if (parts.length === 2) {
    return { source: 'text', display: parts[1], sub: parts[0] };
  }
  return { source: 'text', display: trimmed, sub: 'music' };
}
```

### Paste Detection

사용자가 *어디서나* Spotify/Apple Music URL 을 *paste* 하면 — 자동으로 panel 열고 URL 채워줌.

```ts
window.addEventListener('paste', (e) => {
  const text = e.clipboardData.getData('text');
  if (!text) return;
  if (/spotify\.com|music\.apple|youtube\.com/.test(text)) {
    openPanel(text);
  }
});
```

### 패널 등장 / 사라짐

- 등장: `translateY(100% → 0)`, 1.0s breath-in
- 닫음: `translateY(0 → 100%)`, 1.4s breath-out
- 배경 scrim: `rgba(14, 12, 11, 0.65)` + blur(4px)

---

## 8. State C — Forward Threshold Beat

`images/` State C 와 같은 구조, 다른 카피.

### 시퀀스 (8초)

```
t = 0.0s    CTA warm
t = 0.5s    Canvas + 음악 카드들 fade out (1.4s)
              + ambient wave fade out
              orbs, grain 은 유지
t = 2.0s    검은 정적 + backdrop blur
t = 2.4s    첫 문장 reveal blur (1.6s)
              "여기까지 들은 결을 잘 두었어요."
t = 4.0s    hold + fade
t = 6.0s    두 번째 문장 reveal blur (1.6s)
              "이제, 다음 감정으로."
t = 8.4s    real app: 다음 화면 / demo: Intro 복귀
```

### 두 문장의 무게

| | 의미 |
|---|---|
| *"여기까지 들은 결을 잘 두었어요."* | 사용자가 *들은 행위* 를 honoring |
| *"이제, 다음 감정으로."* | 다음 페이스 약속 (음악 → 다음 감정 영역으로) |

*"음악으로 잘 했어요"* 형식은 결코 *없음*. *결을 잘 두었어요* — 사용자의 *섬세함* 을 인정.

---

## 9. Next.js + Framer Motion 구현

### 9.1 디렉토리 구조

```
app/
  onboarding/
    music/
      page.tsx                    ← 음악 페이지
components/
  music/
    MusicReflection.tsx           ← 메인 (3 상태)
    IntroState.tsx
    SonicCanvas.tsx               ← State B
    ForwardBeat.tsx               ← State C
    MusicCard.tsx                 ← 단일 echo disc 카드
    EmptyHint.tsx
    Counter.tsx
    AddPanel.tsx                  ← input panel
    AmbientWave.tsx               ← 하단 SVG wave
hooks/
  useMusicAdditions.ts            ← 추가/삭제/paste 통합
  useMusicTier.ts                 ← count → tier
```

### 9.2 `hooks/useMusicAdditions.ts`

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

export type MusicEntry = {
  id: string;
  display: string;     // 예: "Glósóli"
  sub: string;         // 예: "Sigur Rós"
  source: 'spotify' | 'apple' | 'youtube' | 'url' | 'text' | 'music';
  memory: string;      // 선택, 기억 노트
  tilt: number;        // -2 to +2
  drift: number;       // 0 to 8s
  echoDelay: number;   // 0 to 3s
  position: { x: number; y: number };  // % within canvas
};

export function useMusicAdditions() {
  const [entries, setEntries] = useState<MusicEntry[]>([]);

  function parseSource(text: string) {
    const t = text.trim();
    if (/spotify\.com/.test(t))
      return { source: 'spotify' as const, display: t.replace(/^https?:\/\//, ''), sub: 'spotify' };
    if (/music\.apple/.test(t))
      return { source: 'apple' as const, display: t.replace(/^https?:\/\//, ''), sub: 'apple music' };
    if (/youtube\.com|youtu\.be/.test(t))
      return { source: 'youtube' as const, display: t.replace(/^https?:\/\//, ''), sub: 'youtube' };
    if (/^https?:\/\//.test(t))
      return { source: 'url' as const, display: t.replace(/^https?:\/\//, ''), sub: 'link' };
    const parts = t.split(/\s+[—–-]\s+/);
    if (parts.length === 2)
      return { source: 'text' as const, display: parts[1], sub: parts[0] };
    return { source: 'music' as const, display: t, sub: 'music' };
  }

  const add = useCallback((rawText: string, memory: string = '') => {
    if (!rawText.trim()) return;
    const parsed = parseSource(rawText);

    setEntries((prev) => {
      const i = prev.length;
      const col = i % 4;
      const row = Math.floor(i / 4) % 4;
      return [
        ...prev,
        {
          id: 'm-' + Date.now() + Math.random().toString(36).slice(2, 6),
          ...parsed,
          memory: memory.trim(),
          tilt: +(Math.random() * 4 - 2).toFixed(2),
          drift: +(Math.random() * 8).toFixed(2),
          echoDelay: +(Math.random() * 3).toFixed(2),
          position: {
            x: 12 + col * 22 + Math.random() * 4 - 2,
            y: 10 + row * 22 + Math.random() * 4 - 2,
          },
        },
      ];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Auto-detect music URL paste anywhere
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      const text = e.clipboardData.getData('text');
      if (/spotify\.com|music\.apple|youtube\.com/.test(text)) {
        // emit event for AddPanel to receive
        window.dispatchEvent(new CustomEvent('music-paste-detected', { detail: text }));
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  return { entries, add, remove };
}
```

### 9.3 `components/music/MusicCard.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';
import { MusicEntry } from '@/hooks/useMusicAdditions';

export function MusicCard({ entry, onRemove }: { entry: MusicEntry; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 1.4, ease: [0.34, 1.18, 0.64, 1] }}
      onClick={onRemove}
      style={{
        position: 'absolute',
        left: `${entry.position.x}%`,
        top: `${entry.position.y}%`,
        transform: `rotate(${entry.tilt}deg)`,
        animationDelay: `${entry.drift}s, ${entry.echoDelay}s`,
      }}
      className="music-card group cursor-pointer"
    >
      {/* Echo rings */}
      <span className="echo-ring echo-ring-1" />
      <span className="echo-ring echo-ring-2" />

      {/* Disc */}
      <div className="disc" />

      {/* Text */}
      <p className="track-title">{entry.display}</p>
      <p className="track-sub">{entry.sub}</p>

      {entry.memory && (
        <>
          <hr className="micro-rule" />
          <p className="memory-note">{entry.memory}</p>
        </>
      )}
    </motion.div>
  );
}
```

### 9.4 `components/music/AmbientWave.tsx`

```tsx
'use client';

export function AmbientWave() {
  return (
    <svg
      className="ambient-wave"
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        className="wave wave-1"
        d="M0,40 Q150,20 300,40 T600,40 T900,40 T1200,40"
        stroke="rgba(176, 118, 114, 0.4)"
        strokeWidth="1"
        fill="none"
      />
      <path
        className="wave wave-2"
        d="M0,40 Q150,55 300,40 T600,40 T900,40 T1200,40"
        stroke="rgba(143, 160, 172, 0.3)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}
```

---

## 10. 정적 미리보기

```
taste-os/music/
├── index.html
├── style.css
└── script.js
```

머지 후 `kimbany.github.io/taste-os/music/` 에서:

1. **State A** — Intro 6초 시청
2. **"시작하기"** 클릭
3. **State B** — Sonic Canvas. 다양한 방법으로 추가:
   - **+ 노래 두기** 버튼 → panel 에서 텍스트 입력
   - Spotify URL 복사 후 페이지 *어디서나* paste → 자동 panel
   - 기억 노트도 추가 가능
4. **3곡 추가하면서 페이지 변화 관찰**:
   - 하단에서 *Ambient Wave* 가 *서서히 등장*
   - 빛 구체가 *맥박* 하기 시작
   - 카드들에서 *echo 링* 이 퍼져 나옴
5. **"다음 감정으로 이어가기"** 클릭 (3곡 이상 시)
6. **State C** — Threshold Beat 8초

특히 *6곡* 째 추가한 후 — 화면 하단 wave 가 *눈에 띄게* 깊어지고, 빛 구체가 *한 호흡* 으로 함께 *맥박* 합니다. 그게 *재생되지 않는 음악도 방의 분위기가 될 수 있다* 의 시각화.

---

## 닫는 말

대부분의 음악 앱은 *오디오의 효율* 을 디자인합니다. Taste OS Music 은 *기억의 정서* 를 디자인합니다.

사용자가 *Spotify Glósóli URL* 을 paste 한 직후 — 그 노래의 *오디오* 는 재생되지 *않습니다*. 대신:
- 그 노래의 *이름* 이 italic 으로 떠 있고
- *기억 노트* 가 그 옆에 있고
- *echo 링* 이 카드에서 *4초마다* 퍼져 나오고
- 페이지 하단 *wave* 가 *조금 더 깊어집니다*

이게 *재생* 의 시각화. *오디오 없이도* 음악이 *방에 들어와 있음*.

엔지니어가 이 화면을 빌드할 때 마지막 검사:

> ***6곡 째 추가했을 때, 화면이 *조금 더 살아 있다* 고 느껴지는가?***

만약 *no* — wave 강도와 orb pulse 를 늘려야 함. 만약 *너무 명확하게 yes* — 강도를 낮춰야 함. 정답은 *알아채지만 의식적으로 알아채지 않는* 지점.

그 지점이 *재생되지 않는 음악도 방의 분위기가 되는 자리* 입니다.
