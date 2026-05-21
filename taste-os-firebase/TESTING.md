# Taste OS — Real User Emotional Testing

This is **not** usability testing, product validation, or engagement
optimization. We are listening for **emotional resonance** — whether the
experience stays with someone after they leave.

> The only success metric: *"이 경험이, 떠난 뒤에도 내 감정 속에 남아 있다."*

We optimize for **emotional memory, reflective attachment, meaningful
revisits, resonance** — never addiction, session length, productivity, or
virality. (There is no analytics, funnel, or retention-cohort code anywhere.)

---

## 1. What we observe (and how it's instrumented)

Only emotion-first signals, all consent-based, owner-scoped, write-only, never
shown back as a feed and never used for ranking / ads / notifications.

| Signal | Meaning | How |
|--------|---------|-----|
| `lingered` | a person stayed inside a moment | `useResonance().lingerRef` — dwell > 6s on a region |
| `kept` | a line worth carrying | "이 문장, 간직하기" button + tab-hidden-while-line-shown (a pause/screenshot proxy) |
| `returned` | a meaningful revisit | recorded on surface mount (`useResonance(surface)`) |

Reflections (explicit, in `reflection_feedback`):
- "어떤 문장이 가장 오래 기억에 남았나요?"
- "어떤 순간에 가장 이해받는 느낌이 들었나요?"
- "다시 들어오고 싶은 감정이 있었나요?"
- "이상하게 계속 생각나는 장면이 있었나요?"

(Rendered one at a time by `ReflectionPrompt` / the `/reflect` room.)

---

## 2. Emotional friction detection (QA only)

`NEXT_PUBLIC_EMOTIONAL_QA=1` activates `FrictionProbe`, which whispers to the
team (`friction_signals`) when immersion risks breaking:

- `fast_pacing` — flicking past a narration faster than it can breathe
- `agitation` — 4+ taps in 1.2s (an immersion break)
- `cold_narration` — a degraded/robotic fallback line was shown
- `immersion_break` — reserved for SaaS-like moments found in review

Off by default in production. Never user-facing.

---

## 3. Emotional QA sessions (run by a human, by feeling)

Conduct these in the conditions the product is *for*:

- **Mobile, at night, lights low.** Sound on if available.
- **In silence.** Don't narrate over it. Watch for the silent pauses.
- Note where the person **lingers**, **screenshots / says a line aloud**, or
  **scrolls back up** to re-read.

Per-session rubric (note moments, not scores):
- [ ] First 30s — does it feel unlike any other AI product?
- [ ] Narration timing — do lines land in the silence, or rush?
- [ ] Cinematic scrolling — does it *slow them down* gently?
- [ ] Atmosphere continuity — does the air flow unbroken across screens?
- [ ] The report — is there a line they go quiet after?
- [ ] Leaving — do they say they'd come back? (and *why* — longing, not habit)

---

## 4. Emotional friction checklist (what we're hunting)

- [ ] Anywhere pacing feels **too fast** / snappy (should be breath, never < 200ms)
- [ ] Any **emotionally cold** UI moment (a form, a button, a label that breaks the room)
- [ ] Any **robotic narration** (translationese / self-help / exclamation / numbers)
- [ ] **Overwhelming** transitions (too much moving at once)
- [ ] **SaaS-like** moments (settings, dashboards-as-analytics, notifications)
- [ ] Immersion-breaking interactions (errors shown harshly, abrupt loads)

---

## 5. Emotional polish iteration loop

After each round, refine — slowly, one variable at a time:
- spacing & vertical rhythm · motion timing (the three easings) · typography
  rhythm · narration subtlety (prompt + guardrail) · transition softness ·
  ambient atmosphere density (particle counts, orb opacity).

Ship a change only if it makes the room feel **quieter and more alive**, not
busier. If a metric tempts you toward "more time on app", ignore it — that is
the wrong gravity for this product.

---

## 6. Privacy posture

Resonance signals and reflections live under the user's own id, write-only
from the client, with no read path and no aggregation into a profile for
targeting. They exist for one reason: to let the room **deepen around the
person**, and to help us make the experience more human. They can be exported
or released with the rest of the user's memory.
