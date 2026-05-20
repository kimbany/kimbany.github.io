"use client";

import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../client";
import { COLLECTIONS, type UserDoc } from "../collections";

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

/** Live subscription to the user's profile (consent, name, etc.). */
export function watchUserDoc(uid: string, cb: (u: UserDoc | null) => void) {
  return onSnapshot(doc(db, COLLECTIONS.users, uid), (snap) =>
    cb(snap.exists() ? (snap.data() as UserDoc) : null)
  );
}

/** Update the consent gate — the user decides what is remembered. */
export function updateConsent(uid: string, consent: Partial<UserDoc["consent"]>) {
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(consent)) patch[`consent.${k}`] = v;
  return updateDoc(doc(db, COLLECTIONS.users, uid), patch);
}
