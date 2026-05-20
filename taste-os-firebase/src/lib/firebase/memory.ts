import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import { COLLECTIONS } from "./collections";
import type { Modality, Tone } from "./collections";

/**
 * Server-side (Admin SDK) emotional memory access over the top-level
 * `emotional_memories` collection. Vector recall uses Firestore's native
 * KNN (findNearest) with a uid + released prefilter — no separate vector DB.
 * Mirrors ../../taste-os/memory-engine.md.
 */

const memCol = () => adminDb.collection(COLLECTIONS.memories);

export interface IngestInput {
  uid: string;
  modality: Modality;
  emotionText: string;
  embedding: number[] | null; // null for local-only
  caption?: string;
  tone?: Tone;
  warmth?: number;
  storagePath?: string;
}

export async function ingestFragment(input: IngestInput): Promise<string> {
  const ref = memCol().doc();
  await ref.set({
    uid: input.uid,
    modality: input.modality,
    emotionText: input.emotionText,
    embedding: input.embedding ? FieldValue.vector(input.embedding) : null,
    caption: input.caption ?? null,
    tone: input.tone ?? null,
    warmth: input.warmth ?? null,
    storagePath: input.storagePath ?? null,
    salience: 0.5,
    released: false,
    isLocalOnly: input.embedding === null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/** Resonant recall: nearest fragments to a query embedding (KNN), scoped to user. */
export async function matchFragments(uid: string, queryEmbedding: number[], limit = 8) {
  const snap = await memCol()
    .where("uid", "==", uid)
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

/** Recent narrations — injected so the voice never repeats itself. */
export async function recentNarrations(uid: string, limit = 5): Promise<string[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.narrations)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => (d.data().text as string) ?? "").filter(Boolean);
}

/** Persist a finished narration (dedup by leading text). */
export async function saveNarration(n: {
  uid: string;
  mode: string;
  text: string;
  surface: string;
  evidence: string[];
}) {
  await adminDb.collection(COLLECTIONS.narrations).add({
    ...n,
    dedupKey: n.text.slice(0, 40),
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Right to release — removed from recall, embedding deleted. */
export async function releaseFragment(id: string) {
  await memCol().doc(id).update({
    released: true,
    embedding: FieldValue.delete(),
    releasedAt: FieldValue.serverTimestamp(),
  });
}
