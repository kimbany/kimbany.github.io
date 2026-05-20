/** Domain types for the emotional atmosphere system. */

export type Tone = "warm" | "cool" | "mixed" | "neutral";

export type Modality =
  | "image"
  | "quote"
  | "music"
  | "atmosphere"
  | "reflection"
  | "writing";

/** GPT-Vision output — atmosphere, never objects. */
export interface AtmosphereReading {
  atmosphere_ko: string;
  color_temperature: Tone;
  warmth: number; // 0 (cool) .. 1 (warm)
  light_mood_ko: string;
  texture_ko: string;
  cinematic_tone_ko: string;
  composition_emotion_ko: string;
  palette_ko: string[]; // emotional color palette (named)
  resonance_ko: string; // visual emotional resonance, one line
  tone_words_ko: string[];
}

/** The four cinematic recall modes (see memory-engine.md). */
export type RecallMode =
  | "resonant"
  | "daily"
  | "evolving"
  | "nostalgic"
  | "contradictory";

/** Structured facts a narration is allowed to speak from. */
export interface NarrationEvidence {
  facts: string;
  fragmentIds?: string[];
  recent?: string[]; // recent narrations to avoid repeating
}

/** A unit of emotional memory. */
export interface MemoryFragment {
  id: string;
  modality: Modality;
  caption: string | null;
  emotionText: string;
  tone: Tone | null;
  warmth: number | null;
  createdAt: string;
}

/** The fused current atmosphere. */
export interface FusedAtmosphere {
  label: string; // e.g. "Quiet Warmth"
  labelKo: string; // e.g. "조용한 따뜻함"
  warmth: number;
  dominantTone: Tone;
}
