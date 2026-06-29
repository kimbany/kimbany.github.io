// DeskMemo frontend — M1/M2 (+ 크기조정/고정/메모 타입)
//
// 저장 모드:
//   - local : 로그인 전. localStorage.
//   - cloud : 구글 로그인 후. Firestore users/{uid}/notes 실시간 동기화.
//
// 메모 타입:
//   - "note" : 일반 텍스트 메모
//   - "todo" : 체크리스트(할 일). 항목마다 체크박스 + 무한 하위 항목 + 접기.

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
const DEFAULT_W = 210;
const DEFAULT_H = 200;

const board = document.getElementById("board");
const emptyHint = document.getElementById("empty-hint");
const statusEl = document.getElementById("status");
const authBtn = document.getElementById("btn-auth");

/** @type {Array<object>} */
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

/** 누락 필드를 기본값으로 채워 구버전/신버전 메모를 안전하게 다룬다. */
function normalize(n) {
  return {
    id: n.id,
    type: n.type === "todo" ? "todo" : "note",
    text: typeof n.text === "string" ? n.text : "",
    items: Array.isArray(n.items) ? n.items : [],
    color: COLORS[n.color] ? n.color : "yellow",
    x: Number.isFinite(n.x) ? n.x : 16,
    y: Number.isFinite(n.y) ? n.y : 16,
    w: Number.isFinite(n.w) ? n.w : DEFAULT_W,
    h: Number.isFinite(n.h) ? n.h : DEFAULT_H,
    pinned: !!n.pinned,
    order: Number.isFinite(n.order) ? n.order : 0,
    createdAt: Number.isFinite(n.createdAt) ? n.createdAt : Date.now(),
    updatedAt: Number.isFinite(n.updatedAt) ? n.updatedAt : Date.now(),
  };
}

// ---- checklist(todo) 트리 조작 --------------------------------------------

function newItem() {
  return { id: uid(), text: "", done: false, collapsed: false, children: [] };
}

function findItem(items, id) {
  for (const it of items) {
    if (it.id === id) return it;
    const f = findItem(it.children || [], id);
    if (f) return f;
  }
  return null;
}

function removeItem(items, id) {
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) {
    items.splice(i, 1);
    return true;
  }
  for (const it of items) {
    if (removeItem(it.children || [], id)) return true;
  }
  return false;
}

// ---- persistence -----------------------------------------------------------

function loadLocal() {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalize);
  } catch {
    return [];
  }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function persist(note) {
  note.updatedAt = Date.now();
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
  const note = normalize({
    id: uid(),
    color: COLOR_KEYS[notes.length % COLOR_KEYS.length],
    x: 16 + (notes.length % 5) * 18,
    y: 16 + (notes.length % 5) * 18,
    createdAt: now,
    updatedAt: now,
    order: notes.length,
    ...partial,
  });
  notes.push(note);
  board.appendChild(renderNote(note, { focus: true }));
  refreshEmptyHint();
  persist(note);
  return note;
}

/** 단순 필드 변경(변화 있을 때만 저장). */
function updateNote(id, patch) {
  const note = getNote(id);
  if (!note) return;
  let changed = false;
  for (const k in patch) {
    if (note[k] !== patch[k]) changed = true;
  }
  if (!changed) return;
  Object.assign(note, patch);
  persist(note);
}

function deleteNote(id) {
  notes = notes.filter((n) => n.id !== id);
  const card = document.querySelector(`[data-id="${id}"]`);
  card?._ro?.disconnect();
  card?.remove();
  refreshEmptyHint();
  persistRemove(id);
}

// ---- rendering -------------------------------------------------------------

function refreshEmptyHint() {
  emptyHint.style.display = notes.length ? "none" : "flex";
}

/** 카드를 새로 만들어 반환(보드에 붙이지는 않음). */
function renderNote(note, { focus = false, focusItemId = null } = {}) {
  const card = document.createElement("div");
  card.dataset.id = note.id;
  card.className =
    "note-card absolute rounded-lg shadow-lg ring-1 ring-black/10 flex flex-col" +
    (note.pinned ? " pinned" : "");
  card.style.left = note.x + "px";
  card.style.top = note.y + "px";
  card.style.width = note.w + "px";
  card.style.height = note.h + "px";
  card.style.background = COLORS[note.color] || COLORS.yellow;

  card.append(renderHead(note, card));
  card.append(note.type === "todo" ? renderTodoBody(note) : renderTextBody(note));

  makeDraggable(card, card.querySelector(".drag-handle"), note.id);
  observeResize(card, note);

  if (focus) {
    setTimeout(() => {
      const target =
        note.type === "todo"
          ? card.querySelector(".item-text")
          : card.querySelector(".note-text");
      target?.focus();
    }, 0);
  }
  if (focusItemId) {
    setTimeout(() => {
      card.querySelector(`[data-item="${focusItemId}"] .item-text`)?.focus();
    }, 0);
  }
  return card;
}

function renderHead(note, card) {
  const head = document.createElement("div");
  head.className =
    "drag-handle flex items-center justify-between gap-1 px-2 py-1 cursor-move";

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

  const tools = document.createElement("div");
  tools.className = "flex items-center gap-0.5";

  // 타입 전환 (일반 ↔ 체크리스트)
  const typeBtn = iconButton(
    note.type === "todo" ? "📝" : "☑",
    note.type === "todo" ? "일반 메모로 전환" : "체크리스트로 전환",
    (e) => {
      e.stopPropagation();
      updateNote(note.id, { type: note.type === "todo" ? "note" : "todo" });
      rerenderCard(note.id, { focus: false });
    }
  );

  // 위치 고정
  const pinBtn = iconButton(
    note.pinned ? "🔒" : "🔓",
    note.pinned ? "고정 해제" : "위치 고정",
    (e) => {
      e.stopPropagation();
      updateNote(note.id, { pinned: !note.pinned });
      rerenderCard(note.id, { focus: false });
    }
  );

  const del = iconButton("×", "삭제", (e) => {
    e.stopPropagation();
    deleteNote(note.id);
  });
  del.classList.add("text-neutral-600");

  tools.append(typeBtn, pinBtn, del);
  head.append(dots, tools);
  return head;
}

function iconButton(label, title, onClick) {
  const b = document.createElement("button");
  b.textContent = label;
  b.title = title;
  b.className = "h-5 min-w-5 rounded px-0.5 text-xs leading-none hover:bg-black/10";
  b.addEventListener("click", onClick);
  return b;
}

// ---- body: 일반 메모 -------------------------------------------------------

function renderTextBody(note) {
  const ta = document.createElement("textarea");
  ta.className =
    "note-text no-scrollbar m-1 mt-0 flex-1 resize-none rounded bg-white/40 p-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-500";
  ta.placeholder = "메모...";
  ta.value = note.text;
  ta.addEventListener("input", () => updateNote(note.id, { text: ta.value }));
  return ta;
}

// ---- body: 체크리스트 ------------------------------------------------------

function renderTodoBody(note) {
  const wrap = document.createElement("div");
  wrap.className = "no-scrollbar m-1 mt-0 flex-1 overflow-auto rounded bg-white/40 p-1";

  if (!note.items.length) {
    const hint = document.createElement("div");
    hint.className = "px-1 py-0.5 text-[11px] text-neutral-500";
    hint.textContent = "아래 ‘＋ 항목’으로 할 일을 추가하세요";
    wrap.appendChild(hint);
  }

  renderItemList(note.items, wrap, note, 0);

  const addRoot = document.createElement("button");
  addRoot.textContent = "＋ 항목";
  addRoot.className =
    "mt-1 w-full rounded px-1 py-0.5 text-left text-xs text-neutral-600 hover:bg-black/10";
  addRoot.addEventListener("click", (e) => {
    e.stopPropagation();
    const it = newItem();
    note.items.push(it);
    persist(note);
    rerenderCard(note.id, { focusItemId: it.id });
  });
  wrap.appendChild(addRoot);

  return wrap;
}

function renderItemList(items, container, note, depth) {
  for (const item of items) {
    container.appendChild(renderItemRow(item, note, depth));
    if (item.children && item.children.length && !item.collapsed) {
      renderItemList(item.children, container, note, depth + 1);
    }
  }
}

function renderItemRow(item, note, depth) {
  const row = document.createElement("div");
  row.dataset.item = item.id;
  row.className = "flex items-center gap-1 py-0.5";
  row.style.paddingLeft = depth * 14 + "px";

  // 접기/펼치기
  const hasChildren = item.children && item.children.length;
  const toggle = document.createElement("button");
  toggle.className = "h-4 w-4 shrink-0 text-[10px] text-neutral-500";
  toggle.textContent = hasChildren ? (item.collapsed ? "▶" : "▼") : "";
  if (hasChildren) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      item.collapsed = !item.collapsed;
      persist(note);
      rerenderCard(note.id);
    });
  }

  // 체크박스
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!item.done;
  cb.className = "h-3.5 w-3.5 shrink-0 accent-neutral-700";
  cb.addEventListener("change", () => {
    item.done = cb.checked;
    persist(note);
    rerenderCard(note.id);
  });

  // 텍스트
  const text = document.createElement("input");
  text.type = "text";
  text.value = item.text;
  text.placeholder = "할 일...";
  text.className =
    "item-text min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400" +
    (item.done ? " line-through text-neutral-400" : "");
  text.addEventListener("input", () => {
    item.text = text.value;
    persist(note);
  });
  // Enter → 같은 깊이에 새 항목
  text.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const sibling = newItem();
      const parentList = findParentList(note.items, item.id) || note.items;
      const idx = parentList.findIndex((x) => x.id === item.id);
      parentList.splice(idx + 1, 0, sibling);
      persist(note);
      rerenderCard(note.id, { focusItemId: sibling.id });
    }
  });

  // 하위 항목 추가
  const addSub = iconButton("＋", "하위 항목 추가", (e) => {
    e.stopPropagation();
    item.children = item.children || [];
    item.children.push(newItem());
    item.collapsed = false;
    persist(note);
    rerenderCard(note.id, { focusItemId: item.children[item.children.length - 1].id });
  });
  addSub.classList.add("shrink-0");

  // 삭제
  const del = iconButton("×", "항목 삭제", (e) => {
    e.stopPropagation();
    removeItem(note.items, item.id);
    persist(note);
    rerenderCard(note.id);
  });
  del.classList.add("shrink-0", "text-neutral-500");

  row.append(toggle, cb, text, addSub, del);
  return row;
}

function findParentList(items, id) {
  if (items.some((x) => x.id === id)) return items;
  for (const it of items) {
    const found = findParentList(it.children || [], id);
    if (found) return found;
  }
  return null;
}

// ---- 카드 갱신/재렌더 ------------------------------------------------------

function rerenderCard(id, opts = {}) {
  const note = getNote(id);
  const old = document.querySelector(`[data-id="${id}"]`);
  if (!note || !old) return;
  old._ro?.disconnect();
  old.replaceWith(renderNote(note, opts));
}

function renderAll() {
  board.querySelectorAll("[data-id]").forEach((el) => {
    el._ro?.disconnect();
    el.remove();
  });
  notes
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((n) => board.appendChild(renderNote(n)));
  refreshEmptyHint();
}

/** 원격 스냅샷을 DOM과 맞춤. 편집/드래그 중인 카드는 건드리지 않음. */
function reconcile(remote) {
  notes = remote.map(normalize).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const incoming = new Map(notes.map((n) => [n.id, n]));

  board.querySelectorAll("[data-id]").forEach((card) => {
    if (!incoming.has(card.dataset.id)) {
      card._ro?.disconnect();
      card.remove();
    }
  });

  for (const note of notes) {
    const card = board.querySelector(`[data-id="${note.id}"]`);
    if (!card) {
      board.appendChild(renderNote(note));
    } else if (
      !card.contains(document.activeElement) &&
      card.dataset.dragging !== "1"
    ) {
      card._ro?.disconnect();
      card.replaceWith(renderNote(note));
    }
    // 편집/드래그 중인 카드는 echo로 덮지 않음
  }
  refreshEmptyHint();
}

// ---- 드래그 / 리사이즈 -----------------------------------------------------

function makeDraggable(card, handle, id) {
  let startX, startY, originX, originY, dragging = false;

  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    const note = getNote(id);
    if (!note || note.pinned) return; // 고정된 메모는 이동 불가
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
    if (note) {
      Object.assign(note, { x: note.x, y: note.y });
      persist(note);
    }
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

function observeResize(card, note) {
  const ro = new ResizeObserver(() => {
    const w = Math.round(card.offsetWidth);
    const h = Math.round(card.offsetHeight);
    if (w !== Math.round(note.w) || h !== Math.round(note.h)) {
      updateNote(note.id, { w, h });
    }
  });
  ro.observe(card);
  card._ro = ro;
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
document
  .getElementById("btn-new-todo")
  .addEventListener("click", () => addNote({ type: "todo" }));
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

goLocal();
wireGlobalEvents();

if (initFirebase()) {
  onAuth((user) => {
    if (user) goCloud(user);
    else goLocal();
  });
} else {
  setStatus("로컬 모드 (Firebase 미설정)");
}
