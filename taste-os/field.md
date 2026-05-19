# The Field — Taste OS Dashboard & Identity Interface

> A mirror is not a screen. A screen is a place a person looks *at*. A mirror is a place a person looks *through* — and sees themselves on the other side.

This document defines the main interface a person lives in after onboarding. It is not a dashboard in the analytics sense. There are no KPIs, no completion percentages, no streaks. It is a room with weather, a portrait that updates, and a small set of instruments for noticing.

The references are precise: the **restraint of Apple**, the **information dignity of Linear**, the **atmosphere of Cosmos**, the **modular precision of Teenage Engineering**, the **calm of sci-fi instruments** (the Solaris consoles, the Arrival heptapod board, the *Foundation* throne-room HUDs). Taste OS lives where these dispositions meet.

---

## Table of Contents

0. [The Metaphor — Mirror for the Soul](#0-the-metaphor--mirror-for-the-soul)
1. [Information Architecture — The Six Surfaces](#1-information-architecture--the-six-surfaces)
2. [Screen-by-Screen UI](#2-screen-by-screen-ui)
3. [Component System](#3-component-system)
4. [Layout Structure](#4-layout-structure)
5. [Motion Design](#5-motion-design)
6. [Interaction Design](#6-interaction-design)
7. [Responsive System](#7-responsive-system)
8. [Typography Direction](#8-typography-direction)
9. [Color System](#9-color-system)
10. [Closing](#10-closing)

---

## 0. The Metaphor — Mirror for the Soul

A mirror behaves three ways that an app rarely does, and all three are constitutive of the Field:

1. **It does not demand attention.** A mirror hangs there. You look when you want to.
2. **It shows what is already true.** It does not predict, recommend, or sell. It reflects evidence.
3. **It changes slowly.** A mirror's only difference between Tuesday and Wednesday is *you*.

Everything else in this document is a translation of those three behaviors into pixels.

What this rules out, on day one:

- Notifications, badges, red dots, counters.
- Daily logins, streaks, "you missed yesterday."
- Recommendation feeds that re-rank on dwell-time.
- Social affordances at the surface (no profiles, no follow, no public).
- Any screen that opens with a CTA.

What it permits:

- Slow, infrequent, generous arrivals (a new Mirror sentence, a new current detected).
- Instruments — small, labeled, intentional.
- Stillness as a default state.

---

## 1. Information Architecture — The Six Surfaces

The OS has **six surfaces**, named in single words, never plural. They map symmetrically to the six axes of the L3 Constitution layer described in the Genome doc.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   ·  FIELD       — the room you arrive in                      │
│   ·  GENOME      — the long portrait                           │
│   ·  DRIFT       — how you are moving                          │
│   ·  ATMOSPHERE  — what is being brought to your door today    │
│   ·  UNIVERSE    — the graph of everything you've offered      │
│   ·  MIRROR      — one sentence, kept                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Navigation: The Tuner

Navigation is a **vertical hairline rail** on the left edge of the viewport, 56px wide, containing six small dots — one per surface. Inactive dots are 4px, set in `ash`. The active dot is 6px, set in the surface's accent. There are no icons and no labels. A label appears only on focus or hover, in `mist`, set in a fine sans, 12px, with letter-spacing tracked out.

The Tuner is named for, and looks like, the fine selector dial on a Teenage Engineering OP-1. The hierarchy is *physical-feeling*: six clean detents, no animation flourish, the satisfaction of a switch that *clicks*.

Keyboard: `1`–`6` jumps surfaces. `⌘K` opens the command palette (Linear-style; covered in §6). `esc` returns to Field.

### Why six and not five or seven

Six fits the L3 axes (Stillness, Warmth, Density, Tempo, Saturation, Distance). It is also the most common count in calm instrument design — six knobs, six channels, six strings — because it gives meaningful range without overwhelming the eye. Five felt thin; seven felt cluttered. We are not making a Swiss Army knife.

---

## 2. Screen-by-Screen UI

Each surface is described with anatomy, copy, and the single instrument that distinguishes it. ASCII wireframes for each are at 96 cols × 28 rows.

### 2.1 — FIELD

> *The room you arrive in.*

**Anatomy.** A vertically generous single-column page. Top zone: a quiet *Today's Weather* card. Middle zone: the *Right Now* strip (the L1 / Impression layer, what you've returned to this week). Lower zone: a *Quiet Brought to You* row — three items from Atmosphere, no more. The Field never paginates. There is no "see more."

**The instrument.** A single ambient sentence at the top, regenerated daily from L1, written in second person, set in display serif at 36–44px. This is the *Today Line*. It is the Field's only loud element.

**Copy.**
> Tuesday, just past four. *A north-facing afternoon.* You've returned three times this week to images that feel like the moment after a room has emptied.

**Behavior.**
- Time-of-day in the corner, set in JetBrains Mono Light, 11px.
- The Today Line crossfades over 1.4s when it changes, never refreshes harshly.
- The Right Now strip is six small tiles of *your own* recent saves — your reflection, not algorithmic recommendation.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ·                                                                              tue · 16 : 12 │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·          Tuesday, just past four. A north-facing afternoon. You've returned                │
│ ·          three times this week to images that feel like the moment after                   │
│ ·          a room has emptied.                                                               │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·          ─ right now                                                                       │
│ ·                                                                                            │
│ ·          ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                                    │
│ ·          │    │  │    │  │    │  │    │  │    │  │    │                                    │
│ ·          └────┘  └────┘  └────┘  └────┘  └────┘  └────┘                                    │
│ ·                                                                                            │
│ ·          ─ quiet brought to you                                                            │
│ ·                                                                                            │
│ ·          ┌────────────────┐    ┌────────────────┐    ┌────────────────┐                    │
│ ·          │                │    │                │    │                │                    │
│ ·          │                │    │                │    │                │                    │
│ ·          └────────────────┘    └────────────────┘    └────────────────┘                    │
│ ·            a film               a track             a passage                              │
│ ·                                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 — GENOME

> *The long portrait.*

**Anatomy.** A single long-scroll document, framed as a museum placard. Maximum content width is 640px even on ultra-wide screens. Sections, in order:

1. **Taste Name** — two words, display serif at 96–120px, kerned wide.
2. **The Portrait** — the 250–400 word cinematic prose report.
3. **Currents** — 2–4 named currents with their strength and stability.
4. **Atmosphere** — the 8 profilings (dominant hour, climate, material, light, sound floor, pace, scale, weather).
5. **The Six Axes** — the L2 dimensions shown most strongly (pole names + faint bars; no numbers).
6. **Palette** — 5 swatches, named.
7. **Kin** — 6 names (artist, director, architect, composer, writer, one wildcard).
8. **Resonances** — the 2–3 philosophical schools with their friction lines.
9. **The Mirror Line** — the single sentence, italic, alone on its own card.

**The instrument.** A small `·` glyph in the upper-right opens *Provenance* — a small drawer that names which piece of evidence contributed most strongly to each section. Tasteful, technical, optional.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ·                                                                              · provenance  │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                  L a c q u e r e d                                         │
│ ·                                      D u s k                                               │
│ ·                                                                                            │
│ ·                                  ─────────────                                             │
│ ·                                                                                            │
│ ·          It is late afternoon in the report you've written without meaning to.             │
│ ·          North-facing light, the kind that flatters wood and forgives skin.                │
│ ·          The rooms you save have one window each. The music you save has                   │
│ ·          one voice each. Even your quotes — there are three of them, and                   │
│ ·          all three are about leaving.                                                      │
│ ·                                                                                            │
│ ·          ─ currents                                                                        │
│ ·                                                                                            │
│ ·          Lacquered Dusk          steady — 14 weeks                                         │
│ ·          Northern Linen          steady — 9 weeks                                          │
│ ·          Cedar Mathematician     newly forming                                             │
│ ·                                                                                            │
│ ·          ─ atmosphere                                                                      │
│ ·                                                                                            │
│ ·          hour         15:40 – 17:20            material   oak · linen · brass              │
│ ·          climate      dry-cool, alpine-coastal light      single, north, 3200K             │
│ ·          pace         adagio                   scale      human, single-room               │
│ ·                                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 — DRIFT

> *How you are moving.*

**Anatomy.** Three views, switched by a horizontal tuner at the top: **Trail** (2D UMAP of L2 position over time), **Axes** (small multiples of all 14 axes as hairline curves), **Currents** (stacked area of named currents).

**The instrument.** On every view, the L3 Constitution renders as a still anchor — a faint hairline cross — that does not move when the L2 trail does. This is the most affecting object in the entire OS. Watching one's own orbit around one's own constant is, in user tests, the moment the product earns its name.

**Copy at top of Trail view.**
> You haven't moved much. The same room, with the light slowly turning.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ·          [ trail ]   axes   currents                                                       │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                                ·                                           │
│ ·                                          · · · ·                                           │
│ ·                                      · ·   ·                                               │
│ ·                                  · ·    ─ ─┼─ ─                                            │
│ ·                                ·         · │ ·                                             │
│ ·                              ·             · ·  ·                                          │
│ ·                                                  · · ·                                     │
│ ·                                                       · ·                                  │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·          ┌─────────────────────────────────────────────────────────────────────┐           │
│ ·          │  · 14 weeks               anchor                                    │           │
│ ·          │    a turn toward warmer light, around week 9.                       │           │
│ ·          └─────────────────────────────────────────────────────────────────────┘           │
│ ·                                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 — ATMOSPHERE

> *What is being brought to your door today.*

**Anatomy.** A vertical, slow-scroll feed of 5–9 curated items per day. The feed is **finite** — when you reach the bottom, you reach the bottom. *"Tomorrow, more."* No infinite scroll, ever.

Each card is a single piece of curated kin: a film still + sentence, a track + waveform, a passage + provenance, a photograph + place, a building + architect, a poem + year.

**The instrument.** Beneath each card, a small whispered explanation: *"This is here because your **Lacquered Dusk** has been quiet this week, and this is a quiet version of it."* No card appears without a reason; the reason cites the user's own Genome, never aggregated data from other users.

**Interactions.** Two affordances under each card: *Tend* (keep, fold into the Universe), *Pass* (acknowledge, do not record dislike — we never train on negatives). No swiping. No fast iteration.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ·                                                                              ·  5 of 7     │
│ ·                                                                                            │
│ ·          ┌────────────────────────────────────────────────────────────────┐                │
│ ·          │                                                                │                │
│ ·          │                                                                │                │
│ ·          │                       (a still from Stalker)                   │                │
│ ·          │                                                                │                │
│ ·          │                                                                │                │
│ ·          └────────────────────────────────────────────────────────────────┘                │
│ ·                                                                                            │
│ ·          Stalker · Tarkovsky · 1979                                                        │
│ ·                                                                                            │
│ ·          A film about three men walking toward a room that grants wishes.                  │
│ ·          They never arrive.                                                                │
│ ·                                                                                            │
│ ·          Here because your Lacquered Dusk has been quiet this week,                        │
│ ·          and this is a quiet version of it.                                                │
│ ·                                                                                            │
│ ·          ─ tend         ─ pass                                                             │
│ ·                                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 — UNIVERSE

> *The graph of everything you've offered.*

**Anatomy.** A large slow-rotating 3D field rendered with react-three-fiber. Nodes are the user's saves — every image, sound, quote, space, atmosphere card you've tended. Edges are similarity (cosine) above a threshold. Clusters are named with the user's currents. Far in the distance, faintly, twelve dim stars represent the philosophical schools — they don't move, ever.

**The instrument.** Pinch / scroll zooms continuously from a constellation view (the whole Universe) down to a single piece of evidence (one image, full-bleed, with its full provenance: when you saved it, why the system thinks it matters, which current it strengthens).

**Copy at low zoom.**
> 412 things. Three weathers.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ·                                                                              412 things    │
│ ·                                                                              3 weathers    │
│ ·                                                                                            │
│ ·                              ·                          ·                                  │
│ ·                          ·  · ·  ·                  ·     ·                                │
│ ·                       ·    · · ·   ·             ·   · · ·  ·                              │
│ ·                        ·  · · · · ·             ·  · · · · · ·                             │
│ ·                       ·    · · ·   ·             ·   · · ·                                 │
│ ·                          ·  · ·  ·                  ·     ·                                │
│ ·                              ·                          ·                                  │
│ ·                            (lacquered dusk)        (northern linen)                        │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                       ·                                                    │
│ ·                                    ·  · ·                                                  │
│ ·                                  ·   · · ·                                                 │
│ ·                                    ·  · ·                                                  │
│ ·                                       ·                                                    │
│ ·                                (cedar mathematician)                                       │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·          ─ scroll to zoom · drag to rotate · click any point to open                       │
│ ·                                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.6 — MIRROR

> *One sentence, kept.*

**Anatomy.** Black field, full-bleed. One sentence at center, large display serif, italic, ~52–64px. Below the sentence, three things, very faintly: the date the Mirror was set, the six L3 axes as pole names (not numbers, not bars), and one small action: *ask the mirror*.

**The instrument.** *Ask the Mirror* is the only conversational surface in the OS. You can type one question. The system answers in **one sentence**, in the same voice as the Mirror itself, with the same falsifiability constraint. It refuses to flatter, refuses to predict the future, and explicitly says *I don't know* when it doesn't. Most questions get one sentence; some get silence.

**Copy.**
> *You don't collect beauty — you collect evidence that the world has been gentle to someone, once.*
>
> *set 14 weeks ago · still true*
>
> stillness · warmth · density · tempo · saturation · distance
>
> ─ ask the mirror ─

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·          You don't collect beauty — you collect evidence that the                          │
│ ·          world has been gentle to someone, once.                                           │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                  set 14 weeks ago · still true                             │
│ ·                                                                                            │
│ ·                       stillness · warmth · density · tempo · saturation · distance         │
│ ·                                                                                            │
│ ·                                                                                            │
│ ·                                       ─ ask the mirror ─                                   │
│ ·                                                                                            │
│ ·                                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component System

The system is small on purpose. The Field is built from **fourteen primitive components**, the same count as the L2 axes — a coincidence we kept.

| # | Component | Purpose |
|---|---|---|
| 01 | `Hairline` | 1px divider in `ash`. Replaces 80% of conventional UI boxes. |
| 02 | `Whisper` | Body text primitive — humanist sans, tracked, mist color. Enters with breath. |
| 03 | `Display` | Headline primitive — display serif, kerned wide, italics permitted. |
| 04 | `Numeral` | Monospaced number primitive — JetBrains Mono Light, 11–13px, used only for metadata (timestamps, indices, axis values when shown). |
| 05 | `Beacon` | The pulse-only CTA. Hairline border, no fill, slow sinusoidal pulse at 0.6Hz. |
| 06 | `Glyph` | The minimal non-letter mark — `·`, `─`, `⊕`, `◌`. Used where most apps would use an icon. |
| 07 | `Plate` | A surface with `ink` background and 1px hairline border. Holds Atmosphere cards, Provenance entries, Drift annotations. |
| 08 | `Tuner` | A horizontal row of dot detents — used for the Drift view switcher and a few inline controls. |
| 09 | `Rail` | The vertical left navigation. Six dots. Six surfaces. |
| 10 | `Field3D` | The R3F canvas primitive — used in Universe and (degraded) in Drift's Trail. |
| 11 | `Ribbon` | Faint indicator bar for axis strengths. Never numerical. Color is the surface accent. |
| 12 | `Sigil` | The single ensō mark. Appears in Mirror and in the OS's quiet loading state. |
| 13 | `Palette` | The 5-swatch row, named. Used in Genome and as inline citation in Atmosphere. |
| 14 | `Console` | The command palette, opened with `⌘K`. Linear-grade information density, Cosmos-grade restraint. |

### Component example — `Whisper`

```tsx
type WhisperProps = {
  as?: 'p' | 'span' | 'figcaption';
  tone?: 'pearl' | 'mist' | 'ash';
  size?: 'xs' | 'sm' | 'md' | 'lg'; // 11 / 13 / 15 / 18
  enter?: 'breath' | 'reveal' | 'none';
  children: ReactNode;
};
```

Every component has only the props it needs to behave with discipline. No `variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive'`. We do not have a `destructive` variant. Nothing in the Field is destructive.

### Component example — `Beacon`

```tsx
// the only CTA primitive in the system
<Beacon onPress={…}>begin</Beacon>
```

Renders as: hairline border, ember-on-hover, sinusoidal pulse, lowercase, single dash on either side (`─ begin ─`) for the rarest few CTAs.

---

## 4. Layout Structure

### The Stage

Every surface is constructed on a shared **Stage**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Rail (56px) │                Stage (max 1280px centered)                   │
│             │                                                              │
│             │      ┌──────────────────────────────────────────────┐       │
│             │      │ Top margin (160px desktop · 96px mobile)     │       │
│             │      │                                              │       │
│             │      │            Content column (max 640px         │       │
│             │      │            for text-led surfaces,            │       │
│             │      │            max 1080px for visual ones)       │       │
│             │      │                                              │       │
│             │      │ Bottom margin (matches top)                  │       │
│             │      └──────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────────────────────────┘
```

- The Stage is never edge-to-edge. There is always margin. Margin is dignity.
- Vertical rhythm is governed by a Fibonacci-adjacent step system: `8, 12, 20, 32, 56, 96, 160, 280`. The system never uses 16, 24, or 64.
- Maximum content width for prose is locked at 640px even on a 6K display. We accept the empty space.

### Grid

A **12-column grid** with 32px gutters, but most surfaces only use 4 of those columns. The grid exists to be ignored most of the time and adhered to in the rare moments it matters (the Atmosphere card row, the Genome's atmosphere readouts).

### Z-axis

There are only **three z-planes**:

1. **Background** — `void`. The room itself.
2. **Surface** — `ink`. Cards, plates, drawers.
3. **Light** — accent + glow. Used sparingly; the active Rail dot, the Beacon, the Mirror sentence.

We do not use shadows. Depth is communicated by light temperature, not by drop-shadow. (We will use a single `box-shadow` exactly once, on the Universe pop-out, and it is a *long-throw warm* shadow — `0 24px 80px -24px rgba(217,166,108,0.18)` — not a drop shadow.)

---

## 5. Motion Design

The animation system continues the **Breath** language established in the onboarding doc. The Field uses the same tokens, in a more domestic register — the user is now living in the room, not entering it. Motion becomes habitual rather than ceremonial.

### Surface-level motion principles

1. **Cuts are crossfades, never wipes.** When the Tuner changes surface, the outgoing surface exhales for 1.4s while the incoming surface inhales for 0.9s with a 600ms overlap. The seam is felt, not seen.
2. **Hover is a 2px lift and a +120K warm shift.** Never a scale. Never a translate-Y by more than 2px.
3. **Selection is a deepening, not a checkmark.** Selected items gain ~6% saturation and a 1px inner glow.
4. **Drift's Trail animates the last 14 days into position on each load.** The trail "writes itself" in 1.8s from oldest to newest, then the constellation rotates 4° over 12s and stops. It does not loop.
5. **The Mirror sentence enters with the reveal blur** (blur-12 → blur-0 over 1.6s, letter-spacing +120 → +30). It is the only place in the Field this animation appears, and it appears exactly once per visit.
6. **Universe rotation is slow.** 0.06 rad/s around Y by default — it takes about 100 seconds for a full revolution. Pause on hover.

### Motion tokens

```ts
export const fieldMotion = {
  breath: {
    in:   { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    out:  { duration: 1.4, ease: [0.7, 0, 0.84, 0] },
    cross: { overlap: 0.6 },
  },
  hover:   { duration: 0.18, ease: 'easeOut', lift: 2, warmShiftKelvin: 120 },
  select:  { duration: 0.32, ease: 'easeOut', saturationDelta: 0.06, innerGlow: '0 0 0 1px rgba(217,166,108,0.18)' },
  reveal:  { duration: 1.6, filter: ['blur(12px)', 'blur(0)'], letterSpacing: ['0.12em', '0.03em'] },
  drift:   { writeIn: 1.8, settle: 0.4, idleRotateDegPerSec: 0.34 },
  universe:{ rotateRadPerSec: 0.06, dampingOnHover: 0 },
};
```

### Reduced motion

`prefers-reduced-motion: reduce` collapses crossfades to a 200ms opacity transition and disables Universe rotation entirely. The Drift trail simply *appears* with a 600ms fade rather than writing itself. The system does not communicate animation reduction as a downgrade — the reduced experience is its own valid mode and is designed with equal care.

---

## 6. Interaction Design

### Six principles

1. **Quiet by default.** A surface should be readable with no interaction. Hover, drag, and click are extensions of attention, not requirements of it.
2. **One affordance per gesture.** Click does one thing per surface. Drag does one thing per surface. We never overload.
3. **Keyboard parity.** Every action is reachable in two keystrokes from anywhere. The Tuner responds to `1`–`6`; surfaces use single-letter mnemonics (`t` to tend, `p` to pass, `a` to ask the mirror).
4. **Latency is intentional.** When the system has computed something interesting (a new current detected, a Mirror change available), the Field does **not** surface it immediately. It surfaces it the next time the user arrives, and only on Field — never via push, never via badge.
5. **Reversibility is sacred.** Every save has a 7-second window during which a single keystroke (`⌘Z`) takes it back, without notification, without confirmation.
6. **Confirmation is for nothing.** No dialog ever asks "are you sure?" The system either trusts the action and offers undo, or it does not allow the action.

### The Console — `⌘K`

A Linear-grade command palette, drawn with Cosmos's restraint. Opens with `⌘K`. Fuzzy-searches the user's entire Universe, plus all surface actions, plus a small set of *introspective queries* — meta-commands the system can answer in one sentence:

- `what current am i in this week`
- `show me what's missing`
- `read me the line again`
- `what have i passed on recently`
- `take me to last summer`

Each introspective query is a deterministic small-prompt to the system, returning a one-sentence answer in the Mirror voice, with the option to expand into the relevant surface.

**Console layout.**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  search the universe, or ask…                                                  │
│  ──────────────────────────────────────────────────────────────────────────    │
│  · jump to drift                                              [1]              │
│  · jump to universe                                           [5]              │
│  · ask the mirror                                             [m]              │
│  · what current am i in this week                                              │
│  · show me what's missing                                                      │
│  · take me to last summer                                                      │
│  ──────────────────────────────────────────────────────────────────────────    │
│   42 things matching "linen"                                                   │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Save & Tend

**Tend** is the single saving verb. It is used in Atmosphere, Universe, and on any item in the user's own gallery. It carries no metric, no like-count, no public visibility. It only adjusts the L1 layer's evidence weights and the Universe's edges.

**Pass** acknowledges an Atmosphere item without recording it as a dislike. The system does not learn from negatives — only from positives. If a user passes on twenty things in a row, the *Quiet Brought to You* row will gently say: *"We're going to be quieter for a few days. We were getting it wrong."* — and the daily delivery thins for a week.

### Drag

Dragging exists in exactly two places:

- **Universe** — drag to rotate the field.
- **Atmosphere** — drag a card upward to *Tend*, downward to *Pass*. This is the only gestural shortcut in the OS, and it animates with the *Settle physics* (overshoot 2%, return over 1.2s) familiar from onboarding.

There is no swipe, no swipe-to-delete, no swipe-to-reply, no swipe-anywhere-else.

---

## 7. Responsive System

### Three rooms, not three breakpoints

The Field is designed as **three rooms** rather than three breakpoints. Each room has its own posture.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ROOM 1 · POCKET    (< 600px)                                        │
│     phone, one-handed, often standing                                │
│     posture: glance, then put away                                   │
│                                                                      │
│  ROOM 2 · DESK      (600 – 1280px)                                   │
│     laptop, tablet in landscape                                      │
│     posture: lean forward, but not for long                          │
│                                                                      │
│  ROOM 3 · STUDIO    (≥ 1280px)                                       │
│     external display, the room with the good light                   │
│     posture: lean back, breathe, browse Universe                     │
└──────────────────────────────────────────────────────────────────────┘
```

### Pocket adaptations

- The Rail collapses to a **bottom-edge horizontal Tuner**, 48px high, six dots, same hairline grammar.
- The Field's Today Line drops to 28–32px. The *Right Now* strip becomes 3 tiles instead of 6, scrollable horizontally with no scroll-affordance.
- Drift's small multiples render only the **six strongest axes**, never 14.
- Universe degrades to a 2D constellation view (no rotation) on devices that score below the WebGL benchmark threshold.
- The Mirror remains identical at every size. It is the constant.

### Desk adaptations

- The full Rail is present at left.
- Atmosphere reduces from 9 cards to 6.
- Genome's atmosphere readouts move from 4-column to 2-column.
- The Console (`⌘K`) is a 600 × 480 floating panel centered on screen, with the rest of the Field at 30% opacity behind.

### Studio adaptations

- The Stage caps at 1280px even on a 6K display. The surrounding margin is *not* filled with chrome. It is left dark. This is the most-questioned design decision and the one we are most certain of.
- Universe renders at full 3D, slow rotation, 60fps target on M-series.
- Drift renders all 14 axes as small multiples in a 7×2 grid.

### Touch vs cursor

- All hover states have an explicit *focus* equivalent triggered on touch-tap (single-tap reveals, double-tap acts). We do not rely on hover as the only path to information.
- Drag thresholds are 12px on touch, 6px on cursor — touch is forgiven generously.

---

## 8. Typography Direction

### The three voices

| Role | Family | Weight | Use |
|---|---|---|---|
| **Display** | GT Sectra / Tiempos Headline / Söhne Breit (final TBD) | 300–400 | Taste Name, Today Line, Mirror sentence, section labels |
| **Body** | Söhne / Suisse Int'l / Inter Display (final TBD) | 350–450 | All prose, all UI labels, all explanatory copy |
| **Numeral** | JetBrains Mono Light | 300 | Timestamps, indices, axis readouts, code-like provenance |

We pick three families total. We will never add a fourth, even on a Black Friday.

### Type scale

```
display   xl  120 / 100 · -0.02em
display   lg   72 /  72 · -0.01em
display   md   52 /  60 ·  0
display   sm   36 /  44 ·  0
body      lg   18 /  30 · +0.005em
body      md   15 /  26 · +0.01em
body      sm   13 /  22 · +0.02em
body      xs   11 /  18 · +0.04em
numeral   md   13 /  16 · +0.06em
numeral   sm   11 /  14 · +0.08em
```

### Typographic rules

- **Sentence case everywhere.** No ALL-CAPS. No Title Case. The OS speaks as a person speaks.
- **Italic is reserved.** Used for the Mirror line, for one evidence citation per paragraph in the Portrait, and nowhere else.
- **No bold within prose.** Emphasis is achieved by line, by italic, by silence. If a word *must* be emphasized, place it on its own line.
- **Hyphens are em-dashes when they pause, en-dashes when they range.** This matters more than it sounds — typography is tone.
- **Numbers are always tabular** (`font-variant-numeric: tabular-nums`). The eye must be able to compare them at a glance.
- **Default text color is `pearl`, never `#FFFFFF`.** A pure white text on a true black ground is a printing accident, not a design.

---

## 9. Color System

### Palette tokens

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| `void` | `#0A0A0B` | `oklch(13% 0.002 286)` | Primary background. The room. |
| `ink` | `#111114` | `oklch(17% 0.003 286)` | Surface 1. Plates, drawers. |
| `umbra` | `#1A1A1E` | `oklch(22% 0.004 286)` | Surface 2. Modals, the Console behind. |
| `pearl` | `#F4F1EA` | `oklch(95% 0.012 88)` | Primary text. Never `#FFFFFF`. |
| `mist` | `#A8A29E` | `oklch(70% 0.006 60)` | Secondary text. |
| `ash` | `#3A3A3D` | `oklch(33% 0.003 286)` | Hairlines, dividers. |
| `ember` | `#D9A66C` | `oklch(76% 0.090 70)` | Primary accent (Aesop amber). |
| `vermilion` | `#B2483D` | `oklch(50% 0.150 30)` | Reserved — Genome reveal. |
| `seafoam` | `#7FA39A` | `oklch(67% 0.038 175)` | Reserved — Mirror moments. |
| `phosphor` | `#8FB3D4` | `oklch(74% 0.060 240)` | Reserved — Drift annotations. |

### The Six Surface Tints

Each of the six surfaces has a faint accent tint, used **only** on the Rail dot when that surface is active, and as a 0.6% gradient on the surface's background. The user should not consciously notice these — they should feel each surface having a slightly different "temperature."

| Surface | Tint | Temperature feeling |
|---|---|---|
| Field | none (pure void) | room temperature |
| Genome | `ember` at 6% | warm afternoon |
| Drift | `phosphor` at 4% | cool dawn |
| Atmosphere | `pearl` at 3% | natural overcast |
| Universe | `seafoam` at 5% | deep water |
| Mirror | `vermilion` at 2% | still flame |

### Rules

1. **Only one full-strength accent on screen at a time.** All others are at ≤6%.
2. **No gradients in UI chrome.** Gradients exist only on the 0.6% surface tints (which are imperceptible per pixel and felt across the whole field) and on photograph treatments (a 12% void→transparent gradient at the bottom of each Atmosphere card for legibility).
3. **Color contrast.** `pearl/void` exceeds WCAG AAA (21:1). `mist/void` sits at WCAG AA (7.2:1) — used only for non-essential metadata.
4. **No semantic color.** No success-green, no error-red, no warning-yellow. The Field has nothing to warn about and nothing to celebrate.
5. **Photographs are unaltered.** Saturation, contrast, and color in user-uploaded and curated images are never adjusted by the OS. Reality stays reality.

### Dark mode is the only mode (in this version)

A light mode is technically possible — and beautifully so, with `pearl` as background and `void` as text — but we have decided that a light mode at launch dilutes the OS's atmospheric identity. A light mode will arrive in a later season, named (probably) **Linen**. Until then, dark is the only mode, and the system says so honestly in settings: *"Linen mode is being prepared. It will arrive when it's ready."*

---

## 10. Closing

A dashboard tells you how your business is doing. A feed tells you what is new. A mirror tells you *who you are*.

The Field is not a screen full of information about a person. It is a room a person enters at the end of the day, with the lights warm and the door closed and the room itself somehow more like them than it was yesterday — because they have been living in it, and because the room has been paying attention.

If a user closes the laptop, walks to the window, and stands there for a moment with their hand on the glass — we have built the right thing.
