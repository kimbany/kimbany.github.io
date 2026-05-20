// =====================================================================
// main.js - 오케스트레이터 (모든 모듈을 연결)
// ---------------------------------------------------------------------
// 책임:
//   - OS 감지 → 윈도우/맥 스타일 적용
//   - 계산기 UI 부팅 (calculator.js)
//   - 시퀀스 감지 연결 (sequence.js) → 채팅 진입/해제
//   - 계산기 ↔ 채팅 모드 전환 (기록 패널 ↔ 채팅 UI)
//   - 채팅 모드에서 디스플레이를 텍스트 입력창으로 전환
//   - 패닉 복귀 (panic.js)
//   - Firebase 익명 로그인 + 채팅 (auth.js / chat.js)
// =====================================================================

import { CalcEngine, CalculatorUI } from "./calculator.js";
import { SequenceDetector } from "./sequence.js";
import { Panic } from "./panic.js";
import { Veil } from "./veil.js";
import { ChatController } from "./chat.js";
import { isConfigured } from "./firebase-init.js";
import { loadProfile, isSetupDone, ensureSignedIn, syncUserNode } from "./auth.js";
import { detectOSStyle } from "./os.js";

// ---- 상태 ----
let chatActive = false;
let chatBuffer = "";   // 채팅 모드에서 타이핑 중인 평문
let uid = null;
let profile = null;

// ---- OS 스타일 적용 ----
function applyOSStyle(os) {
  document.body.classList.remove("os-win", "os-mac");
  document.body.classList.add(os === "mac" ? "os-mac" : "os-win");
  document.querySelectorAll("link[data-os]").forEach((l) => {
    l.disabled = l.dataset.os !== os;
  });
}

// 버튼 그리드: b(label, action, value, cls)
const b = (label, action, value = "", cls = "") => ({ label, action, value, cls });

// 4열 6행 표준 그리드. (메모리 MC/MR/M+/M-/MS는 엔진은 지원하나 기본 그리드엔 미표시)
const LAYOUT_WIN = [
  b("%", "percent", "", "fn"), b("CE", "clearEntry", "", "fn"),
  b("C", "clear", "", "fn"), b("⌫", "backspace", "", "fn"),
  b("¹⁄ₓ", "unary", "reciprocal", "fn"), b("x²", "unary", "square", "fn"),
  b("²√x", "unary", "sqrt", "fn"), b("÷", "operator", "÷", "op"),
  b("7", "digit", "7"), b("8", "digit", "8"), b("9", "digit", "9"), b("×", "operator", "×", "op"),
  b("4", "digit", "4"), b("5", "digit", "5"), b("6", "digit", "6"), b("-", "operator", "-", "op"),
  b("1", "digit", "1"), b("2", "digit", "2"), b("3", "digit", "3"), b("+", "operator", "+", "op"),
  b("±", "sign", "", ""), b("0", "digit", "0"), b(".", "decimal", "", ""), b("=", "equals", "", "eq"),
];

const LAYOUT_MAC = [
  b("AC", "clear", "", "fn"), b("±", "sign", "", "fn"), b("%", "percent", "", "fn"), b("÷", "operator", "÷", "op"),
  b("7", "digit", "7"), b("8", "digit", "8"), b("9", "digit", "9"), b("×", "operator", "×", "op"),
  b("4", "digit", "4"), b("5", "digit", "5"), b("6", "digit", "6"), b("-", "operator", "-", "op"),
  b("1", "digit", "1"), b("2", "digit", "2"), b("3", "digit", "3"), b("+", "operator", "+", "op"),
  b("0", "digit", "0", "zero"), b(".", "decimal", "", ""), b("=", "equals", "", "eq"),
];

function buildButtons(buttonsRoot, os) {
  const layout = os === "mac" ? LAYOUT_MAC : LAYOUT_WIN;
  buttonsRoot.innerHTML = "";
  buttonsRoot.className = os === "mac" ? "mac-grid" : "win-grid";
  for (const btn of layout) {
    const el = document.createElement("button");
    el.textContent = btn.label;
    el.dataset.action = btn.action;
    if (btn.value) el.dataset.value = btn.value;
    if (btn.cls) el.className = btn.cls;
    buttonsRoot.appendChild(el);
  }
}

// ---- 부팅 ----
async function boot() {
  profile = await loadProfile();
  const os = (profile && profile.osStyle) || detectOSStyle();
  applyOSStyle(os);

  // 첫 설치 설정이 안 됐으면 setup.html로 (Tauri는 별도 창, 웹 미리보기는 이동)
  if (!(await isSetupDone())) {
    location.href = "setup.html";
    return;
  }

  const displayEl = document.getElementById("display");
  const buttonsRoot = document.getElementById("buttons");
  const historyEl = document.getElementById("history");
  const chatRootEl = document.getElementById("chat-root");

  buildButtons(buttonsRoot, os);

  const engine = new CalcEngine();
  const ui = new CalculatorUI(engine, {
    displayEl, buttonsRoot, historyEl,
    onInput: (input) => routeInput(input),
  });
  ui.init();

  const veil = new Veil(profile.calcStyle);
  const chat = new ChatController({
    rootEl: chatRootEl,
    veil,
    getUid: () => uid,
    getNickname: () => profile.nickname,
  });

  const seq = new SequenceDetector({
    enterCode: profile.enterCode || "7777",
    exitCode: "0000",
    onEnter: () => enterChat(),
    onExit: () => exitChat(),
  });

  const panic = new Panic({
    onPanic: () => exitChat(),
    isChatActive: () => chatActive,
    focusSec: (profile.lock && profile.lock.focusSec) || 5,
    mouseSec: (profile.lock && profile.lock.mouseSec) || 15,
  });
  panic.init();

  // Tauri 글로벌 단축키/포커스 이벤트 연결 (네이티브 신호 → 패닉)
  if (window.__TAURI__ && window.__TAURI__.event) {
    const { listen } = window.__TAURI__.event;
    listen("panic", () => panic.fire());
    listen("focus-changed", (e) => { if (e.payload === false && chatActive) panic.fire(); });
  }

  // 채팅 모드 입력 라우팅: 버튼 클릭(onInput) + 시퀀스 감지
  function routeInput(input) {
    if (!chatActive) { seq.feed(input); return; }
    handleChatButton(input);
  }

  // 채팅 모드에서 계산기 "버튼 클릭"을 텍스트 입력으로 변환
  function handleChatButton({ action, value }) {
    switch (action) {
      case "digit": appendChat(value); break;
      case "decimal": appendChat("."); break;
      case "operator": appendChat(value); break; // ×, ÷ 등 글자 그대로
      case "backspace": chatBuffer = chatBuffer.slice(0, -1); renderChatInput(); break;
      case "clear": case "clearEntry": chatBuffer = ""; renderChatInput(); break;
      case "equals": sendChat(); break;
    }
  }

  function appendChat(ch) { chatBuffer += ch; renderChatInput(); }
  function renderChatInput() { displayEl.textContent = chatBuffer || "0"; }

  function sendChat() {
    const text = chatBuffer.trim();
    if (!text) return;
    chat.send(text);
    chatBuffer = "";
    renderChatInput();
  }

  // 채팅 모드 키보드 텍스트 입력 (계산기 _onKey는 locked 시 비활성)
  window.addEventListener("keydown", (e) => {
    if (!chatActive) return;
    if (e.key === "Escape") return;        // 패닉이 처리
    if (e.key === "Enter") { e.preventDefault(); sendChat(); return; }
    if (e.key === "Backspace") { e.preventDefault(); chatBuffer = chatBuffer.slice(0, -1); renderChatInput(); return; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      appendChat(e.key);
    }
  });

  // ---- 모드 전환 ----
  async function enterChat() {
    // 디스플레이에 잠시 7777 보여준 뒤(자연스럽게) 0.3초 후 전환
    setTimeout(async () => {
      if (chatActive) return;
      chatActive = true;
      ui.locked = true;
      document.body.classList.add("chat-mode");

      // Firebase 로그인 (최초 1회). 실패해도 계산기/데모는 동작.
      if (isConfigured() && !uid) {
        try {
          uid = await ensureSignedIn();
          await syncUserNode(uid, profile.nickname);
        } catch (e) { uid = null; }
      }
      await chat.enter();
      chatBuffer = "";
      renderChatInput();
    }, 300);
  }

  function exitChat() {
    if (!chatActive) return;
    // 16ms 이내 즉시 위장 복귀 (애니메이션 없이)
    chatActive = false;
    ui.locked = false;
    chat.hideAllReveals();
    document.body.classList.remove("chat-mode");
    chatBuffer = "";
    seq.reset();
    // 디스플레이는 마지막 진짜 계산 결과(또는 0)로 복원
    ui.render();
  }

  // 패닉/시퀀스에서 접근할 수 있게 노출 (디버그용)
  window.__calctalk = { engine, ui, enterChat, exitChat };
}

boot();
