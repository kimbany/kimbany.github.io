// =====================================================================
// chat.js - 채팅 로직 (Firebase 연동) + 채팅 변신 UI 렌더링
// ---------------------------------------------------------------------
// 책임:
//   - 기록 패널 영역에 채팅 UI 렌더링 (메시지 = 계산식 위장)
//   - Firebase로 메시지 송수신
//   - 탭 투 리빌: 메시지 탭 → 3초 평문 → 자동 재위장 (한 번에 하나만)
//   - 채팅방 드롭다운 전환 + 6자리 초대 코드 생성/입장
//   - Firebase 미설정 시 로컬 데모 모드로 동작 (UI 검증용)
// =====================================================================

import {
  ref, push, set, get, update, onChildAdded, query, limitToLast,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { getFirebase, isConfigured } from "./firebase-init.js";
import * as store from "./store.js";

const REVEAL_MS = 3000;

export class ChatController {
  constructor({ rootEl, veil, getUid, getNickname }) {
    this.rootEl = rootEl;       // 기록 패널 안에 들어갈 채팅 컨테이너
    this.veil = veil;
    this.getUid = getUid;       // () => uid|null
    this.getNickname = getNickname;
    this.roomId = null;
    this.rooms = [];            // [{id, label}]
    this.revealTimer = null;
    this.revealedEl = null;
    this._seen = new Set();
    this._localMsgs = {};       // 데모 모드 메시지 저장 roomId → [{id,from,text,ts}]
    this._built = false;
  }

  // 채팅 UI 골격 1회 생성
  buildUI() {
    if (this._built) return;
    this._built = true;
    this.rootEl.innerHTML = `
      <div class="chat-head">
        <select class="chat-room-select" title="기록"></select>
        <button class="chat-menu-btn" data-chat="menu" title="기록 관리">⋯</button>
      </div>
      <div class="chat-menu" hidden>
        <button data-chat="new-room">+ 새 친구 (초대 코드)</button>
        <button data-chat="join-room">코드로 입장</button>
      </div>
      <div class="chat-list"></div>
    `;
    this.listEl = this.rootEl.querySelector(".chat-list");
    this.selectEl = this.rootEl.querySelector(".chat-room-select");
    this.menuEl = this.rootEl.querySelector(".chat-menu");

    this.rootEl.querySelector('[data-chat="menu"]').addEventListener("click", () => {
      this.menuEl.hidden = !this.menuEl.hidden;
    });
    this.rootEl.querySelector('[data-chat="new-room"]').addEventListener("click", () => this.createRoom());
    this.rootEl.querySelector('[data-chat="join-room"]').addEventListener("click", () => this.joinByCode());
    this.selectEl.addEventListener("change", (e) => this.switchRoom(e.target.value));

    // 메시지 탭 → 리빌 (이벤트 위임)
    this.listEl.addEventListener("click", (e) => {
      const bubble = e.target.closest(".msg");
      if (bubble) this.reveal(bubble);
    });
  }

  async enter() {
    this.buildUI();
    await this.loadRooms();
    if (this.rooms.length === 0) {
      // 데모/첫 진입: 임시 방 하나 보장
      const demo = { id: "demo_room", label: "정산 기록" };
      this.rooms = [demo];
      await this._saveRooms();
    }
    this.renderRoomOptions();
    await this.switchRoom(this.rooms[0].id);
  }

  async loadRooms() {
    this.rooms = await store.get("rooms", []);
  }
  async _saveRooms() {
    await store.set("rooms", this.rooms);
  }

  renderRoomOptions() {
    this.selectEl.innerHTML = "";
    for (const r of this.rooms) {
      const opt = document.createElement("option");
      opt.value = r.id; opt.textContent = r.label;
      this.selectEl.appendChild(opt);
    }
    if (this.roomId) this.selectEl.value = this.roomId;
  }

  async switchRoom(roomId) {
    this.roomId = roomId;
    this._seen.clear();
    this.listEl.innerHTML = "";
    this.selectEl.value = roomId;
    this.menuEl.hidden = true;

    if (isConfigured() && this.getUid()) {
      this._subscribeFirebase(roomId);
    } else {
      this._renderLocal(roomId);
    }
  }

  // ---- Firebase 모드 ----
  _subscribeFirebase(roomId) {
    const { db } = getFirebase();
    const q = query(ref(db, `messages/${roomId}`), limitToLast(50));
    onChildAdded(q, async (snap) => {
      const id = snap.key;
      if (this._seen.has(id)) return;
      this._seen.add(id);
      const m = snap.val();
      await this._appendMessage(id, m.from, m.text);
    });
  }

  // ---- 로컬 데모 모드 (Firebase 없을 때 UI 검증) ----
  _renderLocal(roomId) {
    const msgs = this._localMsgs[roomId] || [];
    msgs.forEach((m) => this._appendMessage(m.id, m.from, m.text));
  }

  async send(text) {
    text = (text || "").trim();
    if (!text || !this.roomId) return;
    const uid = this.getUid();

    if (isConfigured() && uid) {
      const { db } = getFirebase();
      const msgRef = push(ref(db, `messages/${this.roomId}`));
      await set(msgRef, { from: uid, text, timestamp: serverTimestamp() });
      await update(ref(db, `rooms/${this.roomId}`), { lastMessage: serverTimestamp() });
    } else {
      // 데모: 로컬 에코
      const id = "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      (this._localMsgs[this.roomId] ||= []).push({ id, from: "me", text, ts: Date.now() });
      await this._appendMessage(id, "me", text);
    }
  }

  async _appendMessage(id, from, plaintext) {
    const mine = from === "me" || from === this.getUid();
    const disguised = await this.veil.disguise(this.roomId, id);

    const el = document.createElement("div");
    el.className = "msg " + (mine ? "mine" : "other");
    el.dataset.plain = plaintext;
    el.dataset.veil = disguised;
    el.textContent = disguised;
    this.listEl.appendChild(el);
    this.listEl.scrollTop = this.listEl.scrollHeight;
  }

  // 탭 투 리빌: 한 번에 하나만, 3초 후 자동 재위장
  reveal(el) {
    if (this.revealedEl && this.revealedEl !== el) this._hide(this.revealedEl);
    if (this.revealTimer) clearTimeout(this.revealTimer);

    if (el.classList.contains("revealed")) { this._hide(el); return; }

    el.textContent = el.dataset.plain;
    el.classList.add("revealed");
    this.revealedEl = el;
    this.revealTimer = setTimeout(() => this._hide(el), REVEAL_MS);
  }

  _hide(el) {
    el.textContent = el.dataset.veil;
    el.classList.remove("revealed");
    if (this.revealedEl === el) this.revealedEl = null;
  }

  // 패닉 복귀 시 평문 노출 즉시 차단
  hideAllReveals() {
    if (this.revealTimer) clearTimeout(this.revealTimer);
    this.listEl?.querySelectorAll(".msg.revealed").forEach((el) => this._hide(el));
    this.revealedEl = null;
  }

  // ---- 초대 코드 (6자리) ----
  async createRoom() {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const label = "정산 기록"; // "기록"처럼 위장된 방 이름
    const id = "room_" + code;

    if (isConfigured() && this.getUid()) {
      const { db } = getFirebase();
      const uid = this.getUid();
      await set(ref(db, `rooms/${id}`), {
        members: { [uid]: true },
        memberNicknames: { [uid]: this.getNickname() },
        createdAt: serverTimestamp(),
      });
      await set(ref(db, `inviteCodes/${code}`), {
        creator: uid, roomId: id, createdAt: serverTimestamp(),
        expiresAt: Date.now() + 24 * 3600 * 1000, used: false,
      });
      await set(ref(db, `users/${uid}/rooms/${id}`), true);
    }
    this.rooms.push({ id, label });
    await this._saveRooms();
    this.renderRoomOptions();
    await this.switchRoom(id);
    alert(`초대 코드: ${code}\n상대가 이 코드를 입력하면 연결됩니다.`);
  }

  async joinByCode() {
    const code = (prompt("초대 코드 6자리") || "").trim();
    if (!/^\d{6}$/.test(code)) return;

    if (isConfigured() && this.getUid()) {
      const { db } = getFirebase();
      const uid = this.getUid();
      const snap = await get(ref(db, `inviteCodes/${code}`));
      if (!snap.exists()) { alert("존재하지 않는 코드"); return; }
      const inv = snap.val();
      const id = inv.roomId;
      await update(ref(db, `rooms/${id}/members`), { [uid]: true });
      await update(ref(db, `rooms/${id}/memberNicknames`), { [uid]: this.getNickname() });
      await set(ref(db, `users/${uid}/rooms/${id}`), true);
      if (!this.rooms.find((r) => r.id === id)) this.rooms.push({ id, label: "정산 기록" });
    } else {
      const id = "room_" + code;
      if (!this.rooms.find((r) => r.id === id)) this.rooms.push({ id, label: "정산 기록" });
    }
    await this._saveRooms();
    this.renderRoomOptions();
    await this.switchRoom("room_" + code);
  }
}
