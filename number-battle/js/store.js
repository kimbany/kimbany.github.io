/* 상태 저장소 — localStorage 영속화 + 구독
 *
 * 비밀 선택 내용(originalNumber)이 저장소에 그대로 보이면 김이 새므로
 * 가볍게 인코딩해서 저장한다. (암호화가 아니라 "실수로 엿보기" 방지용)
 */
import { STATE_VERSION, emptySetupState, checkIntegrity } from './engine.js';

const KEY = 'numberBattle.state.v1';
const MAGIC = 'NB1:';

function encode(json) {
  try {
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b ^ 0x5a);
    return MAGIC + btoa(bin);
  } catch {
    return json;
  }
}

function decode(raw) {
  if (!raw.startsWith(MAGIC)) return raw; // 예전 평문 포맷 호환
  const bin = atob(raw.slice(MAGIC.length));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i) ^ 0x5a;
  return new TextDecoder().decode(bytes);
}

export function createStore() {
  let state = load() || emptySetupState();
  const listeners = new Set();

  function notify() {
    for (const fn of listeners) fn(state);
  }

  return {
    get() { return state; },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** 상태를 바꾸는 유일한 통로. mutator 안에서 예외가 나면 상태를 되돌린다. */
    update(mutator, { silent = false } = {}) {
      const backup = JSON.stringify(state);
      try {
        const next = mutator(state);
        if (next) state = next;
      } catch (err) {
        state = JSON.parse(backup); // 반쯤 바뀐 상태가 남지 않도록 롤백
        throw err;
      }
      save(state);
      if (!silent) notify();
      return state;
    },

    replace(next) {
      state = next;
      save(state);
      notify();
      return state;
    },

    reset() {
      state = emptySetupState();
      try { localStorage.removeItem(KEY); } catch { /* 무시 */ }
      notify();
      return state;
    },

    /** 화면 갱신만 필요할 때 */
    touch() { notify(); },
  };
}

export function save(state) {
  try {
    localStorage.setItem(KEY, encode(JSON.stringify(state)));
    return true;
  } catch {
    return false; // 시크릿 모드 등 — 저장 실패해도 게임은 계속된다
  }
}

export function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { return null; }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decode(raw));
    if (!parsed || parsed.version !== STATE_VERSION) return null;
    // 저장된 데이터가 깨졌으면 버린다 (진행 중 상태는 final=false 로 느슨하게 검사)
    if (parsed.participants && checkIntegrity(parsed, { final: false }).length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasSavedGame() {
  return load() !== null;
}
