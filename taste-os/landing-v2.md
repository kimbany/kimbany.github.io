# Taste OS — Landing Page v2 (Cinematic)

> A second draft. Same architecture, more atmosphere. The palette warms further into Blade Runner 2049 territory — dim rose, muted silver-blue, dusty beige on soft black. The copy is bolder. The whole page slows by 10–15%.

This document supersedes `landing.md` for the brief you sent. The architecture of `landing.md` (six acts, scroll choreography, IntersectionObserver reveals, breath motion language) is preserved as foundation; this document only documents what's different. Where it's silent, assume v1's specification applies.

Implementation: `taste-os/landing-v2/index.html` + `style.css` + `script.js`. After merging this branch, viewable at `kimbany.github.io/taste-os/landing-v2/`.

Read alongside: `landing.md` (the v1 architecture), `system.md` (design tokens), `voice.md` (Korean voice).

---

## Table of Contents

0. [What's New in v2](#0-whats-new-in-v2)
1. [The Cinematic Palette](#1-the-cinematic-palette)
2. [Section 1 — Hero (exact copy)](#2-section-1--hero-exact-copy)
3. [Section 2 — Atmosphere](#3-section-2--atmosphere)
4. [Section 3 — Taste Preview (4 Genome Cards)](#4-section-3--taste-preview-4-genome-cards)
5. [Section 4 — Identity Evolution](#5-section-4--identity-evolution)
6. [Section 5 — Sharing](#6-section-5--sharing)
7. [Section 6 — Final CTA](#7-section-6--final-cta)
8. [Motion Refinements](#8-motion-refinements)
9. [Voice Note on ~ㅂ니다 Register](#9-voice-note-on-ㅂ니다-register)

---

## 0. What's New in v2

| | v1 | v2 |
|---|---|---|
| Primary accent | `ember` (warm amber) | `rose` (dim dusty rose) |
| Secondary accent | none/phosphor | `silver-blue` (muted) |
| Primary text | `pearl` (warm ivory) | `beige` (dustier, more warmth) |
| Background | pure void | warm-toned soft black |
| Hero headline | *"자신을 알아가는, 가장 조용한 자리."* | *"당신은 계속 변하고 있습니다."* |
| Hero register | ~요 체 (intimate) | ~ㅂ니다 (literary essay) |
| Taste Preview | 1 sample (Lacquered Dusk) | **4 distinct profiles** (Quiet Warmth, Urban Nostalgia, Emotional Minimalism, Warm Futurism) |
| Final headline | *"준비되면, 들어오세요."* | *"조금 더 나다운 방향으로."* |
| Motion speed | base | **~15% slower across the board** |
| Particle layer | 4 light orbs | **orbs + floating dust particles** |
| Door glow color | ember | rose + silver-blue blend |

The two versions share the same six-act architecture, the same IntersectionObserver-driven reveals, the same hairline-bordered Beacon, the same Sigil top-left, the same film-grain overlay. The difference is *atmospheric*, not structural.

---

## 1. The Cinematic Palette

The new palette leans toward **Blade Runner 2049's interrogation room** — warm charcoal, soft black, dim rose against muted silver-blue. The earlier palette was Aesop daylight; this one is the same shop after closing time, with one rose-tinted lamp left on.

```css
:root {
  /* — primitive — */
  --c-night:        #0E0C0B;   /* soft black, warm-toned */
  --c-coal:         #1A1714;   /* warm charcoal surface 1 */
  --c-ash:          #2A2622;   /* surface 2 */
  --c-bone:         #443E37;   /* surface 3 / hairlines */
  --c-mist:         #9A8E81;   /* warm secondary text */
  --c-sand:         #C8B69B;   /* mid-bright neutral */
  --c-beige:        #D8C7AC;   /* primary text — dusty beige */
  --c-silver-blue:  #8FA0AC;   /* muted silver-blue accent */
  --c-rose:         #B07672;   /* dim rose accent */
  --c-rose-deep:    #8A5552;   /* deeper rose, for shadow tints */
}
```

### Use rules

- **One full-strength accent on screen at any moment.** The other sits at ≤6%.
- **Rose is the primary emotional accent** — Mirror lines, Beacon glow, the Door.
- **Silver-blue is the cool counterweight** — used for Urban Nostalgia's palette, second-position card highlights, the *진화* (evolution) section's left-edge tint.
- **`beige` (not pearl) is the new primary text color.** It is dustier, warmer, less ivory. Reads as photograph rather than print.

### Tint map per section

| Section | Background tint |
|---|---|
| Hero | rose at 4% radial top-right, silver-blue at 3% radial bottom-left |
| Atmosphere ⅰ | clean |
| Atmosphere ⅱ | rose at 3% top-left |
| Atmosphere ⅲ | silver-blue at 3% bottom-right |
| Taste Preview | rose at 5% top, silver-blue at 4% bottom |
| Evolution | left-to-right gradient: silver-blue → rose → coal (each at 3%) |
| Sharing | clean with center pearl-equiv at 2% |
| Final CTA | rose at 8% center vertical glow + silver-blue at 4% halo |

---

## 2. Section 1 — Hero (exact copy)

The most-changed section in v2. The hero is bolder and more declarative.

### Composition

```
┌──────────────────────────────────────────────────────────────┐
│  ◌                                                           │
│                                                              │
│         (floating dust particles, very subtle)              │
│                                                              │
│                                                              │
│                                                              │
│           당신은 계속 변하고 있습니다.                      │
│                                                              │
│           ───────                                            │
│                                                              │
│           취향은 단순한 선호가 아니라,                       │
│           당신이라는 사람의 분위기입니다.                    │
│                                                              │
│                                                              │
│           ─── 나의 분위기 탐색하기 ───                       │
│                                                              │
│                                                              │
│           Taste OS                                           │
│                                                              │
│                                                              │
│                                              ↓ 천천히 가요   │
└──────────────────────────────────────────────────────────────┘
```

### Anatomy

1. **Headline** — display lg (52–72px), italic, **beige**, set wide. The single most prominent sentence on the page.
2. **Hairline divider** — 56px, ash, 24% opacity.
3. **Sub-headline** — display sm (24–28px), non-italic, **mist**, two lines, max-width 600px.
4. **Beacon** — `─── 나의 분위기 탐색하기 ───`, the longer version of the ceremonial dash (three dashes each side for this primary CTA; one each side elsewhere).
5. **Wordmark** — small mono-style "Taste OS" in mist below.
6. **Scroll hint** — bottom-right, in `~요` register intentionally (small contrast with the formal headline).

### Atmospheric layer — what's new

In addition to v1's four drifting light orbs (now tinted rose / silver-blue / sand), v2 adds **floating dust particles**:

- 24 small absolutely-positioned `<span>` elements, 1–2px each
- Drifting upward at 8–14px/s with horizontal sway
- Each fades in and out over a 12s lifecycle, staggered
- Color: half are rose at 0.4 alpha, half are silver-blue at 0.3 alpha
- Wraps around viewport bottom-to-top

This is the **Seoul late-night** signature — the dust visible in a streetlight, the particles caught in the projector beam of a screening room.

### Motion at load

```
t = 0.0s   black field, all layers at 0
t = 0.4s   grain fades in to 5%
t = 0.7s   light orbs fade in, staggered
t = 1.2s   dust particles begin appearing (one per 200ms over 5s)
t = 1.4s   Sigil fades in
t = 2.0s   headline reveal-blur (1.8s, slow — the centerpiece)
t = 4.0s   hairline divider draws in (1.0s)
t = 4.4s   sub-headline fades in (1.0s)
t = 5.6s   Beacon fades in with first pulse
t = 6.6s   wordmark fades in
t = 9.0s   scroll hint appears if no scroll yet
```

### Copy

| Slot | Korean | English |
|---|---|---|
| Headline | 당신은 계속 변하고 있습니다. | You are constantly changing. |
| Sub headline | 취향은 단순한 선호가 아니라,<br/>당신이라는 사람의 분위기입니다. | Taste is not just preference.<br/>It is the atmosphere of who you are. |
| CTA | ─── 나의 분위기 탐색하기 ─── | ─── find your atmosphere ─── |
| Wordmark | Taste OS | Taste OS |
| Scroll hint | ↓ 천천히 가요 | ↓ slowly |

---

## 3. Section 2 — Atmosphere

Three observations, one viewport each. The copy is reworked to better support the "atmosphere of who you are" thesis from the hero.

### The three observations

**ⅰ. 모음 (Collection)**

```
─ 하나

당신이 모은 것들에는 패턴이 있어요.

사진, 음악, 단어, 마음이 머문 자리 — 그것들 모두 당신입니다.
```

**ⅱ. 공기 (Atmosphere)**

```
─ 둘

그 패턴에는 분위기가 있고요.

어떤 빛, 어떤 시간, 어떤 온도. 당신만의 공기입니다.
```

**ⅲ. 변화 (Evolution)**

```
─ 셋

그리고 그 분위기는 천천히 변해갑니다.

당신의 마음이 그러는 것처럼.
```

### Voice mix

Per `voice.md`'s permission to mix registers in literary moments: each subsection ends with a ~입니다 declarative (matching the hero), but middle phrasing uses ~요체 for warmth. *"패턴이 있어요"* + *"당신입니다"* sits in the literary essay seam between intimate and considered.

---

## 4. Section 3 — Taste Preview (4 Genome Cards)

The product's emotional samples. Four cards arrayed in a 2×2 grid on Desk/Studio, vertical stack on Pocket. Each card is a full mini-Genome, not a sharing card.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ─ 풍경은 사람마다 다릅니다.                                 │
│                                                              │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │ ◌                       │  │ ◌                       │   │
│  │                         │  │                         │   │
│  │ Quiet                   │  │ Urban                   │   │
│  │ Warmth                  │  │ Nostalgia               │   │
│  │ 조용한 따뜻함            │  │ 도시의 향수             │   │
│  │                         │  │                         │   │
│  │ ▮▮▮▮▮                   │  │ ▮▮▮▮▮                   │   │
│  │                         │  │                         │   │
│  │ 혼자 있을 때 가장 또렷한  │  │ 비 온 다음의 거리.       │   │
│  │ 사람.                   │  │ 늦은 지하철.              │   │
│  │                         │  │                         │   │
│  │ "큰 빛보다, 작은 빛이    │  │ "사람들로 가득한 곳에서   │   │
│  │  오래 가는 걸 알아요."   │  │  가장 자기 자신이에요."   │   │
│  │                         │  │                         │   │
│  │ 늦은 오후 · 단일 광원    │  │ 자정 · 도시 · 비 직후    │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │ ◌                       │  │ ◌                       │   │
│  │                         │  │                         │   │
│  │ Emotional               │  │ Warm                    │   │
│  │ Minimalism              │  │ Futurism                │   │
│  │ 감정의 미니멀리즘        │  │ 따뜻한 미래             │   │
│  │ ...                     │  │ ...                     │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                              │
│                                                              │
│   당신의 풍경은 이 넷 중 하나가 아닐 거예요.                 │
│   완전히 다른 무언가일 가능성이 더 큽니다.                   │
└──────────────────────────────────────────────────────────────┘
```

### Card anatomy

Each card uses a 4:5 aspect ratio (more vertical than v1's sharing cards, which were 5:7).

Five elements per card:
1. **Sigil** top-left, mist 24%
2. **Name** display sm, two lines, italic on the second word
3. **Korean translation** mono 11px, mist
4. **5-swatch palette**
5. **Portrait** — 2 short sentences, beige
6. **Mirror line** — italic, set apart by hairlines
7. **Atmosphere tag** — mono 10px, mist

### Card 1 — Quiet Warmth / 조용한 따뜻함

**Palette:** `#3A2620` `#7A5040` `#B07672` `#C8B69B` `#D8C7AC`
*(deep coal · brown · rose · sand · beige)*

**Portrait:**
> 혼자 있을 때 가장 또렷한 사람.
> 따뜻함을 작게, 그리고 자주 모읍니다.

**Mirror:**
> *"큰 빛보다, 작은 빛이 오래 가는 걸 알아요."*

**Atmosphere:** 늦은 오후 · 단일 광원 · 린넨

### Card 2 — Urban Nostalgia / 도시의 향수

**Palette:** `#0F1620` `#3A4555` `#8FA0AC` `#B07672` `#C8B69B`
*(night blue · slate · silver-blue · rose · sand)*

**Portrait:**
> 비 온 다음의 거리. 늦은 지하철.
> 도시가 조용해질 때를 기다립니다.

**Mirror:**
> *"사람들로 가득한 곳에서 가장 자기 자신이에요."*

**Atmosphere:** 자정 · 도시 · 비 온 직후

### Card 3 — Emotional Minimalism / 감정의 미니멀리즘

**Palette:** `#1A1714` `#443E37` `#9A8E81` `#C8B69B` `#D8C7AC`
*(coal · bone · mist · sand · beige)*

**Portrait:**
> 적게 둡니다. 남긴 것들에는 이유가 있고요.
> 비어 있는 자리도 풍경의 일부입니다.

**Mirror:**
> *"조용한 것이 깊을 수 있다는 걸, 일찍부터 알았어요."*

**Atmosphere:** 정오 · 단일 색 · 여백

### Card 4 — Warm Futurism / 따뜻한 미래

**Palette:** `#1A2030` `#5A6878` `#8FA0AC` `#B07672` `#D9A66C`
*(deep night · steel · silver-blue · rose · ember)*

**Portrait:**
> 차가운 기술 안에서 따뜻함을 찾습니다.
> 미래는 차가워야 한다는 가정에 동의하지 않으세요.

**Mirror:**
> *"내일도 다정할 수 있다고 믿어요."*

**Atmosphere:** 새벽 · 빛 · 부드러운 금속

### Card motion

On scroll-into-view, cards reveal in a staggered diagonal sweep (top-left → bottom-right, 200ms apart). Each card uses *Settle physics* — 12px translate-Y with 2% overshoot over 1.2s.

Hover state: card lifts 4px, warm-shifts +120K via a CSS `filter: brightness(1.04) saturate(1.04)`, palette swatches gain 1px of internal glow. No scale change. No tilt.

### The closing humility

Below the grid, in mist xs:

```
당신의 풍경은 이 넷 중 하나가 아닐 거예요.
완전히 다른 무언가일 가능성이 더 큽니다.
```

> *"Your landscape will probably not be one of these four. It will most likely be something else entirely."*

This is the **honesty signal**, equivalent to v1's *"예시 한 사람의 풍경이에요. 당신의 것은 다를 거예요."* — but it goes further. It explicitly tells the reader the example cards are not the menu. Most landing pages do the opposite, presenting samples as the options.

---

## 5. Section 4 — Identity Evolution

The architecture is the same as v1 (three season chapters + closing italic). The copy is reworked for the *변화* / *나에 가까워지는 일* thesis.

### Composition

```
─ 시간이 지나면, 풍경도 함께 변해갑니다.


봄                         여름                       가을
─                          ─                          ─

새것을                     빛이                       안으로
─────                      ─────                      ─────
사랑하던                   길어진                     돌아온
계절                       계절                       계절

▮▮▮▮▮                      ▮▮▮▮▮                      ▮▮▮▮▮

처음 만나는 것들에         조금 더 멀리,              다시 한 방,
자주 멈춰 섰어요.          자주 나갔어요.             한 창, 한 사람으로
                                                     좁아졌어요.


─────


"한 해 동안 천천히 다른 사람이 되어가셨습니다.
 그게 변하는 것이 아니라,
 자기 자신에 가까워지는 일이라는 걸,
 이제는 아실 거예요."
```

### Why this closing is different

V1's closing was:
> *"2026년, 차가운 완벽함에서 천천히 멀어졌어요. 대신 따뜻함 쪽으로 가까워졌어요. 천천히, 모르는 사이에."*

V2's closing reframes change as *self-recovery*:
> *"한 해 동안 천천히 다른 사람이 되어가셨습니다. 그게 변하는 것이 아니라, 자기 자신에 가까워지는 일이라는 걸, 이제는 아실 거예요."*

> *"Over the year you slowly became a different person. And you will come to know that this is not changing, but moving closer to yourself."*

This sentence is the most emotionally loaded line on the page, and it earns its position by being the last thing before the user reaches the Sharing section. It is also the line we expect users to quote when they recommend the product.

### Background palette migration

The horizontal gradient now spans from **silver-blue (left)** to **rose (right)** — the page is moving from cool early-year to warm late-year, mirroring the seasonal copy.

---

## 6. Section 5 — Sharing

The three sample cards return, now styled in the v2 palette. The Card composition is the same as `sharing.md` §1 (5:7 portrait, Sigil top-left, sender's name, content, date, type).

### Three sample cards

**Card A — Mirror Card from "j."**
> 아침을 견디는 사람

**Card B — Atmosphere Card from "m."**
> 옻칠한 황혼
> ▮ ▮ ▮ ▮ ▮
> oak · brown · rose · sand · beige

**Card C — Threshold Card from "s."**
> 잠시,
> 너의 자리.

### Closing copy

```
카드는 다른 사람의 피드에 들어가지 않습니다.
필요한 사람에게, 직접 가요.
```

Two sentences, mixed register: ~ㅂ니다 for the principled statement, ~요 for the gentler clarification. This is the literary essay seam at work.

---

## 7. Section 6 — Final CTA

### Composition

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│          [warm rose+silver-blue door of light]               │
│          [a rectangle, vertical, blurred, slow pulse]        │
│                                                              │
│                                                              │
│          조금 더 나다운 방향으로.                            │
│                                                              │
│                                                              │
│          ─── Taste OS 시작하기 ───                           │
│                                                              │
│          어디서든, 잠시 머물러도 좋아요.                     │
│                                                              │
│                                                              │
│                                                              │
│          taste.os · 2026 · 개인정보 · 문의                   │
└──────────────────────────────────────────────────────────────┘
```

### Anatomy

1. **The Door** — vertical rectangle, 140×320px, built from a layered radial gradient:
   - Inner core: rose at 36% alpha
   - Mid: rose at 22% alpha
   - Outer: silver-blue at 12% alpha (the cool halo around the warm core)
   - Blur 10px
   - Slow `door-glow` animation at 6s sine cycle
2. **Headline** — display sm, italic, beige. *"조금 더 나다운 방향으로."*
3. **Beacon** — `─── Taste OS 시작하기 ───`, full ceremonial framing.
4. **Whisper** — text xs, mist, slightly faded. *"어디서든, 잠시 머물러도 좋아요."*
5. **Footer** — text xs, mist 40%, single line.

### Copy

| Slot | Korean | English |
|---|---|---|
| Headline | 조금 더 나다운 방향으로. | Toward becoming a little more myself. |
| CTA | ─── Taste OS 시작하기 ─── | ─── begin Taste OS ─── |
| Whisper | 어디서든, 잠시 머물러도 좋아요. | You can stay a while, wherever you are. |
| Footer | taste.os · 2026 · 개인정보 · 문의 | taste.os · 2026 · privacy · contact |

### The Door's interaction

The Door responds to cursor position in the final section via a `requestAnimationFrame`-driven lerp at 0.06 damping. The translation is small (≤12px). It is not a hover effect; it is *the room becoming aware that someone is standing at the threshold.*

When the Beacon is hovered, the Door's inner core color temperature shifts +200K — slightly warmer, slightly redder. The room is welcoming.

---

## 8. Motion Refinements

V2 motion is uniformly **~15% slower** than v1. The numbers below are absolute (not multipliers of v1).

| Pattern | v1 duration | v2 duration |
|---|---|---|
| Reveal blur | 1.6s | 1.8s |
| Headline reveal blur | 1.6s | 2.0s |
| Section fade (breath in) | 0.9s | 1.0s |
| Section exit (breath out) | 1.4s | 1.6s |
| Crossfade overlap | 0.6s | 0.7s |
| Card settle | 1.2s | 1.4s |
| Door glow cycle | 6s | 7s |
| Beacon pulse cycle | 3.2s | 3.6s |
| Orb drift cycle | 36s | 42s |

The page is now more film than software. The user is asked to slow down even more.

### New motion: dust particles

```css
.dust {
  position: fixed;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  opacity: 0;
  filter: blur(0.5px);
  animation: dust-rise 12s linear infinite, dust-fade 12s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

@keyframes dust-rise {
  0%   { transform: translateY(105vh) translateX(0); }
  100% { transform: translateY(-10vh)  translateX(20px); }
}

@keyframes dust-fade {
  0%, 100% { opacity: 0; }
  10%, 90% { opacity: 0.35; }
}
```

24 dust particles spawn with staggered animation delays (one every 500ms). They are mostly rose-tinted, with one in four silver-blue. They drift slowly upward — the visual evidence that the room has *air* moving through it.

---

## 9. Voice Note on ~ㅂ니다 Register

The hero's *"당신은 계속 변하고 있습니다"* uses ~ㅂ니다, which `voice.md` generally cautions against ("too formal, sounds corporate"). The exception that applies here is *literary essay register* — Korean modern essay (김연수, 한강, 박완서, 김애란) routinely uses ~ㅂ니다 in passages of considered observation. It is not corporate; it is *meditative.*

The landing page's mixed-register pattern:

- ~ㅂ니다 — for declarative statements that should land with weight (hero headline, atmosphere thesis sentences, closing essay).
- ~요 — for warmer asides (scroll hints, whispers, the "수도 좋아요" type permission lines).
- Subject elision — wherever the reader is implicit and 당신 would feel performed.

The hero's *"당신은"* is the page's one permitted use of explicit 당신. The rest of the page elides where possible.

This is consistent with `voice.md`'s definition of the indie bookstore voice — *책방 무사*'s curation cards are sometimes ~ㅂ니다, sometimes ~요, depending on whether the line is naming a truth or extending a hand. v2's hero names a truth; v2's footer extends a hand.

---

## Closing

V2 is not a different landing page from v1. It is the same landing page after a few months of refinement — slower, warmer, more comfortable in its own register, more specific about what it is showing the user. The four Taste cards do most of the new work: they prove the product can produce emotionally distinct profiles, not just one beautiful one.

If v1 said *"this is a quiet room"*, v2 says *"this is a quiet room, and you are constantly changing in it."*

That sentence — *당신은 계속 변하고 있습니다* — is the entire page in seven syllables.
