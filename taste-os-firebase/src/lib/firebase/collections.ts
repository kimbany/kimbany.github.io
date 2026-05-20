/**
 * Taste OS — Firestore collection map.
 * One quiet source of truth for collection names + document shapes.
 * Top-level collections, each owned by `uid` (enforced in firestore.rules).
 */

export const COLLECTIONS = {
  users: "users",
  memories: "emotional_memories",
  atmosphere: "atmosphere_states",
  reports: "taste_reports",
  timelines: "emotional_timelines",
  narrations: "narrations",
} as const;

export type Tone = "warm" | "cool" | "mixed" | "neutral";
export type Modality = "image" | "quote" | "music" | "atmosphere" | "reflection" | "writing";

/** users/{uid} — the person, lightly held. */
export interface UserDoc {
  uid: string;
  displayName: string | null;
  isAnonymous: boolean;
  /** consent is conservative by default — we ask, we don't assume */
  consent: {
    rememberImages: boolean;
    rememberWriting: boolean;
    useAiVision: boolean;
    localOnly: boolean;
  };
  locale: string;
  createdAt: unknown; // serverTimestamp
  lastSeenAt: unknown;
}

/** emotional_memories/{id} — a single fragment of feeling. */
export interface MemoryDoc {
  uid: string;
  modality: Modality;
  emotionText: string; // the emotional language (also the embedding input)
  caption: string | null;
  tone: Tone | null;
  warmth: number | null; // 0 cool .. 1 warm
  storagePath: string | null; // original lives in Storage, private
  embedding: number[] | null; // null = local-only (never leaves device)
  salience: number; // emotional weight, nudged gently
  released: boolean; // right to be forgotten
  createdAt: unknown;
}

/** atmosphere_states/{id} — a weekly snapshot of the inner air. */
export interface AtmosphereStateDoc {
  uid: string;
  periodStart: string; // ISO date (week)
  labelKo: string; // "조용한 따뜻함"
  labelEn: string | null; // "Quiet Warmth"
  dominantTone: Tone;
  warmth: number;
  centroid: number[] | null;
  current: boolean; // the live atmosphere
  createdAt: unknown;
}

/** taste_reports/{id} — a cinematic emotional portrait. */
export interface TasteReportDoc {
  uid: string;
  genome: string[]; // ["Quiet Warmth", "Urban Nostalgia", ...]
  narration: string[]; // the report's lines
  palette: string[];
  createdAt: unknown;
}

/** emotional_timelines/{id} — a marker in the evolution of a self. */
export interface TimelineEventDoc {
  uid: string;
  kind: "atmosphere_shift" | "warmth_change" | "theme_recur" | "theme_emerge" | "season_marker";
  labelKo: string;
  fromLabel: string | null;
  toLabel: string | null;
  warmth: number | null;
  occurredAt: unknown;
}

/** narrations/{id} — the quiet voice, with its evidence. */
export interface NarrationDoc {
  uid: string;
  mode: "resonant" | "daily" | "evolving" | "nostalgic" | "contradictory";
  text: string;
  evidence: string[];
  surface: string; // 'daily' | 'home' | 'evolution' | 'report'
  dedupKey: string;
  createdAt: unknown;
}
