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

// 각 색: bg(카드 배경) + dark(어두운 카드 → 흰 글씨)
const COLORS = {
  navy: { bg: "#2b3a5c", dark: true }, // 첨부 이미지 톤
  teal: { bg: "#1f4d4a", dark: true }, // 딥 틸
  plum: { bg: "#46314f", dark: true }, // 딥 플럼
  gray: { bg: "#e5e7eb", dark: false },
};
const COLOR_KEYS = Object.keys(COLORS);
function colorBg(key) {
  return (COLORS[key] || COLORS.navy).bg;
}
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
  const type = n.type === "todo" || n.type === "event" ? n.type : "note";
  return {
    id: n.id,
    type,
    title: typeof n.title === "string" ? n.title : "",
    text: typeof n.text === "string" ? n.text : "",
    // 달력 이벤트(type === "event") 전용 필드
    start: typeof n.start === "string" ? n.start : null,
    end: typeof n.end === "string" ? n.end : null,
    allDay: n.allDay !== false,
    startTime: typeof n.startTime === "string" ? n.startTime : null,
    endTime: typeof n.endTime === "string" ? n.endTime : null,
    items: Array.isArray(n.items) ? n.items : [],
    color: COLORS[n.color] ? n.color : "navy",
    x: Number.isFinite(n.x) ? n.x : 16,
    y: Number.isFinite(n.y) ? n.y : 16,
    w: Number.isFinite(n.w) ? n.w : DEFAULT_W,
    h: Number.isFinite(n.h) ? n.h : DEFAULT_H,
    pinned: !!n.pinned,
    hidden: !!n.hidden,
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
    status: "active", // "active"(진행중) | "hold"(보류) | "done"(완료)
    priority: null, // 1 | 2 | 3 | null
    collapsed: false,
    due: null, // 마감일 "YYYY-MM-DD" | null
    memo: null, // 이슈/메모 텍스트 | null (null이면 숨김)
    children: [],
  };
}

// 상태 읽기(레거시 done 필드 호환)
function statusOf(item) {
  return item.status || (item.done ? "done" : "active");
}
// 상태 + 하위 일괄(토글로 완료/진행 전환 시 하위까지)
function setStatusRecursive(item, status) {
  item.status = status;
  delete item.done;
  (item.children || []).forEach((c) => setStatusRecursive(c, status));
}

// 메모 인라인 편집이 열린 항목 id(런타임 상태, 저장 안 함)
const openMemos = new Set();

/** 카드 내용을 복사용 텍스트로. 체크리스트는 1 / 1-1 / 1-1-1 계층 번호. */
function cardToText(note) {
  const lines = [];
  if (note.title) lines.push(note.title);
  if (note.type === "todo") {
    (function walk(items, prefix) {
      (items || []).forEach((it, i) => {
        const num = prefix ? `${prefix}-${i + 1}` : `${i + 1}`;
        const st = statusOf(it);
        const mark = st === "done" ? " ✓" : st === "hold" ? " (보류)" : "";
        lines.push(`${num}. ${it.text || ""}${mark}`);
        if (it.children && it.children.length) walk(it.children, num);
      });
    })(note.items, "");
  } else {
    lines.push(note.text || "");
  }
  return lines.join("\n");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // clipboard API 불가 시 폴백
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

function toast(msg) {
  const t = document.createElement("div");
  t.className =
    "fixed bottom-4 left-1/2 z-[3000] -translate-x-1/2 rounded bg-black/80 px-3 py-1.5 text-xs text-white shadow-lg";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1200);
}

/** "2026-06-30" → "26.06.30" */
function fmtDue(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y.slice(2)}.${m}.${d}`;
}

/** 항목을 하위까지 깊은 복사(모든 id 새로 발급). */
function cloneItemDeep(item) {
  return {
    id: uid(),
    text: item.text || "",
    status: statusOf(item),
    priority: item.priority || null,
    collapsed: !!item.collapsed,
    due: item.due || null,
    memo: item.memo == null ? null : item.memo,
    children: (item.children || []).map(cloneItemDeep),
  };
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
        // 보호 해제는 실제 저장 완료(await) 후에 — 왕복 중 옛 echo 덮어쓰기 방지
        upsertNote(currentUid, note)
          .catch((e) => console.error("upsert", e))
          .finally(() => cloudDebouncers.delete(note.id));
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

function isBoardNote(n) {
  return !n.hidden && n.type !== "event";
}

function refreshEmptyHint() {
  const anyVisible = notes.some(isBoardNote);
  emptyHint.style.display = anyVisible ? "none" : "flex";
}

/** 메모 숨김/표시 토글. */
function setHidden(id, hidden) {
  updateNote(id, { hidden });
  const note = getNote(id);
  const card = document.querySelector(`[data-id="${id}"]`);
  if (hidden) {
    card?._ro?.disconnect();
    card?.remove();
  } else if (note && !card) {
    board.appendChild(renderNote(note));
  }
  refreshEmptyHint();
  renderNoteList();
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
  const c = COLORS[note.color] || COLORS.navy;
  card.style.background = c.bg;
  card.style.color = c.dark ? "#f3f4f6" : "#1f2937";
  // 내부 요소가 참조하는 CSS 변수(구분선/입력 배경)
  card.style.setProperty("--line", c.dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)");
  card.style.setProperty("--fld", c.dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.45)");
  card.style.setProperty("--card-bg", c.bg);

  card.append(renderHead(note, card));
  card.append(renderTitle(note));
  card.append(note.type === "todo" ? renderTodoBody(note) : renderTextBody(note));

  makeDraggable(card, card.querySelector(".drag-handle"), note.id);
  observeResize(card, note);
  // 최근 편집 시각 기록(입력 직후 원격 echo가 카드를 덮어쓰지 않도록)
  card.addEventListener(
    "input",
    () => {
      card.dataset.editedAt = String(performance.now());
    },
    true
  );

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
    dot.className =
      "h-3 w-3 rounded-full ring-1 ring-current/30" +
      (note.color === key ? " ring-2 ring-current" : "");
    dot.style.background = colorBg(key);
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      updateNote(note.id, { color: key });
      rerenderCard(note.id);
    });
    dots.appendChild(dot);
  }

  const tools = document.createElement("div");
  tools.className = "flex items-center gap-0.5";

  // 내용 복사
  const copyBtn = iconButton(
    svgIcon("copy"),
    "내용 복사",
    async (e) => {
      e.stopPropagation();
      const ok = await copyText(cardToText(note));
      toast(ok ? "복사됨" : "복사 실패");
    },
    true
  );

  // 위치 고정
  const pinBtn = iconButton(
    svgIcon(note.pinned ? "lock" : "unlock"),
    note.pinned ? "고정 해제" : "위치 고정",
    (e) => {
      e.stopPropagation();
      updateNote(note.id, { pinned: !note.pinned });
      rerenderCard(note.id, { focus: false });
    },
    true
  );

  // 숨기기 (목록 패널에서 다시 표시)
  const hideBtn = iconButton(
    svgIcon("eye"),
    "숨기기 (목록에서 다시 표시)",
    (e) => {
      e.stopPropagation();
      setHidden(note.id, true);
    },
    true
  );

  const del = iconButton(
    svgIcon("x"),
    "삭제 (되돌릴 수 없음)",
    async (e) => {
      e.stopPropagation();
      const ok = await confirmDialog(
        "이 메모를 삭제하면 <b>다시 열 수 없습니다.</b><br>삭제할까요?"
      );
      if (ok) deleteNote(note.id);
    },
    true
  );

  tools.append(copyBtn, pinBtn, hideBtn, del);
  head.append(dots, tools);
  return head;
}

function renderTitle(note) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = note.title;
  input.placeholder = "제목";
  input.className =
    "title-input mx-1 mb-0.5 bg-transparent text-sm font-bold " +
    "outline-none placeholder:font-normal";
  input.addEventListener("input", () => updateNote(note.id, { title: input.value }));
  return input;
}

// 심플 라인 아이콘 (stroke=currentColor)
function svgIcon(name) {
  const P = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    list: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    calendar:
      '<rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-1"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    check:
      '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    note:
      '<rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>',
    x: '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
    copy:
      '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    eyeOff:
      '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M6.61 6.61A18.5 18.5 0 0 0 1 12s4 8 11 8a9.12 9.12 0 0 0 5.39-1.61"/><line x1="1" y1="1" x2="23" y2="23"/>',
  };
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 pointer-events-none">' +
    (P[name] || "") +
    "</svg>"
  );
}

function iconButton(content, title, onClick, isHtml = false) {
  const b = document.createElement("button");
  if (isHtml) b.innerHTML = content;
  else b.textContent = content;
  b.title = title;
  b.className =
    "inline-flex h-6 min-w-6 items-center justify-center rounded px-0.5 text-xs leading-none opacity-70 hover:opacity-100";
  b.addEventListener("click", onClick);
  return b;
}

// ---- body: 일반 메모 -------------------------------------------------------

function renderTextBody(note) {
  const ta = document.createElement("textarea");
  ta.className =
    "note-text fld no-scrollbar m-1 mt-0 flex-1 resize-none rounded p-2 text-sm outline-none";
  ta.placeholder = "메모...";
  ta.value = note.text;
  ta.addEventListener("input", () => updateNote(note.id, { text: ta.value }));
  return ta;
}

// ---- body: 체크리스트 ------------------------------------------------------

function renderTodoBody(note) {
  const wrap = document.createElement("div");
  wrap.className = "todo-wrap fld no-scrollbar m-1 mt-0 flex-1 overflow-auto rounded p-1";

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
    if (item.memo != null && openMemos.has(item.id))
      container.appendChild(renderItemMemo(item, note, depth));
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
  const st = statusOf(item);
  const row = document.createElement("div");
  row.dataset.item = item.id;
  // 상태는 토글 색/글씨로 표현 → 행 배경 없음
  row.className = "item-row flex items-center gap-1 rounded py-0.5";
  row.style.paddingLeft = depth * 14 + "px";

  // 접기/펼치기
  const hasChildren = item.children && item.children.length;
  const toggle = document.createElement("button");
  toggle.className = "h-4 w-4 shrink-0 text-[10px] opacity-60";
  toggle.textContent = hasChildren ? (item.collapsed ? "▶" : "▼") : "";
  if (hasChildren) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      item.collapsed = !item.collapsed;
      persist(note);
      rerenderCard(note.id);
    });
  }

  // 토글 — 진행중=초록 스위치, 완료=기존(채움), 보류=빈 스위치
  // 클릭=완료/진행 전환(하위까지), 우클릭=상태 메뉴
  const cb = document.createElement("button");
  cb.type = "button";
  cb.setAttribute("role", "switch");
  cb.setAttribute("aria-checked", st === "done" ? "true" : "false");
  let knobStyle = "";
  if (st === "done") {
    // 완료: knob 오른쪽(on), 기존 채움 그대로
    cb.className = "toggle shrink-0 on";
  } else {
    // 진행중/보류: knob 왼쪽(off) + pill 색 채움(초록/주황) + 흰 knob
    cb.className = "toggle shrink-0";
    const fill = st === "active" ? "#10b981" : "#f59e0b";
    cb.style.background = fill;
    cb.style.borderColor = fill;
    knobStyle = ' style="background:#ffffff"';
  }
  cb.innerHTML = '<span class="toggle-knob"' + knobStyle + "></span>";
  cb.title = "클릭: 완료/진행 전환 · 우클릭: 상태 변경";
  cb.addEventListener("click", () => {
    setStatusRecursive(item, st === "done" ? "active" : "done");
    persist(note);
    rerenderCard(note.id);
  });
  cb.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showStatusMenu(e.clientX, e.clientY, note, item.id);
  });

  // 텍스트
  const text = document.createElement("input");
  text.type = "text";
  text.value = item.text;
  text.placeholder = "할 일...";
  // 글씨: 진행중=흰색(상속, 우선순위색 우선) / 보류=회색 / 완료=회색+취소선
  const prioColor = { 1: "text-red-500", 2: "text-orange-500", 3: "text-yellow-400" };
  text.className =
    "item-text min-w-0 flex-1 bg-transparent text-sm outline-none" +
    (st === "done"
      ? " line-through opacity-50 text-neutral-400"
      : st === "hold"
        ? " text-neutral-400"
        : item.priority
          ? " font-semibold " + prioColor[item.priority]
          : "");
  text.addEventListener("input", () => {
    item.text = text.value;
    persist(note);
  });

  // 마감일 표시(내용 오른쪽, 연하고 작게)
  let dueSpan = null;
  if (item.due) {
    dueSpan = document.createElement("span");
    dueSpan.className = "shrink-0 text-[10px] opacity-60";
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
    svgIcon("calendar"),
    item.due ? "마감일 변경 (" + fmtDue(item.due) + ")" : "마감일 선택",
    (e) => {
      e.stopPropagation();
      try {
        dateIn.showPicker();
      } catch {
        dateIn.click();
      }
    },
    true
  );
  dateBtn.classList.add("shrink-0");
  if (item.due) dateBtn.classList.replace("opacity-70", "opacity-100");
  dateWrap.append(dateBtn, dateIn);

  // 우클릭 메뉴 (메모하기 등)
  row.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showItemContextMenu(e.clientX, e.clientY, note, item.id);
  });
  // Enter → 같은 깊이에 새 항목 (한글 조합 중 엔터는 무시)
  text.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      item.text = text.value; // 현재 입력값 확정 반영(마지막 글자 유실 방지)
      const sibling = newItem();
      const parentList = findParentList(note.items, item.id) || note.items;
      const idx = parentList.findIndex((x) => x.id === item.id);
      parentList.splice(idx + 1, 0, sibling);
      persist(note);
      rerenderCard(note.id, { focusItemId: sibling.id });
    }
  });

  // 메모 표시: 메모가 있으면 말풍선 아이콘(hover로 미리보기, 클릭=열기/닫기)
  let memoIcon = null;
  if (item.memo != null) {
    memoIcon = iconButton(
      svgIcon("chat"),
      item.memo ? item.memo : "메모 (클릭하여 열기)",
      (e) => {
        e.stopPropagation();
        if (openMemos.has(item.id)) openMemos.delete(item.id);
        else openMemos.add(item.id);
        rerenderCard(note.id);
      },
      true
    );
    memoIcon.classList.add("shrink-0");
  }

  // 드래그 핸들(맨 뒤): 잡고 항목 이동. 추가/삭제/하위는 우클릭 메뉴로.
  const handle = document.createElement("button");
  handle.textContent = "⠿";
  handle.title = "드래그로 이동 (가장자리=형제, 가운데=하위) · 우클릭=메뉴";
  handle.className =
    "drag-handle-item shrink-0 px-0.5 text-xs leading-none opacity-60 hover:opacity-100";
  setupItemDrag(handle, note, item.id);

  const parts = [toggle, cb, text, dueSpan, memoIcon, handle, dateWrap].filter(Boolean);
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
    "fixed z-[1000] min-w-32 rounded-md border border-black/10 bg-white py-1 text-sm text-neutral-800 shadow-xl";
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

  // hover로 펼치는 서브메뉴
  const addSubmenu = (label, options) => {
    const b = document.createElement("button");
    b.className = "relative block w-full px-3 py-1.5 text-left hover:bg-neutral-100";
    b.textContent = label + " ▸";
    const sub = document.createElement("div");
    sub.className =
      "absolute left-full top-0 z-[1001] hidden min-w-28 rounded-md border border-black/10 bg-white py-1 shadow-xl";
    for (const [optLabel, fn] of options) {
      const ob = document.createElement("button");
      ob.innerHTML = optLabel;
      ob.className = "block w-full px-3 py-1.5 text-left hover:bg-neutral-100";
      ob.addEventListener("click", () => {
        closeContextMenu();
        fn();
      });
      sub.appendChild(ob);
    }
    b.appendChild(sub);
    b.addEventListener("mouseenter", () => sub.classList.remove("hidden"));
    b.addEventListener("mouseleave", () => sub.classList.add("hidden"));
    menu.appendChild(b);
  };

  if (item.memo == null) {
    add("📝 메모하기", () => {
      item.memo = "";
      openMemos.add(itemId);
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
    add(openMemos.has(itemId) ? "📝 메모 닫기" : "📝 메모 열기", () => {
      if (openMemos.has(itemId)) openMemos.delete(itemId);
      else openMemos.add(itemId);
      rerenderCard(note.id);
    });
    add("📝 메모 삭제", () => {
      item.memo = null;
      openMemos.delete(itemId);
      persist(note);
      rerenderCard(note.id);
    });
  }
  add("📋 복사 (하위 포함)", () => {
    const copy = cloneItemDeep(item);
    const list = findParentList(note.items, itemId) || note.items;
    let idx = list.findIndex((x) => x.id === itemId);
    if (idx < 0) idx = list.length - 1;
    list.splice(idx + 1, 0, copy);
    persist(note);
    rerenderCard(note.id);
  });
  add("＋ 하위 항목", () => {
    item.children = item.children || [];
    const c = newItem();
    item.children.push(c);
    item.collapsed = false;
    persist(note);
    rerenderCard(note.id, { focusItemId: c.id });
  });
  addSubmenu("⚑ 우선순위", [
    [
      '<span class="text-red-500 font-semibold">● 1순위</span>',
      () => setPriority(note, itemId, 1),
    ],
    [
      '<span class="text-orange-500 font-semibold">● 2순위</span>',
      () => setPriority(note, itemId, 2),
    ],
    [
      '<span class="text-yellow-500 font-semibold">● 3순위</span>',
      () => setPriority(note, itemId, 3),
    ],
    ['<span class="text-neutral-500">없음</span>', () => setPriority(note, itemId, null)],
  ]);
  add("➡ 다른 체크리스트로 이동", () => showMoveMenu(x, y, note, itemId));
  add("🗑 삭제", async () => {
    const ok = await confirmDialog("이 항목을 삭제할까요?<br>하위 항목도 함께 삭제됩니다.");
    if (!ok) return;
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

/** 항목을 다른 체크리스트(note)로 이동. */
function showMoveMenu(x, y, srcNote, itemId) {
  closeContextMenu();
  const targets = notes.filter((n) => n.type === "todo" && n.id !== srcNote.id);
  const menu = document.createElement("div");
  menu.className =
    "fixed z-[1000] max-h-64 min-w-40 overflow-auto rounded-md border border-black/10 bg-white py-1 text-sm text-neutral-800 shadow-xl";
  menu.style.left = x + "px";
  menu.style.top = y + "px";

  if (!targets.length) {
    const d = document.createElement("div");
    d.className = "px-3 py-2 text-neutral-500";
    d.textContent = "이동할 다른 체크리스트가 없습니다";
    menu.appendChild(d);
  } else {
    const headEl = document.createElement("div");
    headEl.className = "px-3 py-1 text-[11px] font-semibold text-neutral-400";
    headEl.textContent = "이동할 체크리스트 선택";
    menu.appendChild(headEl);
    for (const t of targets) {
      const b = document.createElement("button");
      b.textContent = "☑ " + notePreview(t);
      b.className = "block w-full truncate px-3 py-1.5 text-left hover:bg-neutral-100";
      b.addEventListener("click", () => {
        closeContextMenu();
        moveItemToNote(srcNote, itemId, t);
      });
      menu.appendChild(b);
    }
  }

  document.body.appendChild(menu);
  ctxMenuEl = menu;
  const r = menu.getBoundingClientRect();
  if (r.right > window.innerWidth) menu.style.left = window.innerWidth - r.width - 8 + "px";
  if (r.bottom > window.innerHeight) menu.style.top = window.innerHeight - r.height - 8 + "px";
  document.addEventListener("pointerdown", onCtxOutside, true);
  document.addEventListener("keydown", onCtxKey, true);
}

function moveItemToNote(srcNote, itemId, destNote) {
  const moved = detachItem(srcNote.items, itemId);
  if (!moved) return;
  destNote.items.push(moved);
  persist(srcNote);
  persist(destNote);
  rerenderCard(srcNote.id);
  rerenderCard(destNote.id); // 대상이 보드에 떠 있으면 갱신(숨김이면 무시됨)
}

function setPriority(note, itemId, p) {
  const it = findItem(note.items, itemId);
  if (!it) return;
  it.priority = p;
  persist(note);
  rerenderCard(note.id);
}

/** 토글 우클릭: 항목 상태(진행중/보류/완료) 변경. */
function showStatusMenu(x, y, note, itemId) {
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
      persist(note);
      rerenderCard(note.id);
    });
    menu.appendChild(b);
  };
  add("🟢 진행 중 (하위 포함)", () => setStatusRecursive(item, "active"));
  add("🟠 보류 (하위 포함)", () => setStatusRecursive(item, "hold"));
  add("⚪ 완료 (하위 포함)", () => setStatusRecursive(item, "done"));

  document.body.appendChild(menu);
  ctxMenuEl = menu;
  const r = menu.getBoundingClientRect();
  if (r.right > window.innerWidth) menu.style.left = window.innerWidth - r.width - 8 + "px";
  if (r.bottom > window.innerHeight) menu.style.top = window.innerHeight - r.height - 8 + "px";
  document.addEventListener("pointerdown", onCtxOutside, true);
  document.addEventListener("keydown", onCtxKey, true);
}

/** 예/아니오 확인 모달. Enter=예, Esc=아니오. Promise<boolean>. */
function confirmDialog(messageHtml) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-[2000] flex items-center justify-center bg-black/40";
    const box = document.createElement("div");
    box.className = "w-64 rounded-lg bg-white p-4 text-neutral-800 shadow-2xl";
    const msg = document.createElement("div");
    msg.className = "mb-4 text-sm leading-relaxed";
    msg.innerHTML = messageHtml;
    const btns = document.createElement("div");
    btns.className = "flex justify-end gap-2";
    const no = document.createElement("button");
    no.textContent = "아니오";
    no.className = "rounded px-3 py-1.5 text-sm bg-neutral-200 hover:bg-neutral-300";
    const yes = document.createElement("button");
    yes.textContent = "예";
    yes.className = "rounded px-3 py-1.5 text-sm bg-rose-500 text-white hover:bg-rose-600";
    btns.append(no, yes);
    box.append(msg, btns);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const close = (val) => {
      overlay.remove();
      document.removeEventListener("keydown", onKey, true);
      resolve(val);
    };
    const onKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        close(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
    };
    yes.addEventListener("click", () => close(true));
    no.addEventListener("click", () => close(false));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
    document.addEventListener("keydown", onKey, true);
    setTimeout(() => yes.focus(), 0);
  });
}

/** ＋ 버튼 드롭다운: 메모 / 체크리스트 선택. */
function showAddMenu(btn) {
  closeContextMenu();
  const r = btn.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.className =
    "fixed z-[1000] min-w-32 overflow-hidden rounded-md border border-black/10 bg-white py-1 text-sm text-neutral-800 shadow-xl";
  menu.style.left = r.left + "px";
  menu.style.top = r.bottom + 4 + "px";
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
  add("📝 메모", () => addNote());
  add("☑ 체크리스트", () => addNote({ type: "todo" }));
  document.body.appendChild(menu);
  ctxMenuEl = menu;
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

function recentlyEdited(card) {
  const t = parseFloat(card.dataset.editedAt || "0");
  return performance.now() - t < 2000;
}

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
    .filter(isBoardNote)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((n) => board.appendChild(renderNote(n)));
  refreshEmptyHint();
  renderNoteList();
}

/** 원격 스냅샷을 DOM과 맞춤. 편집/드래그 중인 카드는 건드리지 않음. */
function reconcile(remote) {
  // 저장 대기 중이거나, 로컬이 더 최근인 변경은 원격 echo로 덮어쓰지 않는다.
  const localById = new Map(notes.map((n) => [n.id, n]));
  const merged = remote.map(normalize).map((rn) => {
    const local = localById.get(rn.id);
    if (!local) return rn;
    const keepLocal =
      cloudDebouncers.has(rn.id) || (local.updatedAt || 0) > (rn.updatedAt || 0);
    return keepLocal ? local : rn;
  });
  for (const [id, ln] of localById) {
    if (cloudDebouncers.has(id) && !merged.some((n) => n.id === id)) merged.push(ln);
  }
  notes = merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const incoming = new Map(notes.map((n) => [n.id, n]));

  board.querySelectorAll("[data-id]").forEach((card) => {
    if (!incoming.has(card.dataset.id)) {
      card._ro?.disconnect();
      card.remove();
    }
  });

  for (const note of notes) {
    const card = board.querySelector(`[data-id="${note.id}"]`);
    if (!isBoardNote(note)) {
      if (card) {
        card._ro?.disconnect();
        card.remove();
      }
      continue;
    }
    if (!card) {
      board.appendChild(renderNote(note));
    } else if (
      !card.contains(document.activeElement) &&
      card.dataset.dragging !== "1" &&
      !recentlyEdited(card)
    ) {
      card._ro?.disconnect();
      card.replaceWith(renderNote(note));
    }
    // 편집 중이거나 방금 편집한(2초 내) 카드는 echo로 덮지 않음
  }
  refreshEmptyHint();
  renderNoteList();
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
let selectedDate = null; // "YYYY-MM-DD" | null (클릭한 날짜)

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
            done: statusOf(it) === "done",
            color: note.color,
          });
        }
        walk(it.children);
      }
    })(note.items);
  }
  return map;
}

// 달력 이벤트(type === "event")를 메모와 같은 저장소에 둔다 → 동기화 재사용.
function addEvent(data) {
  const ev = normalize({
    id: uid(),
    type: "event",
    color: "navy",
    order: notes.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...data,
  });
  notes.push(ev);
  persist(ev);
}

/** 특정 날짜(key)에 걸치는 이벤트들. */
function eventsOnDate(key) {
  return notes.filter(
    (n) =>
      n.type === "event" &&
      n.start &&
      key >= n.start &&
      key <= (n.end || n.start)
  );
}

/** 모든 체크리스트 항목을 평탄화(이벤트 연동 선택용). */
function allTodoItems() {
  const out = [];
  for (const n of notes) {
    if (n.type !== "todo") continue;
    (function walk(items) {
      for (const it of items || []) {
        out.push({
          noteId: n.id,
          itemId: it.id,
          label: (n.title ? n.title + " / " : "") + (it.text || "(내용 없음)"),
        });
        walk(it.children);
      }
    })(n.items);
  }
  return out;
}

function timeOptions() {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
      opts.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
    }
  }
  return opts;
}

/** 이벤트 추가 폼(모달). 연동 선택 시 체크리스트 항목의 마감일을 설정. */
function showEventForm(defaultDate) {
  closeContextMenu();
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4";
  const box = document.createElement("div");
  box.className =
    "w-72 max-w-full rounded-lg bg-white p-4 text-neutral-800 shadow-2xl text-sm";
  const heading = document.createElement("div");
  heading.className = "mb-2 text-sm font-semibold";
  heading.textContent = "이벤트 추가";
  box.appendChild(heading);

  const field = (labelText, el) => {
    const w = document.createElement("label");
    w.className = "mb-2 block";
    const t = document.createElement("div");
    t.className = "mb-0.5 text-[11px] text-neutral-500";
    t.textContent = labelText;
    w.append(t, el);
    return w;
  };
  const inputCls = "w-full rounded border border-neutral-300 px-2 py-1";

  const title = document.createElement("input");
  title.type = "text";
  title.placeholder = "이벤트 제목";
  title.className = inputCls;

  const link = document.createElement("select");
  link.className = inputCls;
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "(연동 안 함 — 새 이벤트)";
  link.appendChild(opt0);
  for (const it of allTodoItems()) {
    const o = document.createElement("option");
    o.value = it.noteId + "|" + it.itemId;
    o.textContent = it.label;
    link.appendChild(o);
  }
  link.addEventListener("change", () => {
    title.disabled = !!link.value;
    title.placeholder = link.value ? "(연동 항목 내용 사용)" : "이벤트 제목";
  });

  const startD = document.createElement("input");
  startD.type = "date";
  startD.value = defaultDate || ymd(new Date());
  startD.className = inputCls;
  const endD = document.createElement("input");
  endD.type = "date";
  endD.value = defaultDate || ymd(new Date());
  endD.className = inputCls;

  const allDay = document.createElement("input");
  allDay.type = "checkbox";
  allDay.checked = true;
  const allDayWrap = document.createElement("label");
  allDayWrap.className = "mb-2 flex items-center gap-2 text-[12px]";
  const adt = document.createElement("span");
  adt.textContent = "종일";
  allDayWrap.append(allDay, adt);

  const timeRow = document.createElement("div");
  timeRow.className = "mb-2 items-center gap-1";
  timeRow.style.display = "none";
  const startT = document.createElement("select");
  const endT = document.createElement("select");
  for (const s of timeOptions()) {
    const o1 = document.createElement("option");
    o1.value = s;
    o1.textContent = s;
    startT.appendChild(o1);
    const o2 = document.createElement("option");
    o2.value = s;
    o2.textContent = s;
    endT.appendChild(o2);
  }
  startT.value = "09:00";
  endT.value = "10:00";
  startT.className = "rounded border border-neutral-300 px-1 py-1";
  endT.className = "rounded border border-neutral-300 px-1 py-1";
  const tilde = document.createElement("span");
  tilde.textContent = " ~ ";
  timeRow.append(startT, tilde, endT);
  allDay.addEventListener("change", () => {
    timeRow.style.display = allDay.checked ? "none" : "flex";
  });

  box.append(
    field("제목", title),
    field("체크리스트 연동 (선택)", link),
    field("시작일", startD),
    field("종료일", endD),
    allDayWrap,
    timeRow
  );

  const btns = document.createElement("div");
  btns.className = "flex justify-end gap-2 pt-1";
  const cancel = document.createElement("button");
  cancel.textContent = "취소";
  cancel.className = "rounded px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300";
  const save = document.createElement("button");
  save.textContent = "저장";
  save.className = "rounded px-3 py-1.5 bg-indigo-500 text-white hover:bg-indigo-600";
  btns.append(cancel, save);
  box.appendChild(btns);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey, true);
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };
  cancel.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKey, true);

  save.addEventListener("click", () => {
    const start = startD.value;
    let end = endD.value || start;
    if (end < start) end = start;
    if (link.value) {
      // 체크리스트 항목 마감일 연동
      const [nid, iid] = link.value.split("|");
      const n = getNote(nid);
      const it = n && findItem(n.items, iid);
      if (it) {
        it.due = start;
        persist(n);
        rerenderCard(nid);
      }
    } else {
      const t = title.value.trim();
      if (!t) {
        title.focus();
        return;
      }
      addEvent({
        title: t,
        start,
        end,
        allDay: allDay.checked,
        startTime: allDay.checked ? null : startT.value,
        endTime: allDay.checked ? null : endT.value,
      });
    }
    close();
    renderCalendar();
  });
  setTimeout(() => title.focus(), 0);
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
  prev.className = "rounded px-1 hover:bg-black/5";
  prev.addEventListener("click", () => {
    calMonth--;
    if (calMonth < 0) {
      calMonth = 11;
      calYear--;
    }
    selectedDate = null;
    renderCalendar();
  });
  const next = document.createElement("button");
  next.textContent = "▶";
  next.className = "rounded px-1 hover:bg-black/5";
  next.addEventListener("click", () => {
    calMonth++;
    if (calMonth > 11) {
      calMonth = 0;
      calYear++;
    }
    selectedDate = null;
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

  // 날짜 그리드 (칸 키움 + 클릭 선택)
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-7 gap-0.5 text-center text-[11px]";
  const startDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  for (let i = 0; i < startDay; i++) grid.appendChild(document.createElement("div"));
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className =
      "flex min-h-[3.6rem] cursor-pointer flex-col items-center rounded py-1.5 leading-tight hover:bg-black/5";
    if (key === todayKey) cell.classList.add("bg-amber-400/25", "font-bold");
    if (key === selectedDate) cell.classList.add("ring-1", "ring-indigo-400", "bg-indigo-500/10");
    const num = document.createElement("div");
    num.textContent = day;
    cell.appendChild(num);
    const evs = eventsOnDate(key);
    if (due[key] || evs.length) {
      const dotRow = document.createElement("div");
      dotRow.className = "mt-1 flex gap-0.5";
      if (due[key]) {
        const d = document.createElement("div");
        const allDone = due[key].every((x) => x.done);
        d.className =
          "h-2 w-2 rounded-full " + (allDone ? "bg-neutral-400" : "bg-rose-400");
        dotRow.appendChild(d);
      }
      if (evs.length) {
        const d = document.createElement("div");
        d.className = "h-2 w-2 rounded-full bg-indigo-400";
        dotRow.appendChild(d);
      }
      cell.appendChild(dotRow);
    }
    cell.addEventListener("click", () => {
      selectedDate = selectedDate === key ? null : key;
      renderCalendar();
    });
    grid.appendChild(cell);
  }
  cal.appendChild(grid);

  // 하단 목록: 날짜 선택 시 그 날짜만, 아니면 이번 달 전체
  const list = document.createElement("div");
  list.className = "mt-2 border-t border-black/10 pt-2 text-[11px]";

  const listHead = document.createElement("div");
  listHead.className = "mb-1 text-[11px] font-semibold text-neutral-500";

  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  let dueKeys, evList;
  if (selectedDate) {
    listHead.textContent = `${Number(selectedDate.slice(5, 7))}월 ${Number(
      selectedDate.slice(8)
    )}일`;
    dueKeys = due[selectedDate] ? [selectedDate] : [];
    evList = eventsOnDate(selectedDate);
  } else {
    listHead.textContent = "이번 달 (날짜 클릭 시 그 날만)";
    dueKeys = Object.keys(due)
      .filter((k) => k.startsWith(monthPrefix))
      .sort();
    evList = notes
      .filter((n) => n.type === "event" && n.start && n.start.startsWith(monthPrefix))
      .sort((a, b) => (a.start < b.start ? -1 : 1));
  }
  list.appendChild(listHead);

  const mmdd = (iso) => `${iso.slice(5, 7)}.${iso.slice(8)}`;

  // 이벤트 행 (삭제 가능)
  for (const ev of evList) {
    const row = document.createElement("div");
    row.className = "flex items-start gap-1 py-0.5";
    const dot = document.createElement("span");
    dot.className = "mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400";
    const txt = document.createElement("span");
    txt.className = "min-w-0 flex-1 text-neutral-700";
    const range =
      ev.end && ev.end !== ev.start ? `${mmdd(ev.start)}~${mmdd(ev.end)}` : mmdd(ev.start);
    const time = ev.allDay ? "" : ` ${ev.startTime || ""}~${ev.endTime || ""}`;
    txt.textContent = `${range}${time}  ${ev.title}`;
    const del = document.createElement("button");
    del.textContent = "×";
    del.title = "이벤트 삭제";
    del.className = "shrink-0 px-1 text-neutral-400 hover:text-rose-500";
    del.addEventListener("click", async () => {
      if (await confirmDialog("이 이벤트를 삭제할까요?")) {
        deleteNote(ev.id);
        renderCalendar();
      }
    });
    row.append(dot, txt, del);
    list.appendChild(row);
  }

  // 체크리스트 마감 행
  for (const k of dueKeys) {
    for (const it of due[k]) {
      const row = document.createElement("div");
      row.className = "flex items-start gap-1 py-0.5";
      const dot = document.createElement("span");
      dot.className = "mt-1 h-2 w-2 shrink-0 rounded-full";
      dot.style.background = colorBg(it.color);
      const txt = document.createElement("span");
      txt.className =
        "min-w-0 flex-1 " + (it.done ? "text-neutral-500 line-through" : "text-neutral-700");
      const label = it.title ? `${it.title} · ${it.text}` : it.text;
      txt.textContent = `${mmdd(k)}  ${label}`;
      row.append(dot, txt);
      list.appendChild(row);
    }
  }

  if (!evList.length && !dueKeys.length) {
    const empty = document.createElement("div");
    empty.className = "text-neutral-400";
    empty.textContent = "마감/이벤트 없음";
    list.appendChild(empty);
  }

  // 이벤트 추가 버튼
  const addEv = document.createElement("button");
  addEv.textContent = "＋ 이벤트 추가";
  addEv.className =
    "mt-2 w-full rounded border border-black/10 px-2 py-1 text-[11px] text-neutral-600 hover:bg-black/5";
  addEv.addEventListener("click", () => showEventForm(selectedDate || todayKey));
  list.appendChild(addEv);

  cal.appendChild(list);
}

function toggleCalendar() {
  const cal = document.getElementById("calendar");
  if (cal) cal.classList.toggle("hidden");
}

// ---- 메모 목록 패널 (숨김 포함) -------------------------------------------

let noteListOpen = false;

function notePreview(note) {
  if (note.title) return note.title;
  if (note.type === "todo") {
    const first = (note.items || []).find((i) => i.text);
    return first ? first.text : "(빈 체크리스트)";
  }
  return (note.text || "").split("\n")[0] || "(빈 메모)";
}

function ensureNoteListPanel() {
  let panel = document.getElementById("note-list-panel");
  if (panel) return panel;
  panel = document.createElement("aside");
  panel.id = "note-list-panel";
  panel.className =
    "fixed right-0 top-0 z-[900] flex h-full w-64 max-w-[80vw] translate-x-full flex-col " +
    "border-l border-black/10 bg-[#f5f4f2] p-3 text-neutral-700 shadow-2xl " +
    "backdrop-blur transition-transform duration-200";
  const head = document.createElement("div");
  head.className = "mb-2 flex items-center justify-between";
  const title = document.createElement("div");
  title.className = "text-sm font-semibold";
  title.textContent = "메모 목록";
  const close = document.createElement("button");
  close.textContent = "✕";
  close.className = "rounded px-1 hover:bg-black/5";
  close.addEventListener("click", () => toggleNoteList(false));
  head.append(title, close);
  const body = document.createElement("div");
  body.id = "note-list-body";
  body.className = "no-scrollbar flex-1 overflow-auto";
  panel.append(head, body);
  document.body.appendChild(panel);
  return panel;
}

function renderNoteList() {
  const panel = document.getElementById("note-list-panel");
  if (!panel) return; // 패널이 아직 열린 적 없음
  const body = panel.querySelector("#note-list-body");
  body.innerHTML = "";
  if (!notes.length) {
    body.innerHTML = '<div class="text-xs text-neutral-400">메모가 없습니다</div>';
    return;
  }
  notes
    .slice()
    .filter((n) => n.type !== "event")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((note) => {
      const row = document.createElement("div");
      row.className = "mb-1 flex items-center gap-2 rounded px-2 py-1.5 hover:bg-black/5";
      const dot = document.createElement("span");
      dot.className = "h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/20";
      dot.style.background = colorBg(note.color);
      const label = document.createElement("button");
      label.className =
        "min-w-0 flex-1 truncate text-left text-sm " +
        (note.hidden ? "text-neutral-500" : "text-neutral-700");
      label.textContent = (note.type === "todo" ? "☑ " : "📝 ") + notePreview(note);
      label.title = "클릭하면 화면에 표시";
      label.addEventListener("click", () => {
        if (note.hidden) setHidden(note.id, false);
        focusCard(note.id);
      });
      const toggle = document.createElement("button");
      toggle.innerHTML = svgIcon(note.hidden ? "eyeOff" : "eye");
      toggle.title = note.hidden ? "표시" : "숨기기";
      toggle.className =
        "inline-flex shrink-0 items-center justify-center rounded px-1 opacity-70 hover:opacity-100";
      toggle.addEventListener("click", () => setHidden(note.id, !note.hidden));
      row.append(dot, label, toggle);
      body.appendChild(row);
    });
}

function focusCard(id) {
  setTimeout(() => {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("ring-2", "ring-indigo-400");
    setTimeout(() => card.classList.remove("ring-2", "ring-indigo-400"), 1200);
  }, 0);
}

function toggleNoteList(open) {
  const panel = ensureNoteListPanel();
  noteListOpen = open === undefined ? !noteListOpen : open;
  renderNoteList();
  panel.classList.toggle("translate-x-full", !noteListOpen);
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

const btnAdd = document.getElementById("btn-add");
const btnList = document.getElementById("btn-list");
const btnCal = document.getElementById("btn-cal");
btnAdd.innerHTML = svgIcon("plus");
btnList.innerHTML = svgIcon("list");
btnCal.innerHTML = svgIcon("calendar");
[btnAdd, btnList, btnCal].forEach((b) => b.classList.add("inline-flex", "items-center"));
btnAdd.addEventListener("click", (e) => showAddMenu(e.currentTarget));
btnList.addEventListener("click", () => toggleNoteList());
btnCal.addEventListener("click", toggleCalendar);

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
