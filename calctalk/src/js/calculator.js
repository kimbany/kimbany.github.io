// =====================================================================
// calculator.js - 진짜 계산기 엔진 + DOM 바인딩
// ---------------------------------------------------------------------
// 이 파일의 책임: "100% 진짜 계산기" 그 자체.
//   - 사칙연산, %, ±, 소수점, C/CE/⌫, =
//   - 윈도우 표준 모드 확장: x², √x, 1/x, 메모리(MC/MR/M+/M-/MS)
//   - 마우스 클릭 + 키보드 입력 (버튼 누름 피드백 포함)
//   - 실제 계산 기록 누적 (최근 10건)
// 시퀀스(7777=)나 채팅은 이 파일이 모름. 위에서 살짝 얹는 구조(sequence.js).
// =====================================================================

const MAX_DIGITS = 16; // 디스플레이 최대 자릿수 (오버플로 방지)

// 큰 숫자는 콤마, 소수는 그대로. 계산기다운 표시 포맷.
export function formatNumber(value) {
  if (value === "Error") return "Error";
  if (typeof value === "string") value = parseFloat(value);
  if (!isFinite(value)) return "Error";

  // 너무 큰/작은 수는 지수 표기 (실제 계산기처럼)
  if (Math.abs(value) >= 1e16 || (value !== 0 && Math.abs(value) < 1e-10)) {
    return value.toExponential(9).replace(/\.?0+e/, "e");
  }

  const negative = value < 0;
  const abs = Math.abs(value);
  const [intPart, decPart] = String(abs).split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const result = decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  return negative ? `-${result}` : result;
}

// ---------------------------------------------------------------------
// 순수 계산 엔진 (DOM 의존 없음 → 테스트 가능)
// ---------------------------------------------------------------------
export class CalcEngine {
  constructor() {
    this.reset();
    this.memory = 0;
    this.history = []; // { expr: "12 × 3 = 36" } 최근 10건
  }

  reset() {
    this.display = "0";        // 화면 문자열
    this.accumulator = null;   // 누적값(앞 피연산자)
    this.operator = null;      // 대기 중 연산자
    this.waitingForOperand = false; // 연산자 직후 새 숫자 대기
    this.lastOperand = null;   // = 반복용 마지막 피연산자
    this.lastOperator = null;
    this.justEvaluated = false;
  }

  get displayNumber() {
    return parseFloat(this.display.replace(/,/g, "")) || 0;
  }

  inputDigit(d) {
    if (this.justEvaluated) { this.reset(); }
    if (this.waitingForOperand) {
      this.display = d;
      this.waitingForOperand = false;
    } else {
      const raw = this.display.replace(/,/g, "");
      if (raw.replace(/[.\-]/g, "").length >= MAX_DIGITS) return; // 자릿수 제한
      this.display = raw === "0" ? d : raw + d;
    }
    this._normalize();
  }

  inputDecimal() {
    if (this.justEvaluated) { this.reset(); }
    if (this.waitingForOperand) {
      this.display = "0.";
      this.waitingForOperand = false;
      return;
    }
    const raw = this.display.replace(/,/g, "");
    if (!raw.includes(".")) this.display = raw + ".";
  }

  setOperator(op) {
    const current = this.displayNumber;
    if (this.operator && this.waitingForOperand) {
      // 연산자만 바꾸는 경우 (예: + 누르고 바로 -)
      this.operator = op;
      return;
    }
    if (this.accumulator === null) {
      this.accumulator = current;
    } else if (this.operator) {
      this.accumulator = this._compute(this.accumulator, current, this.operator);
      this.display = formatNumber(this.accumulator);
    }
    this.operator = op;
    this.waitingForOperand = true;
    this.justEvaluated = false;
  }

  equals() {
    let rhs, op;
    if (this.operator && !this.waitingForOperand) {
      rhs = this.displayNumber;
      op = this.operator;
    } else if (this.justEvaluated && this.lastOperator !== null) {
      // = 반복: 마지막 연산 재적용
      rhs = this.lastOperand;
      op = this.lastOperator;
      this.accumulator = this.displayNumber;
    } else {
      return; // 연산자 없음 → 무시 (시퀀스 감지는 sequence.js가 별도 처리)
    }

    const lhs = this.accumulator;
    const result = this._compute(lhs, rhs, op);
    const exprStr = `${formatNumber(lhs)} ${op} ${formatNumber(rhs)} = ${formatNumber(result)}`;

    this.accumulator = result;
    this.display = formatNumber(result);
    this.lastOperand = rhs;
    this.lastOperator = op;
    this.operator = null;
    this.waitingForOperand = false;
    this.justEvaluated = true;

    if (this.display !== "Error") this._pushHistory(exprStr);
    return exprStr;
  }

  percent() {
    const current = this.displayNumber;
    if (this.accumulator !== null && this.operator) {
      // a + b% → a + (a*b/100)
      this.display = formatNumber((this.accumulator * current) / 100);
    } else {
      this.display = formatNumber(current / 100);
    }
  }

  toggleSign() {
    const raw = this.display.replace(/,/g, "");
    if (raw === "0") return;
    this.display = raw.startsWith("-") ? raw.slice(1) : "-" + raw;
    this._normalize();
  }

  clearAll() { const m = this.memory, h = this.history; this.reset(); this.memory = m; this.history = h; }
  clearEntry() { this.display = "0"; this.waitingForOperand = false; this.justEvaluated = false; }

  backspace() {
    if (this.justEvaluated || this.waitingForOperand) return;
    let raw = this.display.replace(/,/g, "");
    raw = raw.length <= 1 || (raw.length === 2 && raw.startsWith("-")) ? "0" : raw.slice(0, -1);
    this.display = raw;
    this._normalize();
  }

  // 윈도우 표준 모드 확장 연산 (단항)
  unary(kind) {
    const x = this.displayNumber;
    let r;
    switch (kind) {
      case "square": r = x * x; break;
      case "sqrt": r = x < 0 ? "Error" : Math.sqrt(x); break;
      case "reciprocal": r = x === 0 ? "Error" : 1 / x; break;
      default: return;
    }
    this.display = r === "Error" ? "Error" : formatNumber(r);
    this.waitingForOperand = true;
    this.justEvaluated = false;
  }

  // 메모리
  memoryClear() { this.memory = 0; }
  memoryRecall() { this.display = formatNumber(this.memory); this.waitingForOperand = true; }
  memoryAdd() { this.memory += this.displayNumber; this.waitingForOperand = true; }
  memorySub() { this.memory -= this.displayNumber; this.waitingForOperand = true; }
  memoryStore() { this.memory = this.displayNumber; this.waitingForOperand = true; }

  _compute(a, b, op) {
    let r;
    switch (op) {
      case "+": r = a + b; break;
      case "-": r = a - b; break;
      case "×": r = a * b; break;
      case "÷": r = b === 0 ? "Error" : a / b; break;
      default: r = b;
    }
    if (r === "Error" || !isFinite(r)) return "Error";
    // 부동소수점 오차 정리
    return Math.round(r * 1e10) / 1e10;
  }

  _normalize() {
    if (this.display === "Error") return;
    const raw = this.display.replace(/,/g, "");
    const negative = raw.startsWith("-");
    const body = negative ? raw.slice(1) : raw;
    if (body.includes(".")) {
      const [i, d] = body.split(".");
      this.display = (negative ? "-" : "") + formatNumber(i) + "." + d;
    } else {
      this.display = (negative ? "-" : "") + formatNumber(body);
    }
  }

  _pushHistory(exprStr) {
    this.history.unshift({ expr: exprStr });
    if (this.history.length > 10) this.history.pop();
  }
}

// ---------------------------------------------------------------------
// DOM 바인딩: 버튼/키보드 입력을 엔진에 연결
// ---------------------------------------------------------------------
export class CalculatorUI {
  constructor(engine, { displayEl, buttonsRoot, historyEl, onInput }) {
    this.engine = engine;
    this.displayEl = displayEl;
    this.buttonsRoot = buttonsRoot;
    this.historyEl = historyEl;
    this.onInput = onInput || (() => {}); // 시퀀스 감지 훅
    this.locked = false; // 채팅 모드일 때 계산기 입력 잠금
  }

  init() {
    this.buttonsRoot.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      this.handle(btn.dataset.action, btn.dataset.value, btn);
    });
    window.addEventListener("keydown", (e) => this._onKey(e));
    this.render();
  }

  // action: digit/decimal/operator/equals/percent/sign/clear/clearEntry/backspace/unary/memory
  handle(action, value, btnEl) {
    if (btnEl) this._flash(btnEl);

    // 시퀀스 감지 훅: 계산기 동작 "전에" 키를 흘려보냄 (계산도 정상 작동시킴)
    this.onInput({ action, value });

    if (this.locked) return; // 채팅 입력 모드면 계산기 엔진은 건드리지 않음

    const e = this.engine;
    switch (action) {
      case "digit": e.inputDigit(value); break;
      case "decimal": e.inputDecimal(); break;
      case "operator": e.setOperator(value); break;
      case "equals": e.equals(); break;
      case "percent": e.percent(); break;
      case "sign": e.toggleSign(); break;
      case "clear": e.clearAll(); break;
      case "clearEntry": e.clearEntry(); break;
      case "backspace": e.backspace(); break;
      case "unary": e.unary(value); break;
      case "memory": this._memory(value); break;
    }
    this.render();
  }

  _memory(kind) {
    const e = this.engine;
    ({ MC: () => e.memoryClear(), MR: () => e.memoryRecall(),
       "M+": () => e.memoryAdd(), "M-": () => e.memorySub(),
       MS: () => e.memoryStore() }[kind] || (() => {}))();
  }

  setDisplay(text) { this.displayEl.textContent = text; }

  render() {
    this.setDisplay(this.engine.display);
    if (this.historyEl) this._renderHistory();
  }

  _renderHistory() {
    this.historyEl.innerHTML = "";
    for (const h of this.engine.history) {
      const div = document.createElement("div");
      div.className = "history-item";
      div.textContent = h.expr;
      this.historyEl.appendChild(div);
    }
  }

  _flash(btnEl) {
    btnEl.classList.add("pressed");
    setTimeout(() => btnEl.classList.remove("pressed"), 90);
  }

  // 키보드 → 가상 버튼 클릭(피드백 위해 실제 버튼 엘리먼트 찾아 누름)
  _onKey(e) {
    if (this.locked) return; // 채팅 모드에선 키보드를 main.js 텍스트 입력이 가져감
    const map = this._keyToAction(e);
    if (!map) return;
    e.preventDefault();
    const btn = this.buttonsRoot.querySelector(
      `[data-action="${map.action}"]${map.value ? `[data-value="${CSS.escape(map.value)}"]` : ""}`
    );
    this.handle(map.action, map.value, btn);
  }

  _keyToAction(e) {
    const k = e.key;
    if (/^[0-9]$/.test(k)) return { action: "digit", value: k };
    if (k === ".") return { action: "decimal" };
    if (k === "+") return { action: "operator", value: "+" };
    if (k === "-") return { action: "operator", value: "-" };
    if (k === "*") return { action: "operator", value: "×" };
    if (k === "/") return { action: "operator", value: "÷" };
    if (k === "Enter" || k === "=") return { action: "equals" };
    if (k === "%") return { action: "percent" };
    if (k === "Backspace") return { action: "backspace" };
    if (k === "Escape") return { action: "clear" }; // 패닉은 panic.js가 별도 capture로 가로챔
    return null;
  }
}
