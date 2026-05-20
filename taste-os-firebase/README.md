# Taste OS — Application (Firebase)

The Next.js implementation of Taste OS on a **Firebase** backend (the
`../taste-os-app/` variant uses Supabase/pgvector; the `../taste-os/` static
prototypes + `*.md` docs are the design + behavior source of truth).

Same cinematic emotional architecture — only the data layer differs.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion ·
**Firebase** (Auth · Firestore + native vector search · Storage · Cloud
Functions) · OpenAI · Vercel (web) + Firebase (functions/rules).

## Folder structure

```
src/
  app/                         # same shell + route groups as the Supabase app
    layout.tsx                 # fonts + AuthProvider + AtmosphereProvider + AmbientField
    template.tsx               # cinematic page dissolve
    page.tsx                   # the threshold
    (experience)/ onboarding · analysis · report
    (space)/      home · daily · evolution · sharing
    api/narrate/route.ts       # SSE; verifies Firebase ID token, builds evidence
  components/
    ambient/AmbientField.tsx
    cinematic/ Reveal · Beacon · Narration
    providers/ AtmosphereProvider · AuthProvider   # AuthProvider = Firebase
  motion/  easings · variants · useReveal · useParallax
  lib/
    firebase/
      client.ts                # client SDK (auth/firestore/storage singletons)
      admin.ts                 # Admin SDK (server-only) + verifyUid()
      auth.ts                  # google/apple/email-link/anonymous + promote
      memory.ts                # Firestore data + KNN vector recall (findNearest)
    openai/ client · vision · embeddings · narration
    utils/cn.ts
  server/actions/atmosphere.ts # evidence from Firestore
  types/ atmosphere · db

functions/                     # Cloud Functions: embed / analyzeImage / narrate
  src/index.ts                 #   + onFragmentCreated (incremental memory graph)

firebase.json                  # firestore/storage/functions/emulators
firestore.rules                # private-by-default per user
storage.rules                  # user-owned memory originals
firestore.indexes.json         # 1024-dim KNN vector index + supporting indexes
```

## Data model (Firestore — top-level collections, private per user)

Names are the single source of truth in `lib/firebase/collections.ts`.

```
users/{uid}                profile + consent gate (rememberImages/Writing/useAiVision/localOnly)
emotional_memories/{id}    uid, modality, emotionText, embedding(vector 1024), tone, warmth, salience, released
atmosphere_states/{id}     uid, periodStart, labelKo/En, warmth, centroid, current   (engine-managed)
taste_reports/{id}         uid, genome[], narration[], palette[]
emotional_timelines/{id}   uid, kind, fromLabel/toLabel, warmth, occurredAt          (engine-managed)
narrations/{id}            uid, mode, text, evidence[], surface, dedupKey            (engine-managed)
```

- **Vector recall** uses Firestore's native `findNearest` (COSINE) with a
  `uid + released` prefilter — no separate vector DB. Index in
  `firestore.indexes.json`.
- **Security** (`firestore.rules`): each doc owner-only by `uid`; engine-managed
  collections are read-only to clients and written by the Admin SDK in Functions.

## Services & hooks (modular, cinematic)

```
lib/firebase/
  collections.ts            collection names + document types (one source of truth)
  client.ts / admin.ts      client SDK (persistent login) / Admin SDK (server)
  auth.ts                   startGuest · signInWithGoogle (links guest→named) · ensureUserDoc
  memory.ts                 server recall: matchFragments (KNN) · recentNarrations · save/release
  services/                 client CRUD + realtime:
    users · memories · atmosphere · reports · timelines · narrations · storage
hooks/
  useAuth                   session + isGuest + signInWithGoogle/signOut
  useUser                   live profile + consent
  useUpload                 image/asset/atmosphere upload with progress
  useEmotionalMemories      live drift of memories
  useCurrentAtmosphere      live atmosphere → also drives the visual air (warmth→tier)
```

## Authentication

Firebase Auth with **persistent login** (`indexedDB` → `browserLocal`).
First visit silently starts a **guest (anonymous)** session via `AuthProvider`,
so the user meets the atmosphere before deciding to stay. **Google** sign-in
links the guest in place — the `uid` is preserved, so all emotional memory
follows. Storage uploads land in the user's private `memories/{uid}/...` folder.

## Auth

Firebase Auth — email magic-link + Google + Apple + **anonymous**. `AuthProvider`
starts an anonymous session on first visit so users meet the atmosphere before
deciding to stay; `promoteAnonymous()` links a permanent identity while keeping
the same uid (seamless emotional continuity).

## OpenAI

Quiet emotional mirror, not a chatbot. Three capabilities, one service layer.

```
lib/openai/                 # server-only service layer
  client.ts                 model map (gpt-4o vision, gpt-4.1 narration,
                            text-embedding-3-large @1024d), store:false
  prompts.ts                prompt orchestration — VISION_SYSTEM, VOICE_PROMPT,
                            MODE_PROMPTS, temperatures, evidence renderer,
                            voice guardrail (passesVoice), KO-first multilingual
  vision.ts                 atmosphere reading (NOT objects): warmth, light mood,
                            texture, cinematic tone, emotional palette, resonance
  embeddings.ts             embed emotional language → shared 1024-dim latent
  narration.ts              streamNarration (SSE) + generateNarration (guarded)

lib/ai/                     # pipelines (OpenAI × Firebase)
  visionPipeline.ts         image URL → atmosphere → single emotional sentence
  embeddingPipeline.ts      scrub PII → embed (skips when local-only)
  narrationPipeline.ts      evidence → stream → persist (dedup, no repeats)
  scrub.ts                  strip emails / phones / urls / handles before AI

lib/server/guard.ts         requireUid(idToken) — token-gates routes & actions
```

### Vision analysis
`runVision(url)` reads the *feeling* of an image — emotional atmosphere,
lighting mood, texture warmth, cinematic tone, emotional color palette, visual
resonance — and condenses it to the one sentence the system remembers. It never
names objects. `detail:low` keeps it cheap.

### Emotional embeddings
Every modality (quotes, writing, atmosphere selections, image atmosphere
summaries, narration memory) is turned into emotional language, then embedded
into one 1024-dim space so unlike things that *feel* alike sit close together.

### Streaming narration
`POST /api/narrate` (SSE) verifies the Firebase ID token, builds evidence from
Firestore, streams `gpt-4.1` tokens, and persists the finished line. The client
(`components/cinematic/Narration.tsx`) reveals it **line-by-line with breath
pacing** — a line blooms, lingers (longer if longer), dissolves into silence.

### Image upload → analysis → Taste Report (full pipeline)
`/onboarding → /upload → (weave) → /report`

1. **Upload** — `EmotionalUpload` (drag/drop) → `optimizeImage` (client
   downscale/webp) → `useUpload` resumable upload to private `memories/{uid}/`
   with a progress shimmer + rotating emotional loading lines.
2. **Vision** — `ingestImageMemory` (server action, token + consent gated) runs
   `runVision` (gpt-4o, atmosphere not objects; **one retry → quiet fallback**).
3. **Summary + embedding** — the reading is condensed to one emotional sentence,
   PII-scrubbed, embedded into the 1024-dim latent.
4. **Memory** — saved to `emotional_memories`: image path, emotional summary,
   embedding (vector), atmosphere tags, palette, tone/warmth, narration fragment.
5. **Report** — `generateTasteReport` (`reportPipeline`) gathers the user's
   memories, weaves a genome + 3 narration lines + palette, writes
   `taste_reports`, and **updates the current `atmosphere_states`** — so an
   uploaded image directly shapes the Taste Genome, the atmosphere identity,
   the narration, and the home/dashboard reflections.
6. **Errors** — vision retry + fallback atmosphere; report generation falls back
   to a gentle default portrait; the UI never shows a hard error, only a quiet
   "잠시 후 다시 머물러 주세요" with a retry.

### Secure architecture
- **Server actions** (`server/actions/memory.ts`): `ingestTextMemory`,
  `ingestImageMemory` — consent-aware, token-gated, run privileged work
  (Vision + embed + Admin Firestore) server-side only.
- **API route protection**: `requireUid` + `Authorization: Bearer <idToken>`
  on the vision route; ID token in the body for the SSE narrate route.
- **Env protection**: `OPENAI_API_KEY` + `FIREBASE_SERVICE_ACCOUNT` are
  server-only; all OpenAI calls set `store: false` (no training on feelings).
- **Client hooks**: `useIngestMemory` (upload → vision → store),
  and the streaming narration component — neither ever sees a key.

## Setup

```bash
cp .env.example .env.local         # Firebase web config + OPENAI_API_KEY
npm install
npm run dev                        # http://localhost:3000

# Firebase
firebase login && firebase use <project>
npm run fb:rules                   # deploy firestore + storage rules
npm run fb:indexes                 # build the vector index
firebase functions:secrets:set OPENAI_API_KEY
npm run fb:functions               # deploy embed / analyzeImage / narrate
```

## Deploy

Web → Vercel (Next.js). Backend → Firebase (rules, indexes, functions).
`FIREBASE_SERVICE_ACCOUNT` + `OPENAI_API_KEY` are server-only and must never
reach the client. Full plan: `../taste-os/launch.md`.
