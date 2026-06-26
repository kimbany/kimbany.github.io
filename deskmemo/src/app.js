// DeskMemo frontend — M0/M1
//
// Local-only note board (color cards, drag, edit, delete) persisted to
// localStorage. Firebase sync replaces the storage layer in M2; the alarm
// scheduler arrives in M3. The data shape already matches CLAUDE.md §5 so the
// swap is mostly mechanical.

const COLORS = {
  yellow: "#fde68a",
  pink: "#fbcfe8",
  blue: "#bfdbfe",
  green: "#bbf7d0",
  gray: "#e5e7eb",
};
const COLOR_KEYS = Object.keys(COLORS);
const STORAGE_KEY = "deskmemo.notes.v1";

const board = document.getElementById("board");
const emptyHint = document.getElementById("empty-hint");

/** @typedef {{id:string,text:string,color:string,x:number,y:number,createdAt:number,updatedAt:number,order:number}} Note */
/** @type {Note[]} */
let notes = load();

// ---- persistence (M2: swap for Firestore onSnapshot + setDoc) -------------

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function uid() {
  return "n_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---- CRUD -----------------------------------------------------------------

function addNote(partial = {}) {
  const now = Date.now();
  const note = {
    id: uid(),
    text: "",
    color: COLOR_KEYS[notes.length % COLOR_KEYS.length],
    // Cascade new notes so they don't stack exactly on top of each other.
    x: 16 + (notes.length % 5) * 18,
    y: 16 + (notes.length % 5) * 18,
    createdAt: now,
    updatedAt: now,
    order: notes.length,
    ...partial,
  };
  notes.push(note);
  save();
  renderNote(note, true);
  refreshEmptyHint();
  return note;
}

function updateNote(id, patch) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  Object.assign(note, patch, { updatedAt: Date.now() });
  save();
}

function deleteNote(id) {
  notes = notes.filter((n) => n.id !== id);
  save();
  document.querySelector(`[data-id="${id}"]`)?.remove();
  refreshEmptyHint();
}

// ---- rendering ------------------------------------------------------------

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

  // header: drag handle + color dots + delete
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

  // body: editable text
  const ta = document.createElement("textarea");
  ta.className =
    "no-scrollbar m-1 mt-0 h-28 resize-none rounded bg-white/40 p-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-500";
  ta.placeholder = "메모...";
  ta.value = note.text;
  ta.addEventListener("input", () => updateNote(note.id, { text: ta.value }));

  card.append(head, ta);
  board.appendChild(card);

  makeDraggable(card, head, note);

  if (focus) setTimeout(() => ta.focus(), 0);
}

function renderAll() {
  board.querySelectorAll("[data-id]").forEach((el) => el.remove());
  notes.sort((a, b) => a.order - b.order).forEach((n) => renderNote(n));
  refreshEmptyHint();
}

// ---- dragging (card within the board) -------------------------------------

function makeDraggable(card, handle, note) {
  let startX, startY, originX, originY, dragging = false;

  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return; // let color/delete buttons work
    dragging = true;
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
    note.x = nx;
    note.y = ny;
    card.style.left = nx + "px";
    card.style.top = ny + "px";
  });

  const end = () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("z-50");
    updateNote(note.id, { x: note.x, y: note.y });
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

// ---- Tauri integration ----------------------------------------------------

function tauri() {
  return typeof window !== "undefined" ? window.__TAURI__ : undefined;
}

async function hideBoard() {
  const t = tauri();
  if (t?.window?.getCurrentWindow) {
    try {
      await t.window.getCurrentWindow().hide();
      return;
    } catch (e) {
      console.warn("hide failed", e);
    }
  }
  // Browser dev fallback: nothing to hide.
}

function wireGlobalEvents() {
  const t = tauri();
  // New-note event emitted from Rust on Ctrl+Alt+N / tray menu.
  if (t?.event?.listen) {
    t.event.listen("new-note", () => addNote());
  }
}

// ---- wiring ---------------------------------------------------------------

document.getElementById("btn-new").addEventListener("click", () => addNote());
document.getElementById("btn-hide").addEventListener("click", hideBoard);

renderAll();
wireGlobalEvents();
