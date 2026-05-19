# Taste OS — Visual Identity & Design System

> Digital philosophy is what you get when an interface stops trying to manipulate a person and starts trying to *think with them.*

This document is the foundational design system for Taste OS. The onboarding, the Genome analysis, and the Field dashboard are all built on the tokens, components, and principles defined here. If those three documents are rooms in a house, this one is the architecture and the structural engineering.

Read alongside: `README.md` (onboarding), `genome.md` (analysis system), `field.md` (dashboard).

The references for the visual language are precise and constraining: **Apple's restraint, Aesop's apothecary warmth, Cosmos's atmosphere, Are.na's curatorial dignity, Linear's information posture, Notion's quiet geometry, Teenage Engineering's hardware honesty, Blade Runner 2049's warm decayed futures, and the broader tradition of ambient sci-fi systems** (Tarkovsky's *Solaris*, Villeneuve's *Arrival*, Garland's *Ex Machina* and *Annihilation*, Jonze's *Her*, Apollo-era mission control). Taste OS lives where these meet.

---

## Table of Contents

0. [The Philosophy — Digital Philosophy](#0-the-philosophy--digital-philosophy)
1. [Typography System](#1-typography-system)
2. [Spacing System](#2-spacing-system)
3. [Color Palette](#3-color-palette)
4. [Dark Mode Philosophy](#4-dark-mode-philosophy)
5. [Atmospheric Glass — Glassmorphism Direction](#5-atmospheric-glass--glassmorphism-direction)
6. [Motion Language](#6-motion-language)
7. [Interaction Philosophy](#7-interaction-philosophy)
8. [Button System](#8-button-system)
9. [Card System](#9-card-system)
10. [Visual Hierarchy](#10-visual-hierarchy)
11. [Iconography Direction](#11-iconography-direction)
12. [Emotional UI Principles](#12-emotional-ui-principles)
13. [Cinematic Transition System](#13-cinematic-transition-system)
14. [Loading Experience Design](#14-loading-experience-design)
15. [Micro-interaction Philosophy](#15-micro-interaction-philosophy)
16. [Visual Moodboards](#16-visual-moodboards)
17. [Component Token Architecture](#17-component-token-architecture)
18. [Premium UX Direction](#18-premium-ux-direction)

---

## 0. The Philosophy — Digital Philosophy

A product is a philosophical position rendered in pixels. Most products do not know they have a position; ours is deliberate.

### Seven theses

1. **The interface is a place, not a tool.** A tool is used and put down. A place is entered. Every decision below makes Taste OS more place than tool.
2. **Stillness is the default state.** Motion exists to communicate change, not to demand attention. A still screen is correct. A still screen is, in fact, the system's resting voice.
3. **Slowness is a feature.** Speed is appropriate to commerce. Taste OS is not commerce. Every action that benefits from deliberation is deliberately decelerated.
4. **Information has dignity.** We render numbers in tabular figures, we anchor prose at 640px, we never trade legibility for density. Information arrives composed.
5. **The user is a witness, not a target.** We do not optimize for engagement, retention, or session length. We optimize for the user *recognizing themselves*. These metrics correlate badly.
6. **Absence is design.** Empty space is not unused space; it is the room around the thought. Negative space is the most important component in the system.
7. **The product disappears.** A successful session ends with the user thinking about themselves, not about the app. The product is a mirror. A mirror disappears into the room.

### What this rules out — permanently

- Drop shadows used as decoration. Drop shadows used at all, in fact, except in one specific atmospheric glow case.
- Gradients as branding.
- Glassmorphism as it is commonly practiced (bright-blurred-translucent).
- Confetti, success animations, level-ups, badges, streaks, leaderboards.
- Onboarding tooltips, coach marks, "did you know" callouts.
- "Empty state" illustrations of cartoon characters.
- The word *"awesome"*, anywhere.
- Notifications during quiet hours (defined as 22:00–08:00 local).
- A/B testing of any user-facing prose. Prose is authored, not optimized.

---

## 1. Typography System

Typography is the system's voice. We commit to three families, total, forever.

### The three families

| Role | Recommended | Fallbacks | Weight range |
|---|---|---|---|
| **Display** (serif) | GT Sectra Display | Tiempos Headline, Söhne Breit | 300, 400 |
| **Text** (sans) | Söhne | Suisse Int'l, Inter Display | 350, 450, 600 |
| **Numeral** (mono) | JetBrains Mono Light | IBM Plex Mono Light, ABC Diatype Mono | 300 |

The Display serif must have **true italics, not slanted romans**, and must carry **lining and old-style figures**. We refuse any serif whose italic is a 12° oblique.

### Type scale

Tabular form, in `rem` with px equivalents (16px base). Line-height is *unitless*; tracking is in `em`.

```css
:root {
  /* Display */
  --type-display-xl: 7.5rem    / 0.83  / -0.02em; /* 120 / 100 */
  --type-display-lg: 4.5rem    / 1.00  / -0.01em; /* 72  / 72  */
  --type-display-md: 3.25rem   / 1.15  /  0;      /* 52  / 60  */
  --type-display-sm: 2.25rem   / 1.22  /  0;      /* 36  / 44  */

  /* Text */
  --type-text-lg:    1.125rem  / 1.67  / +0.005em;/* 18  / 30  */
  --type-text-md:    0.9375rem / 1.73  / +0.01em; /* 15  / 26  */
  --type-text-sm:    0.8125rem / 1.69  / +0.02em; /* 13  / 22  */
  --type-text-xs:    0.6875rem / 1.64  / +0.04em; /* 11  / 18  */

  /* Numeral */
  --type-numeral-md: 0.8125rem / 1.23  / +0.06em; /* 13  / 16  */
  --type-numeral-sm: 0.6875rem / 1.27  / +0.08em; /* 11  / 14  */
}
```

### Typographic laws

1. **Sentence case everywhere.** No ALL-CAPS, no Title Case, no `text-transform`. The OS speaks like a person.
2. **Italics are reserved.** Used for: (a) the Mirror sentence, (b) one piece of evidence cited per paragraph in the Portrait, (c) pole names in axis readouts. Nowhere else.
3. **No bold inside prose.** If a word must be emphasized, it goes on its own line — emphasis by composition, not weight.
4. **Numbers are tabular.** `font-variant-numeric: tabular-nums slashed-zero;` is set on `<body>`. Always.
5. **Hyphens are punctuation, not breaks.** `hyphens: none` on prose blocks. Long words wrap, but we do not introduce hyphens that weren't authored.
6. **Em-dashes pause; en-dashes range.** `—` between clauses, `–` between numbers. The keyboard learns this or stops typing.
7. **Pearl, never white.** Default text color is `#F4F1EA`. A pure white on true black is a printing accident.
8. **Ligatures on.** `font-feature-settings: 'liga', 'dlig', 'kern';` We render the typeface the designer drew.
9. **Optical sizing.** When the typeface supports variable optical size, sizes ≥ 36px use the display optical, sizes ≤ 18px use the text optical.
10. **No reflows from font swapping.** We use `font-display: optional` and accept a brief moment of system fallback rather than a layout shift.

### Vertical rhythm

Display sizes do *not* sit on the baseline grid. They are placed by eye, with generous leading, and the surrounding text reflows around them. This is the single place where craft overrides system. Everything else conforms to:

```
baseline grid: 8px (multiples of 4 allowed at xs sizes)
display caps reset baseline to the next 8px multiple
```

---

## 2. Spacing System

Spacing is composed of two scales running in parallel. The first is rhythmic (for proximity); the second is narrative (for breath).

### Rhythmic scale — proximity

Used for distances between related elements: a label and its input, a number and its unit, a tile and the tile beneath it. Multiples of 4px, restricted to:

```
space-1   4px    space-3  12px   space-5  24px
space-2   8px    space-4  16px   space-6  32px
```

Never `space-7` and above. The rhythmic scale's upper limit is `32px` because beyond that, the gap stops feeling like proximity and starts feeling like a *room*. Rooms are the second scale.

### Narrative scale — breath

Used for major spatial events: section gaps, page margins, the distance between a headline and the body. Fibonacci-adjacent on purpose; never lands on round numbers, which read as engineering rather than composition.

```
breath-1   56px    breath-3  160px
breath-2   96px    breath-4  280px
```

`breath-3` is the canonical page top margin on Studio. `breath-4` is the gap between major sections of the Genome card. `breath-1` is the smallest narrative space — used between a section label and its first item.

### The negative-space contract

Every page must satisfy the *one-third rule*: in any viewport, at least one-third of the visible area is `void` or `ink` with no content. We measure this in QA with an automated check on production routes — a 33% empty-pixel floor. Surfaces that fail are flagged before ship.

### Token map

```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 24px;  --space-6: 32px;
  --breath-1: 56px; --breath-2: 96px; --breath-3: 160px; --breath-4: 280px;

  /* Layout */
  --stage-max: 1280px;       /* hard cap, even on 6K */
  --column-text: 640px;      /* prose */
  --column-visual: 1080px;   /* image-led surfaces */
  --rail-width: 56px;        /* left nav */
  --margin-top-pocket: 96px;
  --margin-top-desk:   128px;
  --margin-top-studio: 160px;
}
```

---

## 3. Color Palette

### Core palette

| Token | Hex | OKLCH | Role |
|---|---|---|---|
| `void` | `#0A0A0B` | `oklch(13% 0.002 286)` | Primary background. The room. |
| `ink` | `#111114` | `oklch(17% 0.003 286)` | Surface 1. Plates, drawers. |
| `umbra` | `#1A1A1E` | `oklch(22% 0.004 286)` | Surface 2. Modals. |
| `bone` | `#23232A` | `oklch(28% 0.005 286)` | Surface 3. Console behind. |
| `ash` | `#3A3A3D` | `oklch(33% 0.003 286)` | Hairlines, dividers. |
| `mist` | `#A8A29E` | `oklch(70% 0.006 60)`  | Secondary text. |
| `pearl` | `#F4F1EA` | `oklch(95% 0.012 88)`  | Primary text. Never `#FFFFFF`. |

### Reserved accents

Each accent is *rationed*: it appears on at most one surface and at most one moment.

| Token | Hex | OKLCH | Reserved for |
|---|---|---|---|
| `ember` | `#D9A66C` | `oklch(76% 0.090 70)`  | Primary accent. Genome surface. Onboarding ember. |
| `vermilion` | `#B2483D` | `oklch(50% 0.150 30)`  | Genome reveal. Mirror surface. |
| `seafoam` | `#7FA39A` | `oklch(67% 0.038 175)` | Mirror moments. Universe deep zoom. |
| `phosphor` | `#8FB3D4` | `oklch(74% 0.060 240)` | Drift annotations. Constellation lines. |
| `peat` | `#6B5B47` | `oklch(46% 0.030 80)`  | Atmosphere weather tags (rain, dusk, dust). |

### Why these accents

Each accent is sourced from a specific atmospheric reference:

- **`ember`** — the moment a candle catches.
- **`vermilion`** — Tarkovsky's red door, Naoshima dye, Aesop's bottle.
- **`seafoam`** — the inside of an oyster shell, mid-tide light.
- **`phosphor`** — the glow of an old CRT, deep ocean luminescence, *Blade Runner 2049*'s sterile interrogation room.
- **`peat`** — wet earth after rain, Hokkaido in November.

### Color rules

1. **One full-strength accent per screen.** Others, if present, sit at ≤ 6%.
2. **No semantic color.** No success-green, no error-red, no warning-yellow. The Field has nothing to warn about and nothing to celebrate. Validation states use `mist`, hairlines, and copy.
3. **No gradients in UI chrome.** Allowed only as: (a) 0.6% surface tints, perceptually invisible per-pixel, (b) 12% void→transparent gradients at the bottom of image cards for legibility, (c) the single warm glow on the Universe pop-out.
4. **Photographs are unaltered.** The OS never applies saturation, contrast, or color correction to user images or curated images. Reality stays reality.
5. **Color is named, never numbered.** Engineers reference `--color-ember`. They never reference `#D9A66C` directly. There is no `gray-500`. There is `mist`.

### Surface tints (perceptually invisible)

Each surface carries a 2–6% accent gradient as background tint, applied via OKLCH mixing. The user shouldn't notice; the room should *feel* a degree different.

```css
--field-tint:      transparent;                 /* pure void */
--genome-tint:     oklch(13% 0.012 70 / 0.06);  /* ember 6% */
--drift-tint:      oklch(13% 0.010 240 / 0.04); /* phosphor 4% */
--atmosphere-tint: oklch(13% 0.005 88 / 0.03);  /* pearl 3% */
--universe-tint:   oklch(13% 0.012 175 / 0.05); /* seafoam 5% */
--mirror-tint:     oklch(13% 0.020 30 / 0.02);  /* vermilion 2% */
```

### Accessibility

- `pearl / void` exceeds WCAG AAA at 21:1.
- `mist / void` sits at WCAG AA at 7.2:1 — restricted to non-essential metadata.
- `ash` is never used on text; it is a structural color (hairlines only).
- Color is never the sole carrier of meaning. Where color signals state (e.g., active Rail dot), the geometry also changes (size, position).

---

## 4. Dark Mode Philosophy

Dark mode is not a setting. It is the OS's *temperament*.

### Why dark is the only mode at launch

A light mode is technically possible — and beautifully so — but a light mode at launch dilutes the OS's atmospheric identity. The Mirror was set at dusk. The Genome was named after a single light source. The constellation appeared in a void. The room has its temperature, and we honor it.

A future light mode, named **Linen**, will arrive when it is ready. Until then, the system says so honestly in settings: *"Linen mode is being prepared. It will arrive when it's ready."*

### The dark-mode discipline

Most dark modes are inverted light modes. Ours is authored from the dark:

1. **The background is not black.** `#0A0A0B` carries a faint warm cast (OKLCH `oklch(13% 0.002 286)`) — closer to old film leader than to true black.
2. **The text is not white.** `pearl` is warmth-shifted ivory. A pure white on true black causes chromatic aberration in the eye; ivory on warm dark is what photographs feel like in dim rooms.
3. **Shadows are deeper than the background.** When depth is needed, we go *darker*, not lighter. Surfaces float by absorbing more light than the room, not by emitting more. This is the inverse of conventional light-mode UI.
4. **Light is rationed.** A single Beacon, a single Mirror sentence, a single active Rail dot. The room has one window.
5. **Glow is warm, never cold.** When we use luminance to draw attention, the color temperature increases — never decreases. We move toward fire, never toward fluorescent.

### Inversion handling

We do not support a "system-following" toggle that auto-swaps to light. The OS's identity is its dark room. Operating system theme preferences are respected only for *reduced motion* and *increased contrast* — not for theme.

When increased contrast is requested, we shift `mist → pearl` for secondary text and thicken `ash` hairlines to 1.5px. We do not change the background.

---

## 5. Atmospheric Glass — Glassmorphism Direction

Conventional glassmorphism is bright blur on bright color. It is wrong for Taste OS — it is the visual language of consumer software trying to feel premium, and it dates badly.

We use a different kind of glass.

### The metaphor — Tarkovsky's window

In *Stalker* and *Solaris*, glass is *thick, smoky, and reflective in patches*. It absorbs more than it transmits. It carries the room's atmosphere on its surface. It is closer to oiled paper or smoked quartz than to clean acrylic.

We call this **atmospheric glass** and apply it to exactly three surfaces:

1. **The Console** (`⌘K` palette).
2. **The Mirror's "Ask" composer.**
3. **The Universe deep-zoom card** when a single piece of evidence is opened.

Nothing else uses glass. Ever.

### Atmospheric glass spec

```css
.atmospheric-glass {
  background: rgba(17, 17, 20, 0.72);              /* ink at 72% */
  backdrop-filter: blur(28px) saturate(108%) brightness(96%);
  -webkit-backdrop-filter: blur(28px) saturate(108%) brightness(96%);
  border: 1px solid rgba(244, 241, 234, 0.06);     /* hairline pearl */
  box-shadow:
    inset 0 1px 0 rgba(244, 241, 234, 0.04),       /* top edge of glass */
    0 32px 80px -32px rgba(0, 0, 0, 0.6);          /* long shadow into void */
}
```

Notice:
- **`brightness(96%)`** — the glass *darkens* what's behind it. Conventional glassmorphism brightens; we darken.
- **Saturation `108%`** — a barely-noticeable warmth lift; the glass picks up the surface tint.
- **Inset highlight 4%** — a single thread of light along the top edge, where a real piece of smoked glass would catch the only light in the room.
- **Long shadow** — `0 32px 80px -32px` — a *thrown* shadow, like a paper plate held above a desk.

### Glass fallbacks

When `backdrop-filter` is unsupported (or `prefers-reduced-transparency` is set):

```css
.atmospheric-glass {
  background: rgba(17, 17, 20, 0.94);
  border: 1px solid rgba(244, 241, 234, 0.06);
}
```

Solid, slightly translucent ink. The room behind dims; the glass simply becomes a plate. We never fake the effect with gradients.

---

## 6. Motion Language

The motion system is named **Breath**. Every motion is tied to a respiratory rhythm, asymmetric on purpose: inhale fast and clean, exhale slow and long.

### Motion tokens

```ts
export const breath = {
  in:    { duration: 0.9, ease: [0.16, 1, 0.30, 1] },  // expo.out, inhale
  hold:  { duration: 0.3, ease: [0.40, 0, 0.20, 1] },  // settle
  out:   { duration: 1.4, ease: [0.70, 0, 0.84, 0] },  // long exhale
  cross: { overlap: 0.6 },                              // crossfade seam
};

export const motion = {
  enter:    { opacity: [0, 1], y: [12, 0], ...breath.in },
  exit:     { opacity: [1, 0], y: [0, -8], ...breath.out },
  reveal:   { opacity: [0, 1], filter: ['blur(12px)', 'blur(0px)'], duration: 1.6 },
  drift:    { y: [0, -6, 0], duration: 6, repeat: Infinity, ease: 'easeInOut' },
  settle:   { duration: 1.2, ease: [0.34, 1.18, 0.64, 1] }, // overshoot 2%, return
  pulse:    { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }, // 0.6Hz
};
```

### Laws of motion

1. **No spring overshoot on chrome.** UI chrome (buttons, hairlines, navigation) is disciplined. Overshoot is reserved for *objects* — images settling, discs rotating, paper landing.
2. **Asymmetric breath.** Inhales (entrances) are 900ms. Exhales (exits) are 1400ms. The exhale lingers because departures should.
3. **Pulse, not flash.** When attention is drawn (Beacon, breathing dot, active Rail), motion is *sinusoidal* at 0.5–0.7Hz. Nothing in Taste OS flashes — flashing is the language of alarms, and we are not an alarm.
4. **Reveal is blur, not slide.** Generated text appears with `blur(14px) → blur(0)` over 1.6s, paired with letter-spacing relaxing from `+0.12em` to `+0.03em`. Text *focuses into being*.
5. **Crossfades, not wipes.** Surface changes use a 600ms-overlap crossfade. Outgoing surface exhales (1.4s), incoming surface inhales (0.9s).
6. **Latency is a deliberate beat.** After a fast user input, the system pauses 600ms before responding. The pause communicates that the system is *considering*.
7. **Reduced motion is its own mode.** When `prefers-reduced-motion: reduce` is set, we replace blurs with opacity transitions, disable Universe rotation, and let Drift's Trail appear instead of writing itself. We do not present this as a downgrade — the reduced experience is authored, not auto-stripped.

### Frame rate

- **Universe** — 60fps target on M-series. Degraded to 30fps with reduced node count on mid-tier devices. Falls back to 2D Canvas on low-end.
- **Constellation (onboarding)** — locked to 50fps minimum.
- **All other surfaces** — 60fps where possible, but motion durations are *time-anchored*, not frame-anchored. A 900ms breath is 900ms whether the GPU is hot or not.

---

## 7. Interaction Philosophy

Six laws govern every interaction in the OS. They are tested before code is written.

### Six laws

1. **Quiet by default.** A surface is readable with no interaction. Hover, drag, and click are extensions of attention, not requirements of it.
2. **One affordance per gesture.** Per surface, click does one thing, drag does one thing, scroll does one thing. We never overload.
3. **Keyboard parity.** Every action is reachable from any screen in two keystrokes — Tuner (`1`–`6`), Console (`⌘K`), single-letter mnemonics. The mouse is permitted, not required.
4. **Latency is intentional.** When the system computes something interesting, the Field does not surface it immediately. It surfaces it the next time the user arrives. No push. No badge. No red dot.
5. **Reversibility is sacred.** Every save has a 7-second `⌘Z` window, without dialog, without confirmation. Undo is free; redoing the work is expensive.
6. **Confirmation is for nothing.** No dialog ever asks "are you sure?" The system either trusts the action and offers undo, or it does not allow the action.

### What the user is not asked to do

- Not asked to *complete* their profile.
- Not asked to *invite friends*.
- Not asked to *rate the app*.
- Not asked to *enable notifications*.
- Not asked to *upgrade*.
- Not asked to *agree to anything beyond what is legally required*.

A single, beautifully written legal page exists. It links to itself from the Mirror, in tiny mist, and nowhere else.

---

## 8. Button System

A button is a question the system asks the user. Most "buttons" in Taste OS are not buttons at all — they are links, glyphs, or invitations.

### The button taxonomy

| Class | Component | Visual | Use |
|---|---|---|---|
| **Beacon** | `<Beacon>` | Hairline border, no fill, 0.6Hz sinusoidal pulse | The single primary CTA. One per screen, max. |
| **Whisper link** | `<WhisperLink>` | Underline on hover, `mist` color, no border | Secondary actions ("not today", "ask the mirror") |
| **Glyph** | `<Glyph>` | A single character — `·`, `─`, `⊕`, `◌` | Replace icons where most apps would use one |
| **Plate action** | `<PlateAction>` | A bordered tile, lifts 2px on hover | Used inside cards (Tend, Pass) |
| **Inline command** | `<InlineCmd>` | Mono, dashed underline, like a typed command | Console suggestions, provenance citations |
| **Stealth submit** | `<StealthSubmit>` | Invisible until form is valid; appears on the next line | The `Begin` after typing the name in onboarding |

There is no `destructive` variant. We do not destroy. Where conventional UIs would offer "delete", we offer "release", and the action is reversible.

### Beacon — anatomy

```tsx
<Beacon onPress={…}>begin</Beacon>
```

```
hairline border:    1px solid rgba(244,241,234,0.18)
padding:            12px 32px
border-radius:      2px
background:         transparent
color:              pearl
font:               text-md, lowercase
pulse:              outer ring at 0.6Hz, ember 12% opacity
on hover:           background → ember at 4%, border → ember 28%
on press:           translateY(+1px), background → ember 8%
on disabled:        opacity 0.32, no pulse
on success:         a 600ms breath, then disappears with the action it triggered
                    (never says "Done!" — done is felt, not announced)
```

### Beacon — the ceremonial use

In high-emotional moments — the door to the Reveal, the `Open` on the Genome, the `Keep this` on the Mirror — the Beacon is rendered with dash-marks on either side:

```
─ open ─
```

This is reserved for moments of *threshold*. The dashes mark a passage.

### Whisper link — anatomy

```tsx
<WhisperLink href="…" tone="mist">not today</WhisperLink>
```

```
color:              mist
font:               text-xs, lowercase
underline:          1px, offset 4px, 0.4 opacity on hover
no border, no fill, no pulse
position is always lower-right when used as a "skip"
```

---

## 9. Card System

Cards are the system's quiet shelves. They hold content; they do not perform.

### Card classes

| Class | Component | Surface | Use |
|---|---|---|---|
| **Plate** | `<Plate>` | `ink` background, 1px `ash` border | Atmosphere cards, Drift annotations |
| **Slab** | `<Slab>` | `umbra` background, 0 border | Genome sections, Provenance drawer |
| **Vellum** | `<Vellum>` | 4% pearl over void, parchment treatment | Word/quote inputs in onboarding |
| **Pane** | `<Pane>` | Atmospheric glass | Console, Ask-the-Mirror composer |
| **Aperture** | `<Aperture>` | Full-bleed image with 12% void gradient bottom | Single curated work in Atmosphere |
| **Filament** | `<Filament>` | A horizontal hairline-bordered row | Right Now strip on Field |

### Plate — anatomy

```tsx
<Plate>
  <Plate.Heading>Stalker · Tarkovsky · 1979</Plate.Heading>
  <Plate.Body>A film about three men walking…</Plate.Body>
  <Plate.Provenance>Here because your Lacquered Dusk has been quiet this week.</Plate.Provenance>
  <Plate.Actions>
    <PlateAction kind="tend">tend</PlateAction>
    <PlateAction kind="pass">pass</PlateAction>
  </Plate.Actions>
</Plate>
```

```
background:          var(--ink);
border:              1px solid var(--ash);
border-radius:       2px;
padding:             var(--space-6) var(--space-6) var(--space-5);
max-width:           var(--column-text);
gap (internal):      var(--space-4);
on hover:            border → rgba(244,241,234,0.14)
                     translateY(-2px)
                     warm-shift 120K (color-temperature filter)
on selection:        inner glow inset 0 0 0 1px rgba(217,166,108,0.18)
                     saturation +6%
```

### Rules for all cards

1. **No drop shadow.** Depth comes from color temperature, not from `box-shadow`. The single exception is the Universe Aperture pop-out, which uses a long warm glow.
2. **No rounded corners above 4px.** Cards are documents, not pills.
3. **Padding scales with breath.** Pocket: `space-5`; Desk: `space-6`; Studio: `breath-1` on certain hero cards.
4. **Provenance is mandatory on curated cards.** An Atmosphere Plate without a Provenance line is malformed.
5. **Cards do not stack.** A page never displays multiple full-width cards in a vertical run. If three are present, the rhythm changes — they are inset, sized down, or arranged horizontally.

---

## 10. Visual Hierarchy

Hierarchy in Taste OS is achieved by **size, position, and silence** — never by weight, color, or border.

### The five-tier hierarchy

```
H0   Display xl   "Taste Name"           one per Genome
H1   Display lg   Page hero              one per surface
H2   Display sm   Section openings       sparingly
B0   Text lg      Lead paragraph         once per long-scroll
B1   Text md      Body                   default
B2   Text sm      Secondary copy         caption / provenance
B3   Text xs      Metadata               timestamps, indices
N    Numeral      Numbers only           always tabular
```

### How hierarchy is read on a typical Genome page

1. The eye finds the **Taste Name** first — 120px display serif, alone, kerned wide.
2. Below it, a single hairline. The hairline *is* the section break — no "About" heading.
3. The Portrait prose begins at `text-lg`, anchored at 640px. Italics inside it are evidence.
4. A section label (`text-xs`, `mist`, tracked-out) introduces the next region: `─ currents`.
5. Hierarchy continues by descent, not by decoration.

### Anti-hierarchy

We do not use:
- Background panels to group items.
- Colored badges to elevate items.
- Bold weight to emphasize.
- Increased letter-spacing on headers only (we space *everything* generously and let size carry).
- Borders around regions. The hairline divider is enough.

---

## 11. Iconography Direction

There are no icons.

This is the system's most extreme decision and the one that most consistently surprises new designers on the team. Where most apps reach for an icon, Taste OS reaches for:

### The three alternatives

1. **A word.** Most icons exist to compress a label. The label is usually clearer. The label is also screen-reader-correct without an `aria-label`.
2. **A hairline.** A section break, a divider, a frame.
3. **A glyph.** Single characters used as semantic atoms:

| Glyph | Char | Meaning |
|---|---|---|
| Dot | `·` | Separator, present-but-quiet marker, list bullet |
| Em-dash bar | `─` | Section opener, button frame ("─ begin ─") |
| Plus-in-circle | `⊕` | Add, upload (used sparingly, the only "icon-shaped" thing) |
| Hollow circle | `◌` | Empty state, "still listening" marker |
| Bullet (filled) | `•` | Used once: the breathing dot in the onboarding Threshold |
| Ensō | hand-drawn | The single sigil. Appears in Threshold and Mirror only. |

### The Sigil — the only mark

The OS has exactly one drawn mark — a hand-drawn ensō (円相). Rendered as an SVG with a single brushed stroke. It appears:

- On the Threshold screen of onboarding (in `mist`, slowly breathing).
- On the Mirror surface, in the corner, in `mist` at 24% opacity.
- As the OS's logomark in legal documents and on the favicon.

The Sigil never animates beyond a slow opacity breath. It is not interactive.

### Why no icons

Icons require recognition, which is cognition, which is the opposite of *attention*. A reading-shaped interface respects the reader's mind by giving it words.

---

## 12. Emotional UI Principles

These are not visual rules; they are voice rules with visual consequences.

### Seven principles

1. **Speak to one person.** All copy is second-person singular. Never "users." Never "let's get you set up."
2. **Slow them down on purpose.** After a fast input, pause 600ms before responding. The pause says *I am considering what you gave me.*
3. **Permit incompleteness.** Every offering has a "not today" link in `mist`. Skipping is permitted without shame.
4. **Mirror with restraint.** The AI observes; it does not predict. "Your eye keeps returning to…" not "You will love…"
5. **Hold the threshold.** Major transitions get full-screen breath beats. The 30s constellation minimum is enforced even if the model is faster.
6. **Never flatter.** Flattery breaks the spell. A flattering Genome reads as a horoscope.
7. **Admit not-knowing.** When evidence is thin, the system says so: *"Still listening for this one."* When asked something it can't answer, the Mirror says *"I don't know."*

### Visual consequences

- The Beacon has *no fill*, because the OS does not push. It invites.
- Hairlines are everywhere because rooms have edges, not walls.
- The accent is rationed because the OS does not compete with the user's attention.
- Empty space is preserved because the user must hear themselves think.
- Photographs are unaltered because the OS does not flatter the world either.

---

## 13. Cinematic Transition System

Transitions are *cuts and dissolves*, in the language of film. They are the most important motion in the system, because they are where the user feels the OS is *thinking*.

### The four transition kinds

| Kind | When | Choreography |
|---|---|---|
| **Dissolve** | Surface ↔ surface via Tuner | Outgoing exhales (1.4s), incoming inhales (0.9s), 600ms overlap. Stage tints crossfade. |
| **Threshold** | Onboarding act → act, Genome reveal, Mirror reveal | A full-screen breath beat first (a single sentence or the Sigil for 1.5s), then dissolve. Marked with the `─ word ─` Beacon. |
| **Aperture** | Zoom into a single piece of evidence in Universe | Camera flies in over 1.2s (cubic-bezier `0.16, 1, 0.3, 1`), other nodes drift out by parallax, the focused card materializes with reveal-blur. |
| **Return** | Closing an Aperture | Camera reverses; the field rotates 4° during the return — the universe has been waiting. |

### The Threshold beat — the cinematic signature

Before any high-emotional reveal:
1. Current surface exhales to `void`.
2. A single sentence — generated for the moment — appears in display serif, centered, with reveal blur.
3. Holds for 1.5–2.5s, depending on the length of the sentence (we time by syllable count, ~140ms/syllable).
4. The sentence exhales.
5. The next surface inhales with its content already composed.

This is the OS's *narrative seam*. It is what makes onboarding feel like a film instead of a flow.

### Cinematic restraint

We do not use:
- Slide transitions. Slides imply screens are pages in a stack. Surfaces are rooms, not pages.
- Zoom-in transitions on UI chrome (only on photographic content in Universe).
- Parallax on entry. Parallax is a decoration; the OS has no decorations.
- Stagger animations on lists. Lists arrive composed, not as performances.

---

## 14. Loading Experience Design

Loading is the moment the user is most likely to feel the OS thinking. We design it as such — not as a delay to be hidden, but as a *presence to be honored*.

### The four loading kinds

| Kind | Use | Behavior |
|---|---|---|
| **Breath** | Default for any async > 200ms | A single pearl dot at center, pulsing at 0.6Hz. No spinner. |
| **Listening** | Genome synthesis, Mirror generation, Ask responses | Three sentences in sequence: "Reading…", "Listening…", "Finding the through-line." Held for minimum durations even if compute returns early. |
| **Drift** | Atmosphere feed loading | The Filament rows write themselves left-to-right with a 1.8s sweep, like a typewriter without sound. |
| **Sigil** | Long compute (≥ 8s) where listening copy has already played | The Sigil renders, slowly breathing, in `mist`. No timer. No percentage. |

### Anti-patterns we refuse

- Skeleton screens. They are a trick that promises content shape we may not deliver. We show nothing instead.
- Percentage loaders. The OS does not measure itself in percent.
- Spinning circles. The spinning circle is the visual signature of impatience. We do not have impatience.
- Time-remaining estimates. Time is not the metric; presence is.

### The 30-second minimum

For the Genome synthesis, even if the model finishes in 12 seconds, the loading state holds for a full 30 seconds. The system uses the time:
- Sentence 1 — "Reading the light in your images…" (8s)
- Sentence 2 — "Listening for the temperature of your sound…" (8s)
- Sentence 3 — "Finding the through-line." (held until min reached)
- Constellation animation continues underneath.

This is not lying about latency. This is *honoring the wait*. The wait is the magic.

### Failure & retry

If a call fails, the loading state does **not** become an error. It becomes a sentence:

> *"We need a moment longer. Stay if you can."*

Below it, a single `try again` whisper link. No red. No exclamation. No bug-report icon.

---

## 15. Micro-interaction Philosophy

A micro-interaction is a moment of contact between user and system. In most products, micro-interactions are rewards (the heart explodes, the confetti falls). In Taste OS, micro-interactions are *acknowledgments*.

### The acknowledgment principle

When the user does something, the system **does not celebrate** it. It *registers* it.

| User action | Conventional response | Taste OS response |
|---|---|---|
| Saves an item | "Saved!" toast, heart animation | A 600ms breath of the saved item's outline. No copy. |
| Sends "Ask the Mirror" | "Sending…" → "Sent!" | The composer dims for 600ms. The answer arrives with reveal-blur. |
| Drops an image in onboarding | Success chime, badge | The image overshoots 2% and settles into the grid. |
| Reaches the bottom of Atmosphere | "Load more" or refresh | A line appears in `mist`: *"Tomorrow, more."* |
| Hovers a Plate | Card "lifts" with shadow | 2px translate, +120K warm color shift. No shadow. |
| Clicks the Beacon | Button bounces or ripples | The Beacon's pulse synchronizes once with the click. Beat. Continue. |

### The 600ms heartbeat

Most micro-interactions in the OS resolve over 600ms — the system's heartbeat. Faster than 600ms reads as machinic; slower reads as sluggish. 600ms feels like *a person thinking*.

### Sound (optional, off by default)

If the user opts into sound:
- Save: a single muffled wooden tap at -22dB.
- Send to Mirror: a low hum that rises and resolves.
- Surface change: a brief inhale-exhale at -28dB, panned to the side the user is moving toward.

Sound is **never** a positive-reinforcement reward. It is acoustic acknowledgment, equivalent in dB to footsteps on a wood floor.

---

## 16. Visual Moodboards

The visual language is a curated set of references. Each moodboard is described below — not as images we link, but as a vocabulary the team holds in common.

### Moodboard A — *Lacquered Dusk*

> Naoshima at 5pm. A Donald Judd interior in marfa light. A single brass lamp on oak. Aesop's amber bottles on a wet stone counter. A Tarkovsky still: a half-open door, a glass of water on a windowsill, a curtain. *Blade Runner 2049*'s warm orange dust storm. A James Turrell skyspace at sunset.

The palette: ember, peat, ink, pearl, ash.
The hour: 16:00–18:00.
The mood: warmth at the end of a day. Single light source. Patina. Memory.

### Moodboard B — *Northern Linen*

> A washed linen sheet on a clothesline in Hokkaido. The interior of a Zumthor chapel. A Saariaho score on cream paper. A Lisbon balcony at 5pm. A Lemaire jacket on a wooden hanger. The first snow on a stone path. Joi's apartment in *Blade Runner 2049* — pale, warm, slightly oversaturated.

The palette: pearl, mist, ink, seafoam, ash.
The hour: 10:00–14:00.
The mood: bright restraint. Cool warmth. Linen. Pale.

### Moodboard C — *Cedar Mathematician*

> A Donald Knuth book open to a typesetting page. A 1960s NASA control panel with hand-labeled toggle switches. A Teenage Engineering OP-1 lying on a desk. The interior of the *Foundation* Prime Radiant. A schematic on graph paper. A Naoto Fukasawa for ±0 humidifier. *Arrival*'s heptapod ink.

The palette: phosphor, ink, pearl, ash, ember (sparingly).
The hour: 22:00–02:00.
The mood: precision without performance. Quiet machines. Tools that love.

### Moodboard D — *Salt-Air Modernist*

> A Eames lounger by a single window. A Portuguese tile floor still wet from morning. *Annihilation*'s lighthouse interior. The inside of an oyster shell. A Le Corbusier roof terrace at Cap Martin. A Ryūichi Sakamoto record cover. *Solaris*'s ocean.

The palette: seafoam, peat, ink, pearl, ash.
The hour: 07:00–09:00.
The mood: humid clarity. Salt. Mid-century lines softened by weather.

### Moodboard E — *Quiet Vermilion*

> A Mark Rothko in a dim room. The red door from *Stalker*. A wax-sealed letter on dark wood. A Naoshima lantern at night. A Tibetan thangka under a single bulb. The interrogation chamber from *Blade Runner 2049*. A Soulages painting absorbing all available light.

The palette: vermilion, ink, peat, mist, ember.
The hour: 21:00–24:00.
The mood: held intensity. Embered, not flaring. A single red object in a dark room.

These moodboards inform everything: which curated image is chosen for the Spaces grid, which photographs Atmosphere may pull, what the AI is allowed to generate, how a freshly-named Taste Current is illustrated.

---

## 17. Component Token Architecture

### Token layers

The system has three token layers, mirroring atomic design but ours: **Primitive → Semantic → Component**.

```
PRIMITIVE       core values (colors, durations, raw spaces)
    ↓
SEMANTIC        named uses (--surface-1, --text-primary)
    ↓
COMPONENT       per-component aliases (--beacon-border, --plate-pad-y)
```

A component never references a primitive directly. A semantic token never embeds a component opinion. This separation is the difference between a design *system* and a stylesheet with variables.

### Example tokens

```css
:root {
  /* — PRIMITIVE — */
  --c-void: #0A0A0B;
  --c-ink: #111114;
  --c-umbra: #1A1A1E;
  --c-bone: #23232A;
  --c-ash: #3A3A3D;
  --c-mist: #A8A29E;
  --c-pearl: #F4F1EA;
  --c-ember: #D9A66C;
  --c-vermilion: #B2483D;
  --c-seafoam: #7FA39A;
  --c-phosphor: #8FB3D4;
  --c-peat: #6B5B47;

  --d-fast: 0.18s;
  --d-base: 0.6s;
  --d-breath-in: 0.9s;
  --d-breath-out: 1.4s;
  --d-reveal: 1.6s;

  --e-breath-in: cubic-bezier(0.16, 1, 0.30, 1);
  --e-breath-out: cubic-bezier(0.70, 0, 0.84, 0);

  /* — SEMANTIC — */
  --surface-bg: var(--c-void);
  --surface-1: var(--c-ink);
  --surface-2: var(--c-umbra);
  --surface-3: var(--c-bone);
  --hairline:  var(--c-ash);
  --text-primary: var(--c-pearl);
  --text-secondary: var(--c-mist);
  --accent: var(--c-ember);
  --accent-reveal: var(--c-vermilion);
  --accent-mirror: var(--c-vermilion);

  /* — COMPONENT — */
  --beacon-border: rgba(244, 241, 234, 0.18);
  --beacon-pulse-color: var(--c-ember);
  --beacon-pad-x: var(--space-6);
  --beacon-pad-y: var(--space-3);

  --plate-bg: var(--surface-1);
  --plate-border: var(--hairline);
  --plate-radius: 2px;
  --plate-pad: var(--space-6);

  --pane-bg: rgba(17, 17, 20, 0.72);
  --pane-blur: 28px;
  --pane-saturate: 108%;
  --pane-brightness: 96%;
  --pane-border: rgba(244, 241, 234, 0.06);
}
```

### Reusable component structure

Every component in the system has the same anatomy:

```ts
// /components/<name>/index.tsx
export { Component } from './Component';
export type { ComponentProps } from './Component';

// /components/<name>/Component.tsx
//   the implementation. Receives only the props it needs.

// /components/<name>/tokens.css
//   component-layer tokens. Inherits from semantic.

// /components/<name>/Component.stories.tsx
//   one story per declension. All variants visible at once.

// /components/<name>/README.md
//   when to use this; when not to; the one anti-pattern.
```

Components are forbidden from importing from each other except through composition (e.g., `Plate` uses `Hairline`). No utility imports, no shared spaghetti.

### Core fourteen components (recap from `field.md`)

```
Hairline · Whisper · Display · Numeral · Beacon · Glyph
Plate · Tuner · Rail · Field3D · Ribbon · Sigil · Palette · Console
```

Plus the four card declensions (`Slab`, `Vellum`, `Pane`, `Aperture`, `Filament`) and the six button declensions (`WhisperLink`, `PlateAction`, `InlineCmd`, `StealthSubmit`) — all built on the fourteen primitives.

---

## 18. Premium UX Direction

Premium is not finish; finish is the consequence of premium. Premium is the *relationship* between the product and the person.

### The five attributes of a premium relationship

1. **It does not ask for attention.** A premium product is reached for, not pushed.
2. **It rewards return.** Each visit reveals something the last one did not — not by surprise mechanics, but by genuine accumulation.
3. **It does not perform.** No animations exist to demonstrate engineering. No copy exists to demonstrate cleverness.
4. **It admits limits.** "Still listening for this one." "I don't know." "Come back in a month." These admissions are signs of intelligence, not failure.
5. **It is worth keeping.** The user holds it the way they hold a journal. It accumulates value over time.

### The single-screenshot test

Pick any screen in the OS. Take a screenshot. Show it to a stranger with no context. Three things should be true:

- The stranger should not be able to immediately tell which app this is. (Brand restraint.)
- The stranger should be able to read the screen comfortably. (Information dignity.)
- The stranger should feel that something quiet is happening here. (Atmospheric voice.)

If any of those fail, the screen does not ship.

### The single-metric test

We track exactly one metric for design quality: **does the user keep a sentence from the OS somewhere private?** A wallpaper, a note, a journal, a tattoo. A sentence that was generated by the system about them, that they wanted to hold onto.

If that metric is true, the design system is correct. Engagement, retention, DAU, time-in-app — these are downstream consequences. The single metric is the cause.

---

## Closing

A design system is a set of opinions made portable. The opinions in this document are not preferences; they are commitments to a specific kind of relationship between a product and a person.

The relationship we are committing to is the one between a reader and a slow book, a meditator and a quiet room, a friend who listens before they speak.

If a designer reads this document and finds it constraining, that is the document working. If they find it freeing — because there are now fewer decisions to make and more attention available for the decisions that matter — that is the document working better.

Build slowly. Build quietly. Build like the user is sitting next to you and the room is dim.
