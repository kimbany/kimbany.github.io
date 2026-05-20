# Taste OS — Motion, Sound & Emotional Polish
## 앱이 아니라, 살아있는 감정의 대기(大氣)

> 모션은 장식이 아니다. 사운드는 피드백이 아니다. 전환은 기술적 이벤트가 아니다.
> 셋 모두 *감정의 페이싱* 이다.
>
> 이 문서는 지금까지 만든 모든 화면(`hero/`·`analysis/`·`report-reveal/`·`home/`·`daily/`·`evolution/`·`sharing/`·`narration/`...)에 흐르는 모션 언어를 *하나의 재사용 시스템* 으로 정리하고, 빠져 있던 한 겹 — **생성형 ambient 사운드 엔진** — 을 더한다.

---

## 0. 한 줄 원칙

> *"모든 움직임은 숨이다. 빠른 것은 없다. 멈춤도 콘텐츠다."*

도파민 UI(스냅, 바운스, 알림음, 게임화)는 전부 금지. 대신 호흡·표류·용해.

---

## 1. 감정 타이밍 토큰 (Emotional Timing)

모든 화면이 공유하는 단 세 개의 easing 과 표준 duration:

```css
:root {
  --e-breath-in:  cubic-bezier(0.16, 1, 0.30, 1);   /* 들숨 — 부드럽게 도착 */
  --e-breath-out: cubic-bezier(0.70, 0, 0.84, 0);   /* 날숨 — 천천히 사라짐 */
  --e-settle:     cubic-bezier(0.34, 1.18, 0.64, 1);/* 안착 — 미세한 오버슈트 */
}
```

| 행위 | duration | easing |
|------|----------|--------|
| 텍스트 등장 (reveal) | 1.6–1.8s | breath-in |
| 텍스트 퇴장 | 1.4s | breath-out |
| 카드/조각 안착 | 0.7s | settle |
| 분위기(gradient) 전환 | 2–4s | ease |
| 페이지 전환 | 1.4s in / 1.4s out | breath |
| breath 루프(호흡) | 4–6s | ease-in-out |

> 규칙: *200ms 미만의 전환은 이 제품에 존재하지 않는다* (포커스 링 같은 접근성 예외 제외).

---

## 2. PAGE TRANSITION SYSTEM

화면 사이는 *컷* 이 아니라 *용해(dissolve)* 다.

**패턴 (모든 standalone 화면이 이미 사용 중):**
```
나가는 화면:  data-phase="active" → "exiting"  (opacity 0, slight translateY, 1.4s breath-out)
   ↓  (threshold beat — 검은 backdrop + blur, narration 한두 줄)
들어오는 화면: "hidden" → "active"  (opacity 0→1, 1.4s breath-in)
```

Next.js 구현 (View Transitions API + Framer Motion 폴백):

```tsx
// app/template.tsx — 모든 라우트 전환에 호흡을 입힌다
"use client";
import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(8px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.30, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

깊은 전환(온보딩→분석→리포트)은 *threshold beat* 를 끼운다: 8초 내외의 검은 막 + 한국어 한두 줄(blur→clear→blur). 이미 `analysis/`·`entry/` 에 구현됨.

---

## 3. TYPOGRAPHY MOTION

텍스트는 *나타나지* 않는다. *번진다.*

```css
[data-reveal] {
  opacity: 0; filter: blur(14px); letter-spacing: 0.10em;
  transition: opacity 1.8s var(--e-breath-in),
              filter 1.8s var(--e-breath-in),
              letter-spacing 1.8s var(--e-breath-in);
}
[data-reveal].is-revealed { opacity: 1; filter: blur(0); letter-spacing: -0.012em; }
```

- blur(14→0) + letter-spacing(0.10em→-0.012em) = *안개에서 또렷해지는* 결.
- 줄 단위 stagger, 줄 사이 침묵(1.2–1.6s).
- 침묵을 *지운 자리* 가 아니라 *남긴 자리* 로 다룬다 (narration.md §8 와 동일).

---

## 4. AMBIENT PARTICLE SYSTEM (dust / orbs / grain)

세 겹의 대기:

| 레이어 | 역할 | 모션 |
|--------|------|------|
| **orbs** (3–4개) | 감정의 빛 덩어리 | 56–80s drift, opacity는 분위기 tier 따라 |
| **dust** (10–32개) | 떠다니는 입자 | 14–24s 상승 + fade, blur(0.5px) |
| **grain** | 필름의 결 | steps(4) 미세 흔들림, mix-blend overlay, opacity 0.055 |

전부 `mix-blend-mode: screen`(orbs) / `overlay`(grain), `will-change` 지정, `prefers-reduced-motion` 에서 정지.

```js
// 입자 수는 화면 폭으로 — 모바일은 가볍게
let count = width < 768 ? 0..12 : width < 1280 ? 16..18 : 22..32;
```

---

## 5. ATMOSPHERE TRANSITION SYSTEM

배경은 *고정* 이 아니라 *흐름* 이다. body 클래스가 모든 화면의 공기를 바꾼다:

```css
body::before { transition: background 2–4s ease; }   /* radial gradient morph */
.orb        { transition: opacity 2–4s ease; }       /* 빛의 세기 */
```

- 진행/스크롤/시간/감정 컨텍스트 → body 클래스(`q-1..q-6`, `tier-*`, `era-*`, `time-*`, `card-*`).
- 색은 차가움(silver-blue) ↔ 따뜻함(rose·ember·beige) 축에서만 움직인다 (`tokens.md` 팔레트).
- 모든 전환은 *느껴지지 않을 만큼 느리게* (사용자가 "바뀌었다" 가 아니라 "공기가 다르다" 로 느낌).

---

## 6. MEMORY MOTION SYSTEM

이미지·인용·기억은 *떠다니고, 표류하고, 용해* 된다.

- **float**: WAAPI 무한 keyframe, 각 조각마다 다른 dx/dy/duration(10–16s).
- **drift like recollection**: 등장은 blur+opacity, 위치는 천천히 흔들림.
- **dissolve**: 클릭/수렴 시 blur(20px)+opacity 0 으로 *기억이 흩어지듯* (`analysis/` 의 convergence, `home/` 의 echo).
- **layer**: z축 parallax(마우스 0.04 lerp)로 가까운/먼 기억의 깊이.

```js
el.animate(
  [{ transform: 'translate(0,0)' },
   { transform: `translate(${dx}px, ${dy}px)` },
   { transform: 'translate(0,0)' }],
  { duration: dur*1000, iterations: Infinity, easing: 'ease-in-out' }
);
```

---

## 7. SOUND ATMOSPHERE SYSTEM — 인터페이스 오디오가 아니라 *감정의 공기*

클릭·탭·알림음 *없음.* 대신 **생성형 ambient** — 파일 없이 Web Audio 로 실시간 합성(`./sound/ambient.js`).

### 7.1 신호 흐름

```
oscillator 코드(3–4 detuned) ┐
                             ├─▶ lowpass (LFO 호흡) ─▶ master gain (LFO 호흡) ─▶ convolver(생성 IR) ─▶ out
filtered noise (공기/결)      ┘                                                    ▲
soft chime (가끔, 예약)  ────────────────────────────────────────────────────────┘
```

- **드론 코드**: 정수비에 가까운 부드러운 화음(따뜻함). 살짝 디튠 → 살아있는 결.
- **호흡 LFO**: filter cutoff 와 master gain 에 0.06–0.1Hz LFO → 들숨/날숨.
- **공기 레이어**: 매우 조용한 필터드 노이즈 → 필름 그레인의 청각판.
- **chime**: 드물게(20–40s) 부드러운 사인 톤 — narration 등장 같은 *감정의 순간* 에만.
- **reverb**: 알고리즘으로 생성한 임펄스(노이즈+감쇠)로 *먼 공간감*.

### 7.2 분위기 프리셋

각 화면이 자기 공기를 가진다 (root 음 + 화음 + warmth):

| preset | 쓰임 | 결 |
|--------|------|-----|
| `onboarding` | hero/entry | 낮고 넓은, 새벽의 정적 |
| `analysis` | analysis/ | 미세한 긴장, 모이는 입자 |
| `report` | report-reveal/ | 따뜻하게 열리는, 가장 풍부 |
| `dashboard` | home/ | 익숙하고 조용한 |
| `timeline` | evolution/ | 향수, 멀어지는 잔향 |

```js
TasteAmbient.start('report');      // 사용자 제스처 후
TasteAmbient.setWarmth(0.8);        // 차가움 0 ↔ 따뜻함 1
TasteAmbient.chime();               // 감정의 순간에
TasteAmbient.stop();                // 4s fade-out
```

### 7.3 규칙

- **항상 user gesture 후 시작** (브라우저 autoplay 정책 + 정서적 동의).
- **기본은 꺼짐.** 사운드는 *초대* 이지 강요가 아니다. 작은 `소리 들이기` 토글.
- master gain 은 매우 낮게(−24dB 근방). *배경* 이지 *전경* 이 아니다.
- 화면 전환 시 프리셋 crossfade(2–3s), 끊김 없음.
- `prefers-reduced-motion` / 저전력 / 백그라운드 탭 → 자동 정지.

---

## 8. EMOTIONAL PACING SYSTEM

가장 중요한 시스템은 *느리게 만드는 것* 이다.

- **침묵 허용**: 빈 section(quiet space)을 의도적으로 둔다 (`home/`·`daily/`·`evolution/`).
- **과자극 회피**: 한 화면에 동시에 움직이는 강조 요소는 *하나* 만.
- **느려지게**: reveal stagger·threshold beat·breath 로 사용자의 스크롤 속도를 *부드럽게 늦춘다*.
- **성찰의 멈춤**: narration 사이 침묵, 페이지 진입 후 1.4–2.4s 정적.

```js
// 페이싱 가드: 사용자가 빨리 스크롤해도 화면은 자기 속도를 지킨다
// reveal 은 IntersectionObserver 로만 트리거 — 스크롤 양이 아니라 '도착' 으로.
```

---

## 9. MOBILE ATMOSPHERE OPTIMIZATION

- 입자 수↓, orb 일부 `display:none`, grain 유지(가벼움).
- `transform`/`opacity`/`filter` 만 애니메이트(레이아웃 리플로우 0) → GPU 합성.
- 스크롤은 관성 그대로 두되, reveal 은 동일 호흡 → *부드러운 영화적 스크롤*.
- 터치엔 parallax/tilt 비활성(`hover: hover` 체크), 대신 자동 drift 유지.
- 오디오는 모바일에서 더 보수적(기본 off, 짧은 chime 위주).

---

## 10. 구현 체크리스트

- [x] 3개 easing + duration 토큰 — 전 화면 공유 (`tokens.md`)
- [x] reveal(blur→clear) 패턴 — IntersectionObserver
- [x] orbs / dust / grain 3겹 대기
- [x] body-class 분위기 전환 (q/tier/era/time/card)
- [x] 메모리 float / dissolve / parallax
- [x] threshold beat 페이지 전환
- [x] **생성형 ambient 사운드 엔진** (`./sound/ambient.js`) — 신규
- [x] 페이싱: quiet space + 침묵
- [x] reduced-motion 전면 대응

---

## 11. 마지막 검사

> "사운드를 켜고 눈을 감았을 때 —
> *기계의 소리* 가 들리는가, 아니면 *어떤 공간에 들어와 있는 느낌* 이 드는가?
> 그리고 화면을 아무것도 누르지 않고 30초 바라봤을 때 — *지루한가, 아니면 머무르고 싶은가?*"

후자라면, 이건 앱이 아니라 *살아있는 감정의 대기* 다.
