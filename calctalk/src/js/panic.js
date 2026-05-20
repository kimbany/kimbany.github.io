// =====================================================================
// panic.js - 패닉 버튼 + 자동 잠금 (즉시 위장 복귀)
// ---------------------------------------------------------------------
// 책임: 옆사람이 다가올 때 0.1초 안에 계산기 외관으로 복귀.
//   - ESC 키 → 즉시 복귀 (애니메이션 없이, 16ms 이내)
//   - Ctrl+Q / Cmd+Q → 동일
//   - 창 포커스 상실 N초 → 자동 복귀 (기본 5초)
//   - 마우스 창 밖 N초 → 자동 복귀 (기본 15초)
// 채팅 진행 상태는 메모리에 보존 → 다시 7777= 입력 시 이어서.
// =====================================================================

export class Panic {
  constructor({ onPanic, isChatActive, focusSec = 5, mouseSec = 15 }) {
    this.onPanic = onPanic;            // 즉시 위장 복귀 콜백
    this.isChatActive = isChatActive;  // () => bool
    this.focusSec = focusSec;
    this.mouseSec = mouseSec;
    this._focusTimer = null;
    this._mouseTimer = null;
  }

  init() {
    // ESC / Ctrl+Q / Cmd+Q : capture 단계에서 가로채 즉시 복귀
    window.addEventListener("keydown", (e) => {
      if (!this.isChatActive()) return;
      const panicKey =
        e.key === "Escape" ||
        ((e.ctrlKey || e.metaKey) && (e.key === "q" || e.key === "Q"));
      if (panicKey) {
        e.preventDefault();
        e.stopPropagation();
        this.fire();
      }
    }, true); // capture: 다른 핸들러보다 먼저

    // 포커스 상실 → focusSec 후 자동 복귀
    window.addEventListener("blur", () => {
      if (!this.isChatActive()) return;
      this._focusTimer = setTimeout(() => this.fire(), this.focusSec * 1000);
    });
    window.addEventListener("focus", () => {
      if (this._focusTimer) { clearTimeout(this._focusTimer); this._focusTimer = null; }
    });

    // 마우스 창 밖 → mouseSec 후 자동 복귀
    document.addEventListener("mouseleave", () => {
      if (!this.isChatActive()) return;
      this._mouseTimer = setTimeout(() => this.fire(), this.mouseSec * 1000);
    });
    document.addEventListener("mouseenter", () => {
      if (this._mouseTimer) { clearTimeout(this._mouseTimer); this._mouseTimer = null; }
    });
  }

  setTimings({ focusSec, mouseSec }) {
    if (focusSec != null) this.focusSec = focusSec;
    if (mouseSec != null) this.mouseSec = mouseSec;
  }

  fire() {
    if (this._focusTimer) { clearTimeout(this._focusTimer); this._focusTimer = null; }
    if (this._mouseTimer) { clearTimeout(this._mouseTimer); this._mouseTimer = null; }
    this.onPanic();
  }
}
