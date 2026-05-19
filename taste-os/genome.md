# The Taste Genome — System Design

> The Genome is not a personality test. It is a long, careful look at the evidence a person has already given the world about who they are.

This document defines the system that turns five offerings (images, music, quotes, spaces, feeling) into a living portrait of a person's taste. It is the architectural counterpart to the onboarding document.

The single design constraint that governs everything below: **continuous, not categorical.** No 16 types. No quadrants. No "you are an X." Every output is a vector, a current, a tendency, an observation. The system describes evidence, never predicts behavior.

---

## Table of Contents

0. [Foundational Premise — Why Not MBTI](#0-foundational-premise--why-not-mbti)
1. [Identity Mapping System](#1-identity-mapping-system)
2. [Taste Clustering Engine](#2-taste-clustering-engine)
3. [Emotional Pattern Analysis](#3-emotional-pattern-analysis)
4. [Aesthetic Dimensions — The Fourteen Axes](#4-aesthetic-dimensions--the-fourteen-axes)
5. [Atmosphere Profiling](#5-atmosphere-profiling)
6. [Philosophical Alignment System](#6-philosophical-alignment-system)
7. [Taste Categories — The Currents](#7-taste-categories--the-currents)
8. [Cinematic Personality Report](#8-cinematic-personality-report)
9. [Emotional Evolution Map](#9-emotional-evolution-map)
10. [Synthesis Pipeline](#10-synthesis-pipeline)
11. [Failure Modes & Safeguards](#11-failure-modes--safeguards)

---

## 0. Foundational Premise — Why Not MBTI

MBTI-style systems share four failures we are committed to avoiding.

| MBTI does this | The Genome does this |
|---|---|
| Forces continuous traits into binary letters | Stores continuous floats and *never* rounds for display |
| Predicts behavior from a label | Describes *evidence already given*; predicts nothing |
| Treats identity as fixed | Treats identity as a slowly drifting weather system |
| Uses self-report (lies, mood, social desirability) | Uses revealed preference (what you actually saved) |

The Genome is closer in spirit to:

- The **Köppen climate classification** — many continuous variables describing a place's character, not a horoscope of it.
- An **art historian's monograph** — patient, evidence-led, willing to contradict itself.
- A **gemological report** — observable properties (clarity, hue, inclusions), not a verdict on worth.
- A **musicologist's analysis** — recurring motifs, key changes, what the silence between notes implies.

The user should never read their Genome and feel *typed*. They should feel *witnessed*.

---

## 1. Identity Mapping System

### The Manifold, not the Type

A person's taste is represented as a point — and a velocity — in a 64-dimensional latent space we call the **Taste Manifold**. The manifold has three nested layers:

```
┌───────────────────────────────────────────────────────────┐
│  L3 · CONSTITUTION    (slow, ~year scale)                 │
│      philosophical & temperamental orientation            │
│      6 axes · changes by months                           │
│                                                           │
│  ┌───────────────────────────────────────────────────┐    │
│  │  L2 · ATMOSPHERE   (medium, ~season scale)        │    │
│  │      aesthetic dimensions + climate               │    │
│  │      14 axes · changes by weeks                   │    │
│  │                                                   │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │  L1 · IMPRESSION  (fast, ~day scale)        │  │    │
│  │  │      what you saved this week               │  │    │
│  │  │      44 axes · changes by hours             │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  └───────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

- **L1 / Impression** is volatile — your week's mood. It is the surface of the lake.
- **L2 / Atmosphere** is what most of the Genome reads from — your prevailing weather.
- **L3 / Constitution** is the slow keel — the part of you that does not move when the weather changes.

Each layer is exposed in the product differently:

- L1 appears as the **"Right now"** strip on the user's home screen.
- L2 is the **Genome card** proper.
- L3 is the **Mirror** — the single sentence at the end of onboarding, and the only artifact that requires months of evidence before it changes.

### The Identity Vector

```ts
type TasteVector = {
  impression: Float32Array; // length 44
  atmosphere: Float32Array; // length 14
  constitution: Float32Array; // length 6
  // L4 timestamps & confidence
  measuredAt: Date;
  evidenceCount: { images: number; sounds: number; quotes: number; spaces: number; feeling: number };
  confidence: Float32Array; // length 64, one per axis
};
```

**Confidence is first-class.** Every axis has a confidence score derived from evidence density and inter-modal agreement. Low confidence is *shown*, not hidden — we shade the bar lighter and append a small line: *"still listening for this one."*

### Identity at Three Resolutions

When the system writes about the user, it picks resolution from context:

- **Micro** — "this week you've leaned warmer."
- **Meso** — "your atmosphere is late-afternoon, north-facing."
- **Macro** — "you orient toward the quiet that comes *after* a thing, not before it."

A Genome that only speaks at one resolution feels either gossipy (only micro) or grandiose (only macro). The interplay is the craft.

---

## 2. Taste Clustering Engine

### Modalities & encoders

| Modality | Encoder | Output |
|---|---|---|
| Images | OpenCLIP `ViT-L/14` + a finetune head trained on curated aesthetic corpora | 768-d, L2-normalized |
| Audio | CLAP `HTSAT-base` for timbre, plus essentia features (BPM, key, harmonic stability, dynamic range) | 512-d + 9 hand-features |
| Quotes | A sentence-transformer (`bge-m3`) plus a separate prosody pass (sentence rhythm, em-dash density, abstraction level) | 1024-d + 6 hand-features |
| Spaces | Same image encoder + a spatial-properties classifier (interior/exterior, light direction, ceiling height, material palette) | 768-d + 8 hand-features |
| Feeling | Five floats from the sliders + hesitation times | 10-d |

Everything is concatenated, projected into the **Taste Manifold** via a learned linear head (frozen at v1).

### Clustering at two scales

```
              ┌─── UMAP (n_neighbors=15, min_dist=0.1) ─── 2D viz space
raw vectors ──┤
              └─── HDBSCAN (min_cluster_size=2, leaf) ─── micro-clusters
                          │
                          └── theme-merging via cosine ─── currents (4–7)
```

We deliberately use a **small `min_cluster_size`** because we want to honor outliers. A single anomalous image among twenty is *signal*, not noise — it might be the most revealing piece of evidence in the set.

### Cross-modal coherence

The most interesting findings come from where modalities **agree** — and where they **disagree**.

- **Agreement.** If your images cluster around dim warm interiors *and* your music sits at slow BPM with high harmonic stability *and* your quotes index high on the word "ember"-family — that's a robust current. We name it confidently.
- **Disagreement.** If your images are pristine modernist geometry but your music is doom metal — that's a *tension*, and tensions are explicitly surfaced (see §3, *The Counter-Current*). Most taste systems average disagreement out. We preserve it.

### The "recurring attraction" mechanic

The Genome tracks **what you return to**, not what you saved once. After onboarding, every subsequent save updates a per-axis exponential moving average with τ = 30 days. The system literally watches for repetition and weighs it.

```ts
// schematic
ema_axis = ema_axis * exp(-Δt / 30d) + new_evidence_axis * (1 - exp(-Δt / 30d));
```

A second piece of evidence on an axis is worth ~1.8× a first. A third is worth ~2.4×. The system rewards consistency over volume.

---

## 3. Emotional Pattern Analysis

Emotion is not derived from a sentiment classifier. We compose it from three orthogonal readings, then look for patterns *between* them.

### The three readings

1. **Chromatic affect** (from images & spaces)
   - Dominant CIELAB hue distribution
   - Color temperature (Kelvin), median light direction, contrast ratio
   - Saturation entropy (do you save unified palettes or chaotic ones?)
2. **Sonic affect** (from music)
   - Tempo distribution and *variance* (steady souls cluster narrow)
   - Mode (major/minor) and harmonic stability
   - Dynamic range — the gap between your loudest and softest seconds
   - "Negative space" — silence-to-sound ratio
3. **Lexical affect** (from quotes)
   - Valence (Vader + a custom literary lexicon)
   - Abstraction level (concrete nouns ↔ philosophical nouns)
   - Temporal orientation (past-tense density vs. future-tense)
   - Pronoun distribution (first-person, second-person, omitted)

### Patterns we look for

| Pattern | Signature | Surfaced as |
|---|---|---|
| **The Counter-Current** | strong disagreement between any two modalities | "A current runs against the others — and is probably the most truthful part." |
| **The Hour** | tight cluster in light-direction + tempo + temporal orientation | "Your work belongs to ___" (a specific hour) |
| **The Reach** | quotes index abstract, but images index concrete | "You think in ideas and live in textures." |
| **The Refuge** | images and spaces consistently single-light-source, interiors | "You are drawn to enclosure." |
| **The Horizon** | high frequency of edges, distances, exteriors, future-tense | "You are drawn to what hasn't arrived yet." |
| **The Echo** | recurring lexical or visual motif across ≥3 pieces of evidence | "___ keeps appearing. We don't think it's an accident." |
| **The Silence** | a *missing* axis — e.g. no people, no primary colors, no fast tempos | named explicitly: "What you don't show us is also evidence." |

### The Silence is the innovation

Most systems describe what is present. The Genome also describes what is **conspicuously absent**, because absence in revealed preference is the loudest signal psychology offers. A person who saves 24 images and not one contains a human face has told you something important without saying it.

### Emotional pattern output (sample schema)

```ts
type EmotionalPattern = {
  id: string;
  kind: 'counter_current' | 'hour' | 'reach' | 'refuge' | 'horizon' | 'echo' | 'silence';
  axes: string[];           // which axes triggered it
  evidence: EvidenceRef[];  // pieces of user input that contributed
  strength: number;         // 0–1
  prose: string;            // one-sentence observation, generated
};
```

A Genome usually surfaces 2–4 patterns — not 7. More than four and they stop feeling like observations and start feeling like a buffet.

---

## 4. Aesthetic Dimensions — The Fourteen Axes

These are the L2 axes. They are *named in pairs*, because every dimension is a tension between two truths, not a slider from bad to good.

The poles are deliberately chosen to be **incommensurable** — you cannot be "100% one" because the opposing pole is genuinely another mode of being.

| # | Axis | Left pole | Right pole | What it reads from |
|---|---|---|---|---|
| 1 | **Light** | Vesper *(dusk, warm, single source)* | Meridian *(noon, cool, ambient)* | Image hour + color temp |
| 2 | **Density** | Hush *(empty room, negative space)* | Loam *(layered, ornamented)* | Image entropy + audio density |
| 3 | **Tempo** | Stilled *(adagio, long takes)* | Pulsing *(allegro, cut-heavy)* | BPM, cut density, sentence rhythm |
| 4 | **Surface** | Stone *(matte, weighted, mineral)* | Smoke *(diffuse, atmospheric, soft)* | Material classifier + audio reverb |
| 5 | **Geometry** | Wabi *(asymmetry, accident, patina)* | Aurum *(precision, symmetry, gold ratio)* | Edge analysis + composition score |
| 6 | **Distance** | Intimate *(close-up, interior)* | Sublime *(horizon, scale, exterior)* | Image depth + space classifier |
| 7 | **Climate** | Boreal *(cold, dry, mineral)* | Monsoon *(warm, humid, organic)* | Color + saturation + space type |
| 8 | **Era** | Linen *(pre-industrial, handmade)* | Chrome *(post-2020, screen-native)* | Style classifier + audio production era |
| 9 | **Voice** | Whispered *(restraint, ellipsis)* | Declared *(direct, declamatory)* | Lexical analysis + audio dynamics |
| 10 | **Stance** | Inward *(introspection, first-person)* | Outward *(observation, third-person)* | Quote pronouns + image presence-of-self |
| 11 | **Time** | Anteroom *(before, anticipation)* | Afterlight *(after, residue)* | Lexical tense + image hour |
| 12 | **Risk** | Tended *(curated, safe, refined)* | Feral *(raw, unkempt, dangerous)* | Composition + dynamic range + edge cases |
| 13 | **Company** | Solitary *(no people, single occupancy)* | Convivial *(crowds, voices)* | Image content + audio vocal density |
| 14 | **Gravity** | Levitating *(air, sky, lift)* | Rooted *(earth, weight, base)* | Image vertical center of mass + audio low-end |

### Why fourteen

Twelve felt astrological. Sixteen felt MBTI. Fourteen has no cultural baggage and aligns with a half-month, a fortnight, the period the system uses for atmospheric drift checks.

### Display rules

- Never show all fourteen at once. The Genome card shows the **six strongest** by `|axis_value - 0.5| × confidence`.
- Use the **pole names** in display, never percentages. *"Late Vesper, slightly Hushed, strongly Boreal."*
- Pole names are typeset in italic. Numbers exist in the JSON, not on the screen.

---

## 5. Atmosphere Profiling

The atmosphere layer answers a simple question: *if your taste were a place, what would it be?*

Eight concrete profilings:

```
┌──────────────────────────────────────────────────────────────┐
│  Dominant hour:        late afternoon (15:40–17:20)          │
│  Dominant climate:     dry-cool, alpine-coastal              │
│  Dominant material:    oak · linen · brushed brass           │
│  Dominant light:       single source, north-facing, 3200K    │
│  Dominant sound floor: 32–38 dB (quiet room)                 │
│  Dominant pace:        adagio (62 bpm equivalent)            │
│  Dominant scale:       human, single-room                    │
│  Dominant weather:     after rain                            │
└──────────────────────────────────────────────────────────────┘
```

These are not arbitrary — each maps to a measurable cluster of features:

- **Dominant hour** ← K-means on color temperature + light angle of all images, mapped to a circular hour scale.
- **Dominant climate** ← cross-reference of saturation, color, vegetation cues, sky frequency.
- **Dominant material** ← multi-label classifier trained on a curated material taxonomy (no plastic, no acrylic — yes patina, weave, grain).
- **Dominant light** ← histogram of estimated light source counts and color temperature.
- **Dominant sound floor** ← median quiet-frame RMS across audio uploads.
- **Dominant pace** ← BPM equivalent derived even from non-musical inputs (image scan rhythm, sentence length).
- **Dominant scale** ← classified from spatial depth in images and spaces.
- **Dominant weather** ← rare and only assigned if confidence ≥ 0.7; otherwise omitted.

### The Palette

A 5-swatch palette is extracted by:

1. Pooling dominant colors from all images (median-cut, perceptual deduplication in CIELAB).
2. Cross-referencing with the user's color-temperature preference from audio (warm sounds bias the palette warmer in tie-break).
3. *Excluding* the most-frequent color if it is > 35% of pool area — overrepresented colors are background, not character.

The palette is *named*, never just shown.

> *Oak, ash, ember, fog, ink.*

---

## 6. Philosophical Alignment System

This is the most delicate subsystem. Done wrong it becomes horoscopic. Done right it becomes the part of the Genome users quote to each other.

### The schools (a curated set, not exhaustive)

Each "school" is a vector of expected dispositions across the L2 axes plus a corpus of representative quotes, images, and figures.

| School | Disposition signature (sample axes) | Avoid surfacing if |
|---|---|---|
| **Stoic** | Inward · Stilled · Stone · Tended | high Feral, high Convivial |
| **Romantic** | Sublime · Pulsing · Vesper · Feral | high Tended, high Linen-cool |
| **Daoist / Wuwei** | Hush · Wabi · Solitary · Levitating | high Aurum, high Declared |
| **Existentialist** | Inward · Anteroom · Smoke · Whispered | low Inward |
| **Phenomenological** | Intimate · Stone · Whispered · Hush | low Intimate |
| **Transcendentalist** | Sublime · Boreal · Rooted · Outward | high Chrome, high Convivial |
| **Wabi-Sabi** | Wabi · Linen · Stone · Hush | high Aurum, high Chrome |
| **Hedonic / Epicurean** | Loam · Monsoon · Convivial · Afterlight | high Stone, high Hush |
| **Absurdist** | Counter-currents present, high Voice variance, ironic lexical valence | only assigned if a counter-current exists |
| **Buddhist (Zen)** | Hush · Wabi · Solitary · Stilled · Stone | high Loam, high Pulsing |
| **Apophatic / Mystic** | Smoke · Whispered · Anteroom · Levitating · Hush | high Declared, high Rooted |
| **Stoic-Modernist hybrid** | Stone · Aurum · Tended · Inward · Boreal · Chrome | (used for the "Kinfolk-but-rigorous" person) |

### Alignment, not assignment

The system does **not** say "you are a Daoist." It says:

> *"Three of your strongest currents — Hush, Wabi, and Solitary — are also the currents that Daoist aesthetics run along. The kinship is partial: your Tempo is faster than the tradition expects. That faster pulse is yours."*

Alignment is reported as a **kinship score** (cosine of user's L2 vector and the school's prototype vector) and is always paired with the *part that disagrees*. The disagreement is the user's signature.

### The Resonance Set

Instead of a single label, the Genome surfaces **two or three** philosophical resonances, with their respective kinship strengths and their points of friction with the user. The friction is the most-quoted line in many users' Genomes.

```ts
type PhilosophicalResonance = {
  school: SchoolId;
  kinship: number;        // 0–1, cosine similarity
  agreeing_axes: AxisId[];
  disagreeing_axes: AxisId[];
  prose: string;          // generated, includes the friction
};
```

---

## 7. Taste Categories — The Currents

Categories in the Genome are called **currents**, never *types*. A current is a named direction in the manifold, not a box you sit in. A user always has several currents flowing through them at different strengths.

### Properties of a current

- Generated, not predefined — each user's currents are named for them, not pulled from a list of 16.
- Two-word noun phrases, evocative not descriptive: *"Lacquered Dusk", "Northern Linen", "Salt-Air Modernist", "Velvet Cartographer", "Quiet Vermilion", "Cedar Mathematician", "Postcard Pilgrim", "Inland Apothecary".*
- Each current has a **strength** (0–1) and a **stability** (how many weeks it has persisted). Stability is shown as a small annotation: *"steady — 14 weeks"* or *"newly forming."*

### Generation

The naming pass is a Claude call seeded with:

- The top-6 axes for that current's cluster, in pole-name form.
- The dominant palette tokens.
- 3 representative pieces of evidence (image captions, lyric fragments, quote snippets).
- A style brief: *"Two words. Noun phrase. Concrete + atmospheric. No clichés. No 'minimalist', no 'vibes'."*

The model returns 8 candidates; we filter against a blocklist (industry-buzzword corpus) and choose by aesthetic-perplexity scoring against a hand-curated good-list of historical exemplars (Aesop product names, Cosmos film titles, Are.na channel names).

### How many currents

Most Genomes carry **2–4 currents**. We cap display at 3 even if more are detected, and we *say so*: *"There is a fourth current here, fainter. We're watching it."*

---

## 8. Cinematic Personality Report

The headline output of the Genome is **not** a list of attributes. It is a short, cinematic prose portrait — 250 to 400 words, written in second person, structured like an essayistic film.

### Structure (the four acts of the report)

```
┌────────────────────────────────────────────────────────────┐
│  I.   THE PLACE     — set the atmosphere first             │
│           "It is late afternoon, the kind that…"            │
│                                                            │
│  II.  THE PATTERN   — name 2–3 currents with evidence      │
│           "Three things keep appearing in what you save:"  │
│                                                            │
│  III. THE TENSION   — surface the counter-current          │
│           "And then — something else."                     │
│                                                            │
│  IV.  THE LINE      — one sentence, the Mirror             │
│           italic, alone on its own card                    │
└────────────────────────────────────────────────────────────┘
```

The line at the end is the **Mirror sentence** — the same artifact that closes onboarding. It is generated last, after the prose above is written, and is constrained to:

- Exactly one sentence.
- Second person.
- Concrete-then-abstract, or abstract-then-concrete — never both abstract.
- No metaphor that contains the word "you are like…" (similes pulled in this position read as flattery).
- Must be falsifiable in spirit — must say something that *might be wrong*, because only then can it feel like it sees.

### Generation prompt (Claude, sketch)

```
SYSTEM: You are writing one passage of a Taste Genome report. The Genome is a
patient, evidence-led portrait of a person's taste — not a personality test,
not a marketing copy, not a horoscope. You write in second person, present
tense, in the register of a thoughtful art critic who has been handed the
person's private mood board and asked to describe what they see.

Rules:
- Never predict behavior. Only describe what the evidence shows.
- Never flatter. The user must feel observed, not soothed.
- Use concrete nouns. Avoid abstractions unless paired with a specific image.
- Never use "vibe", "aesthetic", "minimalist", "cozy", "main character".
- Italics are reserved for one piece of evidence and the closing line.
- The closing line should be falsifiable in spirit — a real claim about the
  person that might be wrong, not a safe universal truth.

USER: The user's L2 vector, top axes, currents, dominant palette, dominant
hour, philosophical resonances, three counter-current observations, and four
specific pieces of evidence (quotes verbatim, image captions, track titles).
Write the report.
```

### Length, register, and rhythm

- 250–400 words. Below 250 reads thin; above 400 reads indulgent.
- Average sentence length: 14–22 words. The report should *breathe*; one long sentence per paragraph minimum, one short sentence per paragraph minimum.
- One italic phrase per act maximum. Italics are spices.
- No subheadings in the prose itself — the four acts are felt, not signposted.

### Sample (illustrative)

> It is late afternoon in the report you've written without meaning to. *North-facing light, the kind that flatters wood and forgives skin.* The rooms you save have one window each. The music you save has one voice each. Even your quotes — there are three of them, and all three are about leaving.
>
> Three currents run through this: a *Lacquered Dusk* that prefers warmth at the end of a day to warmth at its center; a *Northern Linen* that wants its beauty washed and weighed; and a faint third — call it the *Cedar Mathematician* — that loves precision when no one is watching.
>
> And then — a track you saved at 142 BPM, the only one. A photograph of a fire, the only one. A line about the sea, the only one. These are not mistakes. The most truthful part of a person is often the part that contradicts the rest.
>
> *You don't collect beauty — you collect evidence that the world has been gentle to someone, once.*

---

## 9. Emotional Evolution Map

The Genome is a **moving** portrait. The Evolution Map is the surface where movement is visible.

### Three views

1. **Drift** — a 2D plot in UMAP space of the user's L2 position over time, with a faint trail. Most users sit nearly still and orbit slowly; some drift seasonally; rare users migrate dramatically. The map honors all three.
2. **Axes-over-time** — a small multiples grid of the 14 axes, each shown as a hairline curve over the user's history. *Don't render the y-axis numerically.* Render pole names at the curve's extrema.
3. **Currents-over-time** — a horizontal stacked area chart of named currents' strengths over weeks. New currents arrive; old ones thin.

### Annotation

Significant inflections are marked with a small `·` and a one-line note: *"a turn toward warmer light, around week 9."* The notes are generated and conservative — fewer than the data could justify, so that each one feels earned.

### Temporal granularity

- Weekly samples for the first three months.
- Monthly samples after that.
- The map only renders if the user has at least four weekly samples — before then, the system explicitly says: *"Too early. Come back in a month."*

### The Anchor

The L3 / Constitution layer does not move on the map. It is rendered as a still anchor point on the Drift view — a faint cross. The user's L2 trail moves; the anchor does not. Watching one's L2 trail orbit one's constitution is the single most affecting visualization in the product, and we have built nothing else this earnestly.

---

## 10. Synthesis Pipeline

End to end, from "user finishes onboarding" to "Mirror sentence renders":

```
                            onboarding submit
                                   │
                ┌──────────────────▼──────────────────┐
                │  1. EVIDENCE INGEST                 │
                │  - dedupe (perceptual hash)         │
                │  - normalize (audio loudness,       │
                │    image color space, text          │
                │    encoding)                        │
                │  - parallel upload + embed          │
                └──────────────────┬──────────────────┘
                                   │
                ┌──────────────────▼──────────────────┐
                │  2. ENCODING                        │
                │  - CLIP image (incl. spaces)        │
                │  - CLAP + essentia audio            │
                │  - bge-m3 + prosody quotes          │
                │  - slider floats + hesitation       │
                └──────────────────┬──────────────────┘
                                   │
                ┌──────────────────▼──────────────────┐
                │  3. MANIFOLD PROJECTION             │
                │  - learned linear head → 64-d       │
                │  - split into L1/L2/L3 slices       │
                │  - confidence per axis              │
                └──────────────────┬──────────────────┘
                                   │
                ┌──────────────────▼──────────────────┐
                │  4. CLUSTERING                      │
                │  - UMAP (cache for viz)             │
                │  - HDBSCAN (micro-clusters)         │
                │  - theme merge → 2–4 currents       │
                └──────────────────┬──────────────────┘
                                   │
                ┌──────────────────▼──────────────────┐
                │  5. PATTERN DETECTION               │
                │  - cross-modal coherence            │
                │  - counter-current, hour, reach,    │
                │    refuge, horizon, echo, silence   │
                │  - rank by strength × novelty       │
                └──────────────────┬──────────────────┘
                                   │
                ┌──────────────────▼──────────────────┐
                │  6. ALIGNMENT                       │
                │  - cosine to 12 school prototypes   │
                │  - keep top-3 with their friction   │
                └──────────────────┬──────────────────┘
                                   │
                ┌──────────────────▼──────────────────┐
                │  7. NARRATIVE SYNTHESIS (Claude)    │
                │  - current names (2–4)              │
                │  - cinematic report (4 acts)        │
                │  - mirror sentence (1 line)         │
                └──────────────────┬──────────────────┘
                                   │
                ┌──────────────────▼──────────────────┐
                │  8. PRESENTATION GATE               │
                │  - hold for minimum 30s             │
                │  - render with breath choreography  │
                └─────────────────────────────────────┘
```

### Latency budget

| Stage | Target | Notes |
|---|---|---|
| 1 — Ingest | 1–3s | Uploads run concurrent with later screens |
| 2 — Encoding | 4–8s | GPU pool, batched per modality |
| 3 — Projection | <100ms | Cheap once embeddings are ready |
| 4 — Clustering | 1–2s | UMAP is the bottleneck; cached if user adds < 10% new evidence |
| 5 — Patterns | <500ms | Pure CPU |
| 6 — Alignment | <100ms | Cosine batch |
| 7 — Narrative | 12–20s | Two Claude calls in parallel: currents + report-and-mirror |
| 8 — Gate | 30s minimum | Time is the experience, not a delay |

### Caching & idempotency

Every step writes its output keyed by `(user_id, evidence_hash)`. Re-rendering the Genome with the same evidence is free. Adding a single new piece of evidence triggers only steps 2-onward for that piece, then re-clusters incrementally.

### Updates over time

The narrative report is **regenerated monthly** by default, or on the user's request. The Mirror sentence is regenerated only when the L3 layer has measurably shifted (vector delta > 0.15 cosine) — typically every 4–9 months. A user receives a quiet email when their Mirror changes: *"something in you has slowly turned. when you're ready, come look."*

---

## 11. Failure Modes & Safeguards

The system can fail in specific, named ways. We design against each.

### Fail mode A — Flattery drift

**Symptom.** Reports start to feel like reading a horoscope: warm, agreeable, unfalsifiable.

**Safeguard.** Every report must contain at least one **observation that might be wrong**. The synthesis prompt enforces this, and a post-hoc classifier flags reports with all-affirmative sentences for regeneration.

### Fail mode B — Cultural narrowness

**Symptom.** Vocabulary tilts Japan-Scandinavia-Italy, all images read like a Kinfolk archive, every philosophical resonance is Stoic or Daoist.

**Safeguard.** The school list, the material lexicon, and the palette-naming corpora are explicitly multi-region (West African textile lexicons, South Asian color systems, Latin American spatial archetypes, Middle Eastern light traditions). Generation prompts include a sampling instruction to avoid the four most-common regional words across the last 50 generations.

### Fail mode C — Cold-start emptiness

**Symptom.** A user gives the minimum offerings; the Genome reads thin.

**Safeguard.** The system is transparent: *"This is what we can see so far. There are five rooms we haven't walked through with you yet."* Confidence ribbons are visibly faded. We resist the temptation to confabulate.

### Fail mode D — Type-creep

**Symptom.** Over time, prose starts to lean on a small set of named currents that recur across users.

**Safeguard.** Currents are generated per-user. A weekly job samples 1,000 current names and flags any that recur in >0.5% of users for blocklisting from future generations.

### Fail mode E — Identity capture

**Symptom.** A user starts curating *for the Genome* — saving things to manipulate their report.

**Safeguard.** The L3 / Constitution layer has a slow-decay update rule that explicitly discounts evidence whose timing correlates with Genome views. The product also gently surfaces a note when curation patterns shift: *"You've been saving more deliberately lately. That's fine. The OS will wait for the real ones."*

### Fail mode F — Surveillance feel

**Symptom.** The user feels analyzed, not seen.

**Safeguard.** The voice rules in §8 prohibit predictive phrasing. The system describes evidence, never inferred behavior. It never says: *"You probably have trouble with…"* It can say: *"Your evidence is unusually quiet — the loud parts of life appear here only as their aftermath."* The difference is everything.

---

## Closing note

The Genome's job is small and difficult: to tell a person something true about themselves that they had not yet said out loud — and to do it without flattery, without category, and without claiming more than the evidence allows.

If we succeed, the user will keep a screenshot of one sentence somewhere private — a notes app, a journal, a wallpaper. That sentence is the only metric we trust.
