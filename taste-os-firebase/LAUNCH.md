# Taste OS — Soft Launch

Not a campaign. Not a viral release. Not a hype-driven AI launch.
A quiet emotional discovery — a calm space people slowly find.

> The feeling we're after: *"이상하게, 인터넷의 다른 모든 것과 다르게 느껴진다."*

We optimize for **emotional memory, quiet resonance, meaningful sharing,
emotional attachment** — never virality, addiction, growth loops, or engagement
tricks. No countdowns, no "join 10,000 others", no urgency.

---

## 1. Soft-launch landing (`/`)

A slow cinematic intro a person falls into — not a pitch:
1. a faint wordmark, then the poem ("당신은 어떤 분위기 속에서 가장 오래 머무르나요?")
2. "사람은 자신이 사랑하는 공기의 결을 닮아갑니다."
3. a calm invitation — **조용히 들어가기** → `/beta`, or **공기만 먼저 느껴볼게요** → `/onboarding`
4. what it is, atmospherically: "점수도, 유형도, 진단도 없어요…"
5. a closing line that lingers: "당신은 계속 변하고 있습니다…"

Mobile-first, `100svh`, made for night. No feature lists anywhere.

---

## 2. Emotional waitlist (`/beta`)

Personal, cinematic, quietly exclusive — never a startup waitlist:
- an invite code opens the door; otherwise a quiet place is held
- no counts, no countdowns: "이건 줄 서기가 아니라, 조용한 약속이니까요."

---

## 3. Introductory copy (Korean-first)

Reuse, verbatim, in posts / DMs / the few places we share:

> 당신은 어떤 분위기 속에서 가장 오래 머무르나요?
>
> Taste OS는 점수도, 유형도, 진단도 내리지 않아요.
> 그저 당신이 사랑하는 것들 뒤에 흐르는 공기를,
> 조용히 비춰드릴 뿐이에요.
>
> 떠난 뒤에도, 마음 어딘가에 남는 한 문장처럼.
>
> — 조용히 열어두었어요.

Tone: reflective, subtle, atmospheric, intimate. Never an exclamation mark.
Never "AI-powered", "revolutionary", "10x", "productivity".

---

## 4. Sharing philosophy

Sharing here is **passing a quiet emotional fragment**, not content marketing
or social virality. A person shares because a line *landed*, not to perform.

- The Sharing card (`/sharing`) draws genome + a line + palette from the user's
  own Taste Report — a small portrait, not a flex.
- No like counts, no follower mechanics, no reshare loops. (See the static
  `../taste-os/sharing-studio.md` for the full philosophy.)
- A shared card should make the receiver feel *invited inward*, not sold to.

---

## 5. Launch assets (in-repo, generated)

- **OG / Twitter image** — `src/app/opengraph-image.tsx` (+ `twitter-image.tsx`):
  generated cinematic card (warm darkness, sigil, one quiet line). No hype text.
- **Icon / favicon** — `src/app/icon.svg` (the sigil arc on night).
- **Typography** — Cormorant Garamond italic + Noto Serif KR; the wordmark is
  letter-spaced Inter, never a logo lockup.
- **Ambient motion** — the live `AmbientField` (orbs/dust/grain) *is* the motion
  graphic; teaser clips are screen-captures of the real intro at night, not
  produced ads. Generated ambient sound lives at `../taste-os/sound/`.

> Teaser clips: record the actual `/` intro on a phone, at night, in one slow
> take. The product is the asset.

---

## 6. Mobile launch experience

Optimized for nighttime, soft scrolling, cinematic pacing, atmospheric depth:
`100svh` + safe-area, momentum scroll, no tap-highlight, reveal-on-arrival,
particle counts scaled down, everything honours `prefers-reduced-motion`.
(See `DEPLOY.md` §5.)

---

## 7. Atmosphere consistency (every touchpoint)

- One palette, one type voice, one set of three easings, the sigil everywhere.
- Narration stays subtle (voice guardrail), motion stays breath (no <200ms).
- Emotional silence is preserved — quiet space sections, gaps between lines.
- The OG card, the landing, the app, and any post all feel like one room.

---

## 8. Launch reflection

Listen, don't measure (see `TESTING.md`):
- emotional reactions + reflective feedback (`ReflectionPrompt`, `/reflect`)
- kept lines ("이 문장, 간직하기") + saved-screenshot proxy
- the four quiet questions (어떤 문장이 가장 오래 기억에 남았나요? …)
- memorable moments noted in QA sessions (mobile, night, in silence)

No virality dashboards. The signal we care about: *do people quietly come back,
and can they recall a line days later?*

---

## 9. The one rule

If any of it starts to feel like an AI startup launch — louder, faster,
growth-shaped — stop and make it quieter. Taste OS should launch like a room
someone slowly falls into, and carries with them after they leave.
