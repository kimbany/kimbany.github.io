# Taste OS — Landing Page Design

> The first surface a person encounters. Not a homepage. Not a product page. A *room with the lights low.*

This document specifies the public landing page at `taste.os/` (and, in this repository, viewable at `kimbany.github.io/taste-os/landing/`). The page is the first moment of contact with the OS — and is therefore subject to every voice and visual rule established in the earlier documents, with extra discipline.

The single sentence to remember while reading this doc:

> *When users first open the website, they should feel: "this understands something about me."*

Read alongside: `system.md` (design system), `voice.md` (Korean-first voice), `sharing.md` (Card system, which the Sharing Preview reproduces), `mvp.md` (which already specifies the launch marketing page; this expands it).

---

## Table of Contents

0. [The Refusal](#0-the-refusal)
1. [Page Architecture](#1-page-architecture)
2. [Section 1 — Hero](#2-section-1--hero)
3. [Section 2 — Emotional Introduction](#3-section-2--emotional-introduction)
4. [Section 3 — Taste Reflection Preview](#4-section-3--taste-reflection-preview)
5. [Section 4 — Identity Evolution Preview](#5-section-4--identity-evolution-preview)
6. [Section 5 — Identity Sharing Preview](#6-section-5--identity-sharing-preview)
7. [Section 6 — Final Emotional CTA](#7-section-6--final-emotional-cta)
8. [Animation System](#8-animation-system)
9. [Visual Effects](#9-visual-effects)
10. [Responsive Behavior](#10-responsive-behavior)
11. [Implementation Architecture](#11-implementation-architecture)
12. [Korean & English Copy Tables](#12-korean--english-copy-tables)

---

## 0. The Refusal

A landing page is the most-rehearsed surface in software, and the most cliché. Before defining what this page *is*, we name what it is not.

### This page does not have

- A hero with a product mockup floating at an angle.
- A "Features" grid of three or six cards with icons.
- Testimonials with profile photos and company logos.
- A pricing table.
- A "How it works" diagram with arrows.
- Numbered steps explaining the product.
- A signup form above the fold demanding the user's email immediately.
- A footer with twelve columns of links to a sitemap.
- Logos of "trusted by" companies.
- Awards, press mentions, "as seen in."
- A chat-bubble icon in the bottom-right.
- A cookie banner that takes a quarter of the screen.
- A countdown timer of any kind.
- The words *revolutionary*, *seamless*, *unlock*, *transform*, *leverage*, *journey*, *empower*.

### This page also does not have

- Multiple CTAs vying for attention.
- A pop-up offering a discount in exchange for an email.
- Animated emojis.
- A 3D rotating product hero.
- A video that auto-plays with sound.
- "Limited time" anything.

What remains, after these refusals, is most of the page. The page is composed of what is *not on it* as much as what is.

---

## 1. Page Architecture

The page is a single long-scroll, organized as a film with six acts. Each act is approximately one viewport tall on Desktop, longer on Mobile to accommodate larger type.

```
                            ▼ scroll

┌──────────────────────────────────────────────────────────────┐
│  ACT I  · HERO                       1 viewport (100vh)      │
│         · emotional invitation, drifting light field         │
├──────────────────────────────────────────────────────────────┤
│  ACT II · EMOTIONAL INTRODUCTION    3 viewports               │
│         · three observations, one per viewport               │
│         · identity · atmosphere · evolution                  │
├──────────────────────────────────────────────────────────────┤
│  ACT III · TASTE REFLECTION         ~1.5 viewports            │
│         · a sample Taste Genome rendered as if real          │
│         · Taste Name, portrait excerpt, currents, palette    │
├──────────────────────────────────────────────────────────────┤
│  ACT IV · IDENTITY EVOLUTION         ~1.5 viewports           │
│         · three season chapters horizontally arrayed         │
│         · palette migration left-to-right                    │
├──────────────────────────────────────────────────────────────┤
│  ACT V  · IDENTITY SHARING           ~1.2 viewports           │
│         · three sample Cards floating, mirror voice excerpt  │
├──────────────────────────────────────────────────────────────┤
│  ACT VI · FINAL CTA                  1 viewport               │
│         · a door of warm light, single Beacon                │
└──────────────────────────────────────────────────────────────┘
```

### Constants across all sections

- **Background:** `void` (#0A0A0B), with subtle 0.6% gradient tint that migrates by section.
- **Grain texture:** A faint film grain overlay at 4% opacity, animated at 8fps (subtle flicker).
- **Drifting light points:** 3–5 small warm light orbs (ember at 0.06 alpha, blurred 80px) drift slowly across the entire page, persisting across sections. This is the Seoul-night signature.
- **Scroll snap:** **None.** Snap creates abruptness. The scroll is free, the eye decides where to rest.
- **Top-of-page rail:** A single small Sigil (ensō) top-left at mist 24%. Nothing else as nav.

---

## 2. Section 1 — Hero

### Composition

A black field, full viewport. Center-aligned content at roughly 38% vertical (just above center, golden ratio anchor).

```
┌──────────────────────────────────────────────────────────────┐
│  ◌                                                           │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│              자신을 알아가는, 가장 조용한 자리.              │
│                                                              │
│                          Taste OS                            │
│                                                              │
│                                                              │
│                       ─ 시작하기 ─                            │
│                                                              │
│                                                              │
│                                                              │
│                                              ↓ 천천히 내려요  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Elements

1. **Sigil** — top-left, mist 24%, slow breath at 0.6Hz.
2. **Headline** — display sm (36–44px), italic, pearl. *"자신을 알아가는, 가장 조용한 자리."*
3. **Wordmark** — display sm, non-italic, mist. *"Taste OS"* — set wide, +0.06em.
4. **Beacon** — `─ 시작하기 ─` — hairline border, no fill, slow 0.6Hz pulse.
5. **Scroll hint** — bottom-right, text xs, mist 60%. *"↓ 천천히 내려요"* — appears after 4s of inactivity, fades on first scroll input.

### Atmospheric layer

3–5 warm light orbs at random positions, drifting slowly. Each orb:

- 240×240px, `radial-gradient(circle, rgba(217,166,108,0.18), transparent 70%)`
- Travels at ~6px/s
- Sinusoidal vertical sway with period 24s
- Wraps around viewport edges (off-right re-enters from left)

This is the **Seoul night** signature — windows of distant apartments, warmer than they should be, drifting just barely.

### Motion at load

```
t = 0.0s   black field with grain at 0%
t = 0.4s   grain fades in to 4%
t = 0.6s   first light orb fades in
t = 0.9s   remaining orbs fade in, staggered 180ms
t = 1.2s   Sigil appears
t = 1.8s   Headline reveal-blur (1.6s)
t = 3.6s   Wordmark fades in (mist, 0.8s)
t = 4.6s   Beacon fades in with first pulse
t = 8.6s   "↓ 천천히 내려요" appears if no scroll yet
```

### Copy

| Slot | Korean | English |
|---|---|---|
| Headline | 자신을 알아가는, 가장 조용한 자리. | The quietest place to know yourself. |
| Wordmark | Taste OS | Taste OS |
| CTA | ─ 시작하기 ─ | ─ begin ─ |
| Scroll hint | ↓ 천천히 내려요 | ↓ scroll, slowly |

---

## 3. Section 2 — Emotional Introduction

Three observations, each one viewport, in succession. The reader does not scroll to "learn how it works"; the reader scrolls to *feel three things land.*

### Composition — repeating across the three subsections

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│   ── 하나                                                    │
│                                                              │
│                                                              │
│   당신은 의미 있는 것을 모으는 사람이에요.                   │
│                                                              │
│                                                              │
│   사진, 음악, 한 줄의 글, 마음이 머문 자리 — 우연이 아니죠.   │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### The three observations

**ⅰ. 정체성 / Identity**

```
─ 하나

당신은 의미 있는 것을 모으는 사람이에요.

사진, 음악, 한 줄의 글, 마음이 머문 자리 — 우연이 아니죠.
```

**ⅱ. 분위기 / Atmosphere**

```
─ 둘

그 모음에는 분위기가 있어요.

어떤 빛, 어떤 시간, 어떤 온도. 당신의 풍경이에요.
```

**ⅲ. 진화 / Evolution**

```
─ 셋

그리고 그 풍경은 천천히 변해가요.

당신이 그러는 것처럼.
```

### Motion

Each subsection enters as it intersects the viewport:

- `─ 하나` (small section label) — fades in first
- Lead sentence — reveal-blur (1.4s) with a 200ms delay after label
- Trailing sentence — fades in (mist tone) with 600ms additional delay

Background tint migrates slightly per subsection:

- ⅰ Identity: `void` (pure)
- ⅱ Atmosphere: `void` with 2% ember warm gradient from top-left
- ⅲ Evolution: `void` with 2% phosphor cool gradient from bottom-right

The migration happens *between* subsections during scroll — never as a snap.

### English mirror

| KR | EN |
|---|---|
| 당신은 의미 있는 것을 모으는 사람이에요. | You are someone who collects what matters. |
| 사진, 음악, 한 줄의 글, 마음이 머문 자리 — 우연이 아니죠. | Images, music, lines you saved, rooms you returned to — none of it was random. |
| 그 모음에는 분위기가 있어요. | What you have collected has an atmosphere. |
| 어떤 빛, 어떤 시간, 어떤 온도. 당신의 풍경이에요. | A light, an hour, a temperature. It is your landscape. |
| 그리고 그 풍경은 천천히 변해가요. | And it changes, slowly. |
| 당신이 그러는 것처럼. | As you do. |

---

## 4. Section 3 — Taste Reflection Preview

A fictional but plausible Taste Genome rendered as if real. The reader sees what the report looks like, in the same composition as the actual product surface.

### Composition

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ─ 우리가 보는 풍경은 이렇게 생겼어요.                       │
│                                                              │
│                                                              │
│                                                              │
│              옻칠한                                          │
│                황혼                                          │
│              (Lacquered Dusk)                                │
│                                                              │
│   ─────────                                                  │
│                                                              │
│   하루가 끝나갈 즈음, 따뜻함 쪽으로 가까워지시는군요.        │
│   사람이 많은 곳에서는 조용한 쪽으로, 천천히.                │
│   당신이 모으는 풍경에는, 늘 창이 하나씩 있어요.             │
│                                                              │
│   ─────────                                                  │
│                                                              │
│   당신의 흐름                                                │
│     · 옻칠한 황혼        steady, 14 weeks                    │
│     · 북쪽의 린넨        steady, 9 weeks                     │
│     · 삼나무 수학자      newly forming                       │
│                                                              │
│   당신의 색                                                  │
│     ▮  ▮  ▮  ▮  ▮                                            │
│     oak · ash · ember · fog · ink                            │
│                                                              │
│   ─────────                                                  │
│                                                              │
│                                                              │
│   "아름다움을 모으는 사람이 아니에요.                        │
│    한때 누군가에게 세상이 다정했다는,                        │
│    그런 증거를 모으세요."                                    │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Anatomy

1. **Section label** — *"우리가 보는 풍경은 이렇게 생겼어요."* — small, mist.
2. **Taste Name** — display lg, italic, two lines, kerned wide. Korean primary + English in mist below.
3. **Portrait excerpt** — three sentences, text-lg, ash-warm tone. Sample of the actual report voice.
4. **Currents** — three named currents with their stability annotations in mono.
5. **Palette** — five swatches with names below in mono.
6. **Mirror line** — italic, set apart by extra breath above and below.

### Motion

The whole section reveals as one composition, not staggered. When 30% of section enters viewport:

- Section label fades in
- Taste Name reveal-blur (1.8s, slow)
- Portrait fades in line by line (3 lines, 400ms apart)
- Currents and Palette fade in together (1.0s)
- Mirror line reveal-blur (1.6s)

Total reveal duration: ~5 seconds. The reader cannot rush this section by scrolling past — but if they do, the elements simply appear at their final state.

### The honesty signal

Below the Mirror line, in mist xs:

> *예시 한 사람의 풍경이에요. 당신의 것은 다를 거예요.*
>
> *— a sample. yours will be different.*

This protects the reader from thinking the example *is* their result.

---

## 5. Section 4 — Identity Evolution Preview

Three season chapters arrayed horizontally, with palette migration left-to-right. Demonstrates the Drift surface without using charts.

### Composition

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ─ 시간이 지나면, 풍경도 함께 움직여요.                      │
│                                                              │
│                                                              │
│                                                              │
│   봄                  여름                  가을              │
│   ─                  ─                     ─                  │
│                                                              │
│   북쪽의              짠 바다의             옻칠한            │
│   린넨                모더니즘              황혼              │
│                                                              │
│   ▮▮▮▮▮              ▮▮▮▮▮                 ▮▮▮▮▮            │
│                                                              │
│   파란 것들이         밖으로 더 자주        다시 안으로       │
│   많아졌어요.         나가셨고요.           들어가셨어요.     │
│                                                              │
│                                                              │
│                                                              │
│   ─────                                                      │
│                                                              │
│   "2026년, 차가운 완벽함에서 천천히 멀어졌어요.              │
│    대신 따뜻함 쪽으로 가까워졌어요. 천천히, 모르는 사이에."  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Anatomy

1. **Section label** — *"시간이 지나면, 풍경도 함께 움직여요."* — section opener.
2. **Three chapter columns** — equal width, separated by faint vertical hairlines:
    - Season label (봄 / 여름 / 가을), small
    - Chapter name in display sm, italic, two lines
    - 5-swatch palette below
    - One-sentence observation in past tense
3. **Connecting line** — beneath, a single italic quote that summarizes the year, in the Drift narration voice.

### Background palette migration

The background of this section is a horizontal gradient that migrates left-to-right:

- Left edge: cool tint (북쪽의 린넨's palette dominant)
- Middle: warm-bright (짠 바다의 모더니즘)
- Right edge: warm-deep (옻칠한 황혼)

The gradient is set at 0.6% mix with `void`, so it is barely perceptible per pixel but is felt across the whole section width.

### Motion

On scroll-into-view:

- Section label fades in
- All three columns fade in together (no stagger — they are *one composition*)
- Each column's palette swatches expand from 0 width to full over 800ms, ember-warming as they appear
- The bottom italic quote reveal-blurs last (1.6s)

### What's deliberately not here

- No year numbers. *"2026년"* is the only number on the page, and only in the closing italic quote.
- No data labels.
- No trend lines, sparklines, or any chart visualization.
- No "see your evolution" CTA.

---

## 6. Section 5 — Identity Sharing Preview

Three sample Cards floating, demonstrating the sharing system without inviting it.

### Composition

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ─ 누군가에게 보내고 싶을 때가 있어요.                       │
│                                                              │
│                                                              │
│                                                              │
│    ┌────────────┐     ┌────────────┐     ┌────────────┐     │
│    │ ◌          │     │ ◌          │     │ ◌          │     │
│    │            │     │            │     │            │     │
│    │ j.         │     │ m.         │     │ s.         │     │
│    │            │     │            │     │            │     │
│    │ ─────      │     │ ─────      │     │ ─────      │     │
│    │            │     │            │     │            │     │
│    │ 아침을     │     │ 옻칠한     │     │ 잠시,      │     │
│    │ 견디는     │     │ 황혼       │     │ 너의 자리. │     │
│    │ 사람       │     │            │     │            │     │
│    │            │     │ ▮▮▮▮▮      │     │            │     │
│    │            │     │            │     │            │     │
│    │ ─────      │     │ ─────      │     │ ─────      │     │
│    │ feb 14     │     │ feb 12     │     │ feb 10     │     │
│    └────────────┘     └────────────┘     └────────────┘     │
│      Mirror Card        Palette Card     Threshold Card     │
│                                                              │
│                                                              │
│   카드는 다른 사람의 피드에 들어가지 않아요.                  │
│   필요한 사람에게, 직접 가요.                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Anatomy

1. **Section label** — *"누군가에게 보내고 싶을 때가 있어요."*
2. **Three Card mockups** — at 5:7 portrait, faintly tilted at +1.2°, −0.4°, +0.8° respectively (just enough to feel hand-arranged). Each is a different Card type.
3. **Card type labels** — below each, in mono xs, mist.
4. **Closing sentences** — two-line statement of what sharing in Taste OS *is*.

### Card content (samples)

- **Card 1 — Mirror Card from "j."**
    ```
    아침을 견디는 사람
    ```
    Display md italic, multi-line, centered.

- **Card 2 — Palette Card from "m."**
    ```
    옻칠한 황혼
    ▮ ▮ ▮ ▮ ▮
    oak · ash · ember · fog · ink
    ```

- **Card 3 — Threshold Card from "s."**
    ```
    잠시, 너의 자리.
    ```

### Motion

On scroll-into-view, the three Cards rise in sequence (translateY: 12px → 0, 800ms each, staggered 200ms). They settle with the *Settle physics* (2% overshoot, 1.2s return) — the same physics images use when dropped during onboarding.

After settling, they idle with a very slow vertical drift (±3px sinusoidal at 0.05Hz). Not enough to demand attention; enough to feel alive.

### English copy

| KR | EN |
|---|---|
| 누군가에게 보내고 싶을 때가 있어요. | Sometimes you want to send this to one person. |
| 카드는 다른 사람의 피드에 들어가지 않아요. | A card never enters anyone's feed. |
| 필요한 사람에게, 직접 가요. | It goes directly to the person you sent it to. |

---

## 7. Section 6 — Final Emotional CTA

The ending. A door of warm light, expanding slowly as the user approaches it.

### Composition

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│              [warm vertical rectangle of light]              │
│              [growing slightly as user scrolls]              │
│                                                              │
│                                                              │
│              준비되면, 들어오세요.                            │
│                                                              │
│              ─ 시작하기 ─                                     │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Anatomy

1. **The Door** — a vertical rectangle of warm light, centered. Width 140px, height 320px. Built with a radial gradient (ember 28% at center → transparent at edges).
2. **Closing sentence** — display sm, italic, below the door. *"준비되면, 들어오세요."*
3. **Final Beacon** — `─ 시작하기 ─`, hairline border, slow pulse.
4. **Hairline footer** — a single line of mist xs at the bottom: *"taste.os · 2026 · privacy · contact"*. No more, no less.

### Motion

The Door uses a parallax effect tied to scroll position within the section:

- Section enters viewport: Door is at 80% opacity, 90% width
- Section at center of viewport: Door at 100% opacity, 100% width
- User has scrolled past: stays at 100%

When user hovers the Beacon, the Door's warmth temperature increases slightly (+200K) — as if the room beyond is welcoming them.

### Copy alternatives

| Surface | KR | EN |
|---|---|---|
| Closing line | 준비되면, 들어오세요. | When you're ready, come in. |
| CTA | ─ 시작하기 ─ | ─ begin ─ |
| Footer | taste.os · 2026 · 개인정보 · 문의 | taste.os · 2026 · privacy · contact |

---

## 8. Animation System

The page motion uses the **Breath** language defined in `system.md` §6, with adjustments for landing-specific patterns.

### Core motion tokens (CSS custom properties)

```css
:root {
  --t-fast: 0.18s;
  --t-base: 0.6s;
  --t-breath-in: 0.9s;
  --t-breath-out: 1.4s;
  --t-reveal: 1.6s;
  --t-reveal-slow: 1.8s;

  --e-breath-in: cubic-bezier(0.16, 1, 0.30, 1);
  --e-breath-out: cubic-bezier(0.70, 0, 0.84, 0);
  --e-settle: cubic-bezier(0.34, 1.18, 0.64, 1);
}
```

### Patterns used on this page

| Pattern | Where | Spec |
|---|---|---|
| **Reveal blur** | Headline, Taste Name, Mirror lines | `filter: blur(14px → 0); letter-spacing: 0.12em → 0.03em` over 1.6–1.8s |
| **Section fade** | Each Act enters viewport | `opacity: 0 → 1; translateY: 12px → 0` over 0.9s |
| **Settle** | Cards in §5 | `translateY: 12px → 0` with 2% overshoot, 1.2s |
| **Drift** | Background light orbs | Constant CSS keyframe animation, 24s sine cycle |
| **Pulse** | Beacons | `box-shadow` outer ring expanding, 0.6Hz sine |
| **Door warm** | §6 Door on hover | Radial gradient color-temperature shift, 0.4s |

### IntersectionObserver-driven reveals

All section enters use `IntersectionObserver` with a 30% threshold. When a section's 30% mark crosses into viewport:

```js
section.classList.add('is-in-view');
```

CSS handles the rest via `[data-section].is-in-view` selectors. No JS animation per element — just one class toggle, then CSS does the breath.

### Reduced motion

Under `prefers-reduced-motion: reduce`:
- Reveal blur becomes opacity fade (300ms)
- Light orb drift pauses (stays positioned but doesn't move)
- Pulse animations stop (Beacons become static hairline borders)
- Card settle physics replaced by simple fade

---

## 9. Visual Effects

### The grain texture

A SVG-based film grain overlay covers the entire page at 4% opacity. The grain animates at 8fps via CSS animation cycling through 4 frames (1 frame = 125ms).

```css
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  opacity: 0.04;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,...");
  animation: grain-shift 0.5s steps(4) infinite;
}
```

The grain is the texture of film photography — central to the visual identity. Without it, the page looks digital; with it, the page looks *photographed*.

### The light orbs (Seoul night)

3–5 absolutely-positioned divs:

```css
.orb {
  position: fixed;
  width: 240px;
  height: 240px;
  background: radial-gradient(
    circle,
    rgba(217, 166, 108, 0.18) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
  filter: blur(40px);
  animation: drift 36s ease-in-out infinite;
}
```

Each orb has staggered animation delays and slightly different drift patterns. They wrap around viewport edges via translate keyframes.

### Section tints

Each Act has a slightly different background tint, applied as a `radial-gradient` overlay at 0.6% mix:

| Act | Tint | Position |
|---|---|---|
| I Hero | None (pure void) | — |
| II Introduction | Migrates: pure → ember 2% → phosphor 2% | per subsection |
| III Reflection | ember 4% | top-left radial |
| IV Evolution | horizontal gradient: phosphor → ember | left-to-right |
| V Sharing | pearl 3% | center radial |
| VI CTA | ember 8% (the Door's halo) | center vertical |

### Subtle gradients

The page uses gradients sparingly:

- Section-tint overlays (above)
- Bottom-of-photo legibility gradients (none on this page; no user photos)
- The Door's radial in §6
- The Beacon's pulse ring

---

## 10. Responsive Behavior

The page is designed first at **Studio** (1440px), then adapted down. Following `system.md` §7 — three rooms, not three breakpoints.

### Pocket (< 600px)

| Element | Adaptation |
|---|---|
| Hero headline | 28–32px (down from 40px) |
| Wordmark | 18px |
| Stage max width | 100% with 24px side padding |
| §4 Evolution | columns stack vertically (3 rows instead of 3 columns) |
| §5 Sharing | Cards stack vertically, no tilt |
| §6 Door | width 100px, height 240px |
| Light orbs | reduced to 2 |
| Grain | unchanged |

### Desk (600–1280px)

| Element | Adaptation |
|---|---|
| Hero headline | 36–40px |
| §4 Evolution | three columns, narrower padding |
| §5 Sharing | three cards horizontal, smaller |

### Studio (≥ 1280px)

Full composition. Page content capped at 1080px wide for prose sections, 1280px for visual sections (per the existing Stage rules). The surrounding margin remains dark.

### Touch vs cursor

- Beacon hover effect replaced by tap-active state.
- Light orb interactivity (none planned — they're purely ambient) remains the same.
- Reduced motion automatically detected and respected on mobile devices.

---

## 11. Implementation Architecture

This document targets Next.js App Router with Tailwind and Framer Motion. The static version in this repository (`taste-os/landing/`) is the same design implemented in vanilla HTML/CSS/JS for direct GitHub Pages hosting.

### Next.js project structure

```
app/
  page.tsx                  ← the landing page (this surface)
  layout.tsx                ← root layout with grain, light orbs, Sigil
components/
  landing/
    Hero.tsx
    Introduction.tsx
    ReflectionPreview.tsx
    EvolutionPreview.tsx
    SharingPreview.tsx
    FinalCTA.tsx
  atmosphere/
    Grain.tsx
    LightOrbs.tsx
    Sigil.tsx
  primitives/
    Beacon.tsx
    Whisper.tsx
    Display.tsx
    Hairline.tsx
hooks/
  useReveal.ts              ← IntersectionObserver hook
  useReducedMotion.ts
styles/
  tokens.css                ← all design tokens
```

### Sample component — Hero.tsx (sketch)

```tsx
'use client';

import { motion } from 'framer-motion';
import { Beacon } from '@/components/primitives/Beacon';
import { breath } from '@/lib/motion/tokens';

export function Hero() {
  return (
    <section
      data-section="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-6"
    >
      <motion.h1
        initial={{ opacity: 0, filter: 'blur(14px)', letterSpacing: '0.12em' }}
        animate={{ opacity: 1, filter: 'blur(0)', letterSpacing: '0.03em' }}
        transition={{ duration: 1.6, delay: 1.8, ease: breath.in }}
        className="font-display italic text-[36px] md:text-[44px] text-pearl text-center max-w-[640px]"
      >
        자신을 알아가는, 가장 조용한 자리.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 3.6 }}
        className="mt-12 text-mist text-base tracking-[0.06em]"
      >
        Taste OS
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 4.6 }}
        className="mt-12"
      >
        <Beacon href="/onboarding">시작하기</Beacon>
      </motion.div>
    </section>
  );
}
```

### Sample primitive — Beacon.tsx

```tsx
import Link from 'next/link';
import { ReactNode } from 'react';
import clsx from 'clsx';

type BeaconProps = {
  href?: string;
  onClick?: () => void;
  ceremonial?: boolean;
  children: ReactNode;
};

export function Beacon({ href, onClick, ceremonial = true, children }: BeaconProps) {
  const Comp = href ? Link : 'button';
  return (
    <Comp
      href={href!}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center',
        'px-8 py-3 rounded-[2px]',
        'border border-pearl/[0.18] hover:border-ember/40',
        'text-pearl text-base lowercase',
        'transition-all duration-200',
        'relative',
        'before:absolute before:inset-0 before:rounded-[2px]',
        'before:shadow-[0_0_0_2px_rgba(217,166,108,0.08)] before:animate-pulse-slow',
      )}
    >
      <span className="text-mist/60 mx-2">─</span>
      <span>{children}</span>
      <span className="text-mist/60 mx-2">─</span>
    </Comp>
  );
}
```

### Static implementation (this repo)

See `taste-os/landing/` for `index.html` + `style.css` + `script.js` — the same design, in vanilla HTML/CSS/JS, runnable directly via GitHub Pages.

---

## 12. Korean & English Copy Tables

Complete reference for the page.

### Section I — Hero

| Slot | KR | EN |
|---|---|---|
| Headline | 자신을 알아가는, 가장 조용한 자리. | The quietest place to know yourself. |
| Wordmark | Taste OS | Taste OS |
| CTA | ─ 시작하기 ─ | ─ begin ─ |
| Scroll hint | ↓ 천천히 내려요 | ↓ scroll, slowly |

### Section II — Emotional Introduction

| Subsection | KR | EN |
|---|---|---|
| ⅰ label | ─ 하나 | ─ one |
| ⅰ lead | 당신은 의미 있는 것을 모으는 사람이에요. | You are someone who collects what matters. |
| ⅰ trail | 사진, 음악, 한 줄의 글, 마음이 머문 자리 — 우연이 아니죠. | Images, music, lines you saved, rooms you returned to — none of it was random. |
| ⅱ label | ─ 둘 | ─ two |
| ⅱ lead | 그 모음에는 분위기가 있어요. | What you have collected has an atmosphere. |
| ⅱ trail | 어떤 빛, 어떤 시간, 어떤 온도. 당신의 풍경이에요. | A light, an hour, a temperature. It is your landscape. |
| ⅲ label | ─ 셋 | ─ three |
| ⅲ lead | 그리고 그 풍경은 천천히 변해가요. | And it changes, slowly. |
| ⅲ trail | 당신이 그러는 것처럼. | As you do. |

### Section III — Taste Reflection Preview

| Slot | KR | EN |
|---|---|---|
| Section label | 우리가 보는 풍경은 이렇게 생겼어요. | This is what the landscape we see looks like. |
| Taste Name | 옻칠한 황혼 | Lacquered Dusk |
| Portrait line 1 | 하루가 끝나갈 즈음, 따뜻함 쪽으로 가까워지시는군요. | Toward the end of the day, you move toward warmth. |
| Portrait line 2 | 사람이 많은 곳에서는 조용한 쪽으로, 천천히. | In crowded rooms, you drift, slowly, toward the quiet. |
| Portrait line 3 | 당신이 모으는 풍경에는, 늘 창이 하나씩 있어요. | The rooms you save have one window each. |
| Currents label | 당신의 흐름 | your currents |
| Palette label | 당신의 색 | your palette |
| Mirror line | "아름다움을 모으는 사람이 아니에요. 한때 누군가에게 세상이 다정했다는, 그런 증거를 모으세요." | "You don't collect beauty — you collect evidence that the world has been gentle to someone, once." |
| Honesty signal | 예시 한 사람의 풍경이에요. 당신의 것은 다를 거예요. | A sample. Yours will be different. |

### Section IV — Identity Evolution

| Slot | KR | EN |
|---|---|---|
| Section label | 시간이 지나면, 풍경도 함께 움직여요. | As time passes, the landscape moves with you. |
| Chapter 1 — season | 봄 | spring |
| Chapter 1 — name | 북쪽의 린넨 | Northern Linen |
| Chapter 1 — line | 파란 것들이 많아졌어요. | Things turned blue. |
| Chapter 2 — season | 여름 | summer |
| Chapter 2 — name | 짠 바다의 모더니즘 | Salt-Air Modernist |
| Chapter 2 — line | 밖으로 더 자주 나가셨고요. | You went outside more. |
| Chapter 3 — season | 가을 | autumn |
| Chapter 3 — name | 옻칠한 황혼 | Lacquered Dusk |
| Chapter 3 — line | 다시 안으로 들어가셨어요. | You went back inside. |
| Closing italic | "2026년, 차가운 완벽함에서 천천히 멀어졌어요. 대신 따뜻함 쪽으로 가까워졌어요. 천천히, 모르는 사이에." | "In 2026, you slowly moved away from cold perfection — toward warmth, without knowing it." |

### Section V — Identity Sharing

| Slot | KR | EN |
|---|---|---|
| Section label | 누군가에게 보내고 싶을 때가 있어요. | Sometimes you want to send this to one person. |
| Card 1 sender | j. | j. |
| Card 1 content | 아침을 견디는 사람 | one who endures the mornings |
| Card 1 type | Mirror Card | Mirror Card |
| Card 2 sender | m. | m. |
| Card 2 content | 옻칠한 황혼 | Lacquered Dusk |
| Card 2 type | Palette Card | Palette Card |
| Card 3 sender | s. | s. |
| Card 3 content | 잠시, 너의 자리. | a place for you, briefly. |
| Card 3 type | Threshold Card | Threshold Card |
| Closing line 1 | 카드는 다른 사람의 피드에 들어가지 않아요. | A card never enters anyone's feed. |
| Closing line 2 | 필요한 사람에게, 직접 가요. | It goes directly to the person you sent it to. |

### Section VI — Final CTA

| Slot | KR | EN |
|---|---|---|
| Closing line | 준비되면, 들어오세요. | When you're ready, come in. |
| CTA | ─ 시작하기 ─ | ─ begin ─ |
| Footer | taste.os · 2026 · 개인정보 · 문의 | taste.os · 2026 · privacy · contact |

---

## Closing

A landing page is, almost always, the worst-written surface in software. It is the place a product tries hardest, and therefore the place a product is most likely to lie.

This landing page does not try to convince. It does not promise outcomes. It does not show what the product can do, except in the smallest possible doses. What it does is *show the room the user is being invited into* — quiet, warm, low-lit, slow.

If the user spends 90 seconds on this page and feels, at the end of it, that something inside them has gone quiet — we have made the right page.

The implementation lives at `taste-os/landing/`. Open `index.html` in a browser; the design above is reproduced as closely as a static page can do it.
