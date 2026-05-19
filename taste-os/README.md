# Taste OS — Onboarding & Taste Analysis Design

> An identity operating system for discovering and evolving personal taste, emotional patterns, aesthetic identity, and inner philosophy.

This document defines the onboarding experience for Taste OS. It is not a feature spec — it is the choreography of a first encounter. The goal is not to register a user; it is to make a stranger feel **seen**.

The references are intentional: the precision of **Apple**, the cosmic stillness of **Cosmos**, the curatorial restraint of **Are.na**, the calm geometry of **Notion**, the visual gravity of **Pinterest**, the material honesty of **MUJI**, the apothecary warmth of **Aesop**. Taste OS lives where these dispositions meet.

---

## Table of Contents

1. [Onboarding UX Flow](#1-onboarding-ux-flow)
2. [Screen-by-Screen Breakdown](#2-screen-by-screen-breakdown)
3. [UI Direction](#3-ui-direction)
4. [Animation Concepts](#4-animation-concepts)
5. [Emotional Interaction Design](#5-emotional-interaction-design)
6. [Onboarding Wireframe Concepts](#6-onboarding-wireframe-concepts)
7. [Visual Language System](#7-visual-language-system)
8. [Onboarding Copywriting](#8-onboarding-copywriting)
9. [Implementation Architecture](#9-implementation-architecture)

---

## 1. Onboarding UX Flow

### Design principles

- **One thought per screen.** Never two. The user is composing a self, not filling a form.
- **No progress bar.** A bar implies a finish line. We replace it with an ambient constellation that grows — progress as expansion, not depletion.
- **No skip buttons until later.** Skipping must feel like a deliberate confession ("Not yet"), never a CTA.
- **No streaks, badges, points, or notifications.** Anti-dopamine by construction.
- **Latency is part of the design.** Where the AI thinks, we let it think — and we make the thinking beautiful.

### High-level flow (12 acts)

```
ACT I  — ARRIVAL
  01. Threshold        (dark void → soft breath of light)
  02. Invocation       (one line: "Let's listen to your taste.")
  03. Naming           (first name only; the only required text input)

ACT II — OFFERINGS  (the user gives the system five gifts)
  04. Images           (upload 9–24 favorite images)
  05. Sound            (upload or link 3–10 tracks)
  06. Words            (3–7 quotes that have stayed with you)
  07. Spaces           (select from curated atmospheric photographs)
  08. Feeling          (5 emotional-preference questions, slider-based)

ACT III — LISTENING  (the AI synthesizes; the user witnesses)
  09. Constellation forming   (live generative visual; ~25–40s)
  10. The Reveal              (Taste Genome card, scrollable)

ACT IV — ENCOUNTER
  11. Mirror moment           (one sentence written to the user)
  12. Entry                   (door into the OS — never called "Home")
```

### Flow diagram

```
                ┌──────────────────────────────────────┐
                │   ACT I · ARRIVAL                    │
                │   threshold → invocation → name      │
                └──────────────────┬───────────────────┘
                                   │
                ┌──────────────────▼───────────────────┐
                │   ACT II · OFFERINGS                 │
                │                                      │
                │   images ─┐                          │
                │   sound  ─┼─► local taste vectors    │
                │   words  ─┤    (CLIP / audio / text  │
                │   spaces ─┤     embeddings)          │
                │   feeling ┘                          │
                └──────────────────┬───────────────────┘
                                   │
                ┌──────────────────▼───────────────────┐
                │   ACT III · LISTENING                │
                │   live constellation while           │
                │   embeddings cluster → archetypes    │
                └──────────────────┬───────────────────┘
                                   │
                ┌──────────────────▼───────────────────┐
                │   ACT IV · ENCOUNTER                 │
                │   Taste Genome + Mirror sentence     │
                │   → Entry into Taste OS              │
                └──────────────────────────────────────┘
```

### Time budget

Designed for roughly **8–11 minutes**, the length of a short film. Long enough to feel like a ritual; short enough to finish in one sitting.

| Act | Time | Cognitive register |
|-----|------|--------------------|
| Arrival | 30s | Stillness |
| Offerings | 6–8 min | Curation |
| Listening | 40s | Surrender |
| Encounter | 1–2 min | Recognition |

---

## 2. Screen-by-Screen Breakdown

Every screen has the same anatomy: **vast negative space**, one center of gravity, one whisper of text, one interaction. Nothing competes.

### 01 · Threshold

- **Composition.** Full-bleed black (`#0A0A0B`). At dead center, a single 6px circle of warm ivory light pulses at 0.6Hz — the breath of a sleeping star.
- **Interaction.** Tap anywhere, or press space.
- **Copy.** *(no text on first beat; after 4s, fade in)* "Take a breath."
- **Transition out.** The dot expands radially into a soft luminous mist, then dissolves into the next screen.

### 02 · Invocation

- **Composition.** Centered serif sentence, kerned wide, rendered with subtle film grain.
- **Copy.** "Let's listen to your taste."
- **Interaction.** "Begin" appears after the sentence has been still for 2.5s. Single soft button, hairline border.

### 03 · Naming

- **Composition.** A single underscored input on a horizon line that splits the screen 1:1.61 (golden).
- **Copy above.** "Before we begin — what should we call you?"
- **Copy below.** *(after typing)* "Hello, ____. Welcome to the quiet part of the internet."

### 04 · Images (Offering I)

- **Composition.** A loose, hand-arranged scatter. Drop zone is the entire viewport — no dashed rectangles, no upload chrome. As images land, they settle into a soft masonry on a 12-column grid with non-uniform row heights.
- **Affordance.** A small "+" sigil in the lower-right. Drag, click, or paste anywhere.
- **Copy.** "Show us what your eye keeps returning to. Nine to twenty-four images. No need to explain them."
- **Behavior.** Each upload triggers a faint chime (optional, off by default). When the user reaches 9, a single sentence appears beneath: *"Enough to begin. More if you'd like."*

### 05 · Sound (Offering II)

- **Composition.** A horizontal "shelf" of placeholder vinyl-disc circles, each 80px. Drop audio files or paste Spotify/Apple Music/SoundCloud links. As tracks load, the disc rotates slowly and shows the waveform along its circumference.
- **Copy.** "What does your inner world sound like? Three to ten tracks."
- **Detail.** Hovering a disc plays a 6-second preview at -12dB. The preview never auto-plays.

### 06 · Words (Offering III)

- **Composition.** A vertical stack of three blank "page" cards, each looking like aged paper at 4% opacity over the void. Click a card to write.
- **Copy.** "A line from a book, a film, a person, a thought. Anything that has stayed."
- **Detail.** While typing, the cursor leaves a faint phosphor trail that decays in 800ms — like writing on warm glass.

### 07 · Spaces (Offering IV)

- **Composition.** A 3×3 grid of full-bleed atmospheric photographs (Kyoto temple at dusk, Icelandic moss field, a Donald Judd interior, a Lisbon balcony at 5pm, a snowed forest, a Tokyo alley with vending machines, a marble bath, a desert at blue hour, a library reading room). User taps to mark as resonant.
- **Copy.** "Choose the rooms your mind already lives in."
- **Detail.** Selected images don't get a checkmark — they *deepen*, gaining saturation and a 2px inner glow, like a memory being recognized.

### 08 · Feeling (Offering V)

Five questions, one per screen, presented as continuous sliders between two opposing poetic poles. The slider is a horizon line with a single luminous point the user drags.

| # | Left pole | Right pole |
|---|-----------|-----------|
| 1 | Solitude | Communion |
| 2 | Wabi-sabi | Pristine geometry |
| 3 | Memory | Anticipation |
| 4 | Silence | Resonance |
| 5 | Earth | Atmosphere |

- **Copy at top.** "There are no right answers. Drift toward the truer side."
- **Detail.** The position is logged not as a discrete value but as a float `0.000–1.000`, with the time-to-rest also captured (hesitation is signal).

### 09 · Constellation Forming

- **Composition.** The five offerings appear as five clusters of points in a 3D field. Lines tentatively reach between them, then settle into a structure. This is rendered with WebGL.
- **Copy.** Three sentences appear in sequence, each held for ~8 seconds:
  1. *"Reading the light in your images…"*
  2. *"Listening for the temperature of your sound…"*
  3. *"Finding the through-line."*
- **Latency design.** If the model finishes early, we hold the visual until the third sentence completes. The wait *is* the magic; we never short-change it.

### 10 · The Reveal — Taste Genome

A long-scroll card, framed like a museum placard. Sections:

1. **Your Taste Name** — a two-word phrase generated specifically for this user (e.g. *"Lacquered Dusk"*, *"Northern Linen"*, *"Quiet Vermilion"*).
2. **Emotional Identity Profile** — a short paragraph in second person, plus a radar across six axes (Stillness, Warmth, Density, Tempo, Saturation, Distance).
3. **Aesthetic Archetypes** — 2–3 archetypes (e.g. *Wanderer-Monk*, *Velvet Cartographer*, *Salt-Air Modernist*), each with one line of definition.
4. **Atmosphere Analysis** — palette swatches, dominant material (linen, oak, brass, basalt…), dominant hour (predawn, golden, blue, midnight), dominant climate (alpine, coastal, monsoon, arid).
5. **Artistic DNA** — six adjacent artists/directors/architects/writers — not as recommendations, as *kin*.

### 11 · Mirror Moment

- **Composition.** Black field. One sentence, large serif, generated for this user from the full corpus of their offerings.
- **Example.** *"You don't collect beauty — you collect evidence that the world has been gentle to someone, once."*
- **Interaction.** A single "Keep this" affordance saves the sentence to the Genome. No share button. Nothing is built to be performed.

### 12 · Entry

- **Composition.** A door — rendered as a tall vertical rectangle of warm light against the dark — opens by parallax as the user moves their cursor.
- **Copy.** "Come in. The OS has been waiting for someone like you."

---

## 3. UI Direction

### Palette

| Token | Hex | Use |
|-------|-----|-----|
| `void` | `#0A0A0B` | Primary background |
| `ink` | `#111114` | Surface 1 |
| `pearl` | `#F4F1EA` | Primary text — never pure white |
| `mist` | `#A8A29E` | Secondary text |
| `ash` | `#3A3A3D` | Hairlines, dividers |
| `ember` | `#D9A66C` | Single accent (Aesop amber) |
| `vermilion` | `#B2483D` | Reserved — used only on the Taste Genome reveal |
| `seafoam` | `#7FA39A` | Reserved — used only for "Mirror" moments |

Only **one accent** is visible at any time. Color is rationed like a spice.

### Typography

- **Display.** A warm contemporary serif — recommend **GT Sectra**, **Söhne Breit**, or **Tiempos Headline**. Wide kerning (+30 to +60), generous leading (1.35).
- **Body.** A humanist sans — **Söhne**, **Inter Display**, or **Suisse Int'l**. Tracked-out at small sizes.
- **Mono.** **JetBrains Mono Light**, used only in the "Genome" technical readouts (the radar axes, vector hashes).
- **Sentence case everywhere.** No all-caps. No bold within body. Emphasis is achieved by *italic*, by line, or by silence.

### Spacing

- Base unit **8px**, but with a *narrative scale*: `8, 12, 20, 32, 56, 96, 160, 280`. The gaps are deliberately Fibonacci-adjacent, never gridlocked.
- Minimum top padding on any onboarding screen: **160px** desktop, **96px** mobile.
- Maximum content width: **640px** for text-led screens, **1280px** for visual screens.

### Layout grammar

- The screen is always **one thought**. If a second element appears, it is hierarchically subordinate — smaller, dimmer, lower.
- Buttons are hairline-bordered (`1px solid rgba(244,241,234,0.18)`) with no fill — they exist as *invitations*, not commands.
- No rounded corners above `4px` except on photographs. Brutalism softened by light, not by radius.

---

## 4. Animation Concepts

The animation system is named **Breath** — every motion is tied to a respiratory rhythm.

### Motion tokens

```ts
export const breath = {
  in:   { duration: 0.9, ease: [0.16, 1, 0.3, 1] },   // expo.out, the inhale
  hold: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },    // gentle settle
  out:  { duration: 1.4, ease: [0.7, 0, 0.84, 0] },   // long exhale
};

export const motion = {
  enter:    { opacity: [0, 1], y: [12, 0], ...breath.in },
  exit:     { opacity: [1, 0], y: [0, -8], ...breath.out },
  reveal:   { opacity: [0, 1], filter: ['blur(12px)', 'blur(0px)'], duration: 1.6 },
  drift:    { y: [0, -6, 0], duration: 6, repeat: Infinity, ease: 'easeInOut' },
};
```

### Concept set

1. **The Breath.** Every screen enters with a 900ms inhale and exits with a 1400ms exhale. Asymmetry is intentional — exhales linger.
2. **Phosphor decay.** Cursor and selection trails fade over 800ms with a slight chromatic aberration, like an old CRT or warm glass.
3. **Settle physics.** When images land on the canvas, they overshoot by 2% and settle back over 1.2s, like paper finding a surface.
4. **Field hover.** Hover on any tappable object lifts it by 2px and warms its color temperature by +120K — never scales it.
5. **Pulse, not flash.** The single attention beacon (e.g. the breathing dot, the "Begin" button) pulses sinusoidally at 0.5–0.7Hz. Nothing in Taste OS ever flashes.
6. **Constellation choreography.** During Listening, points migrate via a soft Verlet simulation; lines fade in by edge weight, not by index — visually expressing that *meaning is emerging, not being drawn*.
7. **Reveal blur.** Generative text appears with a `blur(14px) → blur(0)` over 1.6s, paired with letter-spacing relaxing from `+120` to `+30`. The text feels like it's *focusing into being*.
8. **No bounce, no spring overshoot on UI chrome.** Reserved for objects (images, discs, paper). Chrome stays disciplined.

### Sound (optional, off by default)

- Three ambient stems crossfade between acts: *Threshold* (sub bass + bowed glass), *Offerings* (felt piano), *Encounter* (cello drone + distant bell).
- Interaction sound is at -22dB to -18dB. Never percussive. Never positive-reinforcement.

---

## 5. Emotional Interaction Design

Emotional intelligence is not a feature here; it is the substrate. Five rules govern it.

### Rule 1 — Speak to one person.

All copy is second-person singular, intimate, lowercase-friendly. Never "users," never "let's get you set up." The system speaks as if it has been waiting for *this person*.

### Rule 2 — Slow the user down, on purpose.

After a fast input (e.g. last image dropped), the system pauses 600ms before responding. The pause communicates: *I am considering what you gave me.* Compare to dopamine-loop apps that respond in 80ms to reward speed; Taste OS rewards stillness.

### Rule 3 — Permit incompleteness.

Every offering screen offers a quiet "Not today" link in the lower-right (`mist` color, `12px`). The system explicitly says: *"You can return to this when it feels right."* The user must be able to skip without shame. The Genome will still generate — it will simply be more partial, and the system will name it honestly.

### Rule 4 — Mirror with restraint.

The AI's outputs are written as **observations**, not predictions. We never say "You will love..." We say "Your eye keeps returning to..." We do not flatter. Flattery breaks the spell.

### Rule 5 — Hold the threshold.

The transition from offerings to Genome is the emotional core. Three deliberate friction points protect it:
- A full-screen breath beat ("Take a moment.") before Listening begins.
- A 30s minimum on the constellation, even if the model is faster.
- The Reveal is gated behind a single tap on a word: "Open."

Users should remember Taste OS the way they remember a film — not the way they remember an app.

---

## 6. Onboarding Wireframe Concepts

ASCII wireframes for the load-bearing screens. Each frame is 80 cols × 24 rows.

### 02 · Invocation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                    L e t ' s   l i s t e n   t o   y o u r   t a s t e .    │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                  ─ begin ─                                   │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 04 · Images

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  show us what your eye keeps returning to.                                   │
│                                                                              │
│   ┌──────────┐    ┌──────┐                       ┌─────────────┐             │
│   │          │    │      │   ┌────────────┐      │             │             │
│   │          │    │      │   │            │      │             │             │
│   │          │    └──────┘   │            │      │             │             │
│   └──────────┘               │            │      └─────────────┘             │
│                              └────────────┘                                  │
│         ┌────────┐                       ┌──────────┐    ┌────────┐          │
│         │        │   ┌──────────────┐    │          │    │        │          │
│         │        │   │              │    │          │    │        │          │
│         └────────┘   │              │    └──────────┘    └────────┘          │
│                      └──────────────┘                                        │
│                                                                              │
│                                                                              │
│                       enough to begin. more if you'd like.                   │
│                                                                              │
│                                                                              │
│                                                                ⊕             │
│                                                            not today         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 08 · Feeling (one of five)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│              there are no right answers. drift toward the truer side.        │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│        solitude  ─────────────────●────────────────────────────  communion   │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                  ·  1 / 5  ·                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 09 · Constellation Forming

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                         ·    ·                                               │
│                    ·  · ·  ·                ·                                │
│                  ·  ╲    ╱  ·     ·       ·   ·                              │
│                   ·  ╲  ╱  ·   ·   ·  ─ ─ ─ · ·                              │
│                    · · ╳ · ·      ·  ·     · ·   ·                           │
│                   ·  ╱  ╲  ·    ·  ·     ·  ·                                │
│                  ·  ╱    ╲  ·       ·  ·   ·                                 │
│                    ·  · ·                                                    │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                    listening for the temperature of your sound…              │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 10 · The Reveal

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                  · taste genome ·                            │
│                                                                              │
│                              L a c q u e r e d                               │
│                                  D u s k                                     │
│                                                                              │
│   ──────────────────────────────────────────────────────────────────────     │
│                                                                              │
│   you move toward warmth at the end of the day, and toward stillness         │
│   in the middle of crowds. you are an evening person who loves a single      │
│   light source, the smell of cedar, and rooms with one window.               │
│                                                                              │
│            stillness  ▰▰▰▰▰▰▰▱▱        tempo       ▰▰▰▱▱▱▱▱▱▱                │
│            warmth     ▰▰▰▰▰▰▰▰▱▱        saturation ▰▰▰▰▱▱▱▱▱▱                │
│            density   ▰▰▰▰▱▱▱▱▱▱         distance   ▰▰▰▰▰▰▱▱▱▱                │
│                                                                              │
│   archetypes:   wanderer-monk · velvet cartographer                          │
│   palette:      ▮ ▮ ▮ ▮ ▮      material: oak, linen, brass                   │
│   kin:          tarkovsky · saariaho · zumthor · sebald · murata · kapoor    │
│                                                                              │
│                                                                              │
│                                   ─ open ─                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Visual Language System

### Mood adjectives (the brief in nine words)

> hush · linen · vesper · ember · graphite · porcelain · cedar · brine · velvet

If a design decision can't be defended with at least three of these words, it doesn't ship.

### Imagery rules

- **No stock photography.** Period.
- **No people facing the camera.** Backs of heads, hands, silhouettes — yes. Eye contact pulls the user out of introspection.
- **Photographs prefer single light sources, dawn/dusk hours, natural texture, and Asian/Nordic spatial sensibilities** (Tokyo, Kyoto, Lisbon, Reykjavík, Naoshima, Hokkaido).
- **Avoid:** gradients with neon, glossy 3D renders, glassmorphism, isometric illustrations, mascots, emojis.

### Iconography

- **No icons.** Where most apps would use an icon, Taste OS uses a word, a hairline, or a glyph (`·`, `─`, `⊕`, `◌`).
- The closest thing to a logo is a hand-drawn ensō — present only on the Threshold screen and the Mirror moment.

### Voice — sample fragments

- "We're going to look at five small things together."
- "There's no right answer. Drift toward the truer side."
- "Take your time. The OS is patient."
- "You can return to this when it feels right."
- "We saw something." *(used once, on the Reveal)*

### Voice — what we never say

- "Let's get started!"
- "Awesome!" "Great!" "Nice work!"
- "Tap to continue."
- "Loading…"
- "Welcome to your dashboard."
- Any emoji.
- Any exclamation point after the word *"we."*

---

## 8. Onboarding Copywriting

A complete copy script, screen by screen. Read it aloud once before reading it on a screen.

### 01 · Threshold
> *(silence, 4 seconds)*
> take a breath.

### 02 · Invocation
> let's listen to your taste.
> — begin —

### 03 · Naming
> before we begin —
> what should we call you?
>
> *(after typing)*
> hello, ___. welcome to the quiet part of the internet.

### 04 · Images
> show us what your eye keeps returning to.
> nine to twenty-four images. no need to explain them.
>
> *(after the ninth)* enough to begin. more if you'd like.

### 05 · Sound
> what does your inner world sound like?
> three to ten tracks. drop them anywhere.

### 06 · Words
> a line from a book, a film, a person, a thought.
> anything that has stayed.

### 07 · Spaces
> choose the rooms your mind already lives in.

### 08 · Feeling
> there are no right answers. drift toward the truer side.
>
> 1. solitude ⟶ communion
> 2. wabi-sabi ⟶ pristine geometry
> 3. memory ⟶ anticipation
> 4. silence ⟶ resonance
> 5. earth ⟶ atmosphere

### 09 · Listening (the three sentences)
> reading the light in your images…
> listening for the temperature of your sound…
> finding the through-line.

### 10 · The Reveal
> we saw something.
> — open —

### 11 · Mirror
> *(one generated sentence, e.g.)*
> you don't collect beauty — you collect evidence that the world has been gentle to someone, once.
> — keep this —

### 12 · Entry
> come in.
> the OS has been waiting for someone like you.

---

## 9. Implementation Architecture

### Stack

- **Framework.** Next.js 15 (App Router, React Server Components).
- **Styling.** Tailwind CSS 4, with a `tokens.css` layer exposing the palette + motion tokens. No inline hex.
- **Animation.** Framer Motion 11 for choreography; `framer-motion/three` and **react-three-fiber** for the constellation; **GSAP** reserved only for the Reveal text scramble.
- **State.** Zustand for client-only ephemeral onboarding state; persisted to IndexedDB via `idb-keyval` so a refresh never destroys offerings.
- **Storage.** S3-compatible bucket for uploaded media, with client-side perceptual hashing before upload to dedupe.
- **AI inference.** A single server action `/api/genome/synthesize` orchestrates: CLIP for image embeddings, a CLAP-style audio embedder for tracks, a sentence-transformer for quotes, and a Claude (Opus-class) call for the *narrative synthesis* (Taste Name, Mirror sentence, Genome paragraph). Embedding clustering happens server-side via UMAP.

### Directory layout

```
app/
  onboarding/
    layout.tsx              ← shared dark frame + breath background
    page.tsx                ← act router
    (acts)/
      arrival/page.tsx
      offerings/
        images/page.tsx
        sound/page.tsx
        words/page.tsx
        spaces/page.tsx
        feeling/page.tsx
      listening/page.tsx
      encounter/
        reveal/page.tsx
        mirror/page.tsx
        entry/page.tsx
components/
  motion/
    Breath.tsx              ← <Breath as="section" phase="in"/>
    Phosphor.tsx
    Settle.tsx
  primitives/
    Hairline.tsx
    Whisper.tsx             ← typographic primitive: serif + breath enter
    Beacon.tsx              ← the pulse-only CTA
  constellation/
    Field.tsx               ← R3F canvas
    Cluster.tsx
    Edge.tsx
  genome/
    TasteName.tsx
    Radar.tsx
    Palette.tsx
    KinList.tsx
lib/
  embeddings/
    clip.ts
    clap.ts
    text.ts
  synthesis/
    cluster.ts              ← UMAP + HDBSCAN
    archetypes.ts           ← maps clusters → archetypes
    narrate.ts              ← Claude call for prose
  motion/tokens.ts
  store/onboarding.ts       ← Zustand
styles/
  tokens.css
```

### Performance budgets

| Surface | Target |
|---------|--------|
| First contentful paint (Threshold) | < 800ms |
| Threshold → Invocation transition | locked at 1.6s regardless of network |
| Image upload, single 4MB | optimistic preview in < 120ms |
| Constellation frame rate | ≥ 50fps on M-series; degrade gracefully to 2D Canvas on low-end |
| Genome synthesis end-to-end | held at minimum 30s, max 60s — if model exceeds, surface "still listening…" copy |

### Accessibility

- **Reduced motion.** Honor `prefers-reduced-motion`. Replace the constellation with a slow crossfade of three stills; keep the same copy beats.
- **Keyboard.** Full keyboard journey; `space` advances any beat that's tap-anywhere.
- **Screen readers.** Each act has an `aria-live="polite"` narration that mirrors the visible copy; the Mirror sentence is announced once, deliberately.
- **Contrast.** All `pearl/void` text exceeds WCAG AAA. The `mist` secondary tier sits at WCAG AA — used only on non-essential metadata.

### Privacy posture (because identity products live or die here)

- Uploaded images and tracks are encrypted at rest with a per-user key.
- Embeddings are stored, but raw text quotes and uploaded files can be **purged** at any time without losing the Genome — the Genome is derivable from embeddings alone.
- No third-party analytics during onboarding. A single first-party event (`genome.synthesized`) fires at the Reveal. That is all.
- The system never shares the Genome by default. A "share" surface exists later in the product — never in onboarding.

---

## Closing note

If the user, having finished onboarding, walks away from the screen and feels the urge to sit by a window for a moment — we have built the right thing.

If they reach for their phone to scroll something else — we have built one more app.

The whole point of Taste OS is the difference between those two outcomes.
