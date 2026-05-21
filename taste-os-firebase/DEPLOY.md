# Taste OS — Deployment & Beta

Web on **Vercel** (Seoul `icn1`), backend on **Firebase** (Auth · Firestore +
vector · Storage · Functions), AI on **OpenAI**. The launch should feel like
quietly opening a room — see `../taste-os/launch.md` for the soft-launch ethos.

## 1. Firebase (production)

```bash
firebase login
firebase use production            # alias in .firebaserc → your project
npm run fb:rules                   # firestore.rules + storage.rules
npm run fb:indexes                 # vector + composite indexes (wait for build)
firebase functions:secrets:set OPENAI_API_KEY
npm run fb:functions               # embed / analyzeImage / narrate / onMemoryCreated
```

- Auth: enable **Anonymous** + **Google** (+ Apple) providers; add the Vercel
  domain to authorized domains.
- Seed a few `beta_invites/{CODE}` docs `{ active: true }` for invitees.

## 2. OpenAI (production)

- Org setting: **opt out of training**; all calls already set `store: false`.
- Set a usage cap + budget alerts. Rate limits are enforced in-app
  (`lib/server/rateLimit.ts`: 20 narrations/min, 10 vision/min per user).

## 3. Vercel

Import the repo (root = `taste-os-firebase/`). Set env vars (Production +
Preview separately):

```
# client-safe
NEXT_PUBLIC_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID /
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET / MESSAGING_SENDER_ID / APP_ID
NEXT_PUBLIC_SITE_URL=https://tasteos.app
# server-only — never NEXT_PUBLIC
OPENAI_API_KEY
FIREBASE_SERVICE_ACCOUNT      # service-account JSON (stringified)
MEMORY_ENCRYPTION_KEK
```

`vercel.json` pins the region + security headers; `next.config.mjs` adds header
hardening, `optimizePackageImports`, image AVIF/WebP, and disables the
`x-powered-by` header.

```bash
npm run typecheck && npm run build   # verify before promoting
```

## 4. Production checklist

- [ ] `npm run build` clean; no server secrets in any `NEXT_PUBLIC_` var
- [ ] Firestore rules deny everything by default; beta collections owner-scoped
- [ ] Storage rules: image-only, ≤12MB, per-user folder (mirrored client-side in
      `lib/image/validate.ts`)
- [ ] Vector + composite indexes built (incl. nostalgic ascending index)
- [ ] API routes: token-gated + rate-limited; `Cache-Control: no-store`
- [ ] Smoke the full path: `/beta` → `/onboarding` → `/upload` → `/report` →
      `/home` ↔ `/daily` ↔ `/evolution` ↔ `/sharing`
- [ ] Rollback plan: Vercel instant rollback; `firebase deploy` is reversible

## 5. Mobile + performance polish (shipped)

- `100svh` layout, `env(safe-area-inset-*)` padding, no tap-highlight, momentum
  scroll, `touch-action: manipulation`, parallax/tilt disabled on touch.
- Memory drift renders the *feeling* (tone + caption), never fetches originals.
- Client image downscale → webp before upload; `next/image` AVIF/WebP for any
  served originals.
- Streaming narration: SSE tokens, sentence-level **breath pacing** on the
  client (generation fast, reveal slow). Cinematic `loading.tsx` (no spinner).
- Ambient particle counts scale down on small screens; everything honours
  `prefers-reduced-motion`.

## 6. Beta testing flow

- `/beta` — invite code (`redeemInvite`) opens the door; otherwise a quiet
  waitlist (`joinWaitlist`). No counts, no countdowns.
- `FeedbackWhisper` — one quiet line ("지금, 마음이 어떤가요") writing to
  `beta_feedback` (one-way, owner-create-only). No stars, no scores.

## 7. Emotional QA (the real gate)

Run by *feeling*, not just function:

- [ ] **Narration tone** — every line reads like a late-night Korean essay;
      no translationese / self-help / exclamation / numbers (guardrail enforced)
- [ ] **Atmosphere continuity** — color/air flows unbroken across routes; the
      visual warmth follows the user's real atmosphere
- [ ] **Motion emotionality** — transitions feel like breath, not animation;
      nothing under 200ms
- [ ] **Cinematic pacing** — reveal-on-arrival; silence between narration lines
- [ ] **Emotional immersion** — first 30s feel unlike any other AI product
- [ ] **The report** — finishing it leaves something unspoken in the chest
- [ ] **Mobile** — scrolling is soft; the room still breathes with fewer particles

> If it feels like a startup app, it isn't done. It should feel like a living
> emotional atmosphere you quietly return to.
