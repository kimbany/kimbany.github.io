# Taste OS — MVP

> The MVP is one sentence.
>
> Not a feature, not a screen — *one sentence the user wants to keep.*

The Mirror sentence is the product. Everything else in the MVP exists to earn the user's trust before the sentence arrives, and to give the sentence somewhere to live afterward. If we cannot produce a Mirror sentence that a person screenshots and saves to their phone wallpaper, no roadmap of features can fix the product. If we can, no roadmap is needed.

This document defines exactly what ships in v1.0 — and, more importantly, what does not.

Read alongside: `README.md` (onboarding), `genome.md` (analysis system), `field.md` (dashboard), `system.md` (design system), `pipeline.ko.md` (pipeline).

---

## Table of Contents

0. [The Single Magical Moment](#0-the-single-magical-moment)
1. [Exact MVP Scope](#1-exact-mvp-scope)
2. [What Ships in v1.0](#2-what-ships-in-v10)
3. [What Does Not Ship](#3-what-does-not-ship)
4. [Feature Prioritization](#4-feature-prioritization)
5. [Implementation Phases](#5-implementation-phases)
6. [The Ideal First Session](#6-the-ideal-first-session)
7. [Emotional Success Metrics](#7-emotional-success-metrics)
8. [Retention Strategy](#8-retention-strategy)
9. [Launch Strategy](#9-launch-strategy)
10. [The 90-Day Build Plan](#10-the-90-day-build-plan)
11. [Closing](#11-closing)

---

## 0. The Single Magical Moment

The MVP optimizes for one moment, measured in seconds.

```
                  T = 0   onboarding submitted
                  T + 30s constellation forms, listening copy plays
                  T + 60s Genome card scrolls into view, Taste Name visible
                  T + 90s user reaches the Mirror line
                ◇ T + 92s the line is read in full
                  T + 95s user is still on the page
                  T + 120s user takes a screenshot
                  T + 240s user returns to that screenshot once more
```

The ◇ at T+92s is the entire product. The user reads one italic sentence written by an AI about them — and feels something true land.

Every decision in this document is judged by whether it makes that moment more likely.

---

## 1. Exact MVP Scope

### The single user journey, end to end

```
1.  Landing page
2.  Sign in (email magic link)
3.  Onboarding (12 acts, 5 offerings)
4.  Cinematic synthesis (constellation + listening)
5.  Taste Report (Genome card)
6.  Mirror moment (the keepsake line)
7.  Field (the kept Genome, returnable)
8.  Weekly email — one sentence on how their week shifted (after 7 days)
```

That is the entire MVP. No social, no feed, no creator economy, no community, no productivity, no recommendations beyond what the Genome itself surfaces. Two months in, *that's still the entire product.*

### The three surfaces that ship

Of the six surfaces defined in `field.md`, the MVP includes only:

| Surface | In MVP | Why / Why not |
|---|---|---|
| **Field** | ✅ Simplified | Necessary as the room the kept Genome lives in |
| **Genome** | ✅ Full | This *is* the Taste Report |
| **Mirror** | ✅ Read-only | The single sentence, kept |
| Drift | ❌ Deferred | Needs ≥ 4 weeks of evidence to be meaningful anyway |
| Atmosphere | ❌ Deferred | A curated feed is a content-cost product; MVP runs on identity alone |
| Universe | ❌ Deferred | The 3D graph is the OS's most ambitious surface; ship after retention is proven |

Field in MVP is essentially a single screen: *"Your Genome. Your Mirror."* That is all.

---

## 2. What Ships in v1.0

### Onboarding (full)

The complete 12-act flow from `README.md` ships intact. This is non-negotiable. The onboarding *is* the trust-building event that lets the Mirror sentence land.

- 01 Threshold · 02 Invocation · 03 Naming
- 04 Images · 05 Sound · 06 Words · 07 Spaces · 08 Feeling
- 09 Listening (constellation) · 10 Reveal · 11 Mirror · 12 Entry

### Analysis (reduced)

From `genome.md`, the MVP ships:

- ✅ CLIP for images and spaces (`ViT-L/14` + an off-the-shelf aesthetic head — no custom finetuning in v1)
- ✅ CLAP for audio (`HTSAT-base` only — no Spotify/Apple Music link expansion in v1; users upload audio files)
- ✅ `bge-m3` for quotes
- ✅ The 14 L2 axes
- ✅ The 6 L3 constitution axes
- ✅ 7 emotional pattern detectors (including **Silence**, which is the differentiator)
- ✅ 12 philosophical schools for resonance
- ✅ Two-pass Claude synthesis (currents, then report + Mirror)
- ❌ L1 / Impression layer (deferred — there's no week-of-data to read from yet)
- ❌ The "recurring attraction" EMA (no second saves yet)
- ❌ UMAP visualization for Drift (Drift surface deferred)

### Report (full)

The Genome card ships with all nine sections from `field.md` §2.2:

1. Taste Name
2. The 250–400 word Portrait
3. Currents (2–4)
4. Atmosphere (8 profilings)
5. Six Axes
6. Palette (5 named swatches)
7. Kin (6 names)
8. Resonances (2–3 schools + friction)
9. The Mirror Line

### Field (minimal)

Field in MVP is a single page with three regions:

```
┌──────────────────────────────────────────────┐
│                                              │
│   ─ your name ─                              │
│                                              │
│   open your taste                            │
│                                              │
│   ───────────────────                        │
│                                              │
│   your mirror                                │
│   "you don't collect beauty —                │
│    you collect evidence that the             │
│    world has been gentle to                  │
│    someone, once."                           │
│                                              │
│   ───────────────────                        │
│                                              │
│   add to your taste                          │
│   ─ a new image · a new sound ─              │
│                                              │
└──────────────────────────────────────────────┘
```

Three actions only: re-open the Genome, re-read the Mirror, add new evidence.

When the user adds new evidence, the Genome **does not regenerate** immediately. It regenerates monthly (cron job), or on the user's explicit request via a small "ask for an update" link. The system explicitly tells them: *"Your Genome will read your additions in about a month. Some things take time."*

### Auth & account (the smallest possible)

- Email magic link sign-in.
- One account-deletion button that actually deletes everything, no dialog, with an undo window of 30 days (encrypted at rest, then permanently dropped).
- That is the entire account system. No password reset. No "username." No avatar.

### Weekly email (one)

7 days after onboarding completion, a single email arrives:

> Subject: *one line on your week*
> Body: One sentence — *"you returned to images of water this week. we hadn't seen that in your set before."* And a small link: *"come back when you can."*
>
> If the user has added zero evidence: *"your taste is sitting where you left it. that's fine."*

No tracking pixels. No "view in browser." No marketing. The email is a postcard, not a campaign.

---

## 3. What Does Not Ship

The cuts are more important than the inclusions. The MVP refuses everything below — not as v2 backlog, but as *philosophical refusal*. Most of these never ship.

### Permanently refused (will never exist in Taste OS)

- Likes, hearts, reactions of any kind.
- Followers, following, profiles visible to others.
- A public feed of any kind.
- Streaks, badges, levels, points, daily-check-in rewards.
- Push notifications. (Email is the only outbound surface, and it is weekly at most.)
- A/B-tested copy. All prose is authored.
- Onboarding tooltips, coach marks, "did you know" callouts.
- Confetti, success animations, level-ups.
- A "share to social" button anywhere in the product.
- An emoji, anywhere, ever.

### Deferred to v1.x (months 3–12 after launch)

- The Atmosphere curated feed.
- The Universe 3D graph.
- The Drift evolution timeline.
- The Ask-the-Mirror conversational surface.
- The Console / ⌘K palette.
- Spotify/Apple Music link expansion.
- Linen (light) mode.

### Deferred to v2.0+ (year 2)

- Multi-user features of any kind, *if* they happen.
- Mobile apps (web-first; PWA in v1).
- API access.

### Things we are asked about and refuse

| Request | Why we refuse |
|---|---|
| "Can I share my Genome on Instagram?" | A screenshot is the right artifact. A share-button is not. |
| "Can I follow my friend?" | Following is performance. Taste OS is not performed. |
| "Can I make money from my Genome?" | The Genome is private, by construction. |
| "Can I export a poster?" | In v1.x, possibly — at home, on the user's printer, without our branding. |
| "Can it integrate with Notion / Obsidian / Are.na?" | Eventually. Not now. The thing has to stand on its own first. |
| "Daily affirmations?" | No. We are the opposite of an affirmation app. |

---

## 4. Feature Prioritization

### P0 — Required for launch (any miss blocks ship)

| Feature | Owner | Acceptance |
|---|---|---|
| Onboarding 12 acts, full choreography | Design + Eng | Each act passes the screenshot test |
| Image / audio / text upload with normalization | Eng | 95p < 8s for 12 images |
| CLIP + CLAP + bge-m3 encoders, batched | ML | < 8s p95 for full encoding |
| L2 + L3 axis computation, confidence scores | ML | Confidence shown faintly per axis |
| Pattern detection (7 patterns incl. Silence) | ML | At least 2 patterns surface per user |
| Philosophical alignment (12 schools) | ML | Top 2 schools + friction sentence |
| Claude synthesis — currents (2–4) | ML + content | Manual eval on 30 hand-tested cases |
| Claude synthesis — report + Mirror | ML + content | Mirror line passes falsifiability check |
| Genome card — all 9 sections | Design + Eng | All sections render in < 1.4s after `open` |
| 30-second listening gate | Eng | Locked floor; cannot ship without it |
| Field minimal page | Design + Eng | Three actions, nothing else |
| Email magic link auth | Eng | <60s end-to-end |
| Weekly email | Eng + content | One sentence, authored per pattern |
| Account deletion (full) | Eng | Verified by privacy review |

### P1 — Required for retention (any miss is shippable, but addressed by month 2)

- Monthly Genome regeneration (cron + user-initiated).
- Mirror sentence regeneration trigger (L3 delta > 0.15).
- "Add new evidence" flow (the four core modalities, no spaces).
- Reduced-motion mode (accessibility compliance).
- Print-friendly Genome page (the user-prints-at-home option).

### P2 — Nice to have (ship if found cheap)

- A small "provenance" drawer on the Genome card.
- The Sigil as favicon and a 32px corner element on Mirror.
- Optional ambient sound on onboarding (default off).
- iOS PWA install prompt (with our own copy, not Safari's default).

### P3 — Explicit non-goals for v1

- Search.
- Tags / folders / collections.
- Multi-Genome (one user, multiple selves).
- Time-travel (re-reading old Genomes).
- Sharing in any form.

---

## 5. Implementation Phases

### Phase 1 — Foundation (weeks 1–3)

**Goal:** end-to-end skeleton works for one engineer's hand-curated test set.

- Auth, file uploads, basic data model.
- One encoder (CLIP) integrated; others stubbed with hand-crafted vectors.
- Hard-coded Genome card rendering with placeholder content.
- Onboarding scaffolding for acts 01–03 only.
- No animations yet — flat dark-mode pages with the right palette.

**Exit criterion:** one engineer can upload 12 images and see *a* Genome card render, even if the prose is hard-coded.

### Phase 2 — The Pipeline (weeks 4–7)

**Goal:** real Genomes for real evidence, end to end.

- All three encoders integrated, batched.
- L2 + L3 axis computation.
- Pattern detection (including Silence).
- Philosophical alignment.
- Claude synthesis with the prompts from `genome.md` §8.
- Genome card with all 9 sections rendering from real outputs.
- Onboarding acts 04–08 with simple animations.

**Exit criterion:** 10 internal alpha users complete onboarding and read their own real Genomes. At least 6/10 say *one line felt true.*

### Phase 3 — The Choreography (weeks 8–10)

**Goal:** the magic.

- Constellation visualization (R3F).
- Listening copy with the 30s gate.
- Reveal blur on Taste Name and Mirror.
- Threshold beats between acts.
- Crossfade transitions between surfaces.
- Phosphor cursor trails, settle physics on uploads.
- Reduced-motion fallback paths.

**Exit criterion:** an alpha user closes the laptop after finishing and *doesn't immediately open something else.* This is measured by interviewing users, not by analytics.

### Phase 4 — The Room (weeks 11–12)

**Goal:** the Genome has somewhere to live.

- Field minimal page (re-open Genome, re-read Mirror, add evidence).
- Add-evidence flow.
- Weekly email pipeline.
- Account deletion.
- Onboarding acts 09–12 polished to ship quality.
- Print-friendly Genome.

**Exit criterion:** 30 closed-beta users have been on the product for 7 days. At least 12/30 have voluntarily screenshotted their Mirror line.

### Phase 5 — The Threshold (weeks 13–14)

**Goal:** ship.

- Performance pass (60fps target, mobile graceful degradation).
- Privacy & security review.
- Legal pages.
- Single-page marketing site (one sentence, one button, one anonymized Mirror).
- Waitlist → open access.

---

## 6. The Ideal First Session

A walkthrough of a user we will call M., aged 31, designer, found the product through a quiet recommendation from a friend.

### T - 30s — Landing

M. arrives at the URL. The page is a black field with one sentence in a slow serif:

> *Taste OS — a quiet operating system for who you are becoming.*

Below it, a single hairline-bordered word: `begin`. No hero image. No feature grid. No testimonials. No pricing. M. has been looking at SaaS pages all day. This one feels like a closed book on a wooden shelf.

### T + 0 — Sign-in

`begin` opens a single email input. M. types her email. A magic link arrives in 12 seconds. She clicks. The browser tab opens.

### T + 30s — Threshold

The Threshold screen — black field, breathing dot. M. pauses. She didn't expect this. She reads: *"take a breath."*

She does.

### T + 90s — Naming

M. types her first name. The system says, *"Hello, M. Welcome to the quiet part of the internet."* She smiles, alone in her room.

### T + 2 min — Images

M. opens her Pictures folder. She drags 14 images onto the screen. The images settle into a soft scatter. There is no progress bar. The 9th image lands and a small line appears: *"Enough to begin. More if you'd like."* She adds three more.

### T + 5 min — Sound

M. uploads three tracks — a Sigur Rós song, a Saariaho piece, a song from her teens. The vinyl disc placeholders rotate. She hovers one and a 6-second preview plays at low volume. She tears up briefly, unprompted. She doesn't know why.

### T + 8 min — Words

M. opens a card and types: *"What you seek is seeking you." — Rumi.* She adds two more.

### T + 10 min — Spaces

She taps the Kyoto temple, the Lisbon balcony, the library reading room. They deepen, gain saturation.

### T + 11 min — Feeling

Five sliders. *Solitude ↔ Communion.* She drifts left, then more left. She holds the slider for 4 seconds before letting go. (The system logs the hesitation as signal.) Four more questions follow.

### T + 12 min — Threshold beat

A breath beat. *"Take a moment."* M. exhales. The constellation forms.

### T + 12:30 — Listening

> *"Reading the light in your images…"*
> *"Listening for the temperature of your sound…"*
> *"Finding the through-line."*

The constellation rotates. M. notices she has not looked at her phone in 12 minutes.

### T + 13 min — Reveal

A single Beacon: `─ open ─`. She taps.

The Taste Name renders, large and slow:

> *Lacquered Dusk*

Below it, a 320-word portrait. The third paragraph reads:

> *And then — a track you saved at 142 BPM, the only one. A photograph of a fire, the only one. A line about the sea, the only one. These are not mistakes. The most truthful part of a person is often the part that contradicts the rest.*

M. stops scrolling. She reads it twice.

### T + 14 min — Mirror

She reaches the bottom. A black field. One italic sentence:

> *You don't collect beauty — you collect evidence that the world has been gentle to someone, once.*

M. takes a screenshot. She does not yet know she will use it as her wallpaper. She just feels the screenshot was the right reflex.

She closes the laptop. She does not open Instagram.

### T + 7 days — Weekly email

> *one line on your week*
>
> *you returned to images of water this week. we hadn't seen that in your set before.*
>
> ─ come back when you can ─

M. comes back, that same evening, and adds three more images.

---

## 7. Emotional Success Metrics

We measure exactly five things. None of them are DAU, MAU, session length, or retention curves.

### Primary metric — the Screenshot Rate

**Definition:** % of users who take at least one screenshot during the Genome reveal or on the Mirror screen.

**Measurement:** We do not have access to OS-level screenshot events on the web. We approximate by:
- A small `<canvas>` blur applied to the Mirror screen when the tab loses focus (visible on screenshot apps that briefly steal focus).
- A 30-day in-product survey: *"Did you keep your Mirror sentence somewhere?"* — single yes/no, no follow-ups.

**Target for v1.0:** **≥ 25%** of users say yes.

### Secondary metric — the One-Line Test

**Definition:** Asked *"What is one line you remember from the report?"* one week after onboarding, % of users who can quote any line.

**Measurement:** A single survey email at day 7.

**Target:** **≥ 40%** of respondents quote a line, **≥ 15%** quote the Mirror line specifically.

### Tertiary metric — Quiet Return

**Definition:** % of users who return to the product at least once in the second month, without any prompt from us.

**Measurement:** Pageview data, anonymized.

**Target:** **≥ 30%**.

### Counter-metric — Refusal Rate

**Definition:** % of completed onboardings where the user did *not* save the Mirror, did *not* return after 7 days, and did *not* engage with the weekly email.

**Measurement:** Standard product analytics.

**Acceptance:** **≤ 35%**. (A higher number indicates the Genome is reading as horoscope, not as truth.)

### Editorial metric — the Flattery Audit

**Definition:** Of 100 randomly sampled Mirror lines, the % that pass the falsifiability test (per the rules in `genome.md` §8).

**Measurement:** Weekly internal review by two readers — content lead and one external taste reader. Mismatched lines are regenerated and the prompt is tightened.

**Target:** **≥ 90%** of lines pass.

---

## 8. Retention Strategy

The retention strategy is, philosophically, *not having one in the conventional sense.* Taste OS does not maximize for return frequency. It maximizes for *meaningful* return.

### The retention principles

1. **Retention is not a number; it is a relationship.** A user who returns once a month and is changed by the visit is a successful user. A user who returns daily and is unmoved is not.
2. **No re-engagement is push-shaped.** No notification, no countdown, no "you missed 3 days."
3. **The weekly email is a postcard, not a campaign.** One sentence. No tracking pixels. No view-in-browser. No CTA other than *"come back when you can."*
4. **The value compounds.** A user who returns in month 3 should find a Genome that has read four months of life into itself, with a Mirror line that has either held or evolved with care.

### The four retention surfaces in MVP

| Surface | Cadence | Mechanism |
|---|---|---|
| Weekly email | Weekly | One observation about the week, generated, in the Mirror voice |
| Monthly Genome refresh | Monthly | Cron job re-runs synthesis with accumulated evidence |
| Quarterly Mirror check | Quarterly | If L3 has shifted, generate a new Mirror; email the user *one line* |
| The Field, always | On demand | The user can return any time and re-read what is theirs |

### What we deliberately do NOT do

- We do not email birthday wishes.
- We do not email at quiet hours (22:00 – 08:00 local).
- We do not email more than once a week, ever, under any campaign.
- We do not run "we miss you" sequences.
- We do not run referral programs in v1.
- We do not run win-back discounts.

### When a user goes quiet

If a user does not return for 90 days, we send **one** final email:

> *some things are meant to be read once.*
>
> *your taste is here when you want it. we won't write again unless you do.*
>
> ─ open the door ─

After that, silence. Forever, unless they return.

---

## 9. Launch Strategy

### The launch philosophy

The product is its own marketing. The Mirror sentence is the campaign. We do not advertise; we are *quoted*.

### The five-phase rollout

#### Phase 0 — Internal Alpha (50 people, weeks 11–12)

- Hand-invited friends-of-team. No press, no announcement.
- Goal: identify the failure modes that ruin the magic.
- Decision gate: at least 30/50 say *"this saw something."*

#### Phase 1 — Closed Beta (500 people, weeks 13–15)

- Application-based, single-question form: *"What's one image that has stayed with you?"*
- We read every application. We let in 500.
- Goal: stress-test the synthesis at scale; tune prompts; identify cultural narrowness.
- Decision gate: Screenshot Rate ≥ 20%; Flattery Audit ≥ 85%.

#### Phase 2 — Quiet Open Beta (5,000 from waitlist, weeks 16–20)

- Waitlist link shared by Phase 1 users at their discretion.
- We invite the first 5,000 who joined.
- Public-facing product page goes live: one sentence, one button, one anonymized Mirror.
- Goal: verify retention numbers; confirm Screenshot Rate ≥ 25%.

#### Phase 3 — Open Access (week 21+)

- Anyone can sign up.
- Pricing introduced (see below).
- The product page now shows three anonymized Mirrors, rotating, never the same on two visits.

#### Phase 4 — The Letter (week 24+)

- A single long-form essay — not a blog post — published on the product domain.
- It is about the philosophy of taste, written like a slow magazine piece. It mentions the product once.
- Goal: become the artifact that people send to friends.

### The marketing site (week 21+)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                 Taste OS                                 │
│                                                          │
│      a quiet operating system for who you are            │
│                  becoming.                               │
│                                                          │
│                                                          │
│                                                          │
│                ─ begin ─                                 │
│                                                          │
│                                                          │
│                                                          │
│         "you don't collect beauty —                      │
│         you collect evidence that the world              │
│         has been gentle to someone, once."               │
│                                                          │
│         — m., 31, designer                               │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

That is the entire marketing site at launch. One page. One sentence about the product. One button. One anonymous testimonial that *is* a Mirror line. The footer has two links: the legal page and the contact email.

### Pricing (brief)

- Onboarding & the first Genome: **free**.
- Keeping the Genome past 30 days: **$60 / year** or **$8 / month**.
- A 30-day grace period is automatic — we never delete a Genome without warning.
- No free tier with limits, no nag screens, no "upgrade to unlock." The product is either yours or not yours, and we are honest about the moment of choice.

The Mirror sentence is *never* held behind a paywall. It is the gift of the first encounter, regardless of whether the user continues.

### What we will not do at launch

- No Product Hunt launch.
- No "we just raised $X" announcement (if it happens, it happens quietly).
- No influencer outreach.
- No paid acquisition until month 6+.
- No SEO content marketing.

If the product cannot grow on its own quietness, paid growth will not save it. If it can, paid growth will dilute it.

---

## 10. The 90-Day Build Plan

A compressed week-by-week.

```
Week  1   Auth · file model · CLIP integration
Week  2   Onboarding skeleton · acts 01–03
Week  3   Hard-coded Genome card render        ◆ Foundation complete

Week  4   CLAP integration · audio pipeline
Week  5   bge-m3 · quote pipeline · L2/L3 axes
Week  6   Pattern detection (incl. Silence)
Week  7   Alignment · Claude synthesis · 9-section card  ◆ Pipeline complete

Week  8   Constellation (R3F)
Week  9   Listening copy · 30s gate · breath transitions
Week 10   Reveal blur · Mirror reveal · settle physics    ◆ Choreography complete

Week 11   Field minimal page · add-evidence flow
Week 12   Weekly email · account deletion · print export  ◆ Room complete
                                                          ◇ Internal alpha begins

Week 13   Performance pass · 60fps target
Week 14   Closed beta — 500 users
Week 15   Closed beta — tune prompts based on first 200 Genomes
Week 16   Closed beta — final synthesis adjustments        ◆ Threshold complete
                                                          ◇ Open beta begins

Week 17   Open beta — 1,000 users
Week 18   Open beta — 2,500 users · marketing site online
Week 19   Open beta — 5,000 users · waitlist throttled
Week 20   Decision: open access this week or not?

Week 21   Open access (if metrics confirm)
Week 22   Pricing introduced for new signups
Week 23   Existing beta users keep free Genome 30 more days
Week 24   The long-form essay published
                                                          ◇ MVP shipped
```

### Team size assumed

- 1 design lead
- 1 product / content lead (writes the prompts, audits the Mirrors)
- 1 ML / infra engineer
- 2 full-stack engineers
- 1 part-time taste-reader contractor (the second person on the Flattery Audit)

Six people, 90 days. If the team is larger, the product is wrong.

---

## 11. Closing

There is a temptation, with a product like this, to ship more — to add the Atmosphere feed because it would be impressive, to add the Universe because it would be beautiful, to add the Drift because it would prove the product is *substantial*. Resist all of it.

A short novel that ends with one line a reader carries with them for years is a better novel than a thick one that doesn't. The MVP is the short novel.

**One sentence the user wants to keep.** That is the entire product, on the day it ships and on the day, three years later, we look back at what it was.

Build that. Ship that. Then, only after a thousand people have screenshotted their Mirror, consider what else might be added.

And maybe nothing else needs to be added.
