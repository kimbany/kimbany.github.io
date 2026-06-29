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
    title: typeof n.title === "string" ? n.title : "",
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
  return {
    id: uid(),
    text: "",
    done: false,
    collapsed: false,
    due: null, // 마감일 "YYYY-MM-DD" | null
    memo: null, // 이슈/메모 텍스트 | null (null이면 숨김)
    children: [],
  };
}

/** "2026-06-30" → "26.06.30" */
function fmtDue(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y.slice(2)}.${m}.${d}`;
}

/** 항목과 모든 하위 항목의 done을 일괄 설정(상위 체크 → 하위 전부). */
function setDoneRecursive(item, value) {
  item.done = value;
  (item.children || []).forEach((c) => setDoneRecursive(c, value));
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
  scheduleCalendar();
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
  scheduleCalendar();
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
  card.append(renderTitle(note));
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

function renderTitle(note) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = note.title;
  input.placeholder = "제목";
  input.className =
    "title-input mx-1 mb-0.5 bg-transparent text-sm font-bold text-neutral-800 " +
    "outline-none placeholder:font-normal placeholder:text-neutral-500/70";
  input.addEventListener("input", () => updateNote(note.id, { title: input.value }));
  return input;
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
  wrap.className = "todo-wrap no-scrollbar m-1 mt-0 flex-1 overflow-auto rounded bg-white/40 p-1";

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
    if (item.memo != null) container.appendChild(renderItemMemo(item, note, depth));
    if (item.children && item.children.length && !item.collapsed) {
      renderItemList(item.children, container, note, depth + 1);
    }
  }
}

function renderItemMemo(item, note, depth) {
  const box = document.createElement("div");
  box.className = "py-0.5";
  box.style.paddingLeft = depth * 14 + 22 + "px";
  const ta = document.createElement("textarea");
  ta.rows = 2;
  ta.placeholder = "메모 / 이슈 기록...";
  ta.value = item.memo;
  ta.className =
    "no-scrollbar w-full resize-none rounded border border-amber-300/60 bg-amber-50/80 " +
    "px-1.5 py-1 text-[11px] text-neutral-700 outline-none placeholder:text-neutral-400";
  ta.addEventListener("input", () => {
    item.memo = ta.value;
    persist(note);
  });
  box.appendChild(ta);
  return box;
}

function renderItemRow(item, note, depth) {
  const row = document.createElement("div");
  row.dataset.item = item.id;
  row.className = "item-row flex items-center gap-1 py-0.5";
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

  // 체크박스 — 상위 체크 시 하위 전부 체크
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!item.done;
  cb.className = "h-3.5 w-3.5 shrink-0 accent-neutral-700";
  cb.addEventListener("change", () => {
    setDoneRecursive(item, cb.checked);
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

  // 마감일 표시(내용 오른쪽, 연하고 작게)
  let dueSpan = null;
  if (item.due) {
    dueSpan = document.createElement("span");
    dueSpan.className = "shrink-0 text-[10px] text-neutral-500/80";
    dueSpan.textContent = "(" + fmtDue(item.due) + ")";
  }

  // 마감일 선택(달력 아이콘 + 숨은 date 입력)
  const dateWrap = document.createElement("span");
  dateWrap.className = "relative shrink-0";
  const dateIn = document.createElement("input");
  dateIn.type = "date";
  dateIn.value = item.due || "";
  dateIn.className = "absolute right-0 top-0 h-0 w-0 opacity-0";
  dateIn.addEventListener("change", () => {
    item.due = dateIn.value || null;
    persist(note);
    rerenderCard(note.id);
  });
  const dateBtn = iconButton(
    item.due ? "📅" : "🗓",
    item.due ? "마감일 변경 (" + fmtDue(item.due) + ")" : "마감일 선택",
    (e) => {
      e.stopPropagation();
      try {
        dateIn.showPicker();
      } catch {
        dateIn.click();
      }
    }
  );
  dateBtn.classList.add("shrink-0");
  dateWrap.append(dateBtn, dateIn);

  // 우클릭 메뉴 (메모하기 등)
  row.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showItemContextMenu(e.clientX, e.clientY, note, item.id);
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

  // 드래그 핸들(맨 뒤): 잡고 항목 이동
  const handle = document.createElement("button");
  handle.textContent = "⠿";
  handle.title = "드래그로 이동 (가장자리=형제, 가운데=하위)";
  handle.className =
    "drag-handle-item shrink-0 px-0.5 text-xs leading-none text-neutral-400 hover:text-neutral-700";
  setupItemDrag(handle, note, item.id);

  const parts = [toggle, cb, text, dueSpan, addSub, del, handle, dateWrap].filter(Boolean);
  row.append(...parts);
  return row;
}

// ---- 우클릭 컨텍스트 메뉴 --------------------------------------------------

let ctxMenuEl = null;

function closeContextMenu() {
  ctxMenuEl?.remove();
  ctxMenuEl = null;
  document.removeEventListener("pointerdown", onCtxOutside, true);
  document.removeEventListener("keydown", onCtxKey, true);
}
function onCtxOutside(e) {
  if (ctxMenuEl && !ctxMenuEl.contains(e.target)) closeContextMenu();
}
function onCtxKey(e) {
  if (e.key === "Escape") closeContextMenu();
}

function showItemContextMenu(x, y, note, itemId) {
  closeContextMenu();
  const item = findItem(note.items, itemId);
  if (!item) return;

  const menu = document.createElement("div");
  menu.className =
    "fixed z-[1000] min-w-32 overflow-hidden rounded-md border border-black/10 bg-white py-1 text-sm text-neutral-800 shadow-xl";
  menu.style.left = x + "px";
  menu.style.top = y + "px";

  const add = (label, fn) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.className = "block w-full px-3 py-1.5 text-left hover:bg-neutral-100";
    b.addEventListener("click", () => {
      closeContextMenu();
      fn();
    });
    menu.appendChild(b);
  };

  if (item.memo == null) {
    add("📝 메모하기", () => {
      item.memo = "";
      persist(note);
      rerenderCard(note.id);
      setTimeout(() => {
        document
          .querySelector(`[data-id="${note.id}"] [data-item="${itemId}"]`)
          ?.nextElementSibling?.querySelector("textarea")
          ?.focus();
      }, 0);
    });
  } else {
    add("📝 메모 삭제", () => {
      item.memo = null;
      persist(note);
      rerenderCard(note.id);
    });
  }
  add("＋ 하위 항목", () => {
    item.children = item.children || [];
    const c = newItem();
    item.children.push(c);
    item.collapsed = false;
    persist(note);
    rerenderCard(note.id, { focusItemId: c.id });
  });
  add("🗑 항목 삭제", () => {
    removeItem(note.items, itemId);
    persist(note);
    rerenderCard(note.id);
  });

  document.body.appendChild(menu);
  ctxMenuEl = menu;
  // 화면 밖으로 나가면 위치 보정
  const r = menu.getBoundingClientRect();
  if (r.right > window.innerWidth) menu.style.left = window.innerWidth - r.width - 8 + "px";
  if (r.bottom > window.innerHeight) menu.style.top = window.innerHeight - r.height - 8 + "px";

  document.addEventListener("pointerdown", onCtxOutside, true);
  document.addEventListener("keydown", onCtxKey, true);
}

// ---- 체크리스트 항목 드래그 이동 ------------------------------------------

let itemDrag = null;

function getSubtreeIds(item) {
  const ids = new Set();
  (function walk(it) {
    ids.add(it.id);
    (it.children || []).forEach(walk);
  })(item);
  return ids;
}

/** 트리에서 항목을 떼어내 반환(없으면 null). */
function detachItem(items, id) {
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) return items.splice(i, 1)[0];
  for (const it of items) {
    const r = detachItem(it.children || [], id);
    if (r) return r;
  }
  return null;
}

function clearDropIndicators(card) {
  card.querySelectorAll(".item-row").forEach((r) =>
    r.classList.remove("drop-before", "drop-after", "drop-child")
  );
}

function setupItemDrag(handle, note, itemId) {
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const item = findItem(note.items, itemId);
    if (!item) return;
    const card = handle.closest(".note-card");
    itemDrag = { note, id: itemId, subtree: getSubtreeIds(item), target: null, card };
    handle.setPointerCapture(e.pointerId);
    card?.querySelector(`[data-item="${itemId}"]`)?.classList.add("opacity-40");
  });

  handle.addEventListener("pointermove", (e) => {
    if (!itemDrag) return;
    const card = itemDrag.card;
    if (!card) return;
    clearDropIndicators(card);
    itemDrag.target = null;
    const rows = [...card.querySelectorAll(".item-row")];
    for (const row of rows) {
      const id = row.dataset.item;
      if (itemDrag.subtree.has(id)) continue; // 자기/자손 위는 무시
      const r = row.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        const rel = (e.clientY - r.top) / r.height;
        const pos = rel < 0.3 ? "before" : rel > 0.7 ? "after" : "child";
        itemDrag.target = { id, pos };
        row.classList.add("drop-" + pos);
        break;
      }
    }
  });

  const end = () => {
    if (!itemDrag) return;
    const d = itemDrag;
    itemDrag = null;
    if (d.card) clearDropIndicators(d.card);
    if (d.target && d.target.id !== d.id) {
      moveItem(d.note, d.id, d.target.id, d.target.pos);
      persist(d.note);
    }
    rerenderCard(d.note.id); // opacity 복구 + 재배치 반영
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

/** dragId 항목을 targetId 기준 위치(before/after/child)로 이동. */
function moveItem(note, dragId, targetId, pos) {
  const moved = detachItem(note.items, dragId);
  if (!moved) return;
  if (pos === "child") {
    const target = findItem(note.items, targetId);
    if (!target) {
      note.items.push(moved); // 안전장치
      return;
    }
    target.children = target.children || [];
    target.children.push(moved);
    target.collapsed = false;
  } else {
    const list = findParentList(note.items, targetId) || note.items;
    let idx = list.findIndex((x) => x.id === targetId);
    if (idx < 0) idx = list.length - 1;
    if (pos === "after") idx += 1;
    list.splice(idx, 0, moved);
  }
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
  scheduleCalendar();
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

// ---- 달력 패널 (오른쪽 1/3) -----------------------------------------------

const _now = new Date();
let calYear = _now.getFullYear();
let calMonth = _now.getMonth(); // 0-based
let calTimer = null;

function scheduleCalendar() {
  clearTimeout(calTimer);
  calTimer = setTimeout(renderCalendar, 120);
}

function ymd(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/** 모든 체크리스트에서 마감일이 있는 항목 수집 → { "YYYY-MM-DD": [..] } */
function collectDueItems() {
  const map = {};
  for (const note of notes) {
    if (note.type !== "todo") continue;
    (function walk(items) {
      for (const it of items || []) {
        if (it.due) {
          (map[it.due] = map[it.due] || []).push({
            text: it.text || "(내용 없음)",
            title: note.title || "",
            done: !!it.done,
            color: note.color,
          });
        }
        walk(it.children);
      }
    })(note.items);
  }
  return map;
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  if (!cal) return;
  cal.innerHTML = "";
  const due = collectDueItems();
  const todayKey = ymd(new Date());

  // 헤더: ◀ YYYY.MM ▶
  const head = document.createElement("div");
  head.className = "mb-1 flex items-center justify-between text-xs font-semibold";
  const prev = document.createElement("button");
  prev.textContent = "◀";
  prev.className = "rounded px-1 hover:bg-white/15";
  prev.addEventListener("click", () => {
    calMonth--;
    if (calMonth < 0) {
      calMonth = 11;
      calYear--;
    }
    renderCalendar();
  });
  const next = document.createElement("button");
  next.textContent = "▶";
  next.className = "rounded px-1 hover:bg-white/15";
  next.addEventListener("click", () => {
    calMonth++;
    if (calMonth > 11) {
      calMonth = 0;
      calYear++;
    }
    renderCalendar();
  });
  const label = document.createElement("span");
  label.textContent = `${calYear}.${String(calMonth + 1).padStart(2, "0")}`;
  head.append(prev, label, next);
  cal.appendChild(head);

  // 요일
  const wd = document.createElement("div");
  wd.className = "grid grid-cols-7 text-center text-[10px] text-neutral-400";
  ["일", "월", "화", "수", "목", "금", "토"].forEach((d, i) => {
    const c = document.createElement("div");
    c.textContent = d;
    if (i === 0) c.classList.add("text-red-300");
    wd.appendChild(c);
  });
  cal.appendChild(wd);

  // 날짜 그리드
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-7 gap-0.5 text-center text-[10px]";
  const startDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  for (let i = 0; i < startDay; i++) grid.appendChild(document.createElement("div"));
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "rounded py-0.5 leading-tight";
    if (key === todayKey) cell.classList.add("bg-amber-400/30", "font-bold");
    const num = document.createElement("div");
    num.textContent = day;
    cell.appendChild(num);
    if (due[key]) {
      const dot = document.createElement("div");
      const allDone = due[key].every((x) => x.done);
      dot.className =
        "mx-auto mt-0.5 h-1.5 w-1.5 rounded-full " +
        (allDone ? "bg-neutral-400" : "bg-rose-400");
      cell.appendChild(dot);
    }
    grid.appendChild(cell);
  }
  cal.appendChild(grid);

  // 이번 달 마감 목록
  const list = document.createElement("div");
  list.className = "mt-2 border-t border-white/15 pt-2 text-[11px]";
  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const keys = Object.keys(due)
    .filter((k) => k.startsWith(monthPrefix))
    .sort();
  if (!keys.length) {
    const empty = document.createElement("div");
    empty.className = "text-neutral-400";
    empty.textContent = "이번 달 마감 없음";
    list.appendChild(empty);
  } else {
    for (const k of keys) {
      for (const it of due[k]) {
        const row = document.createElement("div");
        row.className = "flex items-start gap-1 py-0.5";
        const dot = document.createElement("span");
        dot.className = "mt-1 h-2 w-2 shrink-0 rounded-full";
        dot.style.background = COLORS[it.color] || COLORS.yellow;
        const txt = document.createElement("span");
        txt.className =
          "min-w-0 flex-1 " + (it.done ? "text-neutral-500 line-through" : "text-neutral-100");
        const dd = k.slice(8);
        const mm = k.slice(5, 7);
        const label = it.title ? `${it.title} · ${it.text}` : it.text;
        txt.textContent = `${mm}.${dd}  ${label}`;
        row.append(dot, txt);
        list.appendChild(row);
      }
    }
  }
  cal.appendChild(list);
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
renderCalendar();

if (initFirebase()) {
  onAuth((user) => {
    if (user) goCloud(user);
    else goLocal();
  });
} else {
  setStatus("로컬 모드 (Firebase 미설정)");
}
