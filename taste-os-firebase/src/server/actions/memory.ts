"use server";

import { requireUid } from "@/lib/server/guard";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type Modality, type Tone } from "@/lib/firebase/collections";
import { ingestFragment } from "@/lib/firebase/memory";
import { embedForMemory } from "@/lib/ai/embeddingPipeline";
import { runVision } from "@/lib/ai/visionPipeline";

/** Read the user's consent gate (defaults conservative). */
async function getConsent(uid: string) {
  const snap = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  const c = (snap.data()?.consent ?? {}) as Record<string, boolean>;
  return {
    rememberImages: !!c.rememberImages,
    rememberWriting: !!c.rememberWriting,
    useAiVision: !!c.useAiVision,
    localOnly: !!c.localOnly,
  };
}

/**
 * Remember a piece of emotional language (quote, reflection, writing,
 * atmosphere selection). Scrubs PII, embeds (unless local-only), stores.
 */
export async function ingestTextMemory(input: {
  idToken: string;
  modality: Extract<Modality, "quote" | "reflection" | "writing" | "atmosphere" | "music">;
  text: string;
  caption?: string;
  tone?: Tone;
  warmth?: number;
}): Promise<{ id: string }> {
  const uid = await requireUid(input.idToken);
  const consent = await getConsent(uid);

  if ((input.modality === "writing" || input.modality === "reflection") && !consent.rememberWriting) {
    throw new Error("consent: writing not remembered");
  }

  const embedding = await embedForMemory(input.text, { localOnly: consent.localOnly });
  const id = await ingestFragment({
    uid,
    modality: input.modality,
    emotionText: input.text,
    caption: input.caption,
    tone: input.tone,
    warmth: input.warmth,
    embedding,
  });
  return { id };
}

/**
 * Remember an uploaded image by its *atmosphere*. The image must already be in
 * the user's private Storage folder; we read its feeling once (Vision), embed
 * the emotional sentence, and store the path — never the pixels here.
 */
export async function ingestImageMemory(input: {
  idToken: string;
  storagePath: string;
  downloadUrl: string; // short-lived URL Vision reads once
}): Promise<{
  id: string;
  atmosphere: string;
  palette: string[];
  resonance: string;
  toneWords: string[];
  warmth: number;
  degraded: boolean;
}> {
  const uid = await requireUid(input.idToken);
  const consent = await getConsent(uid);
  if (!consent.useAiVision) throw new Error("consent: vision disabled");
  if (!consent.rememberImages) throw new Error("consent: images not remembered");

  const { reading, emotionText, warmth, tone, degraded } = await runVision(input.downloadUrl);
  const embedding = await embedForMemory(emotionText, { localOnly: consent.localOnly });

  const id = await ingestFragment({
    uid,
    modality: "image",
    emotionText,
    caption: reading.atmosphere_ko,
    tone,
    warmth,
    atmosphereTags: reading.tone_words_ko,
    palette: reading.palette_ko,
    narrationFragment: reading.resonance_ko,
    embedding,
    storagePath: input.storagePath,
  });

  return {
    id,
    atmosphere: reading.atmosphere_ko,
    palette: reading.palette_ko,
    resonance: reading.resonance_ko,
    toneWords: reading.tone_words_ko,
    warmth,
    degraded,
  };
}
