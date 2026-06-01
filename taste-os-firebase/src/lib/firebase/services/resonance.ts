"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../client";

/**
 * Resonance signals — emotion-first, NOT engagement.
 * We record only the quiet ways something *landed*: a line lingered on, a line
 * kept, a surface returned to. Never clicks, scroll depth, session length, or
 * anything an addiction loop would want. Owner-scoped, write-only from the
 * client (no feed, no ranking, no ads, no notifications). Used solely to let
 * the room deepen around the person.
 */
export type ResonanceKind = "lingered" | "kept" | "returned";

export async function recordResonance(kind: ResonanceKind, surface: string, ref?: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await addDoc(collection(db, "resonance_signals"), {
      uid,
      kind,
      surface,
      ref: ref ?? null,
      createdAt: serverTimestamp(),
    });
  } catch {
    // a missed signal is no loss — resonance is observed, never extracted
  }
}

/** A reflection answer to one of the quiet questions (explicit, consented). */
export async function recordReflection(question: string, answer: string) {
  const uid = auth.currentUser?.uid;
  if (!uid || !answer.trim()) return;
  try {
    await addDoc(collection(db, "reflection_feedback"), {
      uid,
      question,
      answer: answer.trim().slice(0, 600),
      createdAt: serverTimestamp(),
    });
  } catch {
    /* silent */
  }
}
