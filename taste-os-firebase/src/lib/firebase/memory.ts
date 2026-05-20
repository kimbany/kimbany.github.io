import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import type { Modality, Tone } from "@/types/atmosphere";

/**
 * Firestore-native emotional memory access (server-side, Admin SDK).
 * Vectors use Firestore's KNN vector search (findNearest) — no separate
 * vector DB needed. Mirrors the engine described in ../taste-os/memory-engine.md.
 *
 * Data model (private per user):
 *   users/{uid}
 *     fragments/{id}   { modality, emotionText, embedding(vector), tone, warmth, salience, released, createdAt }
 *     narrations/{id}  { mode, text, evidence[], surface, createdAt }
 *     clusters/{id}    { themeKo, centroid(vector), recurrence, lastSeen }   (engine-managed)
 *     snapshots/{id}   { periodStart, labelKo, warmth, centroid(vector) }    (engine-managed)
 */

function userRef(uid: string) {
  return adminDb.collection("users").doc(uid);
}

export interface IngestInput {
  modality: Modality;
  emotionText: string;
  embedding: number[] | null; // null for local-only memories
  caption?: string;
  tone?: Tone;
  warmth?: number;
  sourceRef?: string; // Storage path
}

/** Store a memory fragment. embedding is wrapped as a Firestore vector value. */
export async function ingestFragment(uid: string, input: IngestInput) {
  const doc = userRef(uid).collection("fragments").doc();
  await doc.set({
    modality: input.modality,
    emotionText: input.emotionText,
    embedding: input.embedding ? FieldValue.vector(input.embedding) : null,
    caption: input.caption ?? null,
    tone: input.tone ?? null,
    warmth: input.warmth ?? null,
    sourceRef: input.sourceRef ?? null,
    salience: 0.5,
    released: false,
    isLocalOnly: input.embedding === null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return doc.id;
}

/** Resonant recall: nearest fragments to a query embedding (KNN). */
export async function matchFragments(uid: string, queryEmbedding: number[], limit = 8) {
  const snap = await userRef(uid)
    .collection("fragments")
    .where("released", "==", false)
    .findNearest({
      vectorField: "embedding",
      queryVector: FieldValue.vector(queryEmbedding),
      limit,
      distanceMeasure: "COSINE",
    })
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
}

/** Recent narrations — injected to keep the voice from repeating itself. */
export async function recentNarrations(uid: string, limit = 5): Promise<string[]> {
  const snap = await userRef(uid)
    .collection("narrations")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => (d.data().text as string) ?? "").filter(Boolean);
}

/** Nostalgic recall: themes that haven't surfaced in a while. */
export async function dormantClusters(uid: string, days = 21, limit = 5) {
  const cutoff = new Date(Date.now() - days * 864e5);
  const snap = await userRef(uid)
    .collection("clusters")
    .where("lastSeen", "<", cutoff)
    .orderBy("lastSeen", "asc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
}

/** Persist a finished narration (dedup by leading text). */
export async function saveNarration(uid: string, n: {
  mode: string; text: string; surface: string; evidence: string[];
}) {
  await userRef(uid).collection("narrations").add({
    ...n,
    dedupKey: n.text.slice(0, 40),
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Right to release — a memory is let go, removed from recall. */
export async function releaseFragment(uid: string, fragmentId: string) {
  await userRef(uid).collection("fragments").doc(fragmentId).update({
    released: true,
    embedding: FieldValue.delete(),
    releasedAt: FieldValue.serverTimestamp(),
  });
}
