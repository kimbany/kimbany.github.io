"use client";

import {
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut as fbSignOut,
  linkWithPopup,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./client";
import { COLLECTIONS, type UserDoc } from "./collections";

/**
 * Quiet, unobtrusive auth. The user meets the atmosphere first (anonymous),
 * and may later link Google — the uid is preserved, so all emotional memory
 * follows seamlessly. Login state is persistent (see client.ts).
 */

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/** First-touch: a guest session so nothing blocks the threshold. */
export async function startGuest(): Promise<User> {
  const cred = await signInAnonymously(auth);
  await ensureUserDoc(cred.user);
  return cred.user;
}

/** Sign in (or upgrade a guest) with Google, keeping the same uid when possible. */
export async function signInWithGoogle(): Promise<User> {
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      const linked = await linkWithPopup(current, googleProvider);
      await markNamed(linked.user);
      return linked.user;
    } catch {
      // credential already on another account — fall through to plain sign-in
    }
  }
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(cred.user);
  return cred.user;
}

export function signOut() {
  return fbSignOut(auth);
}

/** Create the user document on first sight; refresh lastSeen otherwise. */
export async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db, COLLECTIONS.users, user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const fresh: UserDoc = {
      uid: user.uid,
      displayName: user.displayName,
      isAnonymous: user.isAnonymous,
      consent: {
        rememberImages: false,
        rememberWriting: false,
        useAiVision: false,
        localOnly: false,
      },
      locale: typeof navigator !== "undefined" ? navigator.language : "ko",
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    };
    await setDoc(ref, fresh);
  } else {
    await updateDoc(ref, { lastSeenAt: serverTimestamp() });
  }
}

async function markNamed(user: User): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
    isAnonymous: false,
    displayName: user.displayName,
    lastSeenAt: serverTimestamp(),
  });
}

export type { User };
