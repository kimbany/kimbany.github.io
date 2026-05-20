// =====================================================================
// firebase-init.js - Firebase 초기화 (채팅 모드에서만 사용)
// ---------------------------------------------------------------------
// Firebase Realtime Database + Anonymous Auth.
// SDK는 gstatic CDN의 모듈러(v10) ESM을 사용. (Tauri 웹뷰에서 동작)
//
// ⚠️ 아래 firebaseConfig는 자리만 비워둔 placeholder.
//    본인 Firebase 콘솔에서 프로젝트 만들고 값 채워 넣을 것.
//    (Realtime Database 생성 + 익명 로그인 활성화 필요)
// =====================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// TODO: 본인 Firebase 프로젝트 값으로 교체
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// config가 채워졌는지 (placeholder면 채팅 기능 비활성, 계산기는 정상)
export function isConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
}

let _app = null, _auth = null, _db = null;

export function getFirebase() {
  if (!isConfigured()) return null;
  if (!_app) {
    _app = initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    _db = getDatabase(_app);
  }
  return { app: _app, auth: _auth, db: _db };
}
