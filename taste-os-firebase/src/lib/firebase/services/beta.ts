"use client";

import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "../client";
import { COLLECTIONS } from "../collections";

/**
 * Quiet beta plumbing — no countdowns, no "X spots left". A waitlist is a
 * promise, an invite opens a door, and feedback is a whisper, not a survey.
 */

/** Hold a place. Stored under the signed-in (anonymous) user. */
export async function joinWaitlist(email: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("no session");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("invalid email");
  await setDoc(doc(db, "waitlist", uid), {
    uid,
    email,
    createdAt: serverTimestamp(),
  });
}

/** Redeem an invite code; on success, mark the user as invited. */
export async function redeemInvite(code: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("no session");
  const key = code.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!key) return false;
  const snap = await getDoc(doc(db, "beta_invites", key));
  if (!snap.exists() || snap.data()?.active === false) return false;
  await setDoc(doc(db, COLLECTIONS.users, uid), { betaInvited: true }, { merge: true });
  return true;
}

/** A whisper of feedback after a moment that landed (or didn't). */
export async function whisperFeedback(text: string) {
  const uid = auth.currentUser?.uid;
  if (!uid || !text.trim()) return;
  await addDoc(collection(db, "beta_feedback"), {
    uid,
    text: text.trim().slice(0, 600),
    createdAt: serverTimestamp(),
  });
}
