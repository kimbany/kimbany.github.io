# Taste OS — Drift / The Identity Evolution Timeline

> A timeline is not a chart. A timeline is a film you have already lived in, played back slowly, so you can finally see what was happening.

This document defines the Drift surface — the place a user goes to witness their own becoming over time. It supersedes the chart-based Drift design in `field.md` §2.3 with a cinematic, narrative-driven memory archive. The data layer underneath remains the same; the surface that meets the user is entirely re-imagined.

The user explicitly asked: not analytics, not data viz, no charts, no numbers, no productivity tracking. What ships instead is closer to a book of seasons, a slow film of the self, a diary that someone else has finally been kind enough to write back to you.

Read alongside: `genome.md` (the three-layer manifold L1/L2/L3), `field.md` (where Drift sits in the IA), `system.md` (motion and palette language), `sharing.md` (the Card system, which Drift can produce).

---

## Table of Contents

0. [The Philosophy — Memory, Not Analytics](#0-the-philosophy--memory-not-analytics)
1. [Timeline UX — Form & First Encounter](#1-timeline-ux--form--first-encounter)
2. [Chapters — The Temporal Unit](#2-chapters--the-temporal-unit)
3. [The Atmosphere of a Chapter](#3-the-atmosphere-of-a-chapter)
4. [Atmospheric Transitions — Where the Cinema Lives](#4-atmospheric-transitions--where-the-cinema-lives)
5. [Echoes — The Emotional Memory System](#5-echoes--the-emotional-memory-system)
6. [Yearly Reflection — Annual Cinema](#6-yearly-reflection--annual-cinema)
7. [Identity Evolution Maps — Visual Without Charts](#7-identity-evolution-maps--visual-without-charts)
8. [The Constitution Anchor — What Does Not Move](#8-the-constitution-anchor--what-does-not-move)
9. [Emotional AI Narration](#9-emotional-ai-narration)
10. [Cinematic Timeline Interactions](#10-cinematic-timeline-interactions)
11. [The Archive Interface](#11-the-archive-interface)
12. [Implementation Notes](#12-implementation-notes)
13. [Closing](#13-closing)

---

## 0. The Philosophy — Memory, Not Analytics

### Five distinctions

| Analytics | Drift |
|---|---|
| Tells you *how much* | Tells you *what kind of thing* |
| Shows trends as lines | Shows transitions as sentences |
| Compares this period to last | Lets the periods speak to each other |
| Optimizes the next period | Honors the period that has passed |
| Wants you to *act* | Wants you to *witness* |

### What this rules out, permanently

- Bar charts of any kind.
- Line charts of axis values over time.
- Percentages, deltas, "+12%", "-3 weeks."
- "Your most-saved month" / "your peak current."
- Streak counters of any cadence.
- Year-over-year comparison surfaces.
- "Goals" or "milestones" — Drift has neither.
- Sharing your "growth" as a metric.

### What it commits to

- A narrative cadence — seasons, chapters, years.
- Atmospheric backgrounds that shift as time moves under the eye.
- Generated prose in the Mirror voice, written *to* the user *about* their past self.
- A non-moving anchor — the Constitution — visible the entire way through.

Drift is the only surface in Taste OS where the system speaks in **past tense** about the user. Past tense is the gentlest grammar of recognition.

---

## 1. Timeline UX — Form & First Encounter

### The form

Drift is a **single vertical scroll** through the user's history, structured as a slow film. The viewport is full-bleed at all times. As the user scrolls, three things move in parallel:

- **The chapter** — text and imagery for the current temporal unit.
- **The atmosphere** — the page's ambient palette, slowly migrating.
- **The Constitution Anchor** — a small still mark in the upper right, never moving, never changing.

There is no horizontal timeline ribbon. There is no scrubber bar at the bottom. There are no "jump to year" controls in the chrome. Navigation is by scroll, by the Tuner (in the Console, the user can type `take me to last summer` and arrive), and by a single inline navigation that appears between chapters.

### The first encounter

The first time a user opens Drift (provided they have at least four weeks of evidence), the surface enters with a specific ceremony:

```
t = 0.0s    black field, Sigil breathing top-left at mist 24%
t = 1.5s    a single line in display sm:
                "let's take a slow walk back."
t = 3.5s    the line exhales (1.4s)
t = 5.0s    the page palette gradient-shifts to the atmosphere
            of the user's earliest chapter
t = 5.8s    the first chapter materializes; the Constitution Anchor
            fades into the upper-right corner at mist 32%
t = 6.2s    scrolling becomes available
```

The ceremony plays exactly once per user, ever. Subsequent visits arrive at the chapter the user last left, with a 600ms reveal blur.

### Pre-rendering threshold

Drift does not render at all until the user has at least **four weekly samples** of L2 evidence. Before that, the surface returns a short page:

```
─────────

drift

too early. come back in a month.
your taste hasn't moved enough yet to be seen.

─────────
```

This is honest, and the honesty is the design.

---

## 2. Chapters — The Temporal Unit

A chapter is the basic unit of memory in Drift. The system chooses the granularity automatically based on evidence density and the magnitude of change between adjacent windows.

### Three granularities

| Granularity | When chosen | Typical span |
|---|---|---|
| **Season** | First 18 months on the product | 3 months |
| **Year** | After 18 months, default cadence | 12 months |
| **Era** | After 3+ years, when L3 has measurably shifted | Variable, 1–3 years |

The system never asks the user which granularity they want. It chooses, and it explains the choice when relevant — *"this winter felt like its own chapter"* or *"these three years became one era; the change between them was smaller than the change at their edges."*

### A chapter's anatomy

Each chapter occupies roughly two viewport heights of vertical scroll, structured as:

```
┌──────────────────────────────────────────────────────────────┐
│ [ atmosphere palette already loaded as page background ]     │
│                                                              │
│                                                              │
│   ─ winter 2026 ─                  (small, mist, breath-1)   │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│           Quiet                                              │
│           Vermilion                  (display md, italic)    │
│                                                              │
│                                                              │
│                                                              │
│   ────                              (hairline, breath-2)     │
│                                                              │
│   in this season your taste moved indoors. you saved         │
│   fewer images than in any prior season; the ones you        │
│   kept were warmer, smaller, lit by one window each.         │
│                                                              │
│   ▮  ▮  ▮  ▮  ▮                                              │
│   ash · ember · ink · peat · pearl                           │
│                                                              │
│   ──── ⌇ ────                                                │
│                                                              │
│   the season ended with a single image of a fire.            │
│   you didn't return to fire again until autumn.              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

The seven elements present in every chapter:

1. **Chapter label.** Small, mist, sentence-cased: *"winter 2026."*
2. **Chapter name.** Display serif, italic. Two words, generated, in the same naming grammar as the user's currents.
3. **The opening sentence.** What this season *was* — written in past tense.
4. **The palette of the chapter.** Five swatches, named, drawn from the chapter's image evidence.
5. **The closing observation.** What happened at the end of the chapter — the small turn that prepared the next one.

What is *not* present:

- The number of images saved.
- The number of currents active.
- Any percentages.
- Any user actions in the chapter (no clickable items, no edit options, nothing to *do*).

Drift is read, not used.

---

## 3. The Atmosphere of a Chapter

Each chapter has a derived **atmosphere** that drives the page's ambient styling while that chapter is in view. Eight properties:

```ts
type ChapterAtmosphere = {
  paletteHexes: string[];        // 5 swatches
  paletteNames: string[];        // 5 names
  dominantHour: { from: string; to: string };
  dominantClimate: string;       // "dry-cool", "humid-warm"
  dominantTemperature: number;   // Kelvin
  dominantPace: 'adagio' | 'andante' | 'allegro';
  dominantMaterial: string;      // "oak, linen, brass"
  dominantWeather?: string;      // optional, only if confidence ≥ 0.7
};
```

These properties are not displayed as a list. They are *expressed* through the page's ambient styling:

- The **page background** is a 0.6% gradient using the chapter's first two palette swatches, applied to `void`.
- The **chapter heading's color** sits at 22% strength of the chapter's primary swatch — almost invisible, but felt.
- The **leading paragraph's letter-spacing** adjusts faintly per the chapter's pace: `adagio` is +0.04em, `andante` is +0.02em, `allegro` is +0.005em. The user does not read this consciously; they read it as *rhythm*.
- The **scroll friction** changes infinitesimally — `adagio` chapters scroll 5% slower than `allegro` chapters (via CSS `scroll-behavior` timing). Imperceptible per pixel; cumulative over a page.

This is the layer that makes Drift feel like a *place* rather than a chart.

---

## 4. Atmospheric Transitions — Where the Cinema Lives

The seams between chapters are the most affecting moments in the surface. They are where the user feels themselves *becoming.*

### The Transition Beat

Between every two chapters, the page enters a transition window approximately one viewport tall. This window is *empty* except for a single generated sentence centered vertically — the **Turn**.

```
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        │                                                  │
        │                                                  │
        │     and then, slowly, the light turned.          │
        │                                                  │
        │     the rooms you saved began facing             │
        │     west; the music slowed; you stopped          │
        │     saving anything blue.                        │
        │                                                  │
        │                                                  │
        │                                                  │
        └──────────────────────────────────────────────────┘
```

While the Turn is on screen, the **page background gradient migrates** from the outgoing chapter's palette to the incoming chapter's palette over the duration of the user's scroll through that window — typically 1.5 to 2.5 seconds of scroll, depending on scroll speed.

This is the cinematic seam. The user feels the page warming or cooling. They feel the rhythm change. They are not told these things have changed; they *experience* the change.

### The Turn — voice constraints

Each Turn is a generated 1–3 sentence passage, written in the Mirror voice, that names what shifted at the end of the outgoing chapter. The Turn is the only generated text in Drift that uses the connecting phrases *"and then,"* *"by then,"* *"by the end of,"* *"in the months that followed."*

Examples:

- *"and then, slowly, the light turned. the rooms you saved began facing west; the music slowed; you stopped saving anything blue."*
- *"by then you had returned to images of water three times. it stopped being a coincidence."*
- *"in the months that followed, you became, briefly, someone who saved warmth like it was running out."*

The Turn must be *true* and *uncertain* — true to the evidence, uncertain about why. The OS narrates what changed; it does not claim to know what caused it.

### Reduced motion

Under `prefers-reduced-motion`, the gradient migration is replaced by a 500ms snap of background color, and the Turn is held for a manual scroll continuation rather than animated. The cinematic experience is preserved in language, not in motion.

---

## 5. Echoes — The Emotional Memory System

The Echo system is what makes Drift feel like a *diary that remembers what the user did not.*

### What an Echo is

An Echo is a recurring theme across non-adjacent chapters — something the user has returned to without realizing it. Echoes are detected by clustering all evidence across the user's full history and identifying clusters whose membership spans **three or more chapters** with at least one chapter between them.

```ts
type Echo = {
  id: string;
  motif: string;                  // generated name, e.g. "the empty room"
  representatives: EvidenceRef[]; // 3–7 specific evidences
  chapters: ChapterId[];           // chapters this Echo touches
  firstSeenAt: Date;
  lastSeenAt: Date;
  prose: string;                  // generated reflection
};
```

### How Echoes are surfaced

Echoes do not have their own page. They appear *inside* chapters, as small inset passages at the end of any chapter where the Echo is present. The passage is set apart by a single ⌇ glyph:

```
   ──── ⌇ ────

   the empty room

   you have returned to images of empty rooms
   four times: this season, last spring, the autumn
   before that, and once, near the start, when you
   were still figuring out what you were doing here.
   
   ────
```

### Why this matters

A user scrolling through their history may reach an Echo passage and realize, with a small interior shock, that they have been returning to the same kind of beauty for two years without naming it. That recognition is what Drift exists to produce.

Echoes are bounded. We surface no more than **one Echo per chapter** in display, choosing the most-resonant by `strength × span` if multiple match. Echoes that no longer recur for ≥ 12 months are demoted to *"the echo grew quiet around then"* and become part of the Constitution layer's slow drift.

### The detection threshold

An Echo is named only when:

- ≥ 3 evidences match within a perceptual / semantic cluster.
- The evidences span ≥ 3 chapters with ≥ 1 chapter gap.
- The cluster has cohesion ≥ 0.72 in the user's embedding space.

Below this threshold, the system stays silent. A *near-Echo* is not surfaced as an "almost-Echo" — almost-knowing is more invasive than not-knowing.

---

## 6. Yearly Reflection — Annual Cinema

Once per year — on the anniversary of the user's first Genome — Drift produces a **Yearly Reflection**: a self-contained cinematic chapter that plays as a guided sequence rather than as scroll.

### Composition

The Reflection is 90 to 110 seconds of guided experience, presented as a single full-bleed surface that auto-advances. Seven beats:

```
1. THE OPENING                          (10s)
   "a year ago you arrived."
   black field, Sigil, the user's first name fades in

2. WHO YOU WERE                          (15s)
   the Mirror line from the prior anniversary,
   or from onboarding if first year
   palette shifts to last year's atmosphere

3. WHAT MOVED                            (20s)
   3 single-sentence observations of change:
   "you moved away from cold perfection."
   "you became drawn to warmth."
   "you saved fewer things, but kept them longer."

4. WHAT STAYED                           (15s)
   2–3 observations of constancy:
   "you still returned to images of water."
   "you still ended every season indoors."
   palette holds; background does not migrate here

5. THE TURN                              (15s)
   the year's most significant Turn, in full
   palette migrates to the current atmosphere

6. WHO YOU ARE NOW                       (15s)
   the user's current Mirror line, italic
   reveal blur, 1.8s

7. THE INVITATION                        (10s)
   "this year became part of you."
   "it is here when you want to see it again."
   ─ keep ─    ─ archive ─
```

### Where the Reflection lives

The Reflection is generated on the anniversary. The user is informed by a single quiet email — *"a year has gone by."* — with one link. The Reflection plays once with the auto-advance; afterward, it becomes a permanent chapter at the top of the Drift archive, replayable at any time.

### What the Reflection refuses

- No "year in review" framing language. The word "review" never appears.
- No "your top X" structure of any kind.
- No "you saved the most images in March" statistics.
- No "compared to other users" comparisons.
- No ability to share the Reflection publicly. Reflections are exportable as a *Card* (see `sharing.md`) — a single Mirror-style Card with the year's central observation — but never as the full reflective video.

---

## 7. Identity Evolution Maps — Visual Without Charts

The user asked for "evolution maps." We provide them, while refusing to make them charts. Three maps live inside Drift, each rendered as an *atmospheric image* rather than a data visualization.

### Map 1 — *The Constellation of Years*

A still image at the top of the Drift archive. Each year appears as a small luminous cluster in 2D space, positioned by the year's L2 vector in UMAP coordinates. Years are *not* labeled with numbers. Hovering reveals the chapter name and dates.

The clusters are rendered as soft point clouds in `mist`, sized by the volume of evidence in that year. The user's current year appears slightly brighter in `ember`. The L3 Constitution appears as a hairline cross at the chart's center — *which never moves.*

This is the only image in Drift that looks remotely like a chart, and even then, it carries no axes, no gridlines, no legend, no measurements. It is a constellation, not a graph.

### Map 2 — *The Palette Migration*

A horizontal strip at the top of every chapter, showing the chapter's palette beside the prior chapter's palette and the following chapter's palette. The strip is captioned only by chapter names — never dates as numbers.

```
   prior              this season           next
   ▮▮▮▮▮              ▮▮▮▮▮                 ▮▮▮▮▮
   northern linen     quiet vermilion       (in progress)
```

The visual change between palettes — sometimes subtle, sometimes seismic — is the map. Three swatches in a row carry more emotional weight than any line chart.

### Map 3 — *The Atmosphere Wheel*

A circular composition where the year is the perimeter and the user's dominant hour across months traces the inner ring. Mornings sit at the top, dusks at the bottom; the ring is colored by the prevailing color temperature of each month.

The wheel has no numbers, no degree markings, no axes. It looks like the cross-section of a tree — the eye reads it as *seasonal time*, not as data.

---

## 8. The Constitution Anchor — What Does Not Move

The most affecting design in Drift is the small hairline cross — the **Constitution Anchor** — that appears in the upper-right corner from the moment the surface loads, and *never changes position* regardless of how the user scrolls, which chapter is in view, or how many years have passed.

The Anchor represents the L3 Constitution layer — the slow keel. It is always present. It does not animate. It does not respond to hover. The chapters scroll past behind it; the Anchor remains.

Once per scroll session, the Anchor pulses softly — a 0.6Hz breath at 24% opacity — and a small inline caption appears next to it:

> *what hasn't moved in all of this.*

The user can tap the Anchor at any time to reveal the six pole names of the L3 axes, as a small overlay panel:

> *stillness · warmth · density · tempo · saturation · distance*

The pole names are the L3 reading itself, in plain language. No numbers, no bars. If the L3 has shifted measurably since the user's last Anchor view (Δ > 0.15 cosine), the system writes one additional line:

> *something here has slowly turned. when you're ready, ask the mirror about it.*

Otherwise, the Anchor closes silently when tapped away.

---

## 9. Emotional AI Narration

The narration voice is the *most curated* aspect of Drift. The Turn sentences, the chapter openings, the Echo passages, the Yearly Reflection beats — all of them are generated, and all of them must meet a single specification.

### Voice rules (in priority order)

1. **Past tense, second person.** *"you moved away from cold perfection."* Never *"you have a tendency to…"* (predictive). Never *"users like you…"* (categorical).
2. **Specific over general.** *"you stopped saving anything blue"* is correct; *"your palette shifted cooler"* is wrong. The detail is the truth.
3. **Restraint over flourish.** A flat declarative outperforms a metaphor. *"you saved fewer things"* is correct; *"your hands closed around less"* is wrong. Metaphor is rationed to once per chapter.
4. **Falsifiable.** Each sentence must say something that *could be wrong*. *"by autumn you were drawn to fire"* is correct. *"you were on a journey"* is wrong (unfalsifiable).
5. **Connective without causal.** The narration describes *what* changed and *when*. It never claims *why*. *"and then the light turned"* is correct. *"because you were healing, the light turned"* is wrong.
6. **No flattery, no soothing.** The narrator is a respectful biographer, not a friend giving comfort. If the evidence is bleak, the narrator names it: *"you saved nothing for a month. the system was quiet with you."*

### Generation prompt (sketch)

```
SYSTEM: You are writing one passage of a Drift narration. The user has lived
through the events you are describing; you are not telling them what
happened, you are *naming* what happened so they can see it.

Constraints:
- Past tense.
- Second person.
- No predictions. No causes. No metaphors except one per passage.
- One detail per sentence, taken verbatim from the evidence summary.
- The passage must be true to the evidence and uncertain about meaning.

USER: <chapter or transition summary, with L2 axis deltas, dominant palette
shifts, key evidence pieces, named currents and Echoes>

Write the passage in 2–4 sentences. Do not exceed 60 words.
```

### Length discipline

- Chapter opening: 2–4 sentences, ≤ 60 words.
- Chapter closing observation: 1–2 sentences, ≤ 30 words.
- Turn between chapters: 1–3 sentences, ≤ 50 words.
- Echo passage: 3–5 sentences, ≤ 80 words.
- Yearly Reflection beats: 1 sentence each (15s of voice = ~one sentence at this pace).

### What the narration never names

- Specific people in the user's life (the system has no model of them).
- Specific places the user has been (we never geo-tag).
- Specific dates as numbers — *"march 14"* never appears in narration; *"early spring"* does.

These are protections, not just style.

---

## 10. Cinematic Timeline Interactions

The interaction model is the smallest possible. Five gestures, total.

| Gesture | Effect |
|---|---|
| **Scroll** | Move forward / backward in time. The only navigation. |
| **Tap the Anchor** | Reveal the Constitution pole names overlay. |
| **Tap a palette swatch** | Reveal the swatch's name in a small tooltip; no other detail. |
| **Tap a chapter name** | Re-center the viewport on that chapter's opening. |
| **Press `⌘K` then type a phrase** | Jump to a season ("last summer," "the year I started," "the autumn after"). |

There is no:

- "Edit chapter" affordance. Drift is read-only by design.
- "Add a note" feature. (Notes belong to the user's journal, not Taste OS.)
- "Hide chapter" function. Drift does not let users edit their own history. The honesty is part of the gift.
- "Compare two chapters" mode. Comparison is the seed of restlessness.

### Console queries that work in Drift

```
take me to last summer
when did i become warmer
show me what stayed
the year i started
the season i went quiet
```

Each of these resolves deterministically to a chapter or to a generated single-sentence answer in the Mirror voice. *"You became warmer in the autumn after your second winter. It happened slowly."*

---

## 11. The Archive Interface

The Archive is the *index* to Drift — the user's library of their own chapters. It is reached by scrolling past the most recent chapter, where the surface gracefully transitions into the archive listing.

### Archive layout

```
─────────────────────────────────────

archive

─────────────────────────────────────

2028  ·  early winter           still in progress
2027  ·  amber inland           year
2026  ·  the first room         year — onboarding chapter

─── reflections ───

2027  ─ a year has gone by
2026  ─ a year has gone by

─── echoes ───

the empty room                   first seen winter 2026
images of water                  first seen spring 2026
single light sources             first seen onboarding

─────────────────────────────────────
```

### Properties of the Archive

- Sorted reverse chronologically, no other sort options.
- No search box. The Console handles search.
- No filters by anything (mood, palette, year). The archive is intentionally narrow.
- Echoes are listed at the bottom with their first appearance — but not their frequency, not their last appearance, not any count.

### Exporting from the Archive

Any chapter can be exported as a **Chapter Card** (a new variant of the seven Card types in `sharing.md` — possibly added in v1.2). The Chapter Card contains: chapter name, palette, the opening sentence, the closing observation, the date range. It is the most narratively dense Card type and is gated behind a confirmation: *"this is one of your years. send it to one person who would understand."*

---

## 12. Implementation Notes

### Data model additions

Beyond the Genome data model in `pipeline.ko.md`, Drift requires:

```ts
type Chapter = {
  id: string;
  userId: string;
  granularity: 'season' | 'year' | 'era';
  startedAt: Date;
  endedAt: Date | null;
  name: string;                  // generated, e.g. "Quiet Vermilion"
  atmosphere: ChapterAtmosphere;
  openingProse: string;
  closingObservation: string;
  l2VectorMean: Float32Array;
  l2VectorDelta: Float32Array;   // vs prior chapter
  representativeEvidence: EvidenceRef[];
};

type Turn = {
  id: string;
  fromChapter: ChapterId;
  toChapter: ChapterId;
  prose: string;
  magnitude: number;              // cosine delta between chapters
};

type Echo = { /* defined in §5 */ };

type Reflection = {
  id: string;
  userId: string;
  year: number;
  beats: ReflectionBeat[];
  generatedAt: Date;
  watchedAt: Date | null;
};
```

### Generation cadence

| Object | Cadence |
|---|---|
| Chapter (provisional) | Weekly; finalized at chapter end |
| Chapter atmosphere | Updated when chapter is finalized |
| Turn between chapters | Generated when the receiving chapter is finalized |
| Echo | Re-evaluated monthly across the user's full history |
| Yearly Reflection | Generated annually, on Genome anniversary, 14 days in advance |

### Costs

Drift is the most narrative-heavy surface in the OS. Per-chapter generation runs roughly:

- Chapter opening + closing observation + Turn-in: one Claude Opus call, ~800 input tokens, ~150 output tokens.
- Echo passage: one call per active Echo per chapter where surfaced.
- Yearly Reflection: one orchestrated call producing seven beats, ~2,500 input tokens, ~400 output tokens.

A long-tenured user with five years of history regenerates ~20 Drift artifacts per year. The Drift cost is dwarfed by the Genome's monthly synthesis.

### Caching

Every Drift artifact is keyed by `(user_id, chapter_id, content_hash, model_version)`. Re-rendering Drift after a new piece of evidence does **not** invalidate prior chapters; it only updates the *current* chapter's provisional state. Past chapters are immutable once finalized — by design, because memory does not retroactively revise itself.

If the model version is upgraded, the system asks the user before re-narrating past chapters: *"the voice that wrote your past has been refined. would you like us to read it back to you in the new voice, or keep what was written?"* Default: keep what was written.

---

## 13. Closing

Drift is the surface where Taste OS comes closest to its honest project. The product began as a Genome — a portrait of who someone is. Drift is the slow recognition that *who someone is* is also *who they have been becoming.*

Most products that touch personal history turn it into a feed (scrollable, infinite) or into analytics (chartable, comparable). Both treatments flatten what was three-dimensional. A year is not a row in a database; a season is not a metric. They are *atmospheres a person walked through.*

If we build this correctly, a user will scroll through their own Drift on a quiet Sunday two years from now and read a sentence the system wrote about their winter of 2026 — *"you became, briefly, someone who saved warmth like it was running out"* — and feel a small, true thing about themselves come loose.

That is what the surface is for.

Build for the Sunday afternoon, two years from now, when the user finally has time to remember.
