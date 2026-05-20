// =====================================================================
// auth.js - 익명 로그인 + 닉네임/프로필
// ---------------------------------------------------------------------
// 책임: Firebase 익명 인증으로 uid 확보, 사용자 프로필(닉네임/계산스타일/시퀀스)
// 로컬 저장. 채팅 모드에서만 호출됨.
// =====================================================================

import {
  signInAnonymously, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getFirebase, isConfigured } from "./firebase-init.js";
import * as store from "./store.js";

const PROFILE_KEY = "profile";

// 로컬 프로필 로드/저장 (닉네임, 계산 스타일, 시퀀스 등)
export async function loadProfile() {
  return await store.get(PROFILE_KEY, null);
}
export async function saveProfile(profile) {
  await store.set(PROFILE_KEY, profile);
}
export async function isSetupDone() {
  const p = await loadProfile();
  return !!(p && p.nickname && p.calcStyle);
}

// 익명 로그인 → uid 반환 (config 없으면 null)
export function ensureSignedIn() {
  if (!isConfigured()) return Promise.resolve(null);
  const { auth } = getFirebase();
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(user.uid); }
    });
    signInAnonymously(auth).catch(reject);
  });
}

// 로그인 후 users/{uid} 프로필 동기화
export async function syncUserNode(uid, nickname) {
  if (!isConfigured() || !uid) return;
  const { db } = getFirebase();
  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    await set(userRef, { nickname, createdAt: Date.now() });
  } else {
    await set(ref(db, `users/${uid}/nickname`), nickname);
  }
}
