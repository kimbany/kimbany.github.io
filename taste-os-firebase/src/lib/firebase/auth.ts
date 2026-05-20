"use client";

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInAnonymously,
  signInWithPopup,
  sendSignInLinkToEmail,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "./client";

/**
 * Quiet, unobtrusive auth. Users meet the atmosphere first (anonymous),
 * then — when they want — link a permanent identity. The uid is preserved
 * across the upgrade, so all emotional memory follows seamlessly.
 */

export function startAnonymous() {
  return signInAnonymously(auth);
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signInWithApple() {
  return signInWithPopup(auth, new OAuthProvider("apple.com"));
}

const EMAIL_LINK_SETTINGS = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") + "/auth/callback",
  handleCodeInApp: true,
};

export function sendEmailLink(email: string) {
  window.localStorage.setItem("taste-os-email", email);
  return sendSignInLinkToEmail(auth, email, EMAIL_LINK_SETTINGS);
}

/** Upgrade an anonymous user to a permanent account — same uid. */
export async function promoteAnonymous(provider: "google" | "apple" | "email", email?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("no current user");
  if (provider === "google") return linkWithPopup(user, new GoogleAuthProvider());
  if (provider === "apple") return linkWithPopup(user, new OAuthProvider("apple.com"));
  // email: send a magic link; linking completes on callback
  if (!email) throw new Error("email required");
  return sendEmailLink(email);
}

export type { User };
