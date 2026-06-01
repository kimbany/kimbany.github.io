# Taste OS — Application

The real Next.js implementation of Taste OS — a cinematic emotional identity
operating system. This is the production app (deployed to Vercel); the static
prototypes in `../taste-os/` remain the design reference, and the `*.md`
architecture docs there are the source of truth for behavior and voice.

> Scalable **cinematic emotional architecture**, not a generic SaaS structure.
> Every layer exists to make the space feel *emotionally alive*.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · Supabase
(Postgres + pgvector + Auth + Storage + Edge Functions) · OpenAI · Vercel.

## Folder structure

```
src/
  app/
    layout.tsx                 # fonts + AmbientField + AtmosphereProvider
    template.tsx               # cinematic page dissolve (per-route)
    globals.css                # tailwind + tokens + .reveal / .beacon
    page.tsx                   # the threshold (quiet invitation)
    (experience)/              # the one-way cinematic flow
      onboarding/  analysis/  report/
    (space)/                   # the space you return to
      home/  daily/  evolution/  sharing/
    api/
      narrate/route.ts         # SSE streaming narration
      atmosphere/analyze-image # vision atmosphere reading
  components/
    ambient/AmbientField.tsx   # orbs + dust + grain + sigil (the 3-layer air)
    cinematic/
      Reveal.tsx               # text blooms from blur (signature reveal)
      Beacon.tsx               # the one CTA shape: ──── label ────
      Narration.tsx            # streams + breath-paces the quiet voice
    providers/AtmosphereProvider.tsx  # tier/warmth context + parallax
  motion/
    easings.ts                 # 3 curves + durations (nothing under 200ms)
    variants.ts                # reveal / page / settle / stagger
    useReveal.ts               # reveal-on-arrival (IntersectionObserver)
    useParallax.ts             # damped cursor parallax → CSS vars
  lib/
    supabase/{server,client,admin}.ts
    openai/{client,vision,embeddings,narration}.ts
    utils/cn.ts
  server/actions/atmosphere.ts # evidence building + narration persistence
  types/atmosphere.ts
  styles/tokens.css            # the emotional design tokens

supabase/                      # migrations + edge functions (see ../taste-os/backend.md)
```

## Design system foundation

- **Palette** (Tailwind + CSS vars): night / coal / bone / mist / sand / beige /
  silver-blue / rose / ember. Color only moves on the cool↔warm axis.
- **Type**: Cormorant Garamond italic + Noto Serif KR (display/voice), Inter (UI).
- **Motion**: three easings (`breath-in` / `breath-out` / `settle`); reveal =
  `blur(14px)→0` + letter-spacing breath; **no transition under 200ms**.
- **Atmosphere**: `<body data-tier>` + `--atmosphere-warmth` shift gradients/orbs
  slowly across the whole tree (felt, not seen).

## API architecture

- `POST /api/narrate` — Server-Sent Events. Builds evidence from the memory
  engine (pgvector RPCs), streams `gpt-4.1` tokens; the client reveals them
  sentence-by-sentence with breath pacing. Evidence-grounded (no hallucination).
- `POST /api/atmosphere/analyze-image` — GPT-Vision reads the *atmosphere* of an
  image (warmth, light, texture, composition emotion) — never the objects.

## Supabase integration

- `lib/supabase/server.ts` — RLS-scoped server client (components + actions).
- `lib/supabase/client.ts` — browser client.
- `lib/supabase/admin.ts` — service-role, server-only, for background jobs.
- Schema, RLS, vector RPCs, storage and edge functions: `../taste-os/backend.md`.

## Privacy posture

OpenAI calls use `store: false`. Sensitive text is PII-scrubbed before
embedding; local-only memories never leave the device. Right-to-release and
full export are first-class. See `../taste-os/memory-engine.md` & `backend.md`.

## Setup

```bash
cp .env.example .env.local        # fill in Supabase + OpenAI keys
npm install
npm run dev                       # http://localhost:3000

# database (linked Supabase project)
npm run db:push                   # apply migrations
npm run functions:deploy          # embed / narrate / analyze-image
```

## Deploy (Vercel)

Set the env vars from `.env.example` (server-only keys server-side only).
`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `MEMORY_ENCRYPTION_KEK` must
never be exposed to the client. See `../taste-os/launch.md` for the full
deployment + soft-launch plan.
