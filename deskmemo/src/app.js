// DeskMemo frontend — M1/M2
//
// 색상 카드 보드. 두 가지 저장 모드:
//   - local : 로그인 전. localStorage 에 저장.
//   - cloud : 구글 로그인 후. Firestore users/{uid}/notes 실시간 동기화.
//
// 데이터 형태는 CLAUDE.md §5 와 동일.

import {
  initFirebase,
  isConfigured,
  onAuth,
  signInGoogle,
  signOutUser,
  subscribeNotes,
  upsertNote,
  removeNote,
} from "./firebase.js";

const COLORS = {
  yellow: "#fde68a",
  pink: "#fbcfe8",
  blue: "#bfdbfe",
  green: "#bbf7d0",
  gray: "#e5e7eb",
};
const COLOR_KEYS = Object.keys(COLORS);
const STORAGE_KEY = "deskmemo.notes.v1";
const CLOUD_DEBOUNCE_MS = 400;

const board = document.getElementById("board");
const emptyHint = document.getElementById("empty-hint");
const statusEl = document.getElementById("status");
const authBtn = document.getElementById("btn-auth");

/** @typedef {{id:string,text:string,color:string,x:number,y:number,createdAt:number,updatedAt:number,order:number}} Note */
/** @type {Note[]} */
let notes = [];

let mode = "local"; // "local" | "cloud"
let currentUid = null;
let unsubscribeNotes = null;
const cloudDebouncers = new Map();

// ---- helpers ---------------------------------------------------------------

function getNote(id) {
  return notes.find((n) => n.id === id);
}

function uid() {
  return "n_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

// ---- persistence -----------------------------------------------------------

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/** 한 메모의 변경을 현재 모드에 맞게 저장. */
function persist(note) {
  if (mode === "cloud") {
    clearTimeout(cloudDebouncers.get(note.id));
    cloudDebouncers.set(
      note.id,
      setTimeout(() => {
        upsertNote(currentUid, note).catch((e) => console.error("upsert", e));
      }, CLOUD_DEBOUNCE_MS)
    );
  } else {
    saveLocal();
  }
}

function persistRemove(id) {
  if (mode === "cloud") {
    removeNote(currentUid, id).catch((e) => console.error("remove", e));
  } else {
    saveLocal();
  }
}

// ---- CRUD ------------------------------------------------------------------

function addNote(partial = {}) {
  const now = Date.now();
  const note = {
    id: uid(),
    text: "",
    color: COLOR_KEYS[notes.length % COLOR_KEYS.length],
    x: 16 + (notes.length % 5) * 18,
    y: 16 + (notes.length % 5) * 18,
    createdAt: now,
    updatedAt: now,
    order: notes.length,
    ...partial,
  };
  notes.push(note);
  renderNote(note, true);
  refreshEmptyHint();
  persist(note);
  return note;
}

function updateNote(id, patch) {
  const note = getNote(id);
  if (!note) return;
  Object.assign(note, patch, { updatedAt: Date.now() });
  persist(note);
}

function deleteNote(id) {
  notes = notes.filter((n) => n.id !== id);
  document.querySelector(`[data-id="${id}"]`)?.remove();
  refreshEmptyHint();
  persistRemove(id);
}

// ---- rendering -------------------------------------------------------------

function refreshEmptyHint() {
  emptyHint.style.display = notes.length ? "none" : "flex";
}

function renderNote(note, focus = false) {
  const card = document.createElement("div");
  card.dataset.id = note.id;
  card.className =
    "absolute w-44 rounded-lg shadow-lg ring-1 ring-black/10 flex flex-col";
  card.style.left = note.x + "px";
  card.style.top = note.y + "px";
  card.style.background = COLORS[note.color] || COLORS.yellow;

  const head = document.createElement("div");
  head.className =
    "drag-handle flex items-center justify-between px-2 py-1 cursor-move";

  const dots = document.createElement("div");
  dots.className = "flex gap-1";
  for (const key of COLOR_KEYS) {
    const dot = document.createElement("button");
    dot.title = key;
    dot.className = "h-3 w-3 rounded-full ring-1 ring-black/20";
    dot.style.background = COLORS[key];
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      card.style.background = COLORS[key];
      updateNote(note.id, { color: key });
    });
    dots.appendChild(dot);
  }

  const del = document.createElement("button");
  del.textContent = "×";
  del.title = "삭제";
  del.className =
    "ml-1 h-5 w-5 rounded text-neutral-600 hover:bg-black/10 leading-none";
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteNote(note.id);
  });

  head.append(dots, del);

  const ta = document.createElement("textarea");
  ta.className =
    "note-text no-scrollbar m-1 mt-0 h-28 resize-none rounded bg-white/40 p-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-500";
  ta.placeholder = "메모...";
  ta.value = note.text;
  ta.addEventListener("input", () => updateNote(note.id, { text: ta.value }));

  card.append(head, ta);
  board.appendChild(card);

  makeDraggable(card, head, note.id);

  if (focus) setTimeout(() => ta.focus(), 0);
}

/** 카드 DOM을 note 값으로 갱신(편집/드래그 중인 부분은 보호). */
function updateCardDom(card, note) {
  if (card.dataset.dragging !== "1") {
    card.style.left = note.x + "px";
    card.style.top = note.y + "px";
  }
  card.style.background = COLORS[note.color] || COLORS.yellow;
  const ta = card.querySelector(".note-text");
  if (ta && document.activeElement !== ta && ta.value !== note.text) {
    ta.value = note.text;
  }
}

function renderAll() {
  board.querySelectorAll("[data-id]").forEach((el) => el.remove());
  notes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).forEach((n) => renderNote(n));
  refreshEmptyHint();
}

/** 원격 스냅샷을 받아 DOM과 맞춤(추가/삭제/갱신). */
function reconcile(remote) {
  notes = remote.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const incoming = new Map(notes.map((n) => [n.id, n]));

  board.querySelectorAll("[data-id]").forEach((card) => {
    if (!incoming.has(card.dataset.id)) card.remove();
  });

  for (const note of notes) {
    const card = board.querySelector(`[data-id="${note.id}"]`);
    if (!card) renderNote(note);
    else updateCardDom(card, note);
  }
  refreshEmptyHint();
}

// ---- dragging --------------------------------------------------------------

function makeDraggable(card, handle, id) {
  let startX, startY, originX, originY, dragging = false;

  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    const note = getNote(id);
    if (!note) return;
    dragging = true;
    card.dataset.dragging = "1";
    card.classList.add("z-50");
    startX = e.clientX;
    startY = e.clientY;
    originX = note.x;
    originY = note.y;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const nx = Math.max(0, originX + (e.clientX - startX));
    const ny = Math.max(0, originY + (e.clientY - startY));
    card.style.left = nx + "px";
    card.style.top = ny + "px";
    const note = getNote(id);
    if (note) {
      note.x = nx;
      note.y = ny;
    }
  });

  const end = () => {
    if (!dragging) return;
    dragging = false;
    card.dataset.dragging = "0";
    card.classList.remove("z-50");
    const note = getNote(id);
    if (note) updateNote(id, { x: note.x, y: note.y });
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

// ---- mode switching --------------------------------------------------------

function goLocal() {
  mode = "local";
  currentUid = null;
  if (unsubscribeNotes) {
    unsubscribeNotes();
    unsubscribeNotes = null;
  }
  notes = loadLocal();
  renderAll();
  setStatus("로컬 모드");
  if (isConfigured()) {
    authBtn.textContent = "로그인";
    authBtn.classList.remove("hidden");
  }
}

function goCloud(user) {
  mode = "cloud";
  currentUid = user.uid;
  setStatus(`동기화 중 · ${user.displayName || user.email || "로그인됨"}`);
  authBtn.textContent = "로그아웃";
  authBtn.classList.remove("hidden");
  // 첫 로그인 시 로컬→클라우드 마이그레이션은 추후(M2 보완). 지금은 분리.
  if (unsubscribeNotes) unsubscribeNotes();
  unsubscribeNotes = subscribeNotes(currentUid, (remote) => reconcile(remote));
}

// ---- Tauri integration -----------------------------------------------------

function tauri() {
  return typeof window !== "undefined" ? window.__TAURI__ : undefined;
}

async function hideBoard() {
  const t = tauri();
  if (t?.window?.getCurrentWindow) {
    try {
      await t.window.getCurrentWindow().hide();
    } catch (e) {
      console.warn("hide failed", e);
    }
  }
}

function wireGlobalEvents() {
  const t = tauri();
  if (t?.event?.listen) {
    t.event.listen("new-note", () => addNote());
  }
}

// ---- wiring ----------------------------------------------------------------

document.getElementById("btn-new").addEventListener("click", () => addNote());
document.getElementById("btn-hide").addEventListener("click", hideBoard);

authBtn.addEventListener("click", async () => {
  try {
    if (mode === "cloud") {
      await signOutUser();
    } else {
      await signInGoogle();
    }
  } catch (e) {
    console.error("auth", e);
    setStatus("로그인 실패: " + (e?.code || e?.message || e));
  }
});

// 로컬 메모를 먼저 그려서 즉시 사용 가능하게 한 뒤, Firebase 준비되면 전환.
goLocal();
wireGlobalEvents();

if (initFirebase()) {
  onAuth((user) => {
    if (user) goCloud(user);
    else goLocal();
  });
} else {
  // 미설정: 로컬 전용. 로그인 버튼 숨김 유지.
  setStatus("로컬 모드 (Firebase 미설정)");
}
