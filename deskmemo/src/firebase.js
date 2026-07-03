// DeskMemo — Firebase 연동 (M2)
//
// 동기화 레이어: 구글 로그인 + Firestore의 users/{uid}/notes/{noteId} 실시간 구독.
// firebase-config.js 가 없으면 `configured=false` 로 두어, 앱이 로컬 전용
// (localStorage) 모드로 정상 동작하게 한다.
//
// TODO(M4): gstatic CDN 대신 의존성을 로컬 번들로 교체(오프라인 대비).

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let app = null;
let auth = null;
let db = null;
let configured = false;

// config 파일이 없으면(아직 셋업 전) 조용히 로컬 전용 모드로.
let firebaseConfig = null;
try {
  ({ firebaseConfig } = await import("./firebase-config.js"));
} catch {
  console.info("[firebase] firebase-config.js 없음 → 로컬 전용 모드");
}

export function initFirebase() {
  if (configured || !firebaseConfig) return configured;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // 오프라인 영속성: enablePersistence(deprecated) 대신 persistentLocalCache 사용.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager(),
    }),
  });
  configured = true;
  return configured;
}

export function isConfigured() {
  return configured;
}

// ---- 인증 ------------------------------------------------------------------

export function onAuth(callback) {
  if (!configured) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInGoogle() {
  if (!configured) throw new Error("Firebase 미설정");
  const provider = new GoogleAuthProvider();
  // 데스크탑 WebView2에서는 signInWithPopup 이 별도 인증 창으로 열린다.
  // 막힐 경우(auth/unauthorized-domain 등) SETUP.md 의 루프백 방식으로 보강.
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser() {
  if (configured) await signOut(auth);
}

// ---- Firestore notes -------------------------------------------------------

function notesCol(uid) {
  return collection(db, "users", uid, "notes");
}

/** notes 실시간 구독. cb(notesArray) 호출. 구독 해제 함수 반환. */
export function subscribeNotes(uid, cb) {
  if (!configured) return () => {};
  return onSnapshot(notesCol(uid), (snap) => {
    const notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(notes);
  });
}

/** 메모 생성/수정 (merge). note.id 를 문서 id로 사용. */
export async function upsertNote(uid, note) {
  if (!configured) return;
  const { id, ...data } = note;
  await setDoc(doc(db, "users", uid, "notes", id), data, { merge: true });
}

export async function removeNote(uid, id) {
  if (!configured) return;
  await deleteDoc(doc(db, "users", uid, "notes", id));
}
