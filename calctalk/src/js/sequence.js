// =====================================================================
// sequence.js - 숨겨진 시퀀스 감지 (7777= 진입 / 0000= 해제)
// ---------------------------------------------------------------------
// 책임: 계산기 입력 스트림을 엿보며 비밀 시퀀스를 감지.
//   - 진입: "7","7","7","7","=" → 채팅 모드 활성
//   - 해제: "0","0","0","0","=" → 계산기 모드 복귀
//   - 시퀀스는 사용자 설정으로 변경 가능 (기본 7777)
//
// 중요: 계산기 동작이 최우선. 7777을 우연히 입력해도 계산은 정상 작동하고,
// = 까지 맞으면 디스플레이에 잠시 결과(7777) 보여준 뒤 0.3초 후 전환.
// (실제 전환 타이밍/연출은 콜백을 받은 main.js가 처리)
// =====================================================================

export class SequenceDetector {
  constructor({ enterCode = "7777", exitCode = "0000", onEnter, onExit }) {
    this.enter = enterCode.split("");
    this.exit = exitCode.split("");
    this.onEnter = onEnter || (() => {});
    this.onExit = onExit || (() => {});
    this.buffer = []; // 최근 키 입력 (숫자/= 만 추적)
    this.maxLen = Math.max(this.enter.length, this.exit.length) + 1;
    this.active = false; // 현재 채팅 모드인지
  }

  setCodes({ enterCode, exitCode }) {
    if (enterCode) this.enter = enterCode.split("");
    if (exitCode) this.exit = exitCode.split("");
    this.maxLen = Math.max(this.enter.length, this.exit.length) + 1;
  }

  // calculator UI가 모든 입력을 여기로 흘려보냄 ({action, value})
  feed({ action, value }) {
    let token = null;
    if (action === "digit") token = value;
    else if (action === "equals") token = "=";
    else { this.buffer = []; return; } // 연산자/소수점/클리어 등은 시퀀스 흐름을 끊음

    if (token !== "=") {
      this.buffer.push(token);
      if (this.buffer.length > this.maxLen) this.buffer.shift();
      return;
    }

    // "=" 들어옴 → 직전 버퍼가 시퀀스와 일치하는지 검사
    if (!this.active && this._endsWith(this.enter)) {
      this.buffer = [];
      this.onEnter();
      return;
    }
    if (this.active && this._endsWith(this.exit)) {
      this.buffer = [];
      this.onExit();
      return;
    }
    this.buffer = [];
  }

  _endsWith(codeArr) {
    if (this.buffer.length < codeArr.length) return false;
    const tail = this.buffer.slice(-codeArr.length);
    return tail.every((d, i) => d === codeArr[i]);
  }

  reset() { this.buffer = []; }
}
