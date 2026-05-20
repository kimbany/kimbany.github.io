// =====================================================================
// store.js - 영구 저장 래퍼
// ---------------------------------------------------------------------
// 위장 매핑(messageId → seriesId/stepIndex)과 사용자 설정을 사용자 디바이스에
// 영구 저장한다. Firebase 부담을 줄이기 위해 로컬 저장.
//
// 운영(Tauri)에서는 tauri-plugin-store를 쓰고, 브라우저 미리보기에서는
// localStorage로 자동 폴백한다. 두 환경 모두 같은 get/set API로 동작.
// =====================================================================

const PREFIX = "calctalk.";
let tauriStore = null;
let ready = false;

// Tauri 환경이면 plugin-store 로드 시도, 아니면 localStorage 사용
export async function initStore() {
  if (ready) return;
  ready = true;
  if (window.__TAURI__ && window.__TAURI__.store) {
    try {
      const { Store } = window.__TAURI__.store;
      tauriStore = await Store.load("calctalk.json");
    } catch (e) {
      tauriStore = null; // 폴백
    }
  }
}

export async function get(key, fallback = null) {
  await initStore();
  if (tauriStore) {
    const v = await tauriStore.get(key);
    return v === undefined || v === null ? fallback : v;
  }
  const raw = localStorage.getItem(PREFIX + key);
  return raw === null ? fallback : JSON.parse(raw);
}

export async function set(key, value) {
  await initStore();
  if (tauriStore) {
    await tauriStore.set(key, value);
    await tauriStore.save();
    return;
  }
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}
