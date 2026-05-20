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

## Data model (Firestore, private per user)

```
users/{uid}
  fragments/{id}   modality, emotionText, embedding(vector 1024), tone, warmth, salience, released
  narrations/{id}  mode, text, evidence[], surface, createdAt
  clusters/{id}    themeKo, centroid(vector), tone, recurrence, lastSeen   (engine-managed)
  snapshots/{id}   periodStart, labelKo, warmth, centroid(vector)          (engine-managed)
  resonance/{id}   fragmentId, kind (dwelt|returned|kept)                  (닿음, not likes)
```

- **Vector recall** uses Firestore's native `findNearest` (COSINE) — no
  separate vector DB. Index defined in `firestore.indexes.json`.
- **Security**: every doc is owner-only (`firestore.rules`); cluster/snapshot
  writes are engine-only (Admin SDK in Cloud Functions).

## Auth

Firebase Auth — email magic-link + Google + Apple + **anonymous**. `AuthProvider`
starts an anonymous session on first visit so users meet the atmosphere before
deciding to stay; `promoteAnonymous()` links a permanent identity while keeping
the same uid (seamless emotional continuity).

## OpenAI

Shared layer (`lib/openai/*`): vision reads *atmosphere not objects*; all
modalities embed into one 1024-dim latent; narration uses the quiet-voice
prompt + guardrail + streaming. Keys live only server-side and in Cloud
Functions (`store: false`).

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
